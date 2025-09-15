import React from 'react'

export default function ProbabilityBars({ probs }:{ probs:{Z:[number,number], X:[number,number], Y:[number,number]} }){
  const Row = ({label, p}:{label:string, p:[number,number]}) => (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
        <strong>{label}</strong>
        <span className="legend">
          <span><span className="dot" /> + : {(p[0]*100).toFixed(1)}%</span>
          <span><span className="dot" style={{background:'#9bb1d6'}}/> - : {(p[1]*100).toFixed(1)}%</span>
        </span>
      </div>
      <div className="prob"><div style={{width:`${p[0]*100}%`}} /></div>
    </div>
  )
  return (
    <div className="grid">
      <Row label="Z basis (|0⟩ / |1⟩)" p={probs.Z} />
      <Row label="X basis (|+⟩ / |−⟩)" p={probs.X} />
      <Row label="Y basis (|+i⟩ / |−i⟩)" p={probs.Y} />
    </div>
  )
}
