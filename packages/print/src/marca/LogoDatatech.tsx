import { deltaE2000, papelEscuro, parseColor } from '@datatechsolutions/tympan-tokens'
import { useFundoEscuroForcado, usePrint } from '../contexto.tsx'
import { cx, useIdSeguro } from '../util.ts'
import { DATATECH } from './datatech-dados.ts'

export type VarianteDatatech = 'cor' | 'cor-fundo-escuro' | 'mono-escuro' | 'mono-claro' | 'badge' | 'tinta' | 'duotom' | 'estilo'

export interface LogoDatatechProps {
  /** Official version; colour by default, mono in black and white, dark-background version on dark paper. */
  variante?: VarianteDatatech
  /** Width in mm. */
  largura?: number
  /** Ink of `tinta` (whole mark) and of the badge and DATA in `duotom`. */
  cor?: string
  /** Ink of TECH and SOLUTIONS in `duotom`. */
  cor2?: string
  className?: string
}

/** lakebrasil colours: the Datatech mark may never be inked in them (ΔE2000 < 10 falls back to the style's ink). */
const LAKEBRASIL = ['#16c47e', '#0a8754', '#ffd566', '#e8b03a', '#5cb8e8', '#2d7eb0', '#2c66a8', '#143962', '#059669', '#34d399', '#10b981']

function tintaPermitida(cor: string | undefined, reserva: string): string {
  if (!cor) return reserva
  try {
    const c = parseColor(cor)
    return LAKEBRASIL.some((l) => deltaE2000(c, parseColor(l)) < 10) ? reserva : cor
  } catch {
    return reserva
  }
}

type Chave = keyof typeof DATATECH

function resolver(variante: Exclude<VarianteDatatech, 'tinta' | 'duotom' | 'estilo'>, pb: boolean, escuro: boolean): Chave {
  if (variante === 'badge') return pb ? 'badge-mono-escuro' : 'badge'
  if (pb) return escuro ? 'mono-claro' : 'mono-escuro'
  if (escuro && variante === 'cor') return 'cor-fundo-escuro'
  if (escuro && variante === 'mono-escuro') return 'mono-claro'
  return variante
}

/** The Datatech Solutions mark (the publisher), from the official print files. */
export function LogoDatatech({ variante = 'cor', largura, cor, cor2, className }: LogoDatatechProps) {
  const { estilo, pb } = usePrint()
  const fundo = useFundoEscuroForcado()
  const escuro = fundo ?? papelEscuro(estilo)
  const id = useIdSeguro('ty-print-dt')
  const tingido = variante === 'tinta' || variante === 'duotom' || variante === 'estilo'
  const chave = tingido ? 'mono-escuro' : resolver(variante, pb || estilo.logo === 'mono', escuro)
  const dados = DATATECH[chave]
  const [, , vw = 42, vh = 42] = dados.viewBox.split(' ').map(Number)
  const w = largura ?? (chave.startsWith('badge') ? 6 : 30)
  const h = Math.round(((w * vh) / vw) * 100) / 100
  let inner: string = dados.inner
  for (const i of dados.ids) inner = inner.split(`"${i}"`).join(`"${id}-${i}"`).split(`#${i})`).join(`#${id}-${i})`)
  if (tingido) {
    // Recoloured from the mono master, in order: badge, DATA, TECH, SOLUTIONS.
    const tinta = estilo.cor.tinta
    const c1 = variante === 'estilo' ? tintaPermitida(estilo.cor.destaque, tinta) : tintaPermitida(cor, tinta)
    const c2 = variante === 'tinta' ? c1 : variante === 'estilo' ? tinta : tintaPermitida(cor2 ?? cor, tinta)
    const tintas = pb ? [tinta, tinta, tinta, tinta] : [c1, c1, c2, c2]
    let k = 0
    inner = inner.replace(/fill="#000000"/g, () => `fill="${tintas[Math.min(k++, 3)]}"`)
  }
  return (
    <span className={cx('ty-print-logo', 'ty-print-logo--datatech', className)} data-versao={tingido ? variante : chave}>
      <svg role="img" aria-label="Datatech Solutions" viewBox={dados.viewBox} style={{ inlineSize: `${w}mm`, blockSize: `${h}mm` }} dangerouslySetInnerHTML={{ __html: inner }} />
    </span>
  )
}
