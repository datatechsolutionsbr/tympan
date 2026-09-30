// Emblems beside a spread title (PrintEstrutura.emblema, G2 of the style audit): sports pictograms
// (pictogramas), the concrete bicolour circle, a modular human figure (proporcao-modular), a cordel woodcut,
// a magnifier (science communication), buildings (infografico-ilustrado). Decoration only, in the style's
// inks: never data, never a mark.
import type { ReactNode } from 'react'
import { warnDeprecatedPrintId, type Emblema as NomeEmblema } from '@datatechsolutions/tympan-tokens'
import { usePrint } from '../contexto.tsx'

const D = 'var(--ty-print-destaque)'
const D2 = 'var(--ty-print-destaque-2)'
const T = 'var(--ty-print-tinta)'
const P = 'var(--ty-print-papel)'
const O = (i: number, reserva: string) => `var(--ty-print-ornamento-${i}, ${reserva})`

/** Each emblem in its own box (mm); drawn at that size. */
const EMBLEMAS: Record<Exclude<NomeEmblema, 'modulor'>, { w: number; h: number; corpo: ReactNode }> = {
  pictogramas: {
    w: 40,
    h: 12,
    corpo: (
      <>
        <rect x={0} y={0} width={12} height={12} fill={D2} />
        <g stroke={P} strokeWidth={1.1} strokeLinecap="round" fill="none">
          <circle cx={6.4} cy={2.6} r={1.1} fill={P} stroke="none" />
          <path d="M6 4.4 L5.2 7.4 L7.4 9 L7.8 11 M5.2 7.4 L3.6 10.8 M5.8 5 L8.6 6.4 M5.8 5 L3.4 6" />
        </g>
        <rect x={14} y={0} width={12} height={12} fill={D2} />
        <path d="M16.4 6.6 L20 3 L23.6 6.6 V10.4 H16.4 Z" fill={P} />
        <rect x={19.2} y={7.6} width={1.6} height={2.8} fill={D2} />
        <rect x={28} y={0} width={12} height={12} fill={D} />
        <g stroke={P} strokeWidth={1.1} strokeLinecap="round" fill="none">
          <path d="M34 2 V10 M30 6 H38 M30 6 L31.6 4.6 M30 6 L31.6 7.4 M38 6 L36.4 4.6 M38 6 L36.4 7.4" />
        </g>
      </>
    ),
  },
  formas: {
    w: 34,
    h: 11,
    corpo: (
      <>
        <polygon points="0,11 5.5,0 11,11" fill={O(1, 'var(--ty-print-marca-texto)')} />
        <rect x={11.5} y={0} width={11} height={11} fill={O(2, D)} />
        <circle cx={28.5} cy={5.5} r={5.5} fill={O(3, D2)} />
      </>
    ),
  },
  'circulo-bicolor': {
    w: 26,
    h: 22,
    corpo: (
      <>
        <path d="M11 0 A11 11 0 0 0 11 22 Z" fill={D2} />
        <path d="M11 0 A11 11 0 0 1 11 22 Z" fill={D} />
        <rect x={20.5} y={0} width={5.5} height={5.5} fill={T} />
      </>
    ),
  },
  'figura-modular': {
    w: 26,
    h: 26,
    corpo: (
      <>
        <g fill="none" stroke={T} strokeWidth={0.5}>
          <rect x={0} y={4} width={5} height={22} />
          <path d="M0 10.5 H5 M0 15 H5 M0 18.8 H5 M0 22 H5" />
          <rect x={20} y={0} width={5} height={26} />
          <path d="M20 7 H25 M20 12.6 H25 M20 17 H25 M20 20.6 H25" />
        </g>
        <g fill="none" stroke={T} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12.5} cy={6} r={1.5} fill={T} />
          <path d="M12.5 7.6 L12.2 16 L10.6 25.6 M12.2 16 L14.2 25.6 M12.4 9.4 L16.6 2.2 M12.4 9.6 L9.6 14" />
        </g>
      </>
    ),
  },
  casa: {
    w: 40,
    h: 18,
    corpo: (
      <>
        <g fill={T}>
          <rect x={3} y={2} width={2.4} height={15} rx={1.2} />
          <rect x={0} y={6} width={1.8} height={5} rx={0.9} />
          <rect x={0} y={10.2} width={4} height={1.4} />
          <rect x={6.6} y={4.6} width={1.8} height={5.4} rx={0.9} />
          <rect x={4.4} y={9} width={4} height={1.4} />
          <path d="M12 17 V11 L15.5 7.6 L19 11 V17 Z M20 17 V12 L23.4 8.8 L26.8 12 V17 Z M27.8 17 V11.4 L31 8.4 L34.2 11.4 V17 Z" />
          <rect x={0} y={17} width={40} height={1} />
        </g>
        <g fill={P}>
          <rect x={14.8} y={13} width={1.6} height={4} />
          <rect x={22.6} y={13.4} width={1.6} height={3.6} />
          <rect x={30.3} y={13} width={1.6} height={4} />
        </g>
        <circle cx={36} cy={4} r={2.6} fill="none" stroke={T} strokeWidth={0.9} />
        <path d="M36 0 V0.6 M39.6 4 H40 M33 1.2 L33.4 1.6 M39 1.2 L38.6 1.6" stroke={T} strokeWidth={0.6} />
      </>
    ),
  },
  lupa: {
    w: 16,
    h: 16,
    corpo: (
      <>
        <circle cx={6.5} cy={6.5} r={5.2} fill="none" stroke={D2} strokeWidth={1.6} />
        <path d="M10.4 10.4 L15 15" stroke={D2} strokeWidth={2.4} strokeLinecap="round" />
      </>
    ),
  },
  predios: {
    w: 28,
    h: 24,
    corpo: (
      <>
        <g fill="none" stroke={T} strokeWidth={0.5}>
          <rect x={0} y={6} width={7} height={18} />
          <rect x={20} y={0} width={7.5} height={24} />
        </g>
        <g fill={D}>
          {[8, 12, 16, 20].map((y) => (
            <rect key={`a${y}`} x={1.6} y={y} width={3.8} height={1.8} />
          ))}
          {[2.4, 6.4, 10.4, 14.4, 18.4].map((y) => (
            <rect key={`b${y}`} x={21.8} y={y} width={3.9} height={1.8} />
          ))}
        </g>
        <g fill="none" stroke={T} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={13.5} cy={8} r={1.6} fill={T} />
          <path d="M13.5 9.8 V17 L11.6 23.6 M13.5 17 L15.4 23.6 M13.5 12 L10.4 15 M13.5 12 L17.4 9.6" />
        </g>
      </>
    ),
  },
}

/** The style's emblem, or nothing. `escala` resizes it (1 = the size of the studies). */
export function Emblema({ escala = 1 }: { escala?: number }) {
  const { estilo } = usePrint()
  const pedido = estilo.estrutura.emblema
  if (!pedido) return null
  // 'modulor' is the deprecated name of 'figura-modular' (removed with the style aliases).
  if (pedido === 'modulor') warnDeprecatedPrintId('modulor', 'figura-modular', 'emblem')
  const nome = pedido === 'modulor' ? 'figura-modular' : pedido
  const e = EMBLEMAS[nome]
  return (
    <svg className="ty-print-emblem" data-emblema={nome} viewBox={`0 0 ${e.w} ${e.h}`} width={`${e.w * escala}mm`} height={`${e.h * escala}mm`} aria-hidden="true" focusable="false">
      {e.corpo}
    </svg>
  )
}
