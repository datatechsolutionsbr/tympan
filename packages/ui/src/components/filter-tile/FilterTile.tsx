import { useId, type ReactNode } from 'react'
import { Heading, ToggleButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { categoricalVar, SelectedMark } from '../../internal/forms-a/marks'

export interface FilterTileProps {
  selected: boolean
  onToggle: () => void
  label: string
  /** Secondary line, e.g. "42 records"; also the accessible description. */
  detail?: string
  /** Glyph or logo (rendered decoratively). */
  icon: ReactNode
  /** `neutral` puts full-colour logos on a plain light well in both themes. */
  iconSurface?: 'tinted' | 'neutral'
  /** Categorical token index (1 to 8) tinting the icon well only. */
  tone?: number
  disabled?: boolean
  className?: string
}

/** Large tile turning one filter on or off (spec: wave-2/filter-tile.md). */
export function FilterTile(props: FilterTileProps) {
  const ids = useId()
  const detailId = `${ids}-detail`
  const labelId = `${ids}-label`
  const surface = props.iconSurface ?? 'tinted'
  return (
    <ToggleButton
      className={cx('fk-filter-tile', props.className)}
      isSelected={props.selected}
      isDisabled={props.disabled}
      onChange={() => props.onToggle()}
      aria-labelledby={labelId}
      aria-describedby={props.detail ? detailId : undefined}
    >
      <span
        className="fk-filter-tile__well"
        data-surface={surface}
        data-toned={props.tone ? true : undefined}
        style={categoricalVar('--fk-filter-tile-tone', props.tone)}
        aria-hidden="true"
      >
        {props.icon}
      </span>
      <span className="fk-filter-tile__text">
        <span id={labelId} className="fk-filter-tile__label">{props.label}</span>
        {props.detail ? (
          <span id={detailId} className="fk-filter-tile__detail">
            {props.detail}
          </span>
        ) : null}
      </span>
      <SelectedMark shown={props.selected} />
    </ToggleButton>
  )
}

export interface FilterTileGroupHeadingProps {
  label: string
  icon: ReactNode
  level?: 2 | 3 | 4
  className?: string
}

/** Small heading introducing a group of tiles. */
export function FilterTileGroupHeading({ label, icon, level = 3, className }: FilterTileGroupHeadingProps) {
  return (
    <div className={cx('fk-filter-tile-heading', className)}>
      <span className="fk-filter-tile-heading__well" aria-hidden="true">
        {icon}
      </span>
      <Heading level={level} className="fk-filter-tile-heading__text">
        {label}
      </Heading>
    </div>
  )
}

/** Responsive grid for tiles: two columns on phones, more above 640. */
export function FilterTileGrid({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cx('fk-filter-tile-grid', className)}>
      {children}
    </div>
  )
}
