import { cx } from '../../internal/cx'
import { PRODUCT_MARKS, type ProductMarkProduct, type ProductMarkVariant } from './marks'

export type { ProductMarkProduct, ProductMarkVariant } from './marks'

const NAMES: Record<ProductMarkProduct, string> = { tympan: 'Tympan', fakhir: 'Fakhir', astrlabe: 'Astrlabe', datatech: 'Datatech' }

export interface ProductMarkProps {
  product: ProductMarkProduct
  /** `symbol` (the instrument alone) or `horizontal` (symbol and wordmark). */
  variant?: ProductMarkVariant
  /** Block size in CSS pixels (or any CSS length); the width follows the artwork. Default 32. */
  size?: number | string
  /**
   * Accessible name; defaults to the product name. Pass `decorative` when the product name is already
   * visible next to the mark.
   */
  label?: string
  decorative?: boolean
  className?: string
}

/**
 * Datatech family product mark. The ink follows `currentColor`, the accent dot `--ty-mark-accent`
 * (gold by default, set per theme), so marks follow every theme in light and dark. Tympan keeps its own
 * plate mark (stroked, no accent).
 */
export function ProductMark({ product, variant = 'symbol', size = 32, label, decorative = false, className }: ProductMarkProps) {
  const art = PRODUCT_MARKS[product][variant]
  const blockSize = typeof size === 'number' ? `${size}px` : size
  return (
    <svg
      className={cx('ty-product-mark', className)}
      data-product={product}
      data-variant={variant}
      viewBox={art.viewBox}
      style={{ blockSize, inlineSize: 'auto' }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? NAMES[product])}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      {art.plate ? (
        <g transform={`translate(${art.plate.x} ${art.plate.y}) scale(${art.plate.size / 32})`} fill="none" stroke="currentColor">
          <circle cx="16" cy="16" r="14" strokeWidth="1.6" />
          <circle cx="16" cy="20" r="9" strokeWidth="1" />
          <circle cx="16" cy="22.5" r="5" strokeWidth="1" />
          <line x1="2" y1="16" x2="30" y2="16" strokeWidth="1" />
        </g>
      ) : null}
      {art.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.tone === 'accent' ? 'var(--ty-mark-accent, #a67c2e)' : 'currentColor'} />
      ))}
    </svg>
  )
}
