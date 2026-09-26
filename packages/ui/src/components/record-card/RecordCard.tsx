import { Pencil, Trash2 } from 'lucide-react'
import { useState, type CSSProperties, type DragEventHandler, type ReactNode } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { ModalDialog } from '../modal-dialog/ModalDialog'
import { StatusPill } from '../status-pill/StatusPill'

export interface RecordCardDragHandlers {
  draggable?: boolean
  onDragStart?: DragEventHandler<HTMLElement>
  onDragEnd?: DragEventHandler<HTMLElement>
  onDragOver?: DragEventHandler<HTMLElement>
  onDragEnter?: DragEventHandler<HTMLElement>
  onDragLeave?: DragEventHandler<HTMLElement>
  onDrop?: DragEventHandler<HTMLElement>
}

export interface RecordCardProps {
  title: ReactNode
  /** Plain-text title for tooltips and accessible names when `title` is a node. */
  titleText?: string
  secondary?: ReactNode
  leading?: ReactNode
  /** `true`/`false` shows the active/inactive StatusPill; a node renders as given. */
  state?: boolean | ReactNode
  /** Categorical token index (1 to 8) for the decorative strip (§2.3). */
  accent?: number
  children?: ReactNode
  footer?: ReactNode
  onOpen?: () => void
  /** Without a list parent: no list-item semantics. */
  standalone?: boolean
  dragHandlers?: RecordCardDragHandlers
  /** Host-driven dragging state (reduced opacity and outline). */
  dragging?: boolean
  className?: string
}

function StateMark({ state }: { state: RecordCardProps['state'] }) {
  if (state === undefined || state === null) return null
  if (typeof state === 'boolean') return <StatusPill status={state ? 'active' : 'inactive'} size="small" />
  return <>{state}</>
}

/** Summary card of one record in a grid or list (spec: wave-2/record-card.md). */
export function RecordCard(props: RecordCardProps) {
  const Tag = props.standalone ? 'article' : 'li'
  const plainTitle = props.titleText ?? (typeof props.title === 'string' ? props.title : undefined)
  const strip = props.accent ? ({ '--ty-record-accent': `var(--ty-categorical-${props.accent})` } as CSSProperties) : undefined

  const titleRun = (
    <span className="ty-record-card__title" title={plainTitle}>
      {props.title}
    </span>
  )

  return (
    <Tag
      className={cx('ty-record-card', props.className)}
      style={strip}
      data-accent={props.accent ? '' : undefined}
      data-interactive={props.onOpen ? '' : undefined}
      data-dragging={props.dragging ? '' : undefined}
      aria-label={props.standalone ? plainTitle : undefined}
      {...props.dragHandlers}
    >
      <div className="ty-record-card__head">
        {props.leading ? <span className="ty-record-card__leading">{props.leading}</span> : null}
        <div className="ty-record-card__names">
          {props.onOpen ? (
            <AriaButton className="ty-record-card__open" onPress={props.onOpen}>
              {titleRun}
            </AriaButton>
          ) : (
            titleRun
          )}
          {props.secondary ? <span className="ty-record-card__secondary">{props.secondary}</span> : null}
        </div>
        <span className="ty-record-card__state">
          <StateMark state={props.state} />
        </span>
      </div>
      {props.children ? <div className="ty-record-card__body">{props.children}</div> : null}
      {props.footer ? <div className="ty-record-card__footer">{props.footer}</div> : null}
    </Tag>
  )
}

export interface RecordActionsProps {
  /** Record name, appended to the accessible names ("Delete <title>"). */
  recordTitle: string
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void | Promise<void>
  /** When set, deletion asks first in an alert dialog with this title. */
  confirmDeleteTitle?: string
  confirmDeleteDescription?: ReactNode
}

/** Edit and delete pair for a RecordCard footer. */
export function RecordActions(props: RecordActionsProps) {
  const m = useMessages().recordCard
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await props.onDelete()
    } finally {
      setBusy(false)
      setAsking(false)
    }
  }
  const requestDelete = () => (props.confirmDeleteTitle ? setAsking(true) : void remove())

  const named = (label: string) => (
    <>
      {`${label} `}
      <span className="ty-visually-hidden">{props.recordTitle}</span>
    </>
  )

  return (
    <div className="ty-record-actions">
      <Button variant="quiet" size="compact" leadingIcon={<Pencil />} onPress={props.onEdit} disabled={busy}>
        {named(props.editLabel)}
      </Button>
      <Button variant="quiet" size="compact" leadingIcon={<Trash2 />} onPress={requestDelete} busy={busy && !asking} busyLabel={m.working}>
        {named(props.deleteLabel)}
      </Button>
      {props.confirmDeleteTitle ? (
        <ModalDialog
          isOpen={asking}
          onOpenChange={(open) => !open && setAsking(false)}
          role="alertdialog"
          width="narrow"
          busy={busy}
          title={props.confirmDeleteTitle}
          actions={
            <>
              <Button autoFocus onPress={() => setAsking(false)} disabled={busy}>
                {m.cancel}
              </Button>
              <Button variant="danger" busy={busy} onPress={() => void remove()}>
                {props.deleteLabel}
              </Button>
            </>
          }
        >
          {props.confirmDeleteDescription}
        </ModalDialog>
      ) : null}
    </div>
  )
}
