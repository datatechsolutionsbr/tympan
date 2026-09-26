import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { TabPanel, Tabs, type TabItem, type TabsProps } from './Tabs'

import * as rtlDom from '@testing-library/react'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const tabs: TabItem[] = [
  { id: 'definition', label: 'Definition' },
  { id: 'runs', label: 'Runs', count: 4 },
  { id: 'versions', label: 'Versions' },
]

function Example(props: Partial<TabsProps>) {
  return (
    <Tabs label="Analysis" tabs={tabs} {...props}>
      <TabPanel id="definition">
        <label>
          Name <input />
        </label>
      </TabPanel>
      <TabPanel id="runs">Runs panel</TabPanel>
      <TabPanel id="versions">Versions panel</TabPanel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders one tablist with three tabs and one selected', () => {
    render(<Example />)
    const list = screen.getByRole('tablist', { name: 'Analysis' })
    const all = within(list).getAllByRole('tab')
    expect(all).toHaveLength(3)
    expect(all.filter((t) => t.getAttribute('aria-selected') === 'true')).toHaveLength(1)
  })

  it('moves and selects with ArrowRight under automatic activation', async () => {
    const onSelectionChange = vi.fn()
    render(<Example onSelectionChange={onSelectionChange} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    const runs = screen.getByRole('tab', { name: /Runs/ })
    expect(runs).toHaveFocus()
    expect(runs).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Runs panel')
    expect(onSelectionChange).toHaveBeenLastCalledWith('runs')
  })

  it('moves focus without selecting under manual activation until Enter', async () => {
    render(<Example activation="manual" />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    const runs = screen.getByRole('tab', { name: /Runs/ })
    expect(runs).toHaveFocus()
    expect(runs).toHaveAttribute('aria-selected', 'false')
    await userEvent.keyboard('{Enter}')
    expect(runs).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps from the last tab to the first', async () => {
    render(<Example defaultSelectedKey="versions" />)
    await userEvent.tab()
    expect(screen.getByRole('tab', { name: 'Versions' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Definition' })).toHaveFocus()
  })

  it('skips a disabled tab', async () => {
    render(<Example tabs={[tabs[0]!, { ...tabs[1]!, disabled: true }, tabs[2]!]} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Versions' })).toHaveFocus()
  })

  it('includes the count in the accessible name', () => {
    render(<Example />)
    expect(screen.getByRole('tab', { name: 'Runs 4' })).toBeInTheDocument()
  })

  it('preserves input values across switches with keepMounted', async () => {
    render(<Example keepMounted />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Stage count')
    await userEvent.click(screen.getByRole('tab', { name: /Runs/ }))
    await userEvent.click(screen.getByRole('tab', { name: 'Definition' }))
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Stage count')
  })

  it('moves focus from the list into the selected panel with Tab', async () => {
    render(<Example defaultSelectedKey="runs" />)
    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('has 44 px touch tabs, reduced motion and forced colours rules', () => {
    const css = cssOf('components/tabs/Tabs.css')
    expect(mediaBlock(css, /\(max-width:\s*1023\.98px\)/)).toMatch(/var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<Example />)
    await expectNoAxeViolations(container)
  })
})

describe('Tabs in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(
      <Tabs label="التحليل" tabs={[{ id: 'a', label: 'التعريف' }, { id: 'b', label: 'التشغيلات' }]}>
        <TabPanel id="a">أ</TabPanel>
        <TabPanel id="b">ب</TabPanel>
      </Tabs>,
    )
    await rtlUser.click(rtlDom.screen.getByRole('tab', { name: 'التعريف' }))
    // In right-to-left, Left Arrow goes to the next tab.
    await rtlUser.keyboard('{ArrowLeft}')
    expect(rtlDom.screen.getByRole('tab', { name: 'التشغيلات' })).toHaveAttribute('aria-selected', 'true')
    await axeRtl(container)
  })
})
