import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { LegalDocumentFrame, slugForHeading } from './LegalDocumentFrame'

const body = (
  <>
    <h2>Data we collect</h2>
    <p>Only what the research needs.</p>
    <h2 id="retention">Retention</h2>
    <p>Kept for five years.</p>
    <h2>Seus direitos</h2>
    <p>Access and deletion.</p>
  </>
)

describe('LegalDocumentFrame', () => {
  it('lists every second-level heading in document order', () => {
    render(
      <LegalDocumentFrame title="Privacy" updatedAt="Updated on 20 September 2026">
        {body}
      </LegalDocumentFrame>,
    )
    const nav = screen.getByRole('navigation', { name: 'Contents' })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Data we collect', 'Retention', 'Seus direitos'])
  })

  it('gives headings without an id a slug id that their links target', () => {
    render(
      <LegalDocumentFrame title="Privacy" updatedAt="u">
        {body}
      </LegalDocumentFrame>,
    )
    const heading = screen.getByRole('heading', { name: 'Data we collect' })
    expect(heading.id).toBe('data-we-collect')
    expect(screen.getByRole('link', { name: 'Data we collect' })).toHaveAttribute('href', '#data-we-collect')
    expect(slugForHeading('Ação é “já”', 'x')).toBe('acao-e-ja')
    expect(slugForHeading('データの扱い', 'section-4')).toBe('データの扱い')
    expect(slugForHeading('حماية البيانات', 'x')).toBe('حماية-البيانات')
    expect(slugForHeading('डेटा सुरक्षा', 'x')).toBe('डेटा-सुरक्षा')
    expect(slugForHeading('— · —', 'section-4')).toBe('section-4')
  })

  it('gives duplicate headings different ids', () => {
    render(
      <LegalDocumentFrame title="Terms" updatedAt="u">
        <h2>Scope</h2>
        <h2>Scope</h2>
      </LegalDocumentFrame>,
    )
    const [a, b] = screen.getAllByRole('heading', { level: 2, name: 'Scope' })
    expect(a!.id).not.toBe(b!.id)
  })

  it('narrow screens: the contents disclosure opens with Enter', async () => {
    setViewportWidth(375)
    render(
      <LegalDocumentFrame title="Privacy" updatedAt="u">
        {body}
      </LegalDocumentFrame>,
    )
    const trigger = screen.getByRole('button', { name: 'Contents' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Retention' })).toBeVisible()
  })

  it('following a link focuses the heading, which clears the sticky bar', async () => {
    setViewportWidth(1440)
    render(
      <LegalDocumentFrame title="Privacy" updatedAt="u" topBar={<a href="/">Fakhir</a>}>
        {body}
      </LegalDocumentFrame>,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Retention' }))
    expect(screen.getByRole('heading', { name: 'Retention' })).toHaveFocus()
    expect(cssOf('components/legal-document-frame/LegalDocumentFrame.css')).toMatch(/scroll-margin-block-start:\s*var\(--fk-layout-scroll-padding\)/)
  })

  it('renders no empty banner landmark without a top bar', () => {
    const { container } = render(
      <LegalDocumentFrame title="Privacy" updatedAt="u">
        {body}
      </LegalDocumentFrame>,
    )
    expect(container.querySelector('header')).toBeNull()
    expect(container.querySelector('footer')).toBeNull()
  })

  it('hides the contents when there are no second-level headings', () => {
    render(
      <LegalDocumentFrame title="Short note" updatedAt="u">
        <p>One paragraph.</p>
      </LegalDocumentFrame>,
    )
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('has no axe violations, light and dark', async () => {
    setViewportWidth(1440)
    const { container } = render(
      <>
        <ThemeScope scheme="light">
          <LegalDocumentFrame title="Privacy" updatedAt="u" contentsLabel="Contents light">
            <h2>Light section</h2>
          </LegalDocumentFrame>
        </ThemeScope>
        <ThemeScope scheme="dark">
          <LegalDocumentFrame title="Terms" updatedAt="u" contentsLabel="Contents dark">
            <h2>Dark section</h2>
          </LegalDocumentFrame>
        </ThemeScope>
      </>,
    )
    await expectNoAxeViolations(container, ['landmark-no-duplicate-main', 'landmark-one-main', 'landmark-main-is-top-level', 'landmark-unique'])
  })
})
