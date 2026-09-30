import { papelEscuro } from '@datatechsolutions/tympan-tokens'
import { useFundoEscuroForcado, usePrint } from '../context.tsx'
import { cx, useIdSeguro } from '../util.ts'
import { CORES_WORDMARK, FAIXAS_COR, FAIXAS_MONO, ICEBERG, WORDMARK_BRASIL, WORDMARK_LAKE } from './logo-dados.ts'

export type VarianteLogo = 'cor' | 'cor-fundo-escuro' | 'mono-escuro' | 'mono-claro' | 'simbolo'

export interface LogoLakebrasilProps {
  /**
   * Official version. Colour whenever the medium allows (the default); in
   * black and white it becomes mono dark (mono light on dark paper), and on
   * dark paper the colour version switches to the dark-background one.
   */
  variante?: VarianteLogo
  /** Width in mm (the full logo is at least 24 mm wide in print). */
  largura?: number
  /** Clear space of half the symbol height on every side. */
  protecao?: boolean
  /** Decorative use (the seal): hidden from assistive technology, the text beside it names it. */
  decorativo?: boolean
  className?: string
}

type Versao = Exclude<VarianteLogo, 'simbolo'>

function resolver(variante: VarianteLogo, pb: boolean, escuro: boolean): { versao: Versao; soSimbolo: boolean } {
  const soSimbolo = variante === 'simbolo'
  let versao: Versao = soSimbolo ? 'cor' : variante
  if (pb) versao = escuro ? 'mono-claro' : 'mono-escuro'
  else if (escuro && versao === 'cor') versao = 'cor-fundo-escuro'
  else if (escuro && versao === 'mono-escuro') versao = 'mono-claro'
  return { versao, soSimbolo }
}

function Iceberg({ id, versao }: { id: string; versao: Versao }) {
  const mono = versao === 'mono-escuro' || versao === 'mono-claro'
  const tinta = versao === 'mono-claro' ? '#ffffff' : '#000000'
  return (
    <>
      <defs>
        <clipPath id={`${id}-iceberg`}>
          <path d={ICEBERG} />
        </clipPath>
        {mono
          ? null
          : FAIXAS_COR.map((f, i) => (
              <linearGradient key={i} id={`${id}-g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={f.de} />
                <stop offset="100%" stopColor={f.ate} />
              </linearGradient>
            ))}
      </defs>
      <g clipPath={`url(#${id}-iceberg)`}>
        {mono
          ? FAIXAS_MONO.map((f, i) => <rect key={i} x={0} y={f.y} width={22} height={f.h} fill={tinta} />)
          : FAIXAS_COR.map((f, i) => <rect key={i} x={0} y={f.y} width={22} height={f.h} fill={`url(#${id}-g${i})`} />)}
      </g>
    </>
  )
}

/** The lakebrasil mark from the official production files (outlined wordmark). */
export function LogoLakebrasil({ variante = 'cor', largura, protecao = false, decorativo = false, className }: LogoLakebrasilProps) {
  const { estilo, pb } = usePrint()
  const fundo = useFundoEscuroForcado()
  const escuro = fundo ?? papelEscuro(estilo)
  const id = useIdSeguro('ty-print-lb')
  const { versao, soSimbolo } = resolver(variante, pb || estilo.logo === 'mono', escuro)
  const w = largura ?? (soSimbolo ? 4 : 26)
  const vb = soSimbolo ? { w: 22, h: 21 } : { w: 110, h: 24 }
  const h = Math.round(((w * vb.h) / vb.w) * 100) / 100
  const cores = CORES_WORDMARK[versao]
  return (
    <span className={cx('ty-print-logo', protecao && 'ty-print-logo--protection', className)} data-versao={versao} style={protecao ? { padding: `${Math.round(h * 0.44 * 100) / 100}mm` } : undefined}>
      <svg {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'lakebrasil' })} viewBox={`0 0 ${vb.w} ${vb.h}`} style={{ inlineSize: `${w}mm`, blockSize: `${h}mm` }}>
        <Iceberg id={id} versao={versao} />
        {soSimbolo ? null : (
          <>
            <path fill={cores.lake} d={WORDMARK_LAKE} />
            <path fill={cores.brasil} d={WORDMARK_BRASIL} />
          </>
        )}
      </svg>
    </span>
  )
}

export interface SeloLakebrasilProps {
  versaoLake: string
  className?: string
}

/** "Dados lakebrasil · lake AAAA-MM-DD": the symbol and the text are one fixed unit. */
export function SeloLakebrasil({ versaoLake, className }: SeloLakebrasilProps) {
  return (
    <span className={cx('ty-print-badge', className)}>
      <LogoLakebrasil variante="simbolo" largura={2.6} decorativo />
      <span className="ty-print-badge-text">
        <span className="ty-print-badge-name">Dados lakebrasil</span> · <span className="ty-print-badge-version">lake {versaoLake}</span>
      </span>
    </span>
  )
}
