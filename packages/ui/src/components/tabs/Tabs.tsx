import { createContext, useContext, type ReactNode } from 'react'
import { Tab, TabList, TabPanel as AriaTabPanel, Tabs as AriaTabs, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { IconComponent } from '../../internal/types'

export interface TabItem {
  id: string
  label: ReactNode
  icon?: IconComponent
  /** Count after the label, included in the accessible name. */
  count?: number
  disabled?: boolean
}

export interface TabsProps {
  /** Accessible name of the tab list. */
  label: string
  tabs: TabItem[]
  selectedKey?: string
  defaultSelectedKey?: string
  onSelectionChange?: (key: string) => void
  orientation?: 'horizontal' | 'vertical'
  /** Automatic selects on focus; manual needs Enter or Space. */
  activation?: 'automatic' | 'manual'
  /** Keeps inactive panels in the DOM (hidden) to preserve their state. */
  keepMounted?: boolean
  /** TabPanel elements. */
  children: ReactNode
  className?: string
}

/** Panel policy shared with every TabPanel below one Tabs. */
const PanelPolicy = createContext({ forceMount: false })

function TabLabel({ item }: { item: TabItem }) {
  const Glyph = item.icon
  const counted = typeof item.count === 'number'
  return (
    <Tab id={item.id} className="ty-tabs__tab">
      {Glyph && <Glyph className="ty-icon ty-tabs__icon" aria-hidden="true" focusable="false" />}
      <span className="ty-tabs__label">{item.label}</span>
      {counted && ' '}
      {counted && <span className="ty-tabs__count">{item.count}</span>}
    </Tab>
  )
}

/** Only the selection props the host actually set are forwarded (RAC treats `undefined` as controlled). */
function selectionOf(p: TabsProps): { selectedKey?: string; defaultSelectedKey?: string } {
  const out: { selectedKey?: string; defaultSelectedKey?: string } = {}
  if (p.selectedKey !== undefined) out.selectedKey = p.selectedKey
  if (p.defaultSelectedKey !== undefined) out.defaultSelectedKey = p.defaultSelectedKey
  return out
}

/** Sibling views of one object, one panel at a time (spec: wave-1/tabs.md). */
export function Tabs(props: TabsProps) {
  const blocked = props.tabs.reduce<string[]>((acc, t) => (t.disabled ? [...acc, t.id] : acc), [])
  const report = (key: Key) => props.onSelectionChange?.(`${key}`)
  return (
    <AriaTabs
      {...selectionOf(props)}
      className={cx('ty-tabs', props.className)}
      orientation={props.orientation ?? 'horizontal'}
      keyboardActivation={props.activation ?? 'automatic'}
      disabledKeys={blocked}
      onSelectionChange={report}
    >
      <TabList aria-label={props.label} className="ty-tabs__list">
        {props.tabs.map((item) => (
          <TabLabel key={item.id} item={item} />
        ))}
      </TabList>
      <PanelPolicy.Provider value={{ forceMount: props.keepMounted === true }}>{props.children}</PanelPolicy.Provider>
    </AriaTabs>
  )
}

export interface TabPanelProps {
  /** Matches a tab id. */
  id: string
  children: ReactNode
  className?: string
}

/** Content of one tab. */
export function TabPanel(props: TabPanelProps) {
  const policy = useContext(PanelPolicy)
  return (
    <AriaTabPanel id={props.id} shouldForceMount={policy.forceMount} className={cx('ty-tabs__panel', props.className)}>
      {props.children}
    </AriaTabPanel>
  )
}
