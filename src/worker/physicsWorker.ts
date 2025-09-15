/// <reference lib="webworker" />
export type Complex = { re:number, im:number }
type Rho = [[Complex, Complex],[Complex, Complex]]
type Snapshot = {
  alpha: Complex | null,
  beta: Complex | null,
  bloch: {x:number,y:number,z:number, rmag:number},
  probs: { Z:[number,number], X:[number,number], Y:[number,number] },
  purity: number,
  mixed: boolean
}
type MsgIn =
  | { type:'setAngles', theta:number, phi:number }
  | { type:'setNoise', dephasing:number, depolarizing:number, damping:number, auto:boolean }
  | { type:'tick' }
  | { type:'reset' }

let theta = Math.PI/2
let phi = 0
let autoNoise = false
let params = { dephasing: 0, depolarizing: 0, damping: 0 }
let rho = pureFromAngles(theta, phi)
let mixed = false

function complex(re:number, im:number=0): Complex { return {re, im} }
function cadd(a:Complex,b:Complex):Complex{ return complex(a.re+b.re, a.im+b.im) }
function cmul(a:Complex,b:Complex):Complex{ return complex(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re) }
function cconj(a:Complex):Complex{ return complex(a.re, -a.im) }
function cabs2(a:Complex){ return a.re*a.re + a.im*a.im }
function creal(a:Complex){ return a.re }
function cimag(a:Complex){ return a.im }

function Id():Rho{ return [[complex(1,0), complex(0,0)], [complex(0,0), complex(1,0)]] as Rho }
function zeroRho():Rho{ return [[complex(0,0), complex(0,0)], [complex(0,0), complex(0,0)]] as Rho }
function dagger(M:Rho):Rho{
  return [
    [ complex(M[0][0].re, -M[0][0].im), complex(M[1][0].re, -M[1][0].im) ],
    [ complex(M[0][1].re, -M[0][1].im), complex(M[1][1].re, -M[1][1].im) ],
  ] as Rho
}
function matmul(A:Rho,B:Rho):Rho{
  const r = zeroRho()
  for(let i=0;i<2;i++){
    for(let j=0;j<2;j++){
      let s = complex(0,0)
      for(let k=0;k<2;k++){
        s = cadd(s, cmul(A[i][k], B[k][j]))
      }
      r[i][j] = s
    }
  }
  return r
}
function matadd(A:Rho,B:Rho):Rho{
  return [
    [ cadd(A[0][0],B[0][0]), cadd(A[0][1],B[0][1]) ],
    [ cadd(A[1][0],B[1][0]), cadd(A[1][1],B[1][1]) ],
  ] as Rho
}
function matscale(A:Rho, s:number):Rho{
  return [
    [ complex(A[0][0].re*s, A[0][0].im*s), complex(A[0][1].re*s, A[0][1].im*s) ],
    [ complex(A[1][0].re*s, A[1][0].im*s), complex(A[1][1].re*s, A[1][1].im*s) ],
  ] as Rho
}

function pureFromAngles(t:number, p:number):Rho{
  const a = Math.cos(t/2)
  const b = Math.sin(t/2)
  const alpha = complex(a,0)
  const beta = complex(b*Math.cos(p), b*Math.sin(p))
  // ρ = |ψ><ψ|
  const rho01 = cmul(alpha, cconj(beta)) // α β*
  const rho10 = cconj(rho01)
  return [
    [ complex(cabs2(alpha),0), rho01 ],
    [ rho10, complex(cabs2(beta),0) ]
  ]
}

// Pauli matrices
const X:Rho = [[complex(0,0), complex(1,0)],[complex(1,0), complex(0,0)]]
const Y:Rho = [[complex(0,0), complex(0,-1)],[complex(0,1), complex(0,0)]]
const Z:Rho = [[complex(1,0), complex(0,0)],[complex(0,0), complex(-1,0)]]

function applyDephasing(r:Rho, p:number):Rho{
  // Phase damping: keep populations, damp coherences by (1-p)
  const off01 = r[0][1]
  const off10 = r[1][0]
  return [
    [ r[0][0], complex(off01.re*(1-p), off01.im*(1-p)) ],
    [ complex(off10.re*(1-p), off10.im*(1-p)), r[1][1] ]
  ] as Rho
}
function applyDepolarizing(r:Rho, p:number):Rho{
  // With probability p replace the state with the maximally mixed state I/2
  const term1 = matscale(r, 1 - p)
  const term2 = matscale(Id(), p/2)
  return matadd(term1, term2)
}
function applyAmplitudeDamping(r:Rho, gamma:number):Rho{
  // Kraus: E0 = [[1,0],[0, sqrt(1-γ)]], E1 = [[0, sqrt(γ)],[0,0]]
  const s = Math.sqrt(Math.max(0, 1 - gamma))
  const E0:Rho = [[complex(1,0), complex(0,0)],[complex(0,0), complex(s,0)]]
  const E1:Rho = [[complex(0,0), complex(Math.sqrt(Math.max(0,gamma)),0)],[complex(0,0), complex(0,0)]]
  const E0rE0 = matmul(matmul(E0, r), dagger(E0))
  const E1rE1 = matmul(matmul(E1, r), dagger(E1))
  return matadd(E0rE0, E1rE1)
}

function purityOf(r:Rho):number{
  // Tr(ρ^2)
  const a = r[0][0]; const b = r[0][1]; const c = r[1][0]; const d = r[1][1]
  // Compute ρ^2 then trace (or use formula). We'll do directly:
  const r2 = matmul(r, r)
  return r2[0][0].re + r2[1][1].re
}

function blochOf(r:Rho){
  const rx = 2 * r[0][1].re
  const ry = 2 * r[0][1].im  // = 2 Im(ρ01)
  const rz = r[0][0].re - r[1][1].re
  const rmag = Math.sqrt(rx*rx + ry*ry + rz*rz)
  return { x:rx, y:ry, z:rz, rmag }
}

function anglesFromRho(r:Rho):{alpha:Complex|null, beta:Complex|null}{
  // If pure, recover α, β up to global phase. If mixed, return nulls.
  const pur = purityOf(r)
  if(pur > 0.999999){ // treat as pure
    // α = sqrt(ρ00), β phase from ρ01
    const rho00 = r[0][0].re
    const rho11 = r[1][1].re
    const a = Math.sqrt(Math.max(0, rho00))
    const b = Math.sqrt(Math.max(0, rho11))
    // phase φ from ρ01 = α β* = a b e^{-iφ} ? Careful with conventions.
    // For our preparation: β = b e^{iφ}; ρ01 = α β* = a b e^{-iφ}
    // So φ = -arg(ρ01)
    const b01 = r[0][1]
    const phi = -Math.atan2(b01.im, b01.re)
    const alpha = { re:a, im:0 }
    const beta = { re: b * Math.cos(phi), im: b * Math.sin(phi) }
    return { alpha, beta }
  }
  return { alpha: null, beta: null }
}

function snapshot():Snapshot{
  const b = blochOf(rho)
  const Zp:[number,number] = [ (1 + b.z)/2, (1 - b.z)/2 ]
  const Xp:[number,number] = [ (1 + b.x)/2, (1 - b.x)/2 ]
  const Yp:[number,number] = [ (1 + b.y)/2, (1 - b.y)/2 ]
  const pur = purityOf(rho)
  const {alpha, beta} = anglesFromRho(rho)
  return {
    alpha, beta,
    bloch: b,
    probs: { Z:Zp, X:Xp, Y:Yp },
    purity: pur,
    mixed
  }
}

function stepNoise(){
  let r = rho
  if(params.dephasing > 0) r = applyDephasing(r, params.dephasing)
  if(params.depolarizing > 0) r = applyDepolarizing(r, params.depolarizing)
  if(params.damping > 0) r = applyAmplitudeDamping(r, params.damping)
  rho = r
  mixed = true
}

self.onmessage = (ev: MessageEvent<MsgIn>) => {
  const msg = ev.data
  if(msg.type === 'setAngles'){
    theta = msg.theta; phi = msg.phi
    rho = pureFromAngles(theta, phi)
    mixed = false
    ;(self as any).postMessage(snapshot())
  } else if(msg.type === 'setNoise'){
    params.dephasing = msg.dephasing
    params.depolarizing = msg.depolarizing
    params.damping = msg.damping
    autoNoise = msg.auto
    ;(self as any).postMessage(snapshot())
  } else if(msg.type === 'tick'){
    if(autoNoise && (params.dephasing>0 || params.depolarizing>0 || params.damping>0)){
      stepNoise()
    }
    ;(self as any).postMessage(snapshot())
  } else if(msg.type === 'reset'){
    rho = pureFromAngles(theta, phi)
    mixed = false
    ;(self as any).postMessage(snapshot())
  }
}

// initialize
;(self as any).postMessage(snapshot())
