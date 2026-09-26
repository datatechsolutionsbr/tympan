// StepCard: a research step on the canvas (250×86). Typed input chips ride
// the top edge and the output chip the bottom edge, both from the inline
// start; they are the connection handles. The body names the kind and the
// title beside an icon tile, with the run badge, then one mono line: the
// configuration summary, or the wiring problem in amber. A selected, editable
// step shows "+" on the middle of its bottom edge (add after).

import { Check, CircleAlert, LoaderCircle, Plus } from 'lucide-react'
import { useId, useRef } from 'react'
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

/** Where input `index` of `count` meets the top edge (0..1): centred, spread when several. */
export const alongEdge = (index: number, count: number) => (count <= 1 ? 0.5 : 0.35 + (0.3 * index) / (count - 1))

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

  const port = (role: 'source' | 'target', id: string) => {
    const target = surface.connectTarget?.nodeId === node.id && surface.connecting && surface.connecting.role !== role ? (surface.connectTarget.valid ? 'valid' : 'invalid') : undefined
    return {
      'data-role': role,
      ...(target ? { 'data-target': target } : {}),
      ...(preview || locked ? {} : { 'data-fk-port': '', 'data-fk-port-node': node.id, 'data-fk-port-id': id, 'data-fk-port-role': role }),
    }
  }

  return (
    <div className="fk-step" data-selected={selected ? 'true' : undefined} data-issue={issues.length ? 'true' : undefined} data-run={run ?? undefined}>
      {inputs.length ? (
        <span className="fk-step__ports" data-edge="in">
          {inputs.map((accepts, i) => (
            <span key={i} className="fk-step__port" {...port('target', inPort(i))}>
              <ShapeChip shapes={accepts as DataShape[]} words={rt.shapes} aria-hidden="true" />
            </span>
          ))}
        </span>
      ) : null}
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
        <span className="fk-step__head">
          <span className="fk-step__tile" aria-hidden="true">
            {Icon ? <Icon focusable="false" /> : null}
          </span>
          <span className="fk-step__names">
            <span className="fk-step__kind">{kindWord}</span>
            <span className="fk-step__title" title={title} dir="auto">
              {title}
            </span>
          </span>
          {runWord ? (
            <span className="fk-step__run" data-run={run} aria-hidden="true">
              {run === 'ok' ? <Check focusable="false" /> : run === 'running' ? <LoaderCircle focusable="false" /> : <CircleAlert focusable="false" />}
              {runWord}
            </span>
          ) : null}
        </span>
        {problems.length ? (
          <span className="fk-step__line" data-problem="true" aria-hidden="true">
            {problems[0]}
          </span>
        ) : (
          <span className="fk-step__line" data-empty={line ? undefined : 'true'} dir="auto">
            {line ?? w.notSet}
          </span>
        )}
      </AriaButton>
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
      {output ? (
        <span className="fk-step__ports" data-edge="out">
          <span className="fk-step__port" {...port('source', OUT_PORT)}>
            <ShapeChip shapes={[output]} words={rt.shapes} aria-hidden="true" />
          </span>
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
