import React, { useEffect, useRef } from 'react'

interface Complex { re:number, im:number }
function arg(z:Complex){ return Math.atan2(z.im, z.re) }
function abs(z:Complex){ return Math.hypot(z.re, z.im) }

export default function PhasePanel({ alpha, beta, running }:{ alpha:Complex|null, beta:Complex|null, running:boolean }){
  const c1 = useRef<HTMLCanvasElement>(null)
  const c2 = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    let t = 0
    const draw = () => {
      const ctxs = [c1.current?.getContext('2d'), c2.current?.getContext('2d')]
      const amps = [alpha, beta]
      ctxs.forEach((ctx, idx) => {
        if(!ctx) return
        const W = ctx.canvas.width = ctx.canvas.clientWidth
        const H = ctx.canvas.height = ctx.canvas.clientHeight
        ctx.clearRect(0,0,W,H)
        ctx.strokeStyle = '#6fa8ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        const A = amps[idx]
        if(A){
          const mag = abs(A)
          const phase = arg(A)
          for(let x=0;x<W;x++){
            const u = x / W
            const val = mag * Math.cos(phase - t + 4*Math.PI*u)
            const y = H/2 - val * (H*0.4)
            if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
          }
        }
        ctx.stroke()
      })
      t += running ? 0.05 : 0
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [alpha?.re, alpha?.im, beta?.re, beta?.im, running])

  return (
    <div className="grid">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <strong>Re[ α · e<sup>-it</sup> ]</strong>
        </div>
        <canvas className="wave" ref={c1} />
      </div>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <strong>Re[ β · e<sup>-it</sup> ]</strong>
        </div>
        <canvas className="wave" ref={c2} />
      </div>
    </div>
  )
}
