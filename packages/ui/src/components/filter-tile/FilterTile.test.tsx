import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Flag, Globe } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { FilterTile, FilterTileGrid, FilterTileGroupHeading } from './FilterTile'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

describe('FilterTile', () => {
  it('Space on an unselected tile calls onToggle once', async () => {
    const onToggle = vi.fn()
    render(<FilterTile selected={false} onToggle={onToggle} label="Brazil" icon={<Flag />} />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('reports pressed and shows a check mark when selected', () => {
    const { container } = render(<FilterTile selected onToggle={() => {}} label="Brazil" icon={<Flag />} />)
    expect(screen.getByRole('button', { name: 'Brazil' })).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('.ty-selected-mark')).not.toBeNull()
  })

  it('describes the tile with its detail', () => {
    render(<FilterTile selected={false} onToggle={() => {}} label="Brazil" detail="42 records" icon={<Flag />} />)
    expect(screen.getByRole('button', { name: 'Brazil' })).toHaveAccessibleDescription('42 records')
  })

  it('group heading renders at the requested level', () => {
    render(<FilterTileGroupHeading label="Countries" icon={<Globe />} level={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Countries' })).toBeInTheDocument()
  })

  it('selected state survives forced colours without colour (thick border and check)', () => {
    const forced = mediaBlock(cssOf('components/filter-tile/FilterTile.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\[data-selected\]\s*\{[^}]*border:\s*3px solid Highlight/)
    const css = cssOf('internal/forms-a/shared.css')
    expect(css).toMatch(/\.ty-selected-mark/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FilterTileGroupHeading label={`Countries ${scheme}`} icon={<Globe />} />
            <FilterTileGrid label={`Country filters ${scheme}`}>
              <FilterTile selected onToggle={() => {}} label="Brazil" detail="42 records" icon={<Flag />} tone={2} />
              <FilterTile selected={false} onToggle={() => {}} label="Park" icon={<Flag />} iconSurface="neutral" />
            </FilterTileGrid>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('FilterTile in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<FilterTileGrid label="الدول"><FilterTile selected onToggle={() => {}} label="مصر" detail="٤٢ سجلًا" icon={<Flag />} /></FilterTileGrid>)
    expect(rtlDom.screen.getByRole('button', { name: /مصر/ })).toHaveAttribute('aria-pressed', 'true')
    await axeRtl(container)
  })
})
