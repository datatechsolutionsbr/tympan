// RunControls: save status slot, run history, publish, and one run/stop button
// that keeps its element (and focus) while its action and name switch.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { History, LoaderCircle, Play, Square } from 'lucide-react'
import { Tooltip, TooltipTrigger } from 'react-aria-components'
import { Button } from '@fakhir/design-system'
import { defineLabels, useLabels } from '../internal/labels'

export interface RunControlsLabels {
  run: string
  stop: string
  history: string
  publish: string
  publishing: string
  started: string
  stopped: string
  group: string
}

export const runControlsLabels = defineLabels<RunControlsLabels>('RunControls', {
  en: { run: 'Run', stop: 'Stop', history: 'Run history', publish: 'Publish version', publishing: 'Publishing', started: 'Run started', stopped: 'Run stopped', group: 'Run controls' },
  'pt-BR': { run: 'Executar', stop: 'Parar', history: 'Histórico de execuções', publish: 'Publicar versão', publishing: 'Publicando', started: 'Execução iniciada', stopped: 'Execução parada', group: 'Controles de execução' },
  es: { run: 'Ejecutar', stop: 'Detener', history: 'Historial de ejecuciones', publish: 'Publicar versión', publishing: 'Publicando', started: 'Ejecución iniciada', stopped: 'Ejecución detenida', group: 'Controles de ejecución' },
})
export const defaultRunControlsLabels: RunControlsLabels = runControlsLabels.bundles.en

export interface RunControlsProps {
  isRunning: boolean
  onRun: () => void
  onStop: () => void
  onOpenHistory?: () => void
  onPublish?: () => void
  isPublishing?: boolean
  saveStatus?: ReactNode
  labels?: Partial<RunControlsLabels>
  placement?: 'overlay' | 'inline'
  /** Whether Run is the single primary action of the view (gradient); otherwise secondary. */
  primary?: boolean
  className?: string
}

export function RunControls({ isRunning, onRun, onStop, onOpenHistory, onPublish, isPublishing = false, saveStatus, labels, placement = 'overlay', primary = true, className }: RunControlsProps) {
  const l = useLabels(runControlsLabels, labels)
  const [announcement, setAnnouncement] = useState('')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setAnnouncement(isRunning ? l.started : l.stopped)
  }, [isRunning, l.started, l.stopped])

  return (
    <div className={['fk-run-controls', className].filter(Boolean).join(' ')} role="group" aria-label={l.group} data-placement={placement} data-fk-surface-chrome="">
      {saveStatus ? <div className="fk-run-controls__status">{saveStatus}</div> : null}
      {onOpenHistory ? (
        <TooltipTrigger delay={300}>
          <Button className="fk-run-controls__history" variant="quiet" iconOnly accessibleLabel={l.history} leadingIcon={<History />} onPress={onOpenHistory} />
          <Tooltip className="fk-run-controls__tooltip" offset={6}>
            {l.history}
          </Tooltip>
        </TooltipTrigger>
      ) : null}
      {onPublish ? (
        <Button variant="secondary" busy={isPublishing} busyLabel={l.publishing} disabled={isPublishing} onPress={onPublish}>
          {isPublishing ? l.publishing : l.publish}
        </Button>
      ) : null}
      <Button
        className="fk-run-controls__main"
        variant={isRunning ? 'danger' : primary ? 'primary' : 'secondary'}
        leadingIcon={isRunning ? <LoaderCircle className="fk-run-controls__spinner" /> : <Play />}
        trailingIcon={isRunning ? <Square className="fk-run-controls__stop-glyph" /> : undefined}
        onPress={isRunning ? onStop : onRun}
      >
        {isRunning ? l.stop : l.run}
      </Button>
      <span className="fk-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}
