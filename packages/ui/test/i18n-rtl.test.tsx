// Every gallery page (so every component) renders and passes axe in a
// right-to-left locale and under pseudo-localization.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GALLERY_PAGES } from '../gallery/src/Groups'
import { TympanProvider } from '../src/internal/provider'
import { ThemeProvider } from '../src/internal/theme'
import { ToastProvider } from '../src/components/toast/Toast'
import { expectNoAxeViolations } from './axe'

function Page({ id, locale, pseudo = false }: { id: string; locale: string; pseudo?: boolean }) {
  const page = GALLERY_PAGES.find((p) => p.id === id)!
  const Component = page.Component
  return (
    <TympanProvider locale={locale} pseudo={pseudo} navigate={() => {}}>
      <ThemeProvider target="scope">
        <ToastProvider>
          <div data-testid="page" lang={locale} dir={['ar', 'he', 'fa', 'ur'].includes(locale.split('-')[0]!) ? 'rtl' : 'ltr'}>
            <Component scope={`${id}-${locale}`} />
          </div>
        </ToastProvider>
      </ThemeProvider>
    </TympanProvider>
  )
}

describe('every component in a right-to-left locale', () => {
  for (const page of GALLERY_PAGES) {
    it(`${page.title}: renders under dir="rtl" (ar) and passes axe`, async () => {
      const { container } = render(<Page id={page.id} locale="ar" />)
      expect(container.querySelector('[data-testid="page"]')).toHaveAttribute('dir', 'rtl')
      expect(container.querySelector('[data-testid="page"]')!.textContent!.length).toBeGreaterThan(0)
      // Page-composition rules (heading order across sections, several demo
      // landmarks side by side) are checked per component in their own tests.
      await expectNoAxeViolations(container, ['heading-order', 'landmark-unique', 'landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo'])
    }, 60000)
  }
})

describe('pseudo-localization', () => {
  for (const page of GALLERY_PAGES) {
    it(`${page.title}: renders with pseudo-localized copy (he)`, async () => {
      const { container } = render(<Page id={page.id} locale="he" pseudo />)
      // Public-page pieces hold no library copy of their own.
      if (page.id !== 'showcase') expect(container.textContent).toMatch(/⟦/)
      else expect(container.textContent!.length).toBeGreaterThan(0)
    }, 60000)
  }
})
