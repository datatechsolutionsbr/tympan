import type { ReactNode } from 'react'
import { DuplaContextoProvider } from '../contexto.tsx'
import { cx } from '../util.ts'

export interface DuplaProps {
  /** Folios of the spread, "22-23" (even-odd), or "capa" for the open cover. */
  numero: string
  /** Running head of the even page (the part). */
  parte?: string
  /** Running head of the odd page (the chapter). */
  capitulo?: string
  /** First spread of a chapter: forces the even page to start on a left (even) page in print. */
  abreCapitulo?: boolean
  className?: string
  children?: ReactNode
}

/** A two-page spread (even page left, odd page right), 340 × 240 mm on screen, two pages in print. */
export function Dupla({ numero, parte, capitulo, abreCapitulo = false, className, children }: DuplaProps) {
  const capa = numero === 'capa'
  const [par = '', impar = ''] = capa ? ['', ''] : numero.split('-')
  return (
    <div
      className={cx('ty-print-dupla', className)}
      role="group"
      aria-label={capa ? 'Capa aberta' : `Páginas ${par} e ${impar}`}
      data-abre-capitulo={abreCapitulo ? '' : undefined}
      data-capa={capa ? '' : undefined}
    >
      <DuplaContextoProvider value={{ folios: [par, impar], parte, capitulo }}>{children}</DuplaContextoProvider>
    </div>
  )
}
