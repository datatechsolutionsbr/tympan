import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type SkeletonShape = 'line' | 'heading' | 'circle' | 'rect'
export type SkeletonWidth = 'short' | 'medium' | 'long' | 'full' | (string & {})
export type SkeletonPreset = 'stats' | 'cards' | 'section-heading' | 'filters' | 'analysis'

export interface SkeletonProps {
  shape?: SkeletonShape
  width?: SkeletonWidth
  /** Stacked text lines with automatically varied widths. */
  lines?: number
  /** Composed skeleton instead of a single block. */
  preset?: SkeletonPreset
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
}

const namedWidths = new Set(['short', 'medium', 'long', 'full'])
const lineCycle: SkeletonWidth[] = ['long', 'full', 'medium']

function Block({ shape = 'line', width = 'full', className }: { shape?: SkeletonShape; width?: SkeletonWidth; className?: string }) {
  const named = namedWidths.has(width)
  const style: CSSProperties | undefined = named ? undefined : { inlineSize: width }
  return (
    <span
      className={cx('fk-skeleton', className)}
      data-shape={shape}
      data-width={named ? width : 'custom'}
      style={style}
    />
  )
}

function Lines({ lines, width }: { lines: number; width?: SkeletonWidth }) {
  return (
    <span className="fk-skeleton-lines">
      {Array.from({ length: lines }, (_, i) => {
        const w = lines === 1 ? (width ?? 'full') : i === lines - 1 ? 'short' : (lineCycle[i % lineCycle.length] ?? 'full')
        return <Block key={i} shape="line" width={w} />
      })}
    </span>
  )
}

function Grid({ columns, children, kind }: { columns: number; children: ReactNode; kind: string }) {
  return (
    <span className="fk-skeleton-grid" data-preset={kind} style={{ '--fk-skeleton-columns': columns } as CSSProperties}>
      {children}
    </span>
  )
}

function Preset({ preset, count, columns }: { preset: SkeletonPreset; count?: number; columns?: number }) {
  switch (preset) {
    case 'stats': {
      const n = count ?? 4
      return (
        <Grid columns={columns ?? n} kind="stats">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="fk-skeleton-tile" data-part="stat">
              <Block shape="circle" />
              <Block shape="heading" width="medium" />
              <Block shape="line" width="short" />
            </span>
          ))}
        </Grid>
      )
    }
    case 'cards': {
      const n = count ?? 6
      return (
        <Grid columns={columns ?? 3} kind="cards">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="fk-skeleton-tile" data-part="card">
              <Block shape="heading" width="long" />
              <Lines lines={2} />
              <Block shape="line" width="short" />
            </span>
          ))}
        </Grid>
      )
    }
    case 'section-heading':
      return (
        <span className="fk-skeleton-row" data-preset="section-heading">
          <Block shape="circle" />
          <span className="fk-skeleton-lines">
            <Block shape="heading" width="medium" />
            <Block shape="line" width="long" />
          </span>
        </span>
      )
    case 'filters': {
      const n = count ?? 5
      return (
        <span className="fk-skeleton-row" data-preset="filters">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="fk-skeleton fk-skeleton--pill" data-shape="pill" />
          ))}
        </span>
      )
    }
    case 'analysis': {
      const n = count ?? 3
      return (
        <span className="fk-skeleton-tile" data-preset="analysis">
          <Block shape="heading" width="medium" />
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="fk-skeleton-row" data-part="item">
              <Block shape="circle" />
              <Lines lines={2} />
            </span>
          ))}
        </span>
      )
    }
  }
}

/** Content-shaped placeholder, hidden from assistive technology (spec: wave-1/skeleton.md). */
export function Skeleton({ shape = 'line', width, lines = 1, preset, count, columns, className }: SkeletonProps) {
  let body: ReactNode
  if (preset) body = <Preset preset={preset} count={count} columns={columns} />
  else if (lines > 1 && (shape === 'line' || shape === 'heading')) body = <Lines lines={lines} width={width} />
  else body = <Block shape={shape} width={width ?? (shape === 'circle' ? 'short' : 'full')} />
  return (
    <span className={cx('fk-skeleton-root', className)} aria-hidden="true">
      {body}
    </span>
  )
}

export interface PageLoadingStateProps {
  /** Sentence announced once in the status region, such as "Loading the catalogue". */
  label?: string
  /** Inside a section instead of a whole page. */
  compact?: boolean
  preset?: SkeletonPreset
  count?: number
  columns?: 1 | 2 | 3 | 4
  /** Custom skeleton instead of a preset. */
  children?: ReactNode
  className?: string
}

/** Page or section loading wrapper: skeleton plus one polite status (spec: wave-1/skeleton.md). */
export function PageLoadingState({ label, compact = false, preset, count, columns, children, className }: PageLoadingStateProps) {
  const messages = useMessages()
  const text = label ?? messages.loading
  return (
    <div className={cx('fk-page-loading', className)} data-compact={compact || undefined} aria-busy="true">
      <span role="status" className="fk-visually-hidden">
        {text}
      </span>
      {children ? (
        <div aria-hidden="true">{children}</div>
      ) : (
        <>
          {compact ? null : <Skeleton preset="section-heading" />}
          <Skeleton preset={preset ?? 'cards'} count={count} columns={columns} />
        </>
      )}
    </div>
  )
}
