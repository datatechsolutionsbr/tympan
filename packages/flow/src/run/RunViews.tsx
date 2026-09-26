// RunViewModes: RunPreviewPanel (compact, floating) and RunDrawer (full,
// docked) as two modes of one feature. The selected run, the selected node and
// the drawer tab live here, so switching mode keeps them.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@fakhir/design-system'
import { defineLabels, useLabels } from '../internal/labels'
import { useControllable } from '../internal/useControllable'
import { useFlowEditorState } from '../state/editorState'
import { RunDrawer, type RunDrawerLabels, type RunDrawerTab } from './RunDrawer'
import { RunPreviewPanel, type RunPreviewPanelLabels } from './RunPreviewPanel'
import type { RunWordLabels } from './RunStatusMark'
import { useTransition } from './runData'
import type { LoadRuns } from './types'

export type RunViewMode = 'panel' | 'drawer'

export interface RunViewState {
  mode: RunViewMode
  open: boolean
}

export interface PreferredRunModeStore {
  get(): RunViewMode | null
  set(mode: RunViewMode): void
}

export interface RunViewsLabels {
  nowPanel: string
  nowDrawer: string
}

export const runViewsLabels = defineLabels<RunViewsLabels>('run-views', {
  en: { nowPanel: 'Showing the compact run view', nowDrawer: 'Showing the full run details' },
  'pt-BR': { nowPanel: 'Mostrando a visão compacta da execução', nowDrawer: 'Mostrando os detalhes completos da execução' },
  es: { nowPanel: 'Mostrando la vista compacta de la ejecución', nowDrawer: 'Mostrando los detalles completos de la ejecución' },
})
export const defaultRunViewsLabels: RunViewsLabels = runViewsLabels.bundles.en

export interface RunViewsProps {
  flowId: string
  loadRuns: LoadRuns
  runView?: RunViewState
  defaultRunView?: RunViewState
  onRunViewChange?: (next: RunViewState) => void
  /** Open the current mode when a run starts. */
  openOnRun?: boolean
  preferredModeStore?: PreferredRunModeStore
  labels?: Partial<RunViewsLabels> & { panel?: Partial<RunPreviewPanelLabels>; drawer?: Partial<RunDrawerLabels> }
  statusLabels?: Partial<RunWordLabels>
  /** Element focus returns to when a view closes (the run details button). */
  opener?: HTMLElement | null
  /** Engine status of the current run; derived from node results when absent. */
  runStatus?: string
}

const CLOSED: RunViewState = { mode: 'drawer', open: false }

export function RunViews(props: RunViewsProps) {
  const { flowId, loadRuns, openOnRun = false, preferredModeStore, labels, statusLabels, opener } = props
  const l = useLabels(runViewsLabels, labels)
  const wide = useMediaQuery('(min-width: 1024px)', true)
  const [view, setView] = useControllable<RunViewState>(props.runView, props.defaultRunView ?? CLOSED, props.onRunViewChange)
  const isRunning = useFlowEditorState((s) => s.isRunning)
  const results = useFlowEditorState((s) => s.nodeResults)
  const [runId, setRunId] = useState<string | null>(null)
  const [nodeId, setNodeId] = useState<string | null>(null)
  const [tab, setTab] = useState<RunDrawerTab>('live')
  const [announcement, setAnnouncement] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const focusSwitch = useRef(false)
  const preferenceApplied = useRef(false)

  // First opening follows the person's remembered mode.
  useTransition(view.open, false, true, () => {
    if (preferenceApplied.current || !preferredModeStore) return
    preferenceApplied.current = true
    const remembered = preferredModeStore.get()
    if (remembered && remembered !== view.mode) setView({ mode: remembered, open: true })
  })

  useTransition(isRunning, false, true, () => {
    if (openOnRun && !view.open) setView({ ...view, open: true })
  })

  // A failure always opens the drawer on the failing node (design direction §3.10).
  const failing = Object.entries(results).find(([, r]) => r.status === 'error')?.[0] ?? null
  const seenFailure = useRef<string | null>(null)
  useEffect(() => {
    if (!failing || failing === seenFailure.current) {
      if (!failing) seenFailure.current = null
      return
    }
    seenFailure.current = failing
    setRunId(null)
    setTab('live')
    setNodeId(failing)
    setView({ mode: 'drawer', open: true })
    // setView identity changes per render; the failing id is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failing])

  const switchTo = useCallback(
    (mode: RunViewMode) => {
      focusSwitch.current = true
      if (mode === 'drawer') setTab(runId ? 'history' : 'live')
      preferredModeStore?.set(mode)
      setAnnouncement(mode === 'panel' ? l.nowPanel : l.nowDrawer)
      setView({ mode, open: true })
    },
    [preferredModeStore, l, setView, runId],
  )

  useLayoutEffect(() => {
    if (!focusSwitch.current) return
    focusSwitch.current = false
    root.current?.querySelector<HTMLElement>('.fk-run-switch')?.focus()
  })

  const close = () => setView({ ...view, open: false })
  const mode: RunViewMode = wide ? view.mode : 'drawer'
  const runStatus = props.runStatus ?? (isRunning ? 'running' : failing ? 'failed' : Object.keys(results).length ? 'completed' : 'idle')

  return (
    <div ref={root} className="fk-run-views" data-mode={view.open ? mode : 'closed'}>
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
      {view.open && mode === 'panel' ? (
        <RunPreviewPanel
          open
          onClose={close}
          flowId={flowId}
          loadRuns={loadRuns}
          labels={labels?.panel}
          statusLabels={statusLabels}
          selectedRunId={runId}
          onSelectedRunChange={setRunId}
          selectedNodeId={nodeId}
          onSelectedNodeChange={setNodeId}
          onExpand={() => switchTo('drawer')}
          returnFocusTo={opener ?? null}
        />
      ) : null}
      {view.open && mode === 'drawer' ? (
        <RunDrawer
          open
          onClose={close}
          flowId={flowId}
          isRunning={isRunning}
          runStatus={runStatus}
          loadRuns={loadRuns}
          labels={labels?.drawer}
          statusLabels={statusLabels}
          tab={tab}
          onTabChange={setTab}
          selectedRunId={runId}
          onSelectedRunChange={(id) => {
            setRunId(id)
            if (id) setTab('history')
          }}
          selectedNodeId={nodeId}
          onSelectedNodeChange={setNodeId}
          {...(wide ? { onCompact: () => switchTo('panel') } : {})}
          returnFocusTo={opener ?? null}
        />
      ) : null}
    </div>
  )
}
