// What the step parts share inside one editor: the catalog with its words,
// whether AI steps are allowed, the current wiring issues and the "add after"
// action. The editor provides it; stand-alone parts fall back to defaults.

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLabels } from '../internal/labels'
import { readyCatalog, researchStepCatalog, researchStepWords, type ReadyShelf, type ReadyStep, type StepCatalog } from './researchSteps'
import { shapeCountWords, shapeWords, type ShapeWords } from './shapes'
import { stepEditorWords, type StepEditorWords } from './stepLabels'
import type { WiringIssue } from './wiring'

export interface StepsRuntime {
  shelves: ReadyShelf[]
  steps: ReadyStep[]
  byId: ReadonlyMap<string, ReadyStep>
  aiAllowed: boolean
  words: StepEditorWords
  shapes: ShapeWords
  /** Counted shape messages (ICU, `n`). */
  counts: ShapeWords
  /** Wiring issues by receiving node id. */
  issues: ReadonlyMap<string, WiringIssue[]>
  /** Settings problems the host reported, by node id then field key. */
  problems: ReadonlyMap<string, Record<string, string>>
  /** Opens the add picker after a node, anchored to `trigger`. */
  addAfter?: (nodeId: string, trigger: HTMLElement) => void
}

const Ctx = createContext<StepsRuntime | null>(null)
const EMPTY_ISSUES: ReadonlyMap<string, WiringIssue[]> = new Map()
const EMPTY_PROBLEMS: ReadonlyMap<string, Record<string, string>> = new Map()

export interface StepsProviderProps {
  catalog?: StepCatalog
  aiAllowed?: boolean
  issues?: ReadonlyMap<string, WiringIssue[]>
  problems?: ReadonlyMap<string, Record<string, string>>
  addAfter?: (nodeId: string, trigger: HTMLElement) => void
  words?: Partial<StepEditorWords>
  children: ReactNode
}

/** Catalog words resolved for the provider locale. */
export function useReadyCatalog(catalog: StepCatalog = researchStepCatalog) {
  const words = useLabels(researchStepWords, undefined)
  return useMemo(() => readyCatalog(catalog, words), [catalog, words])
}

export function StepsProvider({ catalog, aiAllowed = true, issues, problems, addAfter, words, children }: StepsProviderProps) {
  const ready = useReadyCatalog(catalog)
  const w = useLabels(stepEditorWords, words)
  const shapes = useLabels(shapeWords, undefined)
  const counts = useLabels(shapeCountWords, undefined)
  const value = useMemo<StepsRuntime>(
    () => ({ ...ready, aiAllowed, words: w, shapes, counts, issues: issues ?? EMPTY_ISSUES, problems: problems ?? EMPTY_PROBLEMS, ...(addAfter ? { addAfter } : {}) }),
    [ready, aiAllowed, w, shapes, counts, issues, problems, addAfter],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}


/** The runtime of the nearest StepsProvider, or the built-in catalog. */
export function useSteps(): StepsRuntime {
  const got = useContext(Ctx)
  const ready = useReadyCatalog()
  const words = useLabels(stepEditorWords, undefined)
  const shapes = useLabels(shapeWords, undefined)
  const counts = useLabels(shapeCountWords, undefined)
  return got ?? { ...ready, aiAllowed: true, words, shapes, counts, issues: EMPTY_ISSUES, problems: EMPTY_PROBLEMS }
}
