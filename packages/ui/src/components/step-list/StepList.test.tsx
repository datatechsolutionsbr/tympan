import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
import { StepList } from './StepList'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const four = [
  { id: 'a', name: 'Scope' },
  { id: 'b', name: 'Identity' },
  { id: 'c', name: 'Sources' },
  { id: 'd', name: 'Review' },
]

describe('StepList', () => {
  it('derives complete, current and upcoming from currentIndex', () => {
    const { container } = render(<StepList steps={four} currentIndex={1} label="Setup" />)
    const items = container.querySelectorAll('li')
    expect(items[0]).toHaveAttribute('data-status', 'complete')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[2]).toHaveAttribute('data-status', 'upcoming')
    expect(items[3]).toHaveAttribute('data-status', 'upcoming')
    expect(screen.getByRole('navigation', { name: 'Setup' })).toHaveTextContent('Step 1 of 4, Scope, completed')
  })

  it('selects a completed step', async () => {
    const onStepSelect = vi.fn()
    render(<StepList steps={four} currentIndex={1} label="Setup" onStepSelect={onStepSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Step 1 of 4, Scope, completed' }))
    expect(onStepSelect).toHaveBeenCalledWith(0)
  })

  it('keeps upcoming steps out of the tab order without allowForward', async () => {
    render(<StepList steps={four} currentIndex={1} label="Setup" onStepSelect={() => {}} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /Scope/ })).toHaveFocus()
    await userEvent.tab()
    expect(document.body).toHaveFocus()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('allows upcoming steps with allowForward', () => {
    render(<StepList steps={four} currentIndex={1} label="Setup" onStepSelect={() => {}} allowForward />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('renders links that still call the handler', async () => {
    const onStepSelect = vi.fn()
    const navigate = vi.fn()
    renderWithProvider(
      <StepList steps={four.map((s) => ({ ...s, href: `/wizard/${s.id}` }))} currentIndex={2} label="Setup" onStepSelect={onStepSelect} />,
      { navigate },
    )
    const link = screen.getByRole('link', { name: /Identity/ })
    expect(link).toHaveAttribute('href', '/wizard/b')
    await userEvent.click(link)
    expect(onStepSelect).toHaveBeenCalledWith(1)
  })

  it('shows markers only with the current name below on narrow screens', () => {
    const { container } = render(<StepList steps={four} currentIndex={2} label="Setup" />)
    expect(container.querySelector('.fk-step-list__now')).toHaveTextContent('Sources')
    const narrow = mediaBlock(cssOf('components/step-list/StepList.css'), /\(max-width:\s*639\.98px\)/)
    expect(narrow).toMatch(/\.fk-step-list__now\s*\{[^}]*display:\s*block/)
    expect(narrow).toMatch(/clip-path:\s*inset\(50%\)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <StepList steps={four} currentIndex={2} label={`Setup ${scheme}`} onStepSelect={() => {}} />
            <StepList steps={four} currentIndex={0} label={`Bar ${scheme}`} appearance="bar" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('StepList in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<StepList label="إعداد المشروع" currentIndex={1} steps={[{ id: 'a', name: 'النطاق' }, { id: 'b', name: 'الفريق' }, { id: 'c', name: 'المراجعة' }]} />, { locale: 'ar-EG' })
    expect(container.textContent).toMatch(/الفريق/)
    await axeRtl(container)
  })
})
