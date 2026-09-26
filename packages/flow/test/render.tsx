import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { FakhirProvider, type FakhirProviderProps } from '@fakhir/design-system'

/** Renders inside the design system's FakhirProvider (messages, router, locale). */
export function renderWithProvider(ui: ReactElement, providerProps: Omit<FakhirProviderProps, 'children'> = {}, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: ReactNode }) => <FakhirProvider {...providerProps}>{children}</FakhirProvider>
  return render(ui, { wrapper: Wrapper, ...options })
}
