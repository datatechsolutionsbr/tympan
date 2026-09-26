import { version } from 'react'

const major = Number.parseInt(version, 10)

/**
 * Props that set the HTML `inert` attribute on a host element, portable across
 * React 18.3 and 19. React 19 treats `inert` as a boolean attribute; React 18
 * does not know it, drops `true` with a warning and writes a string as is, so
 * there an empty string is the way to set it. Spread the result on the element:
 * `<div {...inertProps(hidden)} />`.
 */
export function inertProps(on: boolean | undefined): { inert?: boolean } {
  if (!on) return {}
  return (major >= 19 ? { inert: true } : { inert: '' }) as { inert?: boolean }
}
