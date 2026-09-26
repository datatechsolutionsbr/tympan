import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { FilterChips, type ActiveFilter } from './FilterChips'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

const brazil: ActiveFilter = { kind: 'country', value: 'br', label: 'Brazil' }
const year: ActiveFilter = { kind: 'year', value: '2024', label: '2024' }

function Harness({ onRemove, initial = [brazil, year] }: { onRemove?: (f: ActiveFilter) => void; initial?: ActiveFilter[] }) {
  const [filters, setFilters] = useState(initial)
  return (
    <>
      <FilterChips
        filters={filters}
        kindIcons={{ country: MapPin }}
        onRemove={(f) => {
          onRemove?.(f)
          setFilters((all) => all.filter((x) => x !== f))
        }}
      />
      <button type="button">After</button>
    </>
  )
}

describe('FilterChips', () => {
  it('names each remove button with its filter', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Remove Brazil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove 2024' })).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Active filters' })).toBeInTheDocument()
  })

  it('removing Brazil reports it, moves focus to the 2024 chip and announces', async () => {
    const onRemove = vi.fn()
    render(<Harness onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Brazil' }))
    expect(onRemove).toHaveBeenCalledWith(brazil)
    expect(screen.getByRole('row', { name: /2024/ })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Brazil removed')
  })

  it('Delete on a focused chip removes its filter', async () => {
    const onRemove = vi.fn()
    render(<Harness onRemove={onRemove} />)
    await userEvent.tab()
    await userEvent.keyboard('{Delete}')
    expect(onRemove).toHaveBeenCalledWith(brazil)
  })

  it('focus leaves to the next focusable element when the last chip goes', async () => {
    render(<Harness initial={[brazil]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Brazil' }))
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('has no remove controls without onRemove', () => {
    render(<FilterChips filters={[brazil, year]} />)
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull()
  })

  it('uses the default icon for an unknown kind', () => {
    const { container } = render(<FilterChips filters={[year]} kindIcons={{ country: MapPin }} />)
    expect(container.querySelector('[data-kind-icon="default"]')).not.toBeNull()
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<FilterChips filters={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows Clear all only with two or more chips', async () => {
    const onClearAll = vi.fn()
    const { rerender } = render(<FilterChips filters={[brazil]} onClearAll={onClearAll} />)
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
    rerender(<FilterChips filters={[brazil, year]} onClearAll={onClearAll} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClearAll).toHaveBeenCalled()
  })

  it('keeps 44 px remove targets, opacity-only entry and forced-colour borders', () => {
    const css = cssOf('components/filter-chips/FilterChips.css')
    expect(css).toMatch(/\.ty-filter-chips__remove::before[\s\S]*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/ButtonText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FilterChips
              groupLabel={`Filters ${scheme}`}
              filters={[{ ...brazil, tone: 3 }, { ...year, tone: 'accent' }]}
              onRemove={() => {}}
              onClearAll={() => {}}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('FilterChips in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<FilterChips groupLabel="المرشحات" filters={[{ kind: 'country', value: 'eg', label: 'مصر' }]} onRemove={() => {}} onClearAll={() => {}} />)
    expect(rtlDom.screen.getByText('مصر')).toBeInTheDocument()
    await axeRtl(container)
  })
})
