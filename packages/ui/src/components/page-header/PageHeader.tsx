import { useId, type ReactNode } from 'react'
import { Heading, Input, Label, Link as AriaLink, TextField } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { VisuallyHidden } from '../../internal/VisuallyHidden'
import { Breadcrumbs } from '../breadcrumbs/Breadcrumbs'

export interface PageHeaderMetaItem {
  icon?: IconComponent
  text: string
}

export interface PageHeaderEditableTitle {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Accessible name of the title input. */
  label: string
  /** Host-provided validation message shown under the title. */
  errorMessage?: string
}

export interface PageHeaderTrailLevel {
  label: string
  /** Omit on the last level (the current page). */
  href?: string
}

export interface PageHeaderProps {
  title: string
  headingLevel?: 1 | 2 | 3
  /** `page` uses the h1 step, `display` the display step (login, public page), `section` the h3 step. */
  scale?: 'page' | 'display' | 'section'
  /**
   * `standard` (wave 1) or `editorial` (wave 4, the head of the research
   * sheet: mono trail line, serif title, lead, actions at the end, divider).
   */
  variant?: 'standard' | 'editorial'
  eyebrow?: string
  summary?: string
  /** Lead paragraph (body-lg, 68ch). */
  lead?: ReactNode
  /** Mono breadcrumb line; the last level is the current page. */
  trail?: PageHeaderTrailLevel[]
  /** Hairline under the block (default: true for `editorial`). */
  divider?: boolean
  icon?: IconComponent
  breadcrumbs?: Array<{ label: string; href: string }>
  meta?: PageHeaderMetaItem[]
  /** Page actions: at most one primary button (§2.10). */
  actions?: ReactNode
  /** Extra content below (tags, tabs, filters). */
  children?: ReactNode
  headingId?: string
  editableTitle?: PageHeaderEditableTitle
  className?: string
}

type Part = readonly [slot: string, node: ReactNode]

/** Keeps the parts that have content, in the given order. */
function present(parts: Part[]): Part[] {
  return parts.filter(([, node]) => node !== null && node !== undefined && node !== false)
}

function TrailLine({ levels, label }: { levels: PageHeaderTrailLevel[]; label: string }) {
  const lastIndex = levels.length - 1
  return (
    <nav className="ty-page-header__trail" aria-label={label}>
      <ol className="ty-page-header__trail-list">
        {levels.map((level, index) => {
          const isHere = index === lastIndex
          return (
            <li key={`${index}:${level.label}`} className="ty-page-header__trail-level" data-here={isHere || undefined}>
              {isHere || !level.href ? (
                <span aria-current={isHere ? 'page' : undefined} dir="auto">{level.label}</span>
              ) : (
                <AriaLink className="ty-page-header__trail-link" href={level.href} dir="auto">
                  {level.label}
                </AriaLink>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function MetaRow({ items }: { items: PageHeaderMetaItem[] }) {
  return (
    <ul className="ty-page-header__meta">
      {items.map((entry, position) => {
        const Glyph = entry.icon
        return (
          <li key={position + entry.text} className="ty-page-header__meta-item">
            {Glyph ? <Glyph className="ty-icon" aria-hidden="true" focusable="false" /> : null}
            <span dir="auto">{entry.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

function EditableTitle({ level, id, edit }: { level: 1 | 2 | 3; id: string; edit: PageHeaderEditableTitle }) {
  const errorId = `${id}-error`
  const invalid = Boolean(edit.errorMessage)
  return (
    <>
      {/* The outline keeps one heading; the field carries its own name. */}
      <Heading level={level} id={id} className="ty-visually-hidden">
        {edit.value || edit.placeholder}
      </Heading>
      <TextField className="ty-page-header__edit" value={edit.value} onChange={edit.onChange} isInvalid={invalid} aria-describedby={invalid ? errorId : undefined}>
        <Label>
          <VisuallyHidden>{edit.label}</VisuallyHidden>
        </Label>
        <Input className="ty-page-header__title ty-page-header__title-input" placeholder={edit.placeholder} />
      </TextField>
      {invalid ? (
        <p id={errorId} className="ty-page-header__error">
          {edit.errorMessage}
        </p>
      ) : null}
    </>
  )
}

/** The top-of-page block naming the page (specs: wave-1/page-header.md, wave-4/page-header-editorial.md). */
export function PageHeader(props: PageHeaderProps) {
  const copy = useMessages()
  const autoId = useId()
  const roomy = useMinWidth(breakpoints.sm)
  const level = props.headingLevel ?? 1
  const editorial = props.variant === 'editorial'
  const titleId = props.headingId ?? `ty-page-header-${autoId.replace(/:/g, '')}`
  const Icon = props.icon

  const title = props.editableTitle ? (
    <EditableTitle level={level} id={titleId} edit={props.editableTitle} />
  ) : (
    <Heading level={level} id={titleId} className="ty-page-header__title" dir="auto">
      {props.title}
    </Heading>
  )

  const textParts = present([
    ['eyebrow', props.eyebrow ? <p className="ty-page-header__eyebrow" dir="auto">{props.eyebrow}</p> : null],
    ['title', title],
    ['summary', props.summary ? <p className="ty-page-header__summary" dir="auto">{props.summary}</p> : null],
    ['lead', props.lead ? <div className="ty-page-header__lead" dir="auto">{props.lead}</div> : null],
    ['meta', props.meta?.length ? <MetaRow items={props.meta} /> : null],
  ])

  const above = present([
    ['trail', props.trail?.length ? <TrailLine levels={props.trail} label={copy.pageTrail.label} /> : null],
    ['breadcrumbs', props.breadcrumbs?.length ? <Breadcrumbs items={props.breadcrumbs} className="ty-page-header__breadcrumbs" /> : null],
  ])

  return (
    <div
      className={cx('ty-page-header', props.className)}
      data-scale={props.scale ?? 'page'}
      data-variant={editorial ? 'editorial' : undefined}
      data-divider={(props.divider ?? editorial) || undefined}
      data-layout={roomy ? 'inline' : 'stacked'}
    >
      {above.map(([slot, node]) => (
        <SlotFragment key={slot}>{node}</SlotFragment>
      ))}
      <div className="ty-page-header__row">
        {Icon ? (
          <span className="ty-page-header__icon" aria-hidden="true">
            <Icon className="ty-icon" aria-hidden="true" focusable="false" />
          </span>
        ) : null}
        <div className="ty-page-header__text">
          {textParts.map(([slot, node]) => (
            <SlotFragment key={slot}>{node}</SlotFragment>
          ))}
        </div>
        {props.actions ? <div className="ty-page-header__actions">{props.actions}</div> : null}
      </div>
      {props.children ? <div className="ty-page-header__extra">{props.children}</div> : null}
    </div>
  )
}

function SlotFragment({ children }: { children: ReactNode }) {
  return <>{children}</>
}
