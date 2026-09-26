// One polite (and one assertive) live region per canvas, instead of one per
// node. Components call `useAnnounce()`; outside a provider it is a no-op.

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Announce = (message: string, politeness?: 'polite' | 'assertive') => void

const AnnounceContext = createContext<Announce | null>(null)

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')
  const flip = useRef(false)
  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    // A trailing no-break space toggles so repeating the same words is still a change.
    flip.current = !flip.current
    const text = flip.current ? message : `${message} `
    if (politeness === 'assertive') setAssertive(text)
    else setPolite(text)
  }, [])
  const value = useMemo(() => announce, [announce])
  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div className="fk-visually-hidden" role="status" aria-live="polite" data-fk-announcer="polite">
        {polite}
      </div>
      <div className="fk-visually-hidden" role="alert" aria-live="assertive" data-fk-announcer="assertive">
        {assertive}
      </div>
    </AnnounceContext.Provider>
  )
}

const noop: Announce = () => {}

export function useAnnounce(): Announce {
  return useContext(AnnounceContext) ?? noop
}

/** True when an AnnouncerProvider is above (components then skip their own region). */
export function useHasAnnouncer(): boolean {
  return useContext(AnnounceContext) !== null
}
