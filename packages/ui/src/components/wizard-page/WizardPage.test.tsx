import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sparkles } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { WizardPage, type WizardPageProps } from './WizardPage'

const steps = [
  { id: 'scope', title: 'Scope', description: 'What the project studies.' },
  { id: 'team', title: 'Team' },
  { id: 'review', title: 'Review' },
]

function setup(over: Partial<WizardPageProps> = {}) {
  const props: WizardPageProps = {
    title: 'New research project',
    eyebrow: 'Create',
    icon: <Sparkles />,
    steps,
    currentIndex: 0,
    onStepChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  }
  const view = render(<WizardPage {...props} />)
  return { props, ...view }
}

describe('WizardPage', () => {
  it('calls onCancel from previous on the first step', async () => {
    const { props } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCancel).toHaveBeenCalledTimes(1)
  })

  it('submits from the last step with the submit label', async () => {
    const { props } = setup({ currentIndex: 2, submitLabel: 'Create project' })
    await userEvent.click(screen.getByRole('button', { name: 'Create project' }))
    expect(props.onSubmit).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(props.onStepChange).toHaveBeenCalledWith(1)
  })

  it('disables the primary when it cannot advance', () => {
    setup({ canAdvance: false })
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('moves focus to the h1 of the new step and updates the document title', () => {
    const { props, rerender } = setup()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scope')
    act(() => rerender(<WizardPage {...props} currentIndex={1} />))
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Team')
    expect(h1).toHaveFocus()
    expect(document.title).toContain('Team')
  })

  it('disables both buttons and announces busy while submitting', () => {
    setup({ currentIndex: 2, submitting: true })
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    const primary = screen.getByRole('button', { name: 'Submitting' })
    expect(primary).toHaveAttribute('aria-disabled', 'true')
    expect(primary).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Submitting')
  })

  it('names the close button from the catalogue and stacks buttons on narrow screens', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    const css = cssOf('components/wizard-page/WizardPage.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/column-reverse/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <WizardPage
              title={`Flow ${scheme}`}
              eyebrow="Create"
              icon={<Sparkles />}
              steps={steps}
              currentIndex={1}
              onStepChange={() => {}}
              onSubmit={() => {}}
              onCancel={() => {}}
            >
              <p>Body</p>
            </WizardPage>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container, ['page-has-heading-one', 'heading-order'])
  })
})
