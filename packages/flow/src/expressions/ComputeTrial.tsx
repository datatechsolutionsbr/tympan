// "Test with sample data" for the compute form: two sample texts, a run
// button, and the evaluation trace. Its whole state is one reducer.

import { useReducer } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button, InlineNotice, TextArea } from '@datatechsolutions/tympan'
import { fill } from '../internal/labels'
import { sampleFromText } from './computeDraft'
import type { TraceReport } from './trace'
import { TraceTree, type TraceTreeLabels } from './TraceTree'

export interface TrialWords {
  testToggle: string
  sampleInputs: string
  sampleOutputs: string
  sampleHint: string
  invalidExpression: string
  invalidSamples: string
  run: string
  running: string
  results: string
  testFailed: string
  trace: Partial<TraceTreeLabels>
}

export type TrialSamples = { inputs?: Record<string, unknown>; nodeOutputs?: Record<string, unknown> }

interface TrialState {
  expanded: boolean
  inputs: string
  outputs: string
  outcome: { state: 'idle' } | { state: 'running' } | { state: 'traced'; report: TraceReport } | { state: 'error'; text: string }
}

type TrialEvent = { on: 'toggle' } | { on: 'inputs'; text: string } | { on: 'outputs'; text: string } | { on: 'outcome'; outcome: TrialState['outcome'] }

function trialReducer(s: TrialState, e: TrialEvent): TrialState {
  if (e.on === 'toggle') return { ...s, expanded: !s.expanded }
  if (e.on === 'inputs') return { ...s, inputs: e.text }
  if (e.on === 'outputs') return { ...s, outputs: e.text }
  return { ...s, outcome: e.outcome }
}

export function ComputeTrial({ words, locale, blocked, launch }: { words: TrialWords; locale: string; blocked: boolean; launch: (samples: TrialSamples) => Promise<TraceReport> }) {
  const [s, send] = useReducer(trialReducer, { expanded: false, inputs: '', outputs: '', outcome: { state: 'idle' } })
  const busy = s.outcome.state === 'running'

  const start = async () => {
    const readIn = sampleFromText(s.inputs)
    const readOut = sampleFromText(s.outputs)
    const firstBad = [readIn, readOut].find((r) => !r.ok)
    if (firstBad && !firstBad.ok) {
      send({ on: 'outcome', outcome: { state: 'error', text: fill(words.invalidSamples, { detail: firstBad.reason }, locale) } })
      return
    }
    const samples: TrialSamples = {}
    if (readIn.ok && readIn.value) samples.inputs = readIn.value
    if (readOut.ok && readOut.value) samples.nodeOutputs = readOut.value
    send({ on: 'outcome', outcome: { state: 'running' } })
    try {
      send({ on: 'outcome', outcome: { state: 'traced', report: await launch(samples) } })
    } catch (err) {
      send({ on: 'outcome', outcome: { state: 'error', text: fill(words.testFailed, { message: err instanceof Error ? err.message : String(err) }, locale) } })
    }
  }

  const fields = [
    { key: 'inputs' as const, label: words.sampleInputs },
    { key: 'outputs' as const, label: words.sampleOutputs },
  ]

  return (
    <div className="ty-expr-form__section">
      <Button variant="secondary" leadingIcon={<FlaskConical />} aria-expanded={s.expanded} onPress={() => send({ on: 'toggle' })}>
        {words.testToggle}
      </Button>
      {s.expanded ? (
        <div className="ty-expr-form__test">
          {fields.map((f) => (
            <TextArea key={f.key} className="ty-expr-form__code" label={f.label} hint={words.sampleHint} monospace rows={4} value={s[f.key]} onChange={(text) => send({ on: f.key, text })} />
          ))}
          {blocked ? (
            <InlineNotice tone="warning" urgency="polite">
              {words.invalidExpression}
            </InlineNotice>
          ) : null}
          <div>
            <Button variant="secondary" busy={busy} busyLabel={words.running} disabled={blocked || busy} onPress={start}>
              {busy ? words.running : words.run}
            </Button>
          </div>
          <div className="ty-expr-form__section" role="region" aria-label={words.results} aria-live="polite" aria-busy={busy || undefined}>
            {s.outcome.state === 'error' ? (
              <InlineNotice tone="danger" urgency="none">
                {s.outcome.text}
              </InlineNotice>
            ) : s.outcome.state === 'traced' ? (
              <TraceTree report={s.outcome.report} labels={words.trace} />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
