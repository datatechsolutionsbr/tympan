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

const KeepMountedContext = createContext(false)

/** Sibling views of one object, one panel at a time (spec: wave-1/tabs.md). */
export function Tabs(props: TabsProps) {
  const {
    label,
    tabs,
    selectedKey,
    defaultSelectedKey,
    onSelectionChange,
    orientation = 'horizontal',
    activation = 'automatic',
    keepMounted = false,
    children,
    className,
  } = props
  const disabledKeys = tabs.filter((t) => t.disabled).map((t) => t.id)
  return (
    <AriaTabs
      className={cx('fk-tabs', className)}
      orientation={orientation}
      keyboardActivation={activation}
      disabledKeys={disabledKeys}
      {...(selectedKey !== undefined ? { selectedKey } : {})}
      {...(defaultSelectedKey !== undefined ? { defaultSelectedKey } : {})}
      onSelectionChange={(key: Key) => onSelectionChange?.(String(key))}
    >
      <TabList aria-label={label} className="fk-tabs__list">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Tab key={tab.id} id={tab.id} className="fk-tabs__tab">
              {Icon ? <Icon className="fk-icon fk-tabs__icon" aria-hidden="true" focusable="false" /> : null}
              <span className="fk-tabs__label">{tab.label}</span>
              {tab.count !== undefined ? <> <span className="fk-tabs__count">{tab.count}</span></> : null}
            </Tab>
          )
        })}
      </TabList>
      <KeepMountedContext.Provider value={keepMounted}>{children}</KeepMountedContext.Provider>
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
export function TabPanel({ id, children, className }: TabPanelProps) {
  const keepMounted = useContext(KeepMountedContext)
  return (
    <AriaTabPanel id={id} className={cx('fk-tabs__panel', className)} shouldForceMount={keepMounted}>
      {children}
    </AriaTabPanel>
  )
}
