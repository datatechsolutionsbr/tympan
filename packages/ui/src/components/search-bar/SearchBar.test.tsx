import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import type { ActiveFilter } from '../filter-chips/FilterChips'
import { SearchBar, type SearchBarProps } from './SearchBar'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

const brazil: ActiveFilter = { kind: 'country', value: 'br', label: 'Brazil' }
const stage: ActiveFilter = { kind: 'stage', value: '4', label: 'Stage 4' }

function Harness(props: Partial<SearchBarProps>) {
  const [q, setQ] = useState(props.query ?? '')
  return (
    <SearchBar
      {...props}
      query={q}
      onQueryChange={(v) => {
        setQ(v)
        props.onQueryChange?.(v)
      }}
    />
  )
}

describe('SearchBar', () => {
  it('exposes a search landmark', () => {
    render(<SearchBar query="" onQueryChange={() => {}} />)
    expect(screen.getByRole('search')).toBeInTheDocument()
  })

  it('shows no clear controls when empty and both with text', () => {
    const { rerender } = render(<SearchBar query="" onQueryChange={() => {}} onClearAll={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull()
    rerender(<SearchBar query="abc" onQueryChange={() => {}} onClearAll={() => {}} />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
  })

  it('reports typing', async () => {
    const onQueryChange = vi.fn()
    render(<Harness onQueryChange={onQueryChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'a')
    expect(onQueryChange).toHaveBeenCalledWith('a')
  })

  it('removes a filter through its chip and uses the refine wording', async () => {
    const onRemoveFilter = vi.fn()
    render(<SearchBar query="" onQueryChange={() => {}} filters={[brazil, stage]} onRemoveFilter={onRemoveFilter} />)
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Refine within the filters')
    await userEvent.click(screen.getByRole('button', { name: 'Remove Stage 4' }))
    expect(onRemoveFilter).toHaveBeenCalledWith(stage)
  })

  it('cancel style: Cancel appears while focused, empties the query and calls onCancel', async () => {
    const onCancel = vi.fn()
    const onQueryChange = vi.fn()
    render(<Harness query="abc" cancelStyle onCancel={onCancel} onQueryChange={onQueryChange} onClearAll={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    await userEvent.click(screen.getByRole('searchbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('filters dialog: counted trigger, Clear only with onClear and a count, Done closes', async () => {
    function DialogHarness({ withClear }: { withClear: boolean }) {
      const [open, setOpen] = useState(false)
      return (
        <SearchBar
          query=""
          onQueryChange={() => {}}
          filterDialog={{ open, onOpenChange: setOpen, activeCount: 3, onClear: withClear ? () => {} : undefined, content: <p>Body</p> }}
        />
      )
    }
    const { unmount } = render(<DialogHarness withClear />)
    const trigger = screen.getByRole('button', { name: /3/ })
    expect(trigger).toHaveAccessibleName('Filters, 3 active')
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    unmount()
    render(<DialogHarness withClear={false} />)
    await userEvent.click(screen.getByRole('button', { name: /3/ }))
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
  })

  it('keeps 44 px targets and stacks under 640', () => {
    const css = cssOf('components/search-bar/SearchBar.css')
    expect(css).toMatch(/max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/'actions'/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SearchBar
              label={`Search cases ${scheme}`}
              query="centro"
              onQueryChange={() => {}}
              filters={[brazil]}
              onRemoveFilter={() => {}}
              onClearAll={() => {}}
              filterDialog={{ open: false, onOpenChange: () => {}, activeCount: 1, content: null }}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('SearchBar in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<SearchBar label="ابحث في الحالات" query="" onQueryChange={() => {}} filters={[]} onRemoveFilter={() => {}} onClearAll={() => {}} />)
    expect(rtlDom.screen.getByRole('searchbox')).toBeInTheDocument()
    await axeRtl(container)
  })
})
