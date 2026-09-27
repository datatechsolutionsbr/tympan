import { cx } from '../../internal/cx'
import { useId } from 'react'
import { PRODUCT_MARKS, type ProductMarkProduct, type ProductMarkVariant } from './marks'
import { plateGeometry } from './plate'

export type { ProductMarkProduct } from './marks'
export { plateGeometry, type PlateCircle, type PlateGeometry } from './plate'

/** `symbol` (small sizes), `icon` (48 px and up: the fuller plate) or `horizontal` (symbol and wordmark). */
export type ProductMarkVariantName = ProductMarkVariant | 'icon'

const NAMES: Record<ProductMarkProduct, string> = { tympan: 'Tympan', fakhir: 'Fakhir', astrlabe: 'Astrlabe', datatech: 'Datatech' }

export interface ProductMarkProps {
  product: ProductMarkProduct
  /** `symbol` (the instrument alone), `icon` (fuller artwork for 48 px and up) or `horizontal` (with the wordmark). */
  variant?: ProductMarkVariantName
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
const PLATE = plateGeometry()

/** Tympan's plate mark, drawn from the same geometry as the home page plate (400-unit box at x, y, size). */
function PlateMark({ full, x = 0, y = 0, size = 400 }: { full: boolean; x?: number; y?: number; size?: number }) {
  const clip = `ty-plate-${useId().replace(/[^\w-]/g, '')}`
  const g = PLATE
  const soft = 'var(--ty-mark-soft, color-mix(in oklab, var(--ty-mark-accent) 45%, transparent))'
  const altitudes = full ? [10, 20, 30, 40, 50, 60, 70, 80] : [20, 40, 60, 80]
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 400})`}>
      <defs>
        <clipPath id={clip}>
          <circle cx={g.c} cy={g.c} r={g.r} />
        </clipPath>
      </defs>
      {full ? <circle cx={g.c} cy={g.c} r={g.r + 12} fill="none" stroke="var(--ty-mark-line, color-mix(in oklab, currentColor 45%, transparent))" strokeWidth={6} /> : null}
      {g.ticks(full ? 15 : 30, full ? 2 : 1).map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth={full ? (t.long ? 10 : 6) : 16} />
      ))}
      {altitudes.map((h) => {
        const a = g.almucantar(h)
        return <circle key={h} cx={g.c} cy={a.cy} r={a.r} fill="none" stroke={soft} strokeWidth={full ? 8 : 16} clipPath={`url(#${clip})`} />
      })}
      {(() => {
        const hz = g.almucantar(0)
        return <circle cx={g.c} cy={hz.cy} r={hz.r} fill="none" stroke="var(--ty-mark-accent)" strokeWidth={full ? 18 : 30} clipPath={`url(#${clip})`} />
      })()}
      <circle cx={g.c} cy={g.c} r={g.r} fill="none" stroke="currentColor" strokeWidth={full ? 16 : 26} />
      <circle cx={g.c} cy={g.zenith} r={full ? 16 : 24} fill="var(--ty-mark-accent)" />
    </g>
  )
}

/**
 * Datatech family product mark. The ink follows `currentColor`, the accent `--ty-mark-accent` (set per
 * theme), so marks follow every theme in light and dark. Tympan's mark is its astrolabe plate, generated
 * from `plateGeometry` (the home page plate); Fakhir, Astrlabe and Datatech use the "Instrumento" artwork.
 */
export function ProductMark({ product, variant = 'symbol', size = 32, label, decorative = false, className }: ProductMarkProps) {
  const blockSize = typeof size === 'number' ? `${size}px` : size
  const tympan = product === 'tympan'
  const art = PRODUCT_MARKS[product][variant === 'icon' ? 'symbol' : variant]
  const viewBox = tympan && variant !== 'horizontal' ? '0 0 400 400' : art.viewBox
  return (
    <svg
      className={cx('ty-product-mark', className)}
      data-product={product}
      data-variant={variant}
      viewBox={viewBox}
      style={{ blockSize, inlineSize: 'auto' }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : (label ?? NAMES[product])}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      {tympan ? variant === 'horizontal' ? <PlateMark full={false} x={4} y={6} size={40} /> : <PlateMark full={variant === 'icon'} /> : null}
      {art.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.tone === 'accent' ? 'var(--ty-mark-accent)' : 'currentColor'} />
      ))}
    </svg>
  )
}
