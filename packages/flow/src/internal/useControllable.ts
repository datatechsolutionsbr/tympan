import { useCallback, useRef, useState } from 'react'

/** Controlled when `value` is defined, uncontrolled otherwise; `onChange` fires in both. */
export function useControllable<T>(value: T | undefined, initial: T | (() => T), onChange?: (next: T) => void): [T, (next: T) => void] {
  const [own, setOwn] = useState<T>(initial)
  const controlled = value !== undefined
  const latest = useRef(onChange)
  latest.current = onChange
  const set = useCallback(
    (next: T) => {
      if (!controlled) setOwn(next)
      latest.current?.(next)
    },
    [controlled],
  )
  return [controlled ? (value as T) : own, set]
}
