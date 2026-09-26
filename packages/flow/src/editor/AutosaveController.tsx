// AutosaveController: FlowEditor plus two listeners called on every committed
// graph change, in order: onSnapshot (local mirrors), then onAutosave (the
// host debounces and persists). New callback identities are picked up through
// a ref, so re-rendering the host never re-mounts the editor.

import { useCallback, useRef } from 'react'
import type { FlowGraph } from '../model/types'
import { FlowEditor, type FlowEditorProps } from './FlowEditor'

export interface AutosaveControllerProps extends Omit<FlowEditorProps, 'onGraphCommit'> {
  onAutosave: (graph: FlowGraph) => void
  onSnapshot?: (graph: FlowGraph) => void
}

export function AutosaveController({ onAutosave, onSnapshot, ...editor }: AutosaveControllerProps) {
  const latest = useRef({ onAutosave, onSnapshot })
  latest.current = { onAutosave, onSnapshot }
  const commit = useCallback((graph: FlowGraph) => {
    latest.current.onSnapshot?.(graph)
    latest.current.onAutosave(graph)
  }, [])
  return <FlowEditor {...editor} onGraphCommit={commit} />
}
