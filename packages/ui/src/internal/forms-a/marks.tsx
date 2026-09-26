import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'

/** Decorative check glyph used by every selectable surface of the group. */
export function SelectedMark({ shown }: { shown: boolean }) {
  return shown ? (
    <span className="ty-selected-mark" aria-hidden="true">
      <Check focusable="false" />
    </span>
  ) : null
}

/** Categorical token (1 to 8) as a component-local custom property. */
export function categoricalVar(name: string, index: number | undefined): CSSProperties | undefined {
  if (!index) return undefined
  const slot = ((Math.max(1, Math.round(index)) - 1) % 8) + 1
  return { [name]: `var(--ty-categorical-${slot})` } as CSSProperties
}
