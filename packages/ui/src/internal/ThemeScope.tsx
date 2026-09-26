import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export interface ThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  /** Token theme; `tympan` is the default when omitted. */
  theme?: string
  /** Colour mode; follows the operating system when omitted or `system`. */
  mode?: 'system' | 'light' | 'dark'
  /** Alias of `mode`. */
  scheme?: 'light' | 'dark'
  density?: 'compact' | 'default' | 'comfortable'
  children?: ReactNode
}

/** Applies a theme, mode and density to a subtree through the data attributes read by the token stylesheet. */
export function ThemeScope({ theme, mode, scheme, density, className, children, ...rest }: ThemeScopeProps) {
  return (
    <div
      {...rest}
      className={cx('ty-theme-scope', className)}
      data-ty-theme={theme}
      data-ty-mode={mode ?? scheme}
      data-ty-density={density}
    >
      {children}
    </div>
  )
}
