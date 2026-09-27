// EditorShortcuts: the key listener (scoped to the canvas element, never the
// whole document) and stand-alone, reactive history and clipboard helpers for
// hosts that do not use the shared editor store.

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FlowConnector, FlowNode } from '../model/types'
import { clonePiece, copySelection, freezeSnapshot, mergePiece, recordHistory, stepBack, stepForward, type GraphSnapshot, type HistoryStacks } from '../state/graphEdits'
import { matchBinding, type EditorAction } from './keyMap'

/** A handler returns false when it did nothing (the event is then left alone). */
export type ShortcutHandlers = Partial<Record<EditorAction, () => boolean | void>>

export interface ShortcutOptions {
  /** The canvas element (or a ref to it). Keys are heard only inside it. */
  scope: Element | RefObject<Element | null> | null
  enabled?: boolean
  /** Single-character keys (V, H, G, M). WCAG 2.1.4: the host can turn them off. */
  singleKey?: boolean
  /** Escape found nothing to clear: move focus out of the canvas (never trapped). */
  onLeave?: () => void
}

const TEXT_ENTRY = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(TEXT_ENTRY)
}

function dialogOpen(target: EventTarget | null): boolean {
  if (target instanceof Element && target.closest('[role="dialog"], [role="alertdialog"], [role="menu"]')) return true
  return !!document.querySelector('[role="alertdialog"], [role="dialog"][aria-modal="true"]')
}

export function useEditorShortcuts(handlers: ShortcutHandlers, options: ShortcutOptions): void {
  const latest = useRef({ handlers, options })
  latest.current = { handlers, options }
  const resolve = (): Element | null =>
    options.scope && 'current' in (options.scope as object) ? (options.scope as RefObject<Element | null>).current : (options.scope as Element | null)

  // The scope is read after commit (a ref is empty during the first render),
  // and re-read on every commit so a swapped element is followed.
  useEffect(() => {
    const el = resolve()
    if (!el || options.enabled === false) return
    const onKey = (event: Event) => {
      const e = event as KeyboardEvent
      if (e.defaultPrevented) return
      if (isTextEntry(e.target) || dialogOpen(e.target)) return
      const binding = matchBinding(e)
      if (!binding) return
      const { handlers: h, options: o } = latest.current
      if (binding.singleKey && o.singleKey === false) return
      // Connector handles and tool bars own Delete for themselves.
      if (binding.action === 'delete' && e.target instanceof Element && e.target.closest('[data-ty-surface-chrome]')) return
      const run = h[binding.action]
      if (binding.action === 'escape') {
        const cleared = run ? run() !== false : false
        e.preventDefault()
        if (!cleared) o.onLeave?.()
        return
      }
      if (!run) return
      if (run() === false) return
      e.preventDefault()
      e.stopPropagation()
    }
    el.addEventListener('keydown', onKey, true)
    return () => el.removeEventListener('keydown', onKey, true)
  })
}

type Setter<T> = (next: T | ((prev: T) => T)) => void

/** Reactive undo/redo over caller-owned node and connector state. */
export function useEditorHistory(nodes: FlowNode[], edges: FlowConnector[], setNodes: Setter<FlowNode[]>, setEdges: Setter<FlowConnector[]>, bound = 50) {
  const [stacks, setStacks] = useState<HistoryStacks>({ past: [], future: [] })
  const graph = useRef<GraphSnapshot>({ nodes, connectors: edges })
  graph.current = { nodes, connectors: edges }
  const apply = (g: GraphSnapshot) => {
    setNodes(g.nodes)
    setEdges(g.connectors)
  }
  const snapshot = useCallback(() => setStacks((s) => recordHistory(s, freezeSnapshot(graph.current.nodes, graph.current.connectors), bound)), [bound])
  const undo = useCallback(() => {
    setStacks((s) => {
      const r = stepBack(s, freezeSnapshot(graph.current.nodes, graph.current.connectors))
      if (!r) return s
      apply(r.graph)
      return r.stacks
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const redo = useCallback(() => {
    setStacks((s) => {
      const r = stepForward(s, freezeSnapshot(graph.current.nodes, graph.current.connectors))
      if (!r) return s
      apply(r.graph)
      return r.stacks
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { undo, redo, snapshot, canUndo: stacks.past.length > 0, canRedo: stacks.future.length > 0 }
}

/** Reactive copy/paste; repeated pastes cascade from the previous copy. */
export function useEditorClipboard(nodes: FlowNode[], edges: FlowConnector[], setNodes: Setter<FlowNode[]>, setEdges: Setter<FlowConnector[]>, snapshot: () => void) {
  const [clip, setClip] = useState<GraphSnapshot | null>(null)
  const copy = useCallback(() => {
    const piece = copySelection(nodes, edges)
    if (piece) setClip(piece)
  }, [nodes, edges])
  const paste = useCallback(() => {
    if (!clip) return
    snapshot()
    const piece = clonePiece(clip)
    const merged = mergePiece({ nodes, connectors: edges }, piece)
    setNodes(merged.nodes)
    setEdges(merged.connectors)
    setClip(freezeSnapshot(piece.nodes, piece.connectors))
  }, [clip, nodes, edges, setNodes, setEdges, snapshot])
  return { copy, paste, hasCopied: !!clip && clip.nodes.length > 0 }
}
