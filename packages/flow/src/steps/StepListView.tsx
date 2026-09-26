// StepListView: the flow as a numbered list, the keyboard view of the canvas
// (toggled from the dock). ↑↓ move between steps, Alt+↑↓ reorder, A adds
// after the current step, Enter opens its settings. An "add a step here" row
// follows the current step; each row has a "…" menu.

import { ArrowDown, ArrowUp, Ellipsis, Plus, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ActionMenu, Button } from '@fakhir/ui'
import { fill, useFlowLocale } from '../internal/labels'
import type { FlowNode } from '../model/types'
import { ShapeFlow } from './ShapeChip'
import { specOfNode, summaryLine } from './researchSteps'
import { useSteps } from './StepsContext'

export interface StepListViewProps {
  /** Steps in reading order. */
  nodes: readonly FlowNode[]
  locked?: boolean
  /** Step that holds focus when the view opens. */
  activeId?: string | null
  onConfigure: (id: string) => void
  onMove: (id: string, towards: -1 | 1) => void
  onRemove: (id: string) => void
  onAddAfter: (id: string, trigger: HTMLElement) => void
  onActiveChange?: (id: string) => void
}

export function StepListView({ nodes, locked, activeId, onConfigure, onMove, onRemove, onAddAfter, onActiveChange }: StepListViewProps) {
  const rt = useSteps()
  const w = rt.words
  const { locale } = useFlowLocale()
  const start = Math.max(0, nodes.findIndex((n) => n.id === activeId))
  const [at, setAt] = useState(start)
  const rows = useRef(new Map<string, HTMLButtonElement>())
  const pending = useRef<string | null>(null)
  const current = nodes[Math.min(at, nodes.length - 1)]

  // After a reorder the moved step keeps focus at its new place.
  useEffect(() => {
    if (!pending.current) return
    const i = nodes.findIndex((n) => n.id === pending.current)
    const el = rows.current.get(pending.current)
    pending.current = null
    if (i >= 0) setAt(i)
    el?.focus()
  }, [nodes])

  const focusAt = (i: number) => {
    const n = nodes[i]
    if (!n) return
    setAt(i)
    rows.current.get(n.id)?.focus()
    onActiveChange?.(n.id)
  }

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number, n: FlowNode) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (step && e.altKey) {
      e.preventDefault()
      if (locked || !nodes[i + step]) return
      pending.current = n.id
      onMove(n.id, step)
    } else if (step) {
      e.preventDefault()
      focusAt(i + step)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      focusAt(e.key === 'Home' ? 0 : nodes.length - 1)
    } else if ((e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey && !e.altKey && !locked) {
      e.preventDefault()
      onAddAfter(n.id, e.currentTarget)
    }
  }

  return (
    <section className="fk-flow-list" aria-labelledby="fk-flow-list-title">
      <h2 id="fk-flow-list-title" className="fk-visually-hidden">
        {w.listTitle}
      </h2>
      <p className="fk-visually-hidden" id="fk-flow-list-hint">
        {w.listHint}
      </p>
      <ol className="fk-flow-list__rows">
        {nodes.map((n, i) => {
          const spec = specOfNode(n, rt.byId)
          const title = (typeof n.data.label === 'string' && n.data.label) || spec?.name || n.kind
          const line = spec ? summaryLine(spec, n.data, locale) : null
          const Icon = spec?.icon
          const here = n.id === current?.id
          return [
            <li key={n.id} className="fk-flow-list__row" data-current={here ? 'true' : undefined}>
              <span className="fk-flow-list__number" aria-hidden="true">
                {new Intl.NumberFormat(locale).format(i + 1)}
              </span>
              <button
                ref={(el) => {
                  if (el) rows.current.set(n.id, el)
                  else rows.current.delete(n.id)
                }}
                type="button"
                className="fk-flow-list__main"
                tabIndex={here ? 0 : -1}
                aria-describedby="fk-flow-list-hint"
                onFocus={() => {
                  setAt(i)
                  onActiveChange?.(n.id)
                }}
                onClick={() => onConfigure(n.id)}
                onKeyDown={(e) => onKey(e, i, n)}
              >
                <span className="fk-flow-list__tile" aria-hidden="true">
                  {Icon ? <Icon focusable="false" /> : null}
                </span>
                <span className="fk-flow-list__title-text" dir="auto">{title}</span>
                <span className="fk-flow-list__line" dir="auto">{line ?? w.notSet}</span>
                {spec && !spec.primitive ? <ShapeFlow inputs={spec.inputs} output={spec.output} words={rt.shapes} labels={w} bare /> : null}
              </button>
              {!locked ? (
                <ActionMenu
                  label={fill(w.more, { name: title }, locale)}
                  trigger={<Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(w.more, { name: title }, locale)} leadingIcon={<Ellipsis />} />}
                  items={[
                    { id: 'configure', label: w.configure, icon: Settings2 },
                    { id: 'up', label: w.moveUp, icon: ArrowUp, disabled: i === 0 },
                    { id: 'down', label: w.moveDown, icon: ArrowDown, disabled: i === nodes.length - 1 },
                    { type: 'separator' },
                    { id: 'remove', label: w.remove, icon: Trash2, tone: 'danger' },
                  ]}
                  onAction={(id) => {
                    if (id === 'configure') onConfigure(n.id)
                    else if (id === 'up' || id === 'down') {
                      pending.current = n.id
                      onMove(n.id, id === 'up' ? -1 : 1)
                    } else if (id === 'remove') onRemove(n.id)
                  }}
                />
              ) : null}
            </li>,
            here && !locked ? (
              <li key={`${n.id}-add`} className="fk-flow-list__add">
                <button type="button" className="fk-flow-list__add-button" onClick={(e) => onAddAfter(n.id, e.currentTarget)}>
                  <Plus aria-hidden="true" focusable="false" />
                  {w.addHere}
                </button>
              </li>
            ) : null,
          ]
        })}
      </ol>
    </section>
  )
}
