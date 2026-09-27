import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Button } from '../button/Button'
import { HttpErrorPage } from './HttpErrorPage'

describe('HttpErrorPage', () => {
  it('shows the default localised title as the only h1, code read once', () => {
    const { container } = render(<HttpErrorPage kind="not-found" />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Error 404: Page not found')
    expect(container.querySelector('.ty-http-error__code')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('replaces the message', () => {
    render(<HttpErrorPage kind="bad-request" message="The station id is malformed." />)
    expect(screen.getByText('The station id is malformed.')).toBeInTheDocument()
  })

  it('shows the problem type as monospace metadata', () => {
    render(<HttpErrorPage kind="server-error" problemType="https://example.org/problems/upstream" />)
    expect(screen.getByText('https://example.org/problems/upstream').tagName).toBe('CODE')
  })

  it('moves focus to the heading on mount', () => {
    render(<HttpErrorPage kind="server-error" action={<Button>Try again</Button>} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('never uses the accent as the error colour', () => {
    expect(cssOf('components/http-error-page/HttpErrorPage.css')).not.toMatch(/--ty-accent/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <HttpErrorPage kind="not-found" focusHeading={false} />
        </ThemeScope>
        <ThemeScope scheme="dark">
          <HttpErrorPage kind="bad-request" focusHeading={false} />
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container, ['landmark-no-duplicate-main', 'landmark-one-main', 'landmark-main-is-top-level', 'page-has-heading-one', 'landmark-unique'])
  })
})
