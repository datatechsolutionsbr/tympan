import { useMediaQuery } from '../../internal/media'
import { useMessages } from '../../internal/provider'
import type { ReactNode } from 'react'

/**
 * Read-only default brand constants. Hosts serve the logo files from their
 * public folder and set their product name through the `brand.productName`
 * message.
 */
export const brand = Object.freeze({
  productId: 'tympan',
  productName: 'Tympan',
  logoFiles: Object.freeze({
    icon: '/brand/tympan-icon.svg',
    logo: '/brand/tympan-logo.svg',
    logoDark: '/brand/tympan-logo-dark.svg',
  }),
})

export type BrandMarkSize = 'small' | 'medium' | 'large'

/**
 * The badge artwork: an open book, two pages meeting at a spine, drawn for
 * this library. Stroke only, so it inherits the ink set by the badge.
 */
function OpenBookArt() {
  return (
    <svg className="ty-brand-mark__art" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 7.2C10.1 5.7 7.4 5.2 4.5 5.6v11.6c2.9-.4 5.6.1 7.5 1.6" />
      <path d="M12 7.2c1.9-1.5 4.6-2 7.5-1.6v11.6c-2.9-.4-5.6.1-7.5 1.6" />
      <path d="M12 7.2v11.6" />
    </svg>
  )
}

export interface BrandMarkProps {
  size?: BrandMarkSize
  showWordmark?: boolean
  /** Custom wordmark node; defaults to the product name as text. */
  wordmark?: ReactNode
  /** Accessible name when icon-only (defaults to the product name). */
  label?: string
  className?: string
}

/** Product badge plus wordmark (spec: wave-2/brand-mark.md). */
export function BrandMark({ size = 'medium', showWordmark = true, wordmark, label, className }: BrandMarkProps) {
  const productName = useMessages().brand.productName
  const iconOnly = !showWordmark
  const badgeA11y = iconOnly ? { role: 'img', 'aria-label': label ?? productName } : { 'aria-hidden': true as const }
  return (
    <span className={className ? `ty-brand-mark ${className}` : 'ty-brand-mark'} data-size={size}>
      <span className="ty-brand-mark__badge" {...badgeA11y}>
        <OpenBookArt />
      </span>
      {iconOnly ? null : <span className="ty-brand-mark__word">{wordmark ?? productName}</span>}
    </span>
  )
}

export interface BrandLogoProps {
  /** Colour mode of the surrounding theme; follows the operating system when omitted. */
  mode?: 'light' | 'dark'
  /** Overrides the files of `brand.logoFiles`. */
  files?: { logo: string; logoDark: string }
  label?: string
  className?: string
}

/** Image form of the logo: picks the dark file on dark themes. */
export function BrandLogo({ mode, files = brand.logoFiles, label, className }: BrandLogoProps) {
  const productName = useMessages().brand.productName
  const osDark = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = (mode ?? (osDark ? 'dark' : 'light')) === 'dark'
  return <img className={className ? `ty-brand-logo ${className}` : 'ty-brand-logo'} src={dark ? files.logoDark : files.logo} alt={label ?? productName} data-mode={dark ? 'dark' : 'light'} />
}
