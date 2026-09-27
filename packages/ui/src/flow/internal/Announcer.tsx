// A canvas speaks through two shared live regions (polite and assertive)
// instead of one region per node. `useAnnounce()` returns the speaker; with
// no AnnouncerProvider above it, speaking does nothing.

import { createContext, useContext, useReducer, type ReactNode } from 'react'

type Urgency = 'polite' | 'assertive'
type Speaker = (message: string, urgency?: Urgency) => void

interface Lines {
  polite: string
  assertive: string
  /** Odd/even counter: an invisible suffix changes so repeating a sentence still reads. */
  beat: number
}

type Utterance = { text: string; urgency: Urgency }

function speak(prev: Lines, next: Utterance): Lines {
  const beat = prev.beat + 1
  const text = beat % 2 ? next.text : `${next.text} `
  return { ...prev, beat, [next.urgency]: text }
}

const SpeakerContext = createContext<Speaker | null>(null)

const REGIONS: ReadonlyArray<{ urgency: Urgency; role: 'status' | 'alert' }> = [
  { urgency: 'polite', role: 'status' },
  { urgency: 'assertive', role: 'alert' },
]

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(speak, { polite: '', assertive: '', beat: 0 })
  // `dispatch` is stable, so the speaker needs no memoisation.
  const speaker: Speaker = (text, urgency = 'polite') => dispatch({ text, urgency })
  return (
    <SpeakerContext.Provider value={useStableSpeaker(speaker)}>
      {children}
      {REGIONS.map((r) => (
        <div key={r.urgency} className="ty-visually-hidden" role={r.role} aria-live={r.urgency} data-ty-announcer={r.urgency}>
          {lines[r.urgency]}
        </div>
      ))}
    </SpeakerContext.Provider>
  )
}

/** Keeps the first speaker function (it only closes over the stable dispatch). */
function useStableSpeaker(candidate: Speaker): Speaker {
  const [kept] = useReducer((s: Speaker) => s, candidate)
  return kept
}

const silent: Speaker = () => undefined

export function useAnnounce(): Speaker {
  return useContext(SpeakerContext) ?? silent
}

/** Whether a provider is above (components then skip a region of their own). */
export function useHasAnnouncer(): boolean {
  return useContext(SpeakerContext) !== null
}
