// StepCard: a research step on the canvas (about 250×86). Typed input chips
// sit on the top edge, the output chip on the bottom edge; both are the
// connection handles. The body names the kind, the title and a one-line mono
// summary of the configuration, with the run badge and any wiring problem.
// A selected, editable step shows "+" under its output (add after).

import { CircleAlert, CircleCheck, LoaderCircle, Plus, TriangleAlert } from 'lucide-react'
import { useId, useRef, type CSSProperties } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { fill, useFlowLocale } from '../internal/labels'
import type { FlowNodeProps } from '../nodes/types'
import { useNodeResult } from '../state/editorState'
import { useSurface } from '../surface/SurfaceContext'
import { ShapeChip } from './ShapeChip'
import { shapeList, type DataShape } from './shapes'
import { specOfNode, summaryLine } from './researchSteps'
import { useSteps } from './StepsContext'
import { inPort, OUT_PORT } from './wiring'

export const STEP_CARD_SIZE = Object.freeze({ width: 250, height: 86 })

/** Where input `index` of `count` sits along the edge (0..1). */
export const alongEdge = (index: number, count: number) => (index + 1) / (count + 1)

const VERB_TONE: Record<string, string> = { input: 'categorical-2', prepare: 'categorical-4', analyse: 'categorical-5', decide: 'categorical-7', output: 'categorical-3' }

export function StepCard({ node, locked, selected, preview, onConfigure }: FlowNodeProps) {
  const rt = useSteps()
  const { locale } = useFlowLocale()
  const surface = useSurface()
  const result = useNodeResult(node.id)
  const addRef = useRef<HTMLButtonElement>(null)
  const describedBy = useId()
  const spec = specOfNode(node, rt.byId)
  const w = rt.words
  const title = (typeof node.data.label === 'string' && node.data.label) || spec?.name || node.kind
  const kindWord = spec ? rt.shelves.find((s) => s.id === spec.verb)?.title ?? spec.verb : node.kind
  const line = spec ? summaryLine(spec, node.data, locale) : null
  const issues = rt.issues.get(node.id) ?? []
  const Icon = spec?.icon
  const run = result?.status === 'success' ? 'ok' : result?.status === 'running' ? 'running' : result?.status === 'error' ? 'failed' : null
  const runWord = run === 'ok' ? w.runOk : run === 'running' ? w.runRunning : run === 'failed' ? w.runFailed : null
  const problems = issues.map((i) => fill(w.mismatch, { expects: shapeList(i.expects, rt.shapes), gets: i.gets ? rt.shapes[i.gets] : w.nothing }, locale))
  const editable = !locked && !preview
  const inputs = spec?.inputs ?? []
  const output = spec?.output ?? null

  const port = (role: 'source' | 'target', id: string, along: number) => {
    const target = surface.connectTarget?.nodeId === node.id && surface.connecting && surface.connecting.role !== role ? (surface.connectTarget.valid ? 'valid' : 'invalid') : undefined
    return {
      style: { '--fk-step-along': `${along * 100}%` } as CSSProperties,
      'data-role': role,
      ...(target ? { 'data-target': target } : {}),
      ...(preview || locked ? {} : { 'data-fk-port': '', 'data-fk-port-node': node.id, 'data-fk-port-id': id, 'data-fk-port-role': role }),
    }
  }

  return (
    <div
      className="fk-step"
      data-selected={selected ? 'true' : undefined}
      data-issue={issues.length ? 'true' : undefined}
      data-run={run ?? undefined}
      data-tone={spec ? VERB_TONE[spec.verb] ?? 'neutral' : 'neutral'}
    >
      {inputs.map((accepts, i) => (
        <span key={i} className="fk-step__port" data-edge="in" {...port('target', inPort(i), alongEdge(i, inputs.length))}>
          <ShapeChip shapes={accepts as DataShape[]} words={rt.shapes} aria-hidden="true" />
        </span>
      ))}
      <AriaButton
        className="fk-step__body"
        data-fk-node-focus=""
        aria-label={`${kindWord}: ${title}`}
        aria-describedby={describedBy}
        onPress={() => {
          if (surface.justDragged()) return
          onConfigure?.(node.id)
        }}
      >
        <span className="fk-step__tile" aria-hidden="true">
          {Icon ? <Icon focusable="false" /> : null}
        </span>
        <span className="fk-step__kind">{kindWord}</span>
        <span className="fk-step__title" title={title} dir="auto">
          {title}
        </span>
        <span className="fk-step__line" data-empty={line ? undefined : 'true'} dir="auto">
          {line ?? w.notSet}
        </span>
      </AriaButton>
      {runWord ? (
        <span className="fk-step__run" data-run={run} aria-hidden="true">
          {run === 'ok' ? <CircleCheck focusable="false" /> : run === 'running' ? <LoaderCircle focusable="false" /> : <CircleAlert focusable="false" />}
          {runWord}
        </span>
      ) : null}
      <span id={describedBy} className="fk-visually-hidden">
        {[
          inputs.length ? `${w.inputs}: ${inputs.map((a) => shapeList(a, rt.shapes)).join(', ')}` : null,
          output ? `${w.output}: ${rt.shapes[output]}` : null,
          runWord,
          ...problems,
        ]
          .filter(Boolean)
          .join('. ')}
      </span>
      {problems.length ? (
        <p className="fk-step__problem" aria-hidden="true">
          <TriangleAlert focusable="false" />
          <span>{problems[0]}</span>
        </p>
      ) : null}
      {output ? (
        <span className="fk-step__port" data-edge="out" {...port('source', OUT_PORT, 0.5)}>
          <ShapeChip shapes={[output]} words={rt.shapes} aria-hidden="true" />
        </span>
      ) : null}
      {editable && selected && output && rt.addAfter ? (
        <AriaButton
          ref={addRef}
          className="fk-step__add"
          data-fk-surface-chrome=""
          data-fk-add-after={node.id}
          aria-label={fill(w.addAfter, { name: title }, locale)}
          onPress={() => addRef.current && rt.addAfter?.(node.id, addRef.current)}
        >
          <Plus aria-hidden="true" focusable="false" />
        </AriaButton>
      ) : null}
    </div>
  )
}
