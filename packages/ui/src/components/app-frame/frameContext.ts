import { createContext, useContext } from 'react'

export interface FrameState {
  /** True when the navigation shows as the icon rail. */
  navCollapsed: boolean
  /** Where the navigation currently renders. */
  navPlacement: 'column' | 'drawer'
  /** Frame layout: wave-1 top bar or the wave-4 research rail. */
  layout?: AppFrameLayout
  /** Opens the navigation drawer (narrow screens), when the frame offers one. */
  openNavigation?: () => void
}

export type AppFrameLayout = 'topbar' | 'rail'

export const FrameContext = createContext<FrameState>({ navCollapsed: false, navPlacement: 'column' })

/** Navigation state for items rendered inside the frame (rail labels, tooltips). */
export function useAppFrame(): FrameState {
  return useContext(FrameContext)
}

