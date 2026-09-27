// StepPalette: research steps shelved by verb. A search field ("/" jumps to
// it), a filter (all, without AI, recent), then one list per shelf with its
// purpose. Each entry shows its typed "takes → gives" chips; AI steps carry a
// dashed "AI" tag and are unavailable when the project allows no agents.
// Shelves with nothing to show are left out; engine primitives sit on a
// folded shelf. Enter or a tap places a step; a drag drops it on the canvas.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button as AriaButton, Disclosure, DisclosurePanel, GridList, GridListItem, Heading, Input, Label, SearchField, ToggleButton, ToggleButtonGroup, useDragAndDrop, useFilter, type Key } from 'react-aria-components'
import { ChevronDown, GripVertical, Search } from 'lucide-react'
import { fill, useFlowLocale } from '../internal/labels'
import { ShapeFlow } from './ShapeChip'
import type { ReadyShelf, ReadyStep } from './researchSteps'
import { useSteps } from './StepsContext'

/** Drag payload type of a palette step. */
export const STEP_MEDIA_TYPE = 'application/x-tympan-step'

/** A second, empty drag type that names the step, readable while dragging over (payloads are not). */
export const stepDragType = (stepId: string) => `${STEP_MEDIA_TYPE}-${stepId.toLowerCase()}`

/** The step id a drag names, if any. */
export function stepOfDrag(types: readonly string[]): string | null {
  const prefix = `${STEP_MEDIA_TYPE}-`
  const hit = types.find((t) => t.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}

export type PaletteFilter = 'all' | 'no-ai' | 'recent'

export interface StepPaletteProps {
  onPlace: (stepId: string) => void
  /** Step ids placed lately, newest first. */
  recent?: readonly string[]
  /** Which step is being dragged (null when the drag ends). */
  onDragChange?: (stepId: string | null) => void
  className?: string
}

const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && !!el.closest('input, textarea, select, [contenteditable="true"]')

export function StepPalette({ onPlace, recent = [], onDragChange, className }: StepPaletteProps) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const { contains } = useFilter({ sensitivity: 'base' })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PaletteFilter>('all')
  const fieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      e.preventDefault()
      fieldRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const keep = (s: ReadyStep) => {
    if (query && !contains(`${s.name} ${s.description}`, query)) return false
    if (filter === 'no-ai' && s.usesAI) return false
    if (filter === 'recent' && !recent.includes(s.id)) return false
    return true
  }
  const shelves = useMemo(() => {
    const out: ReadyShelf[] = []
    for (const sh of rt.shelves) {
      const steps = sh.steps.filter(keep)
      if (filter === 'recent') steps.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id))
      if (steps.length) out.push({ ...sh, steps })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt.shelves, query, filter, recent, contains])

  const emptyWord = filter === 'recent' && !query ? w.noRecent : fill(w.noMatch, { query }, locale)

  return (
    <section className={['ty-step-palette', className].filter(Boolean).join(' ')} aria-label={w.paletteTitle}>
      <div className="ty-step-palette__top">
        <SearchField className="ty-step-palette__search" value={query} onChange={setQuery}>
          <Label className="ty-visually-hidden">{w.search}</Label>
          <Search className="ty-step-palette__search-icon" aria-hidden="true" focusable="false" />
          <Input ref={fieldRef} className="ty-step-palette__input" placeholder={w.search} aria-keyshortcuts="/" />
          <kbd className="ty-step-palette__key" title={w.searchKey}>
            /
          </kbd>
        </SearchField>
        <ToggleButtonGroup
          className="ty-step-palette__filters"
          aria-label={w.show}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[filter]}
          onSelectionChange={(keys) => {
            const next = [...keys][0]
            if (next) setFilter(next as PaletteFilter)
          }}
        >
          <ToggleButton id="all" className="ty-step-palette__filter">
            {w.all}
          </ToggleButton>
          <ToggleButton id="no-ai" className="ty-step-palette__filter">
            {w.noAI}
          </ToggleButton>
          <ToggleButton id="recent" className="ty-step-palette__filter">
            {w.recent}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="ty-step-palette__shelves">
        {!rt.aiAllowed ? <p className="ty-step-palette__note">{w.aiOff}</p> : null}
        {shelves.length ? (
          shelves.map((sh) =>
            sh.folded && !query ? (
              <Disclosure key={sh.id} className="ty-step-palette__shelf" data-folded="true">
                <div className="ty-step-palette__shelf-head">
                  <Heading level={3} className="ty-step-palette__shelf-title">
                    <AriaButton slot="trigger" className="ty-step-palette__fold">
                      <ChevronDown className="ty-step-palette__chevron" aria-hidden="true" focusable="false" />
                      {sh.title}
                    </AriaButton>
                  </Heading>
                  {sh.purpose ? <span className="ty-step-palette__purpose">{sh.purpose}</span> : null}
                </div>
                <DisclosurePanel>
                  <ShelfList shelf={sh} onPlace={onPlace} {...(onDragChange ? { onDragChange } : {})} />
                </DisclosurePanel>
              </Disclosure>
            ) : (
              <section key={sh.id} className="ty-step-palette__shelf" aria-labelledby={`ty-shelf-${sh.id}`}>
                <div className="ty-step-palette__shelf-head">
                  <h3 id={`ty-shelf-${sh.id}`} className="ty-step-palette__shelf-title">
                    {sh.title}
                  </h3>
                  {sh.purpose ? <span className="ty-step-palette__purpose">{sh.purpose}</span> : null}
                </div>
                <ShelfList shelf={sh} onPlace={onPlace} {...(onDragChange ? { onDragChange } : {})} />
              </section>
            ),
          )
        ) : (
          <p className="ty-step-palette__empty">{emptyWord}</p>
        )}
      </div>
    </section>
  )
}

function ShelfList({ shelf, onPlace, onDragChange }: { shelf: ReadyShelf; onPlace: (id: string) => void; onDragChange?: (id: string | null) => void }) {
  const rt = useSteps()
  const w = rt.words
  const blocked = (s: ReadyStep) => !!s.usesAI && !rt.aiAllowed
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      shelf.steps
        .filter((s) => keys.has(s.id))
        .map((s) => ({
          [STEP_MEDIA_TYPE]: JSON.stringify({ stepId: s.id }),
          [stepDragType(s.id)]: '',
          'text/plain': s.name,
        })),
    onDragStart: (e) => onDragChange?.(String([...e.keys][0] ?? '')),
    onDragEnd: () => onDragChange?.(null),
  })
  const disabled: Key[] = shelf.steps.filter(blocked).map((s) => s.id)
  return (
    <GridList className="ty-step-palette__list" aria-label={shelf.title} items={shelf.steps} disabledKeys={disabled} dragAndDropHooks={dragAndDropHooks} onAction={(key) => onPlace(String(key))}>
      {(s) => {
        const Icon = s.icon
        return (
          <GridListItem id={s.id} textValue={s.name} className="ty-step-palette__item" data-ai={s.usesAI ? 'true' : undefined}>
            <AriaButton slot="drag" className="ty-step-palette__grip" aria-label={fill(w.dragItem, { name: s.name })}>
              <GripVertical aria-hidden="true" focusable="false" />
            </AriaButton>
            <span className="ty-step-palette__tile" aria-hidden="true">
              <Icon focusable="false" />
            </span>
            <span className="ty-step-palette__name">
              {s.name}
              {s.usesAI ? <span className="ty-step-palette__ai">{w.ai}</span> : null}
            </span>
            <span className="ty-step-palette__about" title={s.description} dir="auto">
              {blocked(s) ? w.aiOff : s.description}
            </span>
            {s.primitive ? null : <ShapeFlow inputs={s.inputs} output={s.output} words={rt.shapes} labels={w} />}
          </GridListItem>
        )
      }}
    </GridList>
  )
}
