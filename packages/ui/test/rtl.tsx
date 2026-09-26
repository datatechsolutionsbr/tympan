// Right-to-left rendering helper: an Arabic locale for React Aria (direction,
// digits, calendars) and a dir="rtl" lang="ar" container for CSS.
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { I18nProvider } from 'react-aria-components'
import { TympanProvider } from '../src/internal/provider'

export function renderRtl(ui: ReactElement, options: { locale?: string; navigate?: (href: string) => void } & RenderOptions = {}) {
  const { locale = 'ar', navigate, ...rest } = options
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TympanProvider locale={locale} navigate={navigate}>
      <I18nProvider locale={locale}>
        <div dir="rtl" lang={locale} data-testid="rtl-root">
          {children}
        </div>
      </I18nProvider>
    </TympanProvider>
  )
  return render(ui, { wrapper: Wrapper, ...rest })
}
