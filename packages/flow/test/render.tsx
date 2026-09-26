import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TympanProvider, type TympanProviderProps } from '@datatechsolutions/tympan'

/** Renders inside the design system's TympanProvider (messages, router, locale). */
export function renderWithProvider(ui: ReactElement, providerProps: Omit<TympanProviderProps, 'children'> = {}, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: ReactNode }) => <TympanProvider {...providerProps}>{children}</TympanProvider>
  return render(ui, { wrapper: Wrapper, ...options })
}
