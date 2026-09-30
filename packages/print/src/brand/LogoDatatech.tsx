import { contrastRatio, deltaE2000, luminance, papelEscuro, parseColor, type PrintStyle } from '@datatechsolutions/tympan-tokens'
import { useFundoEscuroForcado, usePrint } from '../context.tsx'
import { cx, useIdSeguro } from '../util.ts'
import { DATATECH } from './datatech-data.ts'

export type VarianteDatatech = 'cor' | 'cor-fundo-escuro' | 'mono-escuro' | 'mono-claro' | 'badge' | 'tinta' | 'duotom' | 'estilo'

export interface LogoDatatechProps {
  /** Official version; colour by default, mono in black and white, dark-background version on dark paper. */
  variante?: VarianteDatatech
  /** Width in mm. */
  largura?: number
  /** Ink of `tinta` (whole mark) and of the badge in `duotom`. */
  cor?: string
  /** Ink of the text (DATATECH, SOLUTIONS) in `duotom`. */
  cor2?: string
  /** Small label above the mark ("Realização"). */
  rotulo?: string
  /** Short signature: the badge followed by this text ("uma realização Datatech Solutions"). */
  texto?: string
  /** Clear space of half the badge height on every side. */
  protecao?: boolean
  className?: string
}

/** lakebrasil colours: the Datatech mark may never be inked in them (ΔE2000 < 10 falls back to the style's ink). */
const LAKEBRASIL = ['#16c47e', '#0a8754', '#ffd566', '#e8b03a', '#5cb8e8', '#2d7eb0', '#2c66a8', '#143962', '#059669', '#34d399', '#10b981']

const perto = (a: string, b: string) => deltaE2000(parseColor(a), parseColor(b)) < 10
const longeDoLakebrasil = (c: string) => !LAKEBRASIL.some((l) => perto(c, l))
const contraste = (a: string, b: string) => contrastRatio(parseColor(a), parseColor(b))

function tintaPermitida(cor: string | undefined, reserva: string): string {
  if (!cor) return reserva
  try {
    return longeDoLakebrasil(cor) ? cor : reserva
  } catch {
    return reserva
  }
}

/** Colour mixed over the paper at an opacity (what SOLUTIONS at 60 % looks like). */
function mistura(cor: string, fundo: string, op: number): string {
  const a = parseColor(cor)
  const b = parseColor(fundo)
  const m = (x: number, y: number) => Math.round((x * op + y * (1 - op)) * 255)
  return `rgb(${m(a.r, b.r)} ${m(a.g, b.g)} ${m(a.b, b.b)})`
}

/** SOLUTIONS at 60 % (the original's lighter hierarchy) when it still reaches 3:1 on the paper, else 100 %. */
function opacidadeSolutions(texto: string, papel: string): number {
  return contraste(mistura(texto, papel, 0.6), papel) >= 3 ? 0.6 : 1
}

interface Tintas {
  badge: string
  texto: string
  solOp: number
}

/**
 * The approved per-style recolouring (diagramacao/gerador/cores_logo.py):
 * duotone (badge in the style's highlight, text in its ink) when the
 * highlight differs from the ink, reaches 3:1 on the paper and stays away
 * from the lakebrasil colours; otherwise the style's ink alone; otherwise the
 * official mono (black or white by paper). One-ink styles use the ink only.
 */
export function tintasDoEstilo(estilo: Pick<PrintStyle, 'cor' | 'logo'>): Tintas {
  const { papel, tinta, destaque, destaque2 } = estilo.cor
  const aprovavel = (cores: string[]) => cores.every((c) => longeDoLakebrasil(c) && contraste(c, papel) >= 3)
  const dest = !perto(destaque, tinta) ? destaque : destaque2
  if (estilo.logo !== 'mono' && !perto(dest, tinta) && aprovavel([dest, tinta])) return { badge: dest, texto: tinta, solOp: opacidadeSolutions(tinta, papel) }
  if (aprovavel([tinta])) return { badge: tinta, texto: tinta, solOp: opacidadeSolutions(tinta, papel) }
  const mono = luminance(parseColor(papel)) < 0.18 ? '#ffffff' : '#000000'
  return { badge: mono, texto: mono, solOp: 1 }
}

type Chave = keyof typeof DATATECH | 'badge-mono-claro'

/** Mark data by key; the light mono badge is the dark one with its ink turned white (same master, same mask). */
function dadosDe(chave: Chave): { viewBox: string; inner: string; ids: readonly string[] } {
  if (chave !== 'badge-mono-claro') return DATATECH[chave]
  const base = DATATECH['badge-mono-escuro']
  return { ...base, inner: base.inner.replace('fill="#000000" mask=', 'fill="#ffffff" mask=') }
}

function resolver(variante: Exclude<VarianteDatatech, 'tinta' | 'duotom' | 'estilo'>, pb: boolean, escuro: boolean): Chave {
  if (variante === 'badge') return pb ? (escuro ? 'badge-mono-claro' : 'badge-mono-escuro') : 'badge'
  if (pb) return escuro ? 'mono-claro' : 'mono-escuro'
  if (escuro && variante === 'cor') return 'cor-fundo-escuro'
  if (escuro && variante === 'mono-escuro') return 'mono-claro'
  return variante
}

/** The Datatech Solutions mark (the publisher), from the official print files. */
export function LogoDatatech({ variante = 'cor', largura, cor, cor2, rotulo, texto, protecao = false, className }: LogoDatatechProps) {
  const { estilo, pb } = usePrint()
  const fundo = useFundoEscuroForcado()
  const escuro = fundo ?? papelEscuro(estilo)
  const id = useIdSeguro('ty-print-dt')
  const tingido = variante === 'tinta' || variante === 'duotom' || variante === 'estilo'
  const chave = tingido ? 'mono-escuro' : resolver(variante, pb || estilo.logo === 'mono', escuro)
  const dados = dadosDe(chave)
  const [, , vw = 42, vh = 42] = dados.viewBox.split(' ').map(Number)
  const w = Math.max(largura ?? (chave.startsWith('badge') ? (texto ? 3.6 : 6) : 30), chave.startsWith('badge') ? 3.6 : 25)
  const h = Math.round(((w * vh) / vw) * 100) / 100
  let inner: string = dados.inner
  for (const i of dados.ids) inner = inner.split(`"${i}"`).join(`"${id}-${i}"`).split(`#${i})`).join(`#${id}-${i})`)
  if (tingido) {
    // Recoloured from the mono master, in order: badge, DATA, TECH, SOLUTIONS.
    const tinta = estilo.cor.tinta
    const t: Tintas = pb
      ? { badge: tinta, texto: tinta, solOp: 1 }
      : variante === 'estilo'
        ? tintasDoEstilo(estilo)
        : variante === 'tinta'
          ? { badge: tintaPermitida(cor, tinta), texto: tintaPermitida(cor, tinta), solOp: opacidadeSolutions(tintaPermitida(cor, tinta), estilo.cor.papel) }
          : { badge: tintaPermitida(cor, tinta), texto: tintaPermitida(cor2 ?? tinta, tinta), solOp: opacidadeSolutions(tintaPermitida(cor2 ?? tinta, tinta), estilo.cor.papel) }
    const tintas = [t.badge, t.texto, t.texto, t.texto]
    let k = 0
    inner = inner.replace(/fill="#000000"/g, () => {
      const i = Math.min(k++, 3)
      return i === 3 && t.solOp < 1 ? `fill="${tintas[i]}" fill-opacity="${t.solOp}"` : `fill="${tintas[i]}"`
    })
  }
  const svg = (
    <svg
      {...(texto ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Datatech Solutions' })}
      viewBox={dados.viewBox}
      style={{ inlineSize: `${w}mm`, blockSize: `${h}mm` }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
  return (
    <span
      className={cx('ty-print-logo', 'ty-print-logo--datatech', texto && 'ty-print-signature', className)}
      data-versao={tingido ? variante : chave}
      data-fundo={escuro ? 'escuro' : undefined}
      style={protecao ? { padding: `${Math.round(h * 0.5 * 100) / 100}mm` } : undefined}
    >
      {rotulo ? <span className="ty-print-logo-label">{rotulo}</span> : null}
      {svg}
      {texto ? <span className="ty-print-signature-text">{texto}</span> : null}
    </span>
  )
}
