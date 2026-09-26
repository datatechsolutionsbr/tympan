import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { BrandMark } from '../brand-mark/BrandMark'
import { BrandPanel } from './BrandPanel'

const figures = [
  { value: '94', label: 'cases' },
  { value: '31', label: 'countries' },
  { value: '512', label: 'proved claims' },
]

describe('BrandPanel', () => {
  it('is a complementary region named by the title with a list of figures', () => {
    render(<BrandPanel mark={<BrandMark />} title="Evidence first" subtitle="A research workbench." figures={figures} />)
    const region = screen.getByRole('complementary', { name: 'Evidence first' })
    expect(within(region).getAllByRole('listitem')).toHaveLength(3)
    expect(within(region).getAllByRole('listitem')[0]).toHaveTextContent('94 cases')
    expect(screen.getByRole('heading', { level: 2, name: 'Evidence first' })).toBeInTheDocument()
  })

  it('holds nothing focusable', async () => {
    render(
      <>
        <BrandPanel mark={<BrandMark />} title="T" subtitle="S" figures={figures} />
        <button>after</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  it('renders no empty footnote line', () => {
    const { container } = render(<BrandPanel mark={null} title="T" subtitle="S" />)
    expect(container.querySelector('.fk-brand-panel__footnote')).toBeNull()
  })

  it('borders each tile and hides decoration under forced colours', () => {
    const forced = mediaBlock(cssOf('components/brand-panel/BrandPanel.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.fk-brand-panel__figure\s*\{[^}]*border:\s*1px solid CanvasText/)
    expect(forced).toMatch(/\.fk-brand-panel__decor\s*\{[^}]*display:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <BrandPanel mark={<BrandMark />} title={`Panel ${s}`} subtitle="Sub" figures={figures} footnote="EACH/USP" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
