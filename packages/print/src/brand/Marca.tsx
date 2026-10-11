// A publisher's or collection's mark from the theme (`marcas.editora`, `marcas.selo`) or given directly:
// an image at a width in mm, its own P&B version (`srcPb`) or the colour one greyed in P&B.
import { isValidElement, type ReactNode } from 'react'
import type { PrintMarca } from '@datatechsolutions/tympan-tokens'
import { papelEscuro } from '@datatechsolutions/tympan-tokens'
import { useFundoEscuroForcado, usePrint } from '../context.tsx'
import { cx } from '../utils.ts'

/** What a component accepts as a mark: true = the theme's publisher mark, an object, or any element. */
export type MarcaEntrada = boolean | PrintMarca | ReactNode

export interface MarcaProps {
  marca: MarcaEntrada
  /** Width in mm when the mark does not set one. */
  largura: number
  /** Height cap in mm (the mark keeps its proportion). */
  altura?: number
  className?: string
}

/** Renders a mark; nothing when none is given and the theme has no publisher mark. */
export function Marca({ marca, largura, altura, className }: MarcaProps) {
  const { estilo, pb } = usePrint()
  const forcado = useFundoEscuroForcado()
  const escuro = forcado ?? papelEscuro(estilo)
  if (marca === false || marca == null) return null
  if (isValidElement(marca)) return <span className={cx('ty-print-mark', className)}>{marca}</span>
  const m: PrintMarca | undefined = marca === true ? estilo.marcas?.editora : typeof marca === 'object' && 'src' in (marca as object) ? (marca as PrintMarca) : undefined
  if (!m) return null
  const w = m.largura ?? largura
  return (
    <img
      className={cx('ty-print-mark', className)}
      src={escuro && m.srcNegativo ? m.srcNegativo : pb && m.srcPb ? m.srcPb : m.src}
      data-negativo={escuro && m.srcNegativo ? '' : undefined}
      alt={m.alt}
      data-pb={pb && !m.srcPb && !(escuro && m.srcNegativo) ? '' : undefined}
      style={{ inlineSize: `${w}mm`, ...(altura ? { maxBlockSize: `${altura}mm`, objectFit: 'contain' as const } : {}) }}
    />
  )
}
