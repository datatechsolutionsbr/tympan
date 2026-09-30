// ClaimTitle: the data-derived assertion sentence rendered with title weight
// above a chart or a report section — the claim the numbers below it support.
// Pure text: no strings of its own, i18n stays with the host's sentence.

import type { ReactNode } from 'react'

export interface ClaimTitleProps {
  /** The assertion sentence ("Extração responde por 80% do tempo de ETL"). */
  children: ReactNode
  className?: string
}

export function ClaimTitle({ children, className }: ClaimTitleProps) {
  return <p className={['ty-claim-title', className].filter(Boolean).join(' ')}>{children}</p>
}
