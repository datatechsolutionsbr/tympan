// Status of a run or of a node inside a run: always an icon and a word
// (design direction §2.3, §2.11); the tone only reinforces them.

import { CircleCheck, CircleDashed, CircleHelp, CircleSlash, CircleX, Clock, History, LoaderCircle } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { defineLabels, useLabels } from '../internal/labels'
import { normaliseStatus } from './lineage'
import type { RunWord } from './types'

export type RunWordLabels = Record<RunWord, string>

export const runWordLabels = defineLabels<RunWordLabels>('run-status', {
  en: { idle: 'idle', pending: 'pending', running: 'running', completed: 'completed', failed: 'failed', skipped: 'skipped', restored: 'restored', unknown: 'unknown' },
  'pt-BR': { idle: 'parada', pending: 'pendente', running: 'em execução', completed: 'concluída', failed: 'falhou', skipped: 'pulada', restored: 'reaproveitada', unknown: 'desconhecido' },
  es: { idle: 'inactiva', pending: 'pendiente', running: 'en ejecución', completed: 'completada', failed: 'falló', skipped: 'omitida', restored: 'restaurada', unknown: 'desconocido' },
})

export const defaultRunWordLabels: RunWordLabels = runWordLabels.bundles.en

const WORD_OF: Record<string, RunWord> = {
  idle: 'idle',
  pending: 'pending',
  queued: 'pending',
  waiting: 'pending',
  running: 'running',
  in_progress: 'running',
  started: 'running',
  streaming: 'running',
  completed: 'completed',
  complete: 'completed',
  succeeded: 'completed',
  success: 'completed',
  done: 'completed',
  failed: 'failed',
  error: 'failed',
  errored: 'failed',
  cancelled: 'failed',
  canceled: 'failed',
  skipped: 'skipped',
  restored: 'restored',
  served_from_history: 'restored',
}

/** Engine spellings (COMPLETED, succeeded, success …) → one word of the view vocabulary. */
export function runWordOf(status: string | undefined | null): RunWord {
  if (!status) return 'idle'
  return WORD_OF[normaliseStatus(status)] ?? 'unknown'
}

const ICONS: Record<RunWord, ComponentType<SVGProps<SVGSVGElement>>> = {
  idle: CircleDashed,
  pending: Clock,
  running: LoaderCircle,
  completed: CircleCheck,
  failed: CircleX,
  skipped: CircleSlash,
  restored: History,
  unknown: CircleHelp,
}

export interface RunStatusMarkProps {
  status: string | RunWord
  labels?: Partial<RunWordLabels>
  /** Hide the word visually (it stays in the accessible text). */
  quiet?: boolean
  className?: string
}

export function RunStatusMark({ status, labels, quiet = false, className }: RunStatusMarkProps) {
  const l = useLabels(runWordLabels, labels)
  const word = runWordOf(status)
  const Icon = ICONS[word]
  return (
    <span className={['ty-run-status', className].filter(Boolean).join(' ')} data-status={word}>
      <Icon className="ty-run-status__icon" aria-hidden="true" focusable="false" />
      <span className={quiet ? 'ty-visually-hidden' : 'ty-run-status__word'}>{l[word]}</span>
    </span>
  )
}
