// SettingsDialog (spec: wave-2/settings-dialog.md; names renamed in
// implementation, see the spec's note). Pages are drawn from `content`
// (heading + typed items) inside a SectionedModal; a page without content
// comes from `renderPage`, else a short sentence.
import { LockKeyhole } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { SectionedModal, type ModalSection } from '../sectioned-modal/SectionedModal'
import type { LockedNotice, SettingsPage } from './settingsModel'
import { ItemControl } from './settingsParts'

export type * from './settingsModel'

export type SettingsOutlineEntry = Omit<ModalSection, 'content' | 'count'>

export interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Navigation entries, in order. */
  outline: SettingsOutlineEntry[]
  /** Page shown on open (the first one otherwise). */
  startAt?: string
  /** Who is signed in, at the top of the navigation. */
  whoCard?: ReactNode
  /** Content by page id. */
  content?: Record<string, SettingsPage>
  /** Host content for pages without `content`. */
  renderPage?: (id: string) => ReactNode | undefined
  /** Sentence for pages with nothing to show. */
  emptyText?: string
  /** Shown when `startAt` is not in `outline`. */
  locked?: LockedNotice
  /** Action at the foot of the navigation (for example "sign out"). */
  exit?: { label: string; icon?: ReactNode; onPress: () => void }
}

export interface PreferenceGroupProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled block of settings (a group, not a landmark). */
export function PreferenceGroup(props: PreferenceGroupProps) {
  const headId = useId()
  return (
    <div role="group" aria-labelledby={props.title ? headId : undefined} className={cx('fk-preference-group', props.className)}>
      {props.title ? (
        <h3 id={headId} className="fk-preference-group__title">
          {props.icon ? (
            <span aria-hidden="true" className="fk-preference-group__icon">
              {props.icon}
            </span>
          ) : null}
          {props.title}
        </h3>
      ) : null}
      <div className="fk-preference-group__body">{props.children}</div>
    </div>
  )
}

function PageBody({ page }: { page: SettingsPage }) {
  return (
    <PreferenceGroup title={page.heading}>
      {page.lead ? <p className="fk-settings-dialog__description">{page.lead}</p> : null}
      {page.items.map((item) => (
        <ItemControl key={item.id} item={item} />
      ))}
    </PreferenceGroup>
  )
}

function Locked({ notice }: { notice: LockedNotice }) {
  return (
    <div className="fk-settings-dialog__denied">
      <span aria-hidden="true" className="fk-settings-dialog__denied-icon">
        {notice.glyph ?? <LockKeyhole />}
      </span>
      <h3 className="fk-settings-dialog__denied-title">{notice.heading}</h3>
      <p className="fk-settings-dialog__description">{notice.reason}</p>
    </div>
  )
}

export function SettingsDialog(props: SettingsDialogProps) {
  const words = useMessages().settingsDialog
  const shell = { open: props.open, onClose: props.onClose, title: props.title, subtitle: props.subtitle }
  const target = props.startAt
  const reachable = !target || props.outline.some((entry) => entry.id === target)

  if (!reachable && props.locked) {
    return (
      <SectionedModal {...shell} size="md">
        <Locked notice={props.locked} />
      </SectionedModal>
    )
  }

  const drawPage = (id: string): ReactNode => {
    const page = props.content?.[id]
    if (page) return <PageBody page={page} />
    return props.renderPage?.(id) ?? <p className="fk-settings-dialog__placeholder">{props.emptyText ?? words.placeholder}</p>
  }
  const foot = props.exit ? (
    <Button fullWidth variant="danger" leadingIcon={props.exit.icon} onPress={props.exit.onPress}>
      {props.exit.label}
    </Button>
  ) : undefined
  return (
    <SectionedModal
      {...shell}
      size="xl"
      className="fk-settings-dialog"
      sections={props.outline.map((entry) => ({ ...entry, content: drawPage(entry.id) }))}
      defaultSection={target}
      identity={props.whoCard}
      navigationFooter={foot}
    />
  )
}
