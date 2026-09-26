import { X } from 'lucide-react'
import { useId, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { Drawer } from '../drawer/Drawer'
import { ProofBadge, type ProofBadgeProps } from '../proof-badge/ProofBadge'
import { clampSize, useSplitter } from '../resizable-split/useSplitter'

export type EvidencePlacement = 'auto' | 'docked' | 'overlay' | 'sheet'

export interface EvidencePanelProps {
  title: string
  subtitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** auto: docked ≥ 1280 px, overlay 1024–1279 px, bottom sheet below. */
  placement?: EvidencePlacement
  /** Docked width in px, clamped to 340–420. */
  width?: number
  /** Makes the docked panel resizable (APG Window Splitter). */
  onWidthChange?: (px: number) => void
  /** Proof band at the top of the body (ProofBadge `block`). */
  proof?: Omit<ProofBadgeProps, 'size'>
  footer?: ReactNode
  /** Where focus returns when the docked panel is closed. */
  returnFocusRef?: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
}

export const EVIDENCE_WIDTH = { min: 340, max: 420 } as const

function usePlacement(requested: EvidencePlacement): Exclude<EvidencePlacement, 'auto'> {
  const wide = useMinWidth(breakpoints.xl)
  const medium = useMinWidth(breakpoints.lg)
  if (requested !== 'auto') return requested
  return wide ? 'docked' : medium ? 'overlay' : 'sheet'
}

function Contents({ proof, footer, children }: Pick<EvidencePanelProps, 'proof' | 'footer' | 'children'>) {
  return (
    <>
      <div className="fk-evidence__body">
        {proof ? <ProofBadge {...proof} size="block" /> : null}
        {children}
      </div>
      {footer ? <div className="fk-evidence__footer">{footer}</div> : null}
    </>
  )
}

/**
 * Side inspector of the selected item's evidence (spec: wave-4/evidence-panel.md):
 * a complementary column when docked, a modal drawer or bottom sheet otherwise.
 */
export function EvidencePanel(props: EvidencePanelProps) {
  const words = useMessages().evidencePanel
  const placement = usePlacement(props.placement ?? 'auto')
  const titleId = useId()
  const { direction } = useLocale()
  const width = clampSize(props.width ?? EVIDENCE_WIDTH.max, EVIDENCE_WIDTH.min, EVIDENCE_WIDTH.max)
  const splitter = useSplitter({
    size: width,
    ...EVIDENCE_WIDTH,
    step: 8,
    grows: direction === 'rtl' ? 'right' : 'left',
    onSize: (px) => props.onWidthChange?.(px),
  })

  if (!props.open) return null

  if (placement !== 'docked') {
    return (
      <Drawer
        open
        onOpenChange={props.onOpenChange}
        title={props.title}
        placement={placement === 'overlay' ? 'end' : 'bottom'}
        maxHeight={placement === 'sheet' ? '80dvh' : undefined}
        className={cx('fk-evidence-modal', props.className)}
      >
        {props.subtitle ? <p className="fk-evidence__subtitle" dir="auto">{props.subtitle}</p> : null}
        <Contents proof={props.proof} footer={props.footer}>
          {props.children}
        </Contents>
      </Drawer>
    )
  }

  const close = () => {
    props.onOpenChange(false)
    props.returnFocusRef?.current?.focus()
  }

  return (
    <aside
      className={cx('fk-evidence', props.className)}
      aria-labelledby={titleId}
      data-placement="docked"
      style={{ '--fk-evidence-width': `${width}px` } as CSSProperties}
    >
      {props.onWidthChange ? <div {...splitter} aria-label={words.resize} className="fk-evidence__handle" /> : null}
      <header className="fk-evidence__head">
        <div className="fk-evidence__titles">
          <h2 id={titleId} className="fk-evidence__title" dir="auto">
            {props.title}
          </h2>
          {props.subtitle ? <p className="fk-evidence__subtitle" dir="auto">{props.subtitle}</p> : null}
        </div>
        <Button variant="quiet" iconOnly accessibleLabel={words.close} leadingIcon={<X />} onPress={close} />
      </header>
      <Contents proof={props.proof} footer={props.footer}>
        {props.children}
      </Contents>
    </aside>
  )
}
