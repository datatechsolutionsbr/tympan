import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ChipGroup, type ChipItem } from './ChipGroup'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

const ab: ChipItem[] = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
]

function Harness({ initial = ab, selected = [] as string[], onSel, onItems }: { initial?: ChipItem[]; selected?: string[]; onSel?: (ids: string[]) => void; onItems?: (i: ChipItem[]) => void }) {
  const [items, setItems] = useState(initial)
  const [sel, setSel] = useState(selected)
  return (
    <ChipGroup
      label="Languages"
      items={items}
      selectedIds={sel}
      allowCustom
      onItemsChange={(i) => {
        setItems(i)
        onItems?.(i)
      }}
      onSelectionChange={(ids) => {
        setSel(ids)
        onSel?.(ids)
      }}
    />
  )
}

describe('ChipGroup', () => {
  it('activating chip A reports [A]', async () => {
    const onSelectionChange = vi.fn()
    render(<ChipGroup label="Letters" items={ab} selectedIds={[]} onSelectionChange={onSelectionChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }))
    expect(onSelectionChange).toHaveBeenCalledWith(['a'])
  })

  it('Select all reports every id and Clear reports []', async () => {
    const onSelectionChange = vi.fn()
    render(<ChipGroup label="Letters" items={ab} selectedIds={['a']} onSelectionChange={onSelectionChange} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 selected')
    await userEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  it('typing "x, y" and Enter adds two custom items, both selected', async () => {
    const onSel = vi.fn()
    render(<Harness onSel={onSel} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Add an item' }), 'x, y{Enter}')
    expect(screen.getByRole('checkbox', { name: 'x' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'y' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Remove x' })).toBeInTheDocument()
  })

  it('committing "Alpha" when "alpha" exists selects it without adding', async () => {
    const onItems = vi.fn()
    render(<Harness initial={[{ id: 'alpha', name: 'alpha' }]} onItems={onItems} />)
    await userEvent.type(screen.getByRole('textbox'), 'Alpha{Enter}')
    expect(onItems).not.toHaveBeenCalled()
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(screen.getByRole('checkbox', { name: 'alpha' })).toBeChecked()
  })

  it('leaving the add field commits the draft', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('textbox'), 'zeta')
    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'zeta' })).toBeChecked()
  })

  it('Backspace in the empty add field removes and deselects the last custom item', async () => {
    const onSel = vi.fn()
    render(<Harness initial={[...ab, { id: 'q', name: 'q', custom: true }]} selected={['q']} onSel={onSel} />)
    await userEvent.click(screen.getByRole('textbox'))
    await userEvent.keyboard('{Backspace}')
    expect(screen.queryByRole('checkbox', { name: 'q' })).toBeNull()
    expect(onSel).toHaveBeenLastCalledWith([])
  })

  it('catalogue items have no remove control', () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
  })

  it('shows the loading text and no chips while loading', () => {
    render(<ChipGroup label="Letters" items={ab} selectedIds={[]} onSelectionChange={() => {}} loading />)
    expect(screen.getByText('Loading items')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('keeps 44 px targets and a forced-colours selection border', () => {
    const css = cssOf('components/chip-group/ChipGroup.css')
    expect(css).toMatch(/\.ty-chip-group__remove::before[\s\S]*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ChipGroup
              label={`Languages ${scheme}`}
              items={[{ id: 'pt', name: 'Portuguese', code: 'pt', marker: 2 }, { id: 'es', name: 'Spanish', code: 'es' }, { id: 'x', name: 'Custom', custom: true }]}
              selectedIds={['pt', 'x']}
              onSelectionChange={() => {}}
              allowCustom
              onItemsChange={() => {}}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ChipGroup in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ChipGroup label="اللغات" items={[{ id: 'ar', name: 'العربية' }, { id: 'he', name: 'עברית' }]} selectedIds={['ar']} onSelectionChange={() => {}} />)
    expect(rtlDom.screen.getByRole('checkbox', { name: /العربية/ })).toBeChecked()
    await axeRtl(container)
  })
})
