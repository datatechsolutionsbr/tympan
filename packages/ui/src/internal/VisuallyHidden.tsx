import type { ReactNode } from 'react'

/** Text available to assistive technology but not drawn. */
export function VisuallyHidden({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <span className="ty-visually-hidden" id={id}>
      {children}
    </span>
  )
}
