import React, { useEffect, useMemo, useRef, useState } from 'react'
import BlochSphere from './components/BlochSphere'
import ProbabilityBars from './components/ProbabilityBars'
import PhasePanel from './components/PhasePanel'

type Complex = { re:number, im:number }
type Snapshot = {
  alpha: Complex | null,
  beta: Complex | null,
  bloch: {x:number,y:number,z:number, rmag:number},
  probs: { Z:[number,number], X:[number,number], Y:[number,number] },
  purity: number,
  mixed: boolean
}

export default function App(){
  const workerRef = useRef<Worker>()
  const [theta, setTheta] = useState(Math.PI/2) // radians
  const [phi, setPhi] = useState(0)
  const [snap, setSnap] = useState<Snapshot>()
  const [running, setRunning] = useState(true)
  const [dephasing, setDephasing] = useState(0)
  const [depolarizing, setDepolarizing] = useState(0)
  const [damping, setDamping] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    const w = new Worker(new URL('./worker/physicsWorker.ts', import.meta.url), { type:'module' })
    workerRef.current = w
    w.onmessage = (ev:MessageEvent<Snapshot>) => setSnap(ev.data)
    const interval = setInterval(() => {
      w.postMessage({ type:'tick' })
    }, 50)
    return () => { clearInterval(interval); w.terminate() }
  }, [])

  useEffect(() => {
    workerRef.current?.postMessage({ type:'setAngles', theta, phi })
  }, [theta, phi])

  useEffect(() => {
    workerRef.current?.postMessage({ type:'setNoise', dephasing, depolarizing, damping, auto })
  }, [dephasing, depolarizing, damping, auto])

  const degTheta = (theta * 180 / Math.PI).toFixed(1)
  const degPhi = (phi * 180 / Math.PI).toFixed(1)

  return (
    <div className="app">
      <aside className="left">
        <h1>Polaris — Quantum State Cartography</h1>
        <p style={{color:'#9bb1d6'}}>Single-qubit visualizer with Bloch sphere, basis probabilities, phase waves, and noise dynamics.</p>

        <h2>State (θ, φ)</h2>
        <div className="row">
          <label>θ (0…π): <span className="value">{degTheta}°</span></label>
          <input className="slider" type="range" min={0} max={Math.PI} step={0.001}
            value={theta} onChange={e=>setTheta(parseFloat(e.target.value))} />
        </div>
        <div className="row">
          <label>φ (0…2π): <span className="value">{degPhi}°</span></label>
          <input className="slider" type="range" min={0} max={2*Math.PI} step={0.001}
            value={phi} onChange={e=>setPhi(parseFloat(e.target.value))} />
        </div>

        <h2>Noise (Kraus)</h2>
        <div className="row">
          <label>Dephasing p: <span className="value">{dephasing.toFixed(3)}</span></label>
          <input className="slider" type="range" min={0} max={0.2} step={0.001}
            value={dephasing} onChange={e=>setDephasing(parseFloat(e.target.value))} />
        </div>
        <div className="row">
          <label>Depolarizing p: <span className="value">{depolarizing.toFixed(3)}</span></label>
          <input className="slider" type="range" min={0} max={0.2} step={0.001}
            value={depolarizing} onChange={e=>setDepolarizing(parseFloat(e.target.value))} />
        </div>
        <div className="row">
          <label>Amplitude damping γ: <span className="value">{damping.toFixed(3)}</span></label>
          <input className="slider" type="range" min={0} max={0.2} step={0.001}
            value={damping} onChange={e=>setDamping(parseFloat(e.target.value))} />
        </div>
        <div className="row" style={{display:'flex', gap:12, alignItems:'center'}}>
          <label><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} /> Auto‑decohere</label>
          <button onClick={()=>workerRef.current?.postMessage({type:'reset'})}>Reset purity</button>
        </div>

        <h2>Transport</h2>
        <div className="row" style={{display:'flex', gap:12, alignItems:'center'}}>
          <button onClick={()=>setRunning(v=>!v)}>{running? 'Pause phase' : 'Play phase'}</button>
        </div>

        {snap && (
          <>
            <h2>Amplitudes</h2>
            <div className="grid">
              <div className="card">
                <strong>α (|0⟩)</strong>
                <div className="amp">{snap.alpha ? `${snap.alpha.re.toFixed(3)} ${snap.alpha.im>=0?'+':'-'} ${Math.abs(snap.alpha.im).toFixed(3)}i` : '— mixed —'}</div>
              </div>
              <div className="card">
                <strong>β (|1⟩)</strong>
                <div className="amp">{snap.beta ? `${snap.beta.re.toFixed(3)} ${snap.beta.im>=0?'+':'-'} ${Math.abs(snap.beta.im).toFixed(3)}i` : '— mixed —'}</div>
              </div>
            </div>

            <h2>Purity & Bloch |r|</h2>
            <div className="grid">
              <div className="card"><div className="purity">Purity Tr(ρ²): {snap.purity.toFixed(4)}</div></div>
              <div className="card"><div className="purity">|r| (arrow length): {snap.bloch.rmag.toFixed(4)}</div></div>
            </div>
          </>
        )}
      </aside>

      <main className="right">
        <div style={{padding:'8px 12px', borderBottom:'1px solid #1e2745', display:'flex', gap:16, alignItems:'center'}}>
          <div>Bloch vector r = (x:{snap?.bloch.x.toFixed(3)}, y:{snap?.bloch.y.toFixed(3)}, z:{snap?.bloch.z.toFixed(3)})</div>
        </div>
        <div className="stage">
          <BlochSphere r={snap?.bloch || {x:0,y:0,z:1,rmag:1}} />
        </div>
        <div className="hud">
          <ProbabilityBars probs={snap?.probs || {Z:[1,0],X:[1,0],Y:[1,0]}} />
          <PhasePanel alpha={snap?.alpha || null} beta={snap?.beta || null} running={running} />
        </div>
      </main>
    </div>
  )
}
