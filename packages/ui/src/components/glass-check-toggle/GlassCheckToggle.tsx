// GlassCheckToggle (spec: wave-4/glass-check-toggle.md). Developer aid: paints
// the page background a loud test colour so translucent surfaces visibly tint
// and secretly opaque ones stand out. Renders nothing unless `enabled`, which
// the host wires to its own development flag (the library reads no build
// variables), so production bundles never show it.
import { Layers } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ToggleButton, Tooltip, TooltipTrigger } from 'react-aria-components'
import { useMediaQuery } from '../../internal/media'
import { useMessages } from '../../internal/provider'

/** Root attribute read by the stylesheet while the check is on. */
export const GLASS_CHECK_MARKER = 'data-ty-glass-check'

export interface GlassCheckToggleProps {
  /** Host development flag. False: nothing is rendered and the document is untouched. */
  enabled?: boolean
  defaultOn?: boolean
  onChange?: (on: boolean) => void
  /** Visible and accessible name (defaults to the catalogue word). */
  label?: string
}

function RootMarker({ on }: { on: boolean }) {
  useEffect(() => {
    const root = document.documentElement
    if (on) root.setAttribute(GLASS_CHECK_MARKER, '')
    else root.removeAttribute(GLASS_CHECK_MARKER)
    return () => root.removeAttribute(GLASS_CHECK_MARKER)
  }, [on])
  return null
}

function Toggle({ defaultOn = false, onChange, label }: Omit<GlassCheckToggleProps, 'enabled'>) {
  const copy = useMessages().glassCheck
  const [on, setOn] = useState(defaultOn)
  const opaque = useMediaQuery('(prefers-reduced-transparency: reduce)')
  const forced = useMediaQuery('(forced-colors: active)')
  const moot = opaque || forced

  const button = (
    <ToggleButton
      className="ty-glass-check"
      isSelected={on}
      data-moot={moot || undefined}
      onChange={(next) => {
        setOn(next)
        onChange?.(next)
      }}
    >
      <Layers className="ty-glass-check__icon" aria-hidden="true" focusable="false" />
      <span className="ty-glass-check__word">{label ?? copy.label}</span>
    </ToggleButton>
  )

  return (
    <>
      <RootMarker on={on} />
      {moot ? (
        <TooltipTrigger delay={300}>
          {button}
          <Tooltip className="ty-glass-check__tip" offset={6}>
            {copy.notApplicable}
          </Tooltip>
        </TooltipTrigger>
      ) : (
        button
      )}
    </>
  )
}

export function GlassCheckToggle({ enabled = false, ...rest }: GlassCheckToggleProps) {
  return enabled ? <Toggle {...rest} /> : null
}
