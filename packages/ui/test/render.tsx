import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { FakhirProvider, type FakhirProviderProps } from '../src/internal/provider'

/** Renders inside FakhirProvider (messages + router adapter). */
export function renderWithProvider(
  ui: ReactElement,
  providerProps: Omit<FakhirProviderProps, 'children'> = {},
  options?: RenderOptions,
) {
  const Wrapper = ({ children }: { children: ReactNode }) => <FakhirProvider {...providerProps}>{children}</FakhirProvider>
  return render(ui, { wrapper: Wrapper, ...options })
}
