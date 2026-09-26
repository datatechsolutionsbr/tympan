import { I18nProvider } from 'react-aria-components'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { StageStrip, type Stage } from './StageStrip'

const stages: Stage[] = [
  { id: 'search', label: 'Search', href: '/sources', status: 'done', figures: ['14 sources', '2 sessions'] },
  { id: 'organise', label: 'Organise', href: '/base', status: 'current', figures: ['94 records'] },
  { id: 'analyse', label: 'Analyse', href: '/analyses', status: 'attention', figures: ['1 failed run'] },
  { id: 'publish', label: 'Publish', href: '/editions', status: 'upcoming' },
  { id: 'write', label: 'Manuscript', href: '/manuscript', status: 'upcoming' },
]

describe('StageStrip', () => {
  it('renders an ordered list of the stages, in order', () => {
    renderWithProvider(<StageStrip stages={stages} label="From search to manuscript" />, { navigate: vi.fn() })
    const list = screen.getByRole('list', { name: 'From search to manuscript' })
    expect(list.tagName).toBe('OL')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((i) => within(i).getByRole('link').textContent)).toEqual(['Search', 'Organise', 'Analyse', 'Publish', 'Manuscript'])
  })

  it('marks the current stage with aria-current="step" and its word', () => {
    render(<StageStrip stages={stages} label="Stages" />)
    const current = screen.getAllByRole('listitem').find((i) => i.getAttribute('aria-current') === 'step')!
    expect(current).toHaveTextContent('current')
    expect(current).toHaveTextContent('Organise')
  })

  it('shows icon and word for attention', () => {
    render(<StageStrip stages={stages} label="Stages" />)
    const attention = screen.getAllByRole('listitem')[2]!
    expect(attention).toHaveTextContent('needs attention')
    expect(attention.querySelector('.ty-stage-strip__status svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('links each stage name and hides the arrows', () => {
    render(<StageStrip stages={stages} label="Stages" />)
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(document.querySelectorAll('.ty-stage-strip__arrow')).toHaveLength(4)
    for (const arrow of document.querySelectorAll('.ty-stage-strip__arrow')) expect(arrow).toHaveAttribute('aria-hidden', 'true')
  })

  it('is a row from 1024 px, keeps 44 px link targets and a system border when forced', () => {
    const css = cssOf('components/stage-strip/StageStrip.css')
    expect(mediaBlock(css, /\(min-width:\s*1024px\)/)).toMatch(/flex-direction:\s*row/)
    expect(css).toMatch(/max\(100%, var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/2px solid Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = renderWithProvider(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <StageStrip stages={stages} label={`Stages ${scheme}`} title="From search to manuscript" />
          </ThemeScope>
        ))}
      </>,
      { navigate: vi.fn() },
    )
    await expectNoAxeViolations(container)
  })
})

describe('StageStrip in right-to-left', () => {
  it('mirrors the arrows and passes axe', async () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <StageStrip stages={stages} label="المراحل" />
        </div>
      </I18nProvider>,
    )
    expect(container.querySelector('.ty-stage-strip__arrow')).toHaveClass('ty-mirror-rtl')
    await expectNoAxeViolations(container)
  })
})
