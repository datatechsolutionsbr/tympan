import type { ReactNode } from 'react'
import { breakpoints, useMinWidth } from '../../internal/media'
import { AmbientBackdrop } from '../ambient-backdrop/AmbientBackdrop'
import { BrandPanel, type BrandPanelProps } from '../brand-panel/BrandPanel'

export type AuthFrameWidth = 'narrow' | 'regular' | 'wide'

export interface AuthFrameProps {
  children: ReactNode
  /** Renders the brand side on wide screens (never below 1024 px). */
  brandPanel?: BrandPanelProps
  width?: AuthFrameWidth
  /** Product mark shown above the form surface. */
  mark?: ReactNode
  mainLabel?: string
  className?: string
}

/** Frame of sign-in and recovery screens (spec: wave-2/auth-frame.md). */
export function AuthFrame({ brandPanel, mark, mainLabel, width = 'regular', className, children }: AuthFrameProps) {
  const wide = useMinWidth(breakpoints.lg)
  const brandSide = brandPanel && wide ? <BrandPanel {...brandPanel} className="fk-auth-frame__brand" /> : null
  return (
    <div className={className ? `fk-auth-frame ${className}` : 'fk-auth-frame'} data-split={brandSide ? '' : undefined}>
      <AmbientBackdrop />
      {brandSide}
      <main className="fk-auth-frame__form-side" aria-label={mainLabel}>
        <div className="fk-auth-frame__column" data-width={width}>
          {mark ? <div className="fk-auth-frame__mark">{mark}</div> : null}
          <div className="fk-auth-frame__sheet">{children}</div>
        </div>
      </main>
    </div>
  )
}
