import { parseColor } from '@datatechsolutions/tympan-tokens'
import { usePrint } from '../context.tsx'
import { useIdSeguro } from '../utils.ts'

const MM = 3.7795
const n3 = (v: number) => Math.round(v * 1000) / 1000

/** Colour matrix that turns noise into the given ink at the given opacity. */
function matriz(cor: string, alfa: number, limiar: number): string {
  const c = parseColor(cor)
  return `0 0 0 0 ${n3(c.r)}  0 0 0 0 ${n3(c.g)}  0 0 0 0 ${n3(c.b)}  0 0 0 ${n3(alfa)} ${n3(limiar)}`
}

/**
 * Paper texture, inline SVG (feTurbulence with fixed seeds, so it is
 * deterministic): grain, fibre, ruled notebook lines or millimetre grid.
 */
export function Textura({ lado }: { lado: 'par' | 'impar' }) {
  const { estilo, pb } = usePrint()
  const id = useIdSeguro('ty-print-pafootl')
  const { textura, intensidade } = estilo.papel
  if (textura === 'nenhuma' || intensidade <= 0) return null
  const tinta = estilo.cor.tinta
  const k = intensidade
  let corpo = null
  let defs = null
  if (textura === 'grao') {
    defs = (
      <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={21} stitchTiles="stitch" />
        <feColorMatrix values={matriz(tinta, 0.9 * k, -0.34)} />
      </filter>
    )
    corpo = <rect width="100%" height="100%" filter={`url(#${id}-f)`} />
  } else if (textura === 'fibra') {
    defs = (
      <>
        <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves={3} seed={4} />
          <feColorMatrix values={matriz(tinta, 0.55 * k, -0.2)} />
        </filter>
        <filter id={`${id}-g`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} stitchTiles="stitch" />
          <feColorMatrix values={matriz(tinta, 1.1 * k, -0.45)} />
        </filter>
      </>
    )
    corpo = (
      <>
        <rect width="100%" height="100%" filter={`url(#${id}-f)`} opacity={0.6} />
        <rect width="100%" height="100%" filter={`url(#${id}-g)`} />
      </>
    )
  } else if (textura === 'pauta') {
    const linha = pb ? '#bdbdbd' : '#b7cbe0'
    const margem = pb ? '#9a9a9a' : '#e3a6a0'
    const passo = 7 * MM
    defs = (
      <pattern id={`${id}-p`} width={10} height={n3(passo)} patternUnits="userSpaceOnUse" y={n3(16 * MM)}>
        <line x1={0} x2={10} y1={n3(passo - 0.5)} y2={n3(passo - 0.5)} stroke={linha} strokeWidth={0.9} />
      </pattern>
    )
    const xm = n3((lado === 'par' ? 170 - 10 : 10) * MM)
    corpo = (
      <g opacity={Math.min(1, 0.4 + k)}>
        <rect width="100%" height="100%" fill={`url(#${id}-p)`} />
        <line x1={xm} x2={xm} y1={0} y2="100%" stroke={margem} strokeWidth={1} />
      </g>
    )
  } else if (textura === 'milimetrado') {
    const linha = estilo.cor.linha
    defs = (
      <>
        <pattern id={`${id}-mm`} width={n3(MM)} height={n3(MM)} patternUnits="userSpaceOnUse">
          <path d={`M ${n3(MM)} 0 L 0 0 0 ${n3(MM)}`} fill="none" stroke={linha} strokeOpacity={n3(0.09 * k)} strokeWidth={0.5} />
        </pattern>
        <pattern id={`${id}-cm`} width={n3(10 * MM)} height={n3(10 * MM)} patternUnits="userSpaceOnUse">
          <path d={`M ${n3(10 * MM)} 0 L 0 0 0 ${n3(10 * MM)}`} fill="none" stroke={linha} strokeOpacity={n3(0.22 * k)} strokeWidth={0.8} />
        </pattern>
      </>
    )
    corpo = (
      <>
        <rect width="100%" height="100%" fill={`url(#${id}-mm)`} />
        <rect width="100%" height="100%" fill={`url(#${id}-cm)`} />
      </>
    )
  }
  return (
    <svg className="ty-print-texture" aria-hidden="true" focusable="false">
      <defs>{defs}</defs>
      {corpo}
    </svg>
  )
}
