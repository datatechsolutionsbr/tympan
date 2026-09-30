// Antes × depois: two layers on top of each other, the top one clipped at the slider position (from the
// Estúdio's curtain). The range input covers the whole stage, so drag, click and the arrow keys all work.
import { useState, type ReactNode } from 'react'

export interface BackdropProps {
  antes: ReactNode
  depois: ReactNode
  rotuloAntes: string
  rotuloDepois: string
}

export function Backdrop({ antes, depois, rotuloAntes, rotuloDepois }: BackdropProps) {
  const [pos, setPos] = useState(50)
  return (
    <div className="ty-site-cortina" style={{ ['--ty-site-cortina' as string]: `${pos}%` }}>
      <div className="ty-site-cortina__camada">{depois}</div>
      <div className="ty-site-cortina__camada ty-site-cortina__camada--topo" aria-hidden="true">
        {antes}
      </div>
      <div className="ty-site-cortina__linha" aria-hidden="true">
        <span className="ty-site-cortina__alca" />
      </div>
      <span className="ty-site-cortina__rotulo ty-site-cortina__rotulo--antes" aria-hidden="true">
        {rotuloAntes}
      </span>
      <span className="ty-site-cortina__rotulo ty-site-cortina__rotulo--depois" aria-hidden="true">
        {rotuloDepois}
      </span>
      <input
        className="ty-site-cortina__controle"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Backdrop: antes, ${rotuloAntes}; depois, ${rotuloDepois}`}
        aria-valuetext={`${pos}% de ${rotuloAntes}`}
      />
    </div>
  )
}
