import type { ReactNode } from 'react'
import { AreaNomeProvider, ColunasProvider, LarguraProvider, useAreasDoMolde } from '../context.tsx'
import { larguraUtil } from '../panels/Panel.tsx'
import { cx } from '../utils.ts'

export interface AreaProps {
  /** Area of the page's molde (livro/moldes.ts), e.g. "a", "d", "fonte". */
  nome: string
  className?: string
  children?: ReactNode
}

/**
 * A named cell of the page grid. The spread's molde says where it sits and
 * how many columns it spans; panels inside take that width (and figures size
 * themselves to it). In the growing row, the last block stretches to the foot.
 */
export function Area({ nome, className, children }: AreaProps) {
  const info = useAreasDoMolde()?.get(nome)
  return (
    <div
      className={cx('ty-print-area', className)}
      data-area={nome}
      data-cresce={info?.cresce ? '' : undefined}
      data-pe={info?.pe ? '' : undefined}
      data-colunas={info?.colunas ?? 6}
      data-fora-do-molde={info ? undefined : ''}
      style={{ gridArea: info ? nome : undefined }}
    >
      <ColunasProvider value={info?.colunas ?? 6}>
        <LarguraProvider value={larguraUtil(info?.colunas ?? 6, 'nenhum', 'pilha')}>
          <AreaNomeProvider value={nome}>{children}</AreaNomeProvider>
        </LarguraProvider>
      </ColunasProvider>
    </div>
  )
}
