import { useId, type ReactNode } from 'react'
import { Heading, Input, Label, TextField } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { breakpoints, useMinWidth } from '../../internal/media'
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

export interface PageHeaderProps {
  title: string
  headingLevel?: 1 | 2 | 3
  /** `page` uses the h1 step, `display` the display step (login, public page), `section` the h3 step. */
  scale?: 'page' | 'display' | 'section'
  eyebrow?: string
  summary?: string
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

/** The top-of-page block naming the page (spec: wave-1/page-header.md). */
export function PageHeader({
  title,
  headingLevel = 1,
  scale = 'page',
  eyebrow,
  summary,
  icon: Icon,
  breadcrumbs,
  meta,
  actions,
  children,
  headingId,
  editableTitle,
  className,
}: PageHeaderProps) {
  const generated = useId()
  const id = headingId ?? `fk-page-header-${generated.replace(/:/g, '')}`
  const errorId = `${id}-error`
  const wide = useMinWidth(breakpoints.sm)

  const titleNode = editableTitle ? (
    <>
      {/* The outline keeps one heading; the editable field carries its own name. */}
      <Heading level={headingLevel} id={id} className="fk-visually-hidden">
        {editableTitle.value || editableTitle.placeholder}
      </Heading>
      <TextField
        className="fk-page-header__edit"
        value={editableTitle.value}
        onChange={editableTitle.onChange}
        isInvalid={!!editableTitle.errorMessage}
        aria-describedby={editableTitle.errorMessage ? errorId : undefined}
      >
        <Label>
          <VisuallyHidden>{editableTitle.label}</VisuallyHidden>
        </Label>
        <Input className="fk-page-header__title fk-page-header__title-input" placeholder={editableTitle.placeholder} />
      </TextField>
      {editableTitle.errorMessage ? (
        <p id={errorId} className="fk-page-header__error">
          {editableTitle.errorMessage}
        </p>
      ) : null}
    </>
  ) : (
    <Heading level={headingLevel} id={id} className="fk-page-header__title">
      {title}
    </Heading>
  )

  return (
    <div className={cx('fk-page-header', className)} data-scale={scale} data-layout={wide ? 'inline' : 'stacked'}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} className="fk-page-header__breadcrumbs" /> : null}
      <div className="fk-page-header__row">
        {Icon ? (
          <span className="fk-page-header__icon" aria-hidden="true">
            <Icon className="fk-icon" aria-hidden="true" focusable="false" />
          </span>
        ) : null}
        <div className="fk-page-header__text">
          {eyebrow ? <p className="fk-page-header__eyebrow">{eyebrow}</p> : null}
          {titleNode}
          {summary ? <p className="fk-page-header__summary">{summary}</p> : null}
          {meta?.length ? (
            <ul className="fk-page-header__meta">
              {meta.map(({ icon: MetaIcon, text }, i) => (
                <li key={`${text}-${i}`} className="fk-page-header__meta-item">
                  {MetaIcon ? <MetaIcon className="fk-icon" aria-hidden="true" focusable="false" /> : null}
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {actions ? <div className="fk-page-header__actions">{actions}</div> : null}
      </div>
      {children ? <div className="fk-page-header__extra">{children}</div> : null}
    </div>
  )
}
