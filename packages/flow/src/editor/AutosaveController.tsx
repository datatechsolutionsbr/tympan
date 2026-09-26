// AutosaveController wraps FlowEditor and fans every committed graph out to
// two sinks, always in the same order: the snapshot sink (local mirrors such
// as an unsaved-changes guard) and then the autosave sink (the host debounces
// and persists). The relay handed to the editor is created once; it reads the
// sinks from a box refreshed on each render, so new callback identities never
// re-mount the canvas or lose its viewport and selection.

import { createElement, useState } from 'react'
import type { FlowGraph } from '../model/types'
import { FlowEditor, type FlowEditorProps } from './FlowEditor'

export interface AutosaveControllerProps extends Omit<FlowEditorProps, 'onGraphCommit'> {
  onAutosave: (graph: FlowGraph) => void
  onSnapshot?: (graph: FlowGraph) => void
}

type Sink = ((graph: FlowGraph) => void) | undefined

export function AutosaveController(props: AutosaveControllerProps) {
  const { onAutosave, onSnapshot, ...editorProps } = props
  const [box] = useState<{ sinks: Sink[] }>(() => ({ sinks: [] }))
  box.sinks = [onSnapshot, onAutosave]
  const [relay] = useState(() => (graph: FlowGraph) => box.sinks.forEach((sink) => sink?.(graph)))
  return createElement(FlowEditor, { ...editorProps, onGraphCommit: relay })
}
