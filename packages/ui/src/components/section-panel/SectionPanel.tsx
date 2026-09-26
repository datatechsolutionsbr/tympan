import { ChevronDown } from 'lucide-react'
import { createElement, useId, type ReactNode } from 'react'
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type SectionPanelScale = 'section' | 'surface' | 'banner' | 'display'
export type SectionPanelElevation = 'sheet' | 'raised' | 'flat'

export interface SectionPanelProps {
  title: string
  eyebrow?: string
  eyebrowAside?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  scale?: SectionPanelScale
  headingLevel?: 1 | 2 | 3
  actions?: ReactNode
  aside?: ReactNode
  toolbar?: ReactNode
  tags?: ReactNode
  elevation?: SectionPanelElevation
  accentStripe?: boolean
  padded?: boolean
  collapsible?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
  className?: string
}

interface HeadParts {
  titleId: string
  props: SectionPanelProps
  /** Wraps the icon, title and chevron in the disclosure trigger when collapsible. */
  trigger: boolean
}

/** Title line: a heading, whose content becomes the trigger button when collapsible. */
function TitleLine({ titleId, props, trigger }: HeadParts) {
  const words = (
    <>
      {props.icon ? (
        <span className="ty-section-panel__icon" aria-hidden="true">
          {props.icon}
        </span>
      ) : null}
      <span id={titleId} className="ty-section-panel__title-text">
        {props.title}
      </span>
    </>
  )
  const inner = trigger ? (
    <Button slot="trigger" className="ty-section-panel__trigger">
      {words}
      <ChevronDown className="ty-icon ty-section-panel__chevron" aria-hidden="true" focusable="false" />
    </Button>
  ) : (
    words
  )
  return createElement(`h${props.headingLevel ?? 2}`, { className: 'ty-section-panel__title' }, inner)
}

function Head(parts: HeadParts) {
  const { props } = parts
  const trailing = props.aside || props.actions
  return (
    <div className="ty-section-panel__head">
      <div className="ty-section-panel__lead">
        {props.eyebrow || props.eyebrowAside ? (
          <div className="ty-section-panel__eyebrow">
            {props.eyebrow ? <span>{props.eyebrow}</span> : null}
            {props.eyebrowAside}
          </div>
        ) : null}
        <TitleLine {...parts} />
        {props.subtitle ? <p className="ty-section-panel__subtitle">{props.subtitle}</p> : null}
      </div>
      {/* Actions stay outside the trigger: each is its own tab stop. */}
      {trailing ? (
        <div className="ty-section-panel__trailing">
          {props.aside}
          {props.actions}
        </div>
      ) : null}
    </div>
  )
}

function Content({ props }: { props: SectionPanelProps }) {
  return (
    <>
      {props.toolbar ? <div className="ty-section-panel__toolbar">{props.toolbar}</div> : null}
      {props.tags ? <div className="ty-section-panel__tags">{props.tags}</div> : null}
      <div className="ty-section-panel__body" data-padded={props.padded === false ? 'false' : 'true'}>
        {props.children}
      </div>
    </>
  )
}

/** A titled block (sheet) of a page, optionally collapsible (spec: wave-2/section-panel.md). */
export function SectionPanel(props: SectionPanelProps) {
  const titleId = useId()
  const shell = {
    className: cx('ty-section-panel', props.className),
    'data-scale': props.scale ?? 'section',
    'data-elevation': props.elevation ?? 'sheet',
    'aria-labelledby': titleId,
  }
  const stripe = props.accentStripe ? <span className="ty-section-panel__stripe" aria-hidden="true" /> : null

  if (!props.collapsible) {
    return (
      <section {...shell}>
        {stripe}
        <Head titleId={titleId} props={props} trigger={false} />
        <Content props={props} />
      </section>
    )
  }

  const controlled = props.open !== undefined
  return (
    <section {...shell}>
      {stripe}
      <Disclosure
        className="ty-section-panel__disclosure"
        {...(controlled ? { isExpanded: props.open } : { defaultExpanded: props.defaultOpen ?? true })}
        onExpandedChange={props.onOpenChange}
      >
        <Head titleId={titleId} props={props} trigger />
        <DisclosurePanel className="ty-section-panel__panel" role="region" aria-labelledby={titleId}>
          <Content props={props} />
        </DisclosurePanel>
      </Disclosure>
    </section>
  )
}
