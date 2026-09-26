import { useEffect, useState } from 'react'

/**
 * Polite live region whose text settles `delay` ms after the last change, so
 * a value that moves on every keystroke is announced once typing pauses.
 */
export function LiveNote({ text, delay = 500, id }: { text: string | undefined; delay?: number; id?: string }) {
  const [settled, setSettled] = useState('')
  useEffect(() => {
    const handle = setTimeout(() => setSettled(text ?? ''), delay)
    return () => clearTimeout(handle)
  }, [text, delay])
  return (
    <span id={id} className="fk-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      {settled}
    </span>
  )
}
