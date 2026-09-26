// Right-to-left rendering harness (retrofit B): an Arabic (or other RTL)
// subtree with the React Aria locale, the library copy of that locale and the
// document direction a host sets.
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from 'react-aria-components'
import { FakhirProvider } from '../src/internal/provider'

export function inRtl(ui: ReactElement, locale = 'ar') {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <FakhirProvider locale={locale} navigate={() => {}}>
      <I18nProvider locale={locale}>
        <div dir="rtl" lang={locale} data-testid="rtl-root">
          {children}
        </div>
      </I18nProvider>
    </FakhirProvider>
  )
  return render(ui, { wrapper: Wrapper })
}
