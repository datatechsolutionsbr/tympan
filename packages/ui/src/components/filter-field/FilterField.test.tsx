import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { FilterField } from './FilterField'

describe('FilterField', () => {
  it('is a searchbox named by its visible label', () => {
    render(<FilterField label="Filter members" value="" onChange={() => {}} />)
    expect(screen.getByRole('searchbox', { name: 'Filter members' })).toBeInTheDocument()
  })

  it('uses ariaLabel, not the placeholder, as the name', () => {
    render(<FilterField ariaLabel="Filter" placeholder="Type a name" value="" onChange={() => {}} />)
    expect(screen.getByRole('searchbox', { name: 'Filter' })).toBeInTheDocument()
  })

  it('Escape clears a non-empty value', async () => {
    const onChange = vi.fn()
    render(<FilterField ariaLabel="Filter" value="ana" onChange={onChange} />)
    await userEvent.click(screen.getByRole('searchbox'))
    await userEvent.keyboard('{Escape}')
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('reports every edit', async () => {
    function Harness() {
      const [v, setV] = useState('')
      return <FilterField ariaLabel="Filter" value={v} onChange={setV} />
    }
    render(<Harness />)
    await userEvent.type(screen.getByRole('searchbox'), 'an')
    expect(screen.getByRole('searchbox')).toHaveValue('an')
  })

  it('shows the clear control only with text', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<FilterField ariaLabel="Filter" value="" onChange={onChange} />)
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull()
    rerender(<FilterField ariaLabel="Filter" value="ana" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear filter' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('announces the result count politely after a pause', () => {
    vi.useFakeTimers()
    const { rerender } = render(<FilterField ariaLabel="Filter" value="a" onChange={() => {}} resultCountText="12 results" />)
    rerender(<FilterField ariaLabel="Filter" value="ab" onChange={() => {}} resultCountText="3 results" />)
    expect(screen.getByRole('status')).not.toHaveTextContent('3 results')
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByRole('status')).toHaveTextContent('3 results')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    vi.useRealTimers()
  })

  it('gives the clear control a 44 x 44 hit area; forced colours keep the border', () => {
    const css = cssOf('internal/forms-a/SearchInput.css')
    expect(css).toMatch(/\.fk-search-input__clear::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--fk-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/FieldText/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/--fk-surface-solid/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FilterField label={`Filter ${scheme}`} value="ana" onChange={() => {}} resultCountText="2 results" />
            <FilterField ariaLabel={`Empty ${scheme}`} value="" onChange={() => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
