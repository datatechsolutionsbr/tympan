import { useEffect, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../internal/cx'
import { cachedFlagSvg, isFlagCode, loadFlagSvg, type FlagArt } from './loadFlag'
import { flagName, normalizeFlagCode } from './names'
import type { FlagCode } from './art'

export type FlagAspect = '4x3' | '1x1' | 'circle'
export type FlagSize = 'xsmall' | 'small' | 'regular' | 'large'

export interface FlagProps {
  /** ISO 3166-1 alpha-2 (`BR`, `jp`), a subdivision (`gb-sct`, `es-ct`) or an organisation (`eu`, `un`). */
  code: FlagCode | (string & {})
  /** `4x3` (default), `1x1`, or `circle` (the square art in a circle). */
  aspect?: FlagAspect
  /** Height: 12, 16, 24 (default) or 32 px. */
  size?: FlagSize
  /** Accessible name; defaults to the region's name in the active locale (Intl.DisplayNames). */
  label?: string
  /** Hides the flag from assistive tech when the region's name is shown next to it. */
  decorative?: boolean
  className?: string
}

const toDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/**
 * A country, territory or regional flag. Flags stand for places, never for
 * languages: a language picker shows each language's own name instead.
 * Each flag loads on its own, so importing Flag does not bundle all of them.
 */
export function Flag({ code, aspect = '4x3', size = 'regular', label, decorative = false, className }: FlagProps) {
  const { locale } = useLocale()
  const key = normalizeFlagCode(code)
  // Unknown codes draw the neutral "unknown" flag and keep their code as the name.
  const drawn = isFlagCode(key) ? key : 'xx'
  const art: FlagArt = aspect === '4x3' ? '4x3' : '1x1'
  const [svg, setSvg] = useState<string | undefined>(() => cachedFlagSvg(drawn, art))

  useEffect(() => {
    let live = true
    const hit = cachedFlagSvg(drawn, art)
    if (hit) setSvg(hit)
    else {
      setSvg(undefined)
      void loadFlagSvg(drawn, art).then((s) => {
        if (live && s) setSvg(s)
      })
    }
    return () => {
      live = false
    }
  }, [drawn, art])

  const name = label ?? flagName(key, locale)
  return (
    <span
      className={cx('ty-flag', className)}
      data-aspect={aspect}
      data-size={size}
      data-code={key}
      data-loaded={svg ? '' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {svg ? <img className="ty-flag__image" src={toDataUri(svg)} alt="" draggable={false} /> : null}
    </span>
  )
}
