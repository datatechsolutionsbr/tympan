// Typed wiring between research steps, as pure functions: what may follow a
// step, which links carry the wrong shape (and a one-click repair), and how a
// new step is placed after a step or inside a link.

import type { FlowConnector, FlowNode } from '../model/types'
import type { DataShape } from './shapes'
import { specOfNode, STEP_KIND, type ReadyStep } from './researchSteps'

export const OUT_PORT = 'out'
export const inPort = (index: number) => `in-${index}`

/** Input position from a port id ('in-1' → 1); unknown ids read as the first input. */
export function inputIndex(portId: string | undefined): number {
  const m = portId ? /^in-(\d+)$/.exec(portId) : null
  return m ? Number(m[1]) : 0
}

type Specs = ReadonlyMap<string, ReadyStep>

/** Shape a node gives: a shape, null (gives nothing) or undefined (untyped). */
export function givenShape(node: FlowNode, specs: Specs): DataShape | null | undefined {
  const s = specOfNode(node, specs)
  return !s || s.primitive ? undefined : s.output
}

/** Shapes one input of a node accepts; undefined when the node is untyped. */
export function acceptedShapes(node: FlowNode, specs: Specs, portId?: string): readonly DataShape[] | undefined {
  const s = specOfNode(node, specs)
  if (!s || s.primitive) return undefined
  return s.inputs[inputIndex(portId)] ?? s.inputs[0] ?? []
}

/** Steps that can follow something giving `shape` (every step with an input when untyped). */
export function stepsAccepting(shape: DataShape | null | undefined, steps: readonly ReadyStep[], aiAllowed = true): ReadyStep[] {
  return steps.filter((s) => {
    if (s.primitive || !s.inputs.length || (s.usesAI && !aiAllowed)) return false
    return shape === undefined || (shape !== null && s.inputs[0]!.includes(shape))
  })
}

export type Repair =
  | { kind: 'replace'; nodeId: string; stepId: string }
  | { kind: 'insert'; connectorId: string; stepId: string }
  | { kind: 'unlink'; connectorId: string }

export interface WiringIssue {
  connectorId: string
  /** The step receiving the wrong shape. */
  nodeId: string
  sourceId: string
  expects: readonly DataShape[]
  gets: DataShape | null
  repair: Repair
}

/** Links whose shape the receiving input does not accept, each with a repair. */
export function wiringIssues(nodes: readonly FlowNode[], connectors: readonly FlowConnector[], steps: readonly ReadyStep[], aiAllowed = true): WiringIssue[] {
  const specs = new Map(steps.map((s) => [s.id, s]))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const found: WiringIssue[] = []
  for (const c of connectors) {
    const from = byId.get(c.source)
    const to = byId.get(c.target)
    if (!from || !to) continue
    const gets = givenShape(from, specs)
    const expects = acceptedShapes(to, specs, c.targetPort)
    if (gets === undefined || expects === undefined) continue
    if (gets !== null && expects.includes(gets)) continue
    // First choice: a step of the same kind of work that takes what arrives;
    // then a bridge that takes it and gives what the receiver wants.
    const receiver = specOfNode(to, specs)
    const takers = gets === null ? [] : stepsAccepting(gets, steps, aiAllowed)
    const twin = takers.find((s) => s.verb === receiver?.verb && s.id !== receiver?.id)
    const bridge = takers.find((s) => s.output !== null && expects.includes(s.output))
    found.push({
      connectorId: c.id,
      nodeId: to.id,
      sourceId: from.id,
      expects,
      gets,
      repair: twin ? { kind: 'replace', nodeId: to.id, stepId: twin.id } : bridge ? { kind: 'insert', connectorId: c.id, stepId: bridge.id } : { kind: 'unlink', connectorId: c.id },
    })
  }
  return found
}

/** A fresh step node (positions are settled by the layout afterwards). */
export function stepNode(step: ReadyStep, id: string, at: { x: number; y: number }): FlowNode {
  const data: Record<string, unknown> = step.kind === STEP_KIND ? { stepId: step.id, ...(step.defaults ?? {}) } : { label: step.name, ...(step.defaults ?? {}) }
  return { id, kind: step.kind, position: at, data }
}

/** Links a new step `newId` to follow `afterId`. */
export function linkAfter(connectors: readonly FlowConnector[], afterId: string, newId: string, makeId: () => string): FlowConnector[] {
  return [...connectors, { id: makeId(), source: afterId, target: newId, sourcePort: OUT_PORT, targetPort: inPort(0) }]
}

/** Replaces link `connectorId` with two links through `newId`. */
export function linkThrough(connectors: readonly FlowConnector[], connectorId: string, newId: string, makeId: () => string): FlowConnector[] {
  const old = connectors.find((c) => c.id === connectorId)
  if (!old) return [...connectors]
  const rest = connectors.filter((c) => c.id !== connectorId)
  return [
    ...rest,
    { id: makeId(), source: old.source, target: newId, ...(old.sourcePort ? { sourcePort: old.sourcePort } : {}), targetPort: inPort(0) },
    { id: makeId(), source: newId, target: old.target, sourcePort: OUT_PORT, ...(old.targetPort ? { targetPort: old.targetPort } : {}) },
  ]
}

/**
 * Reorders two neighbours of a chain: `first` → `second` becomes
 * `second` → `first`, with what came into `first` now entering `second` and
 * what left `second` now leaving `first`. Null when they are not linked.
 */
export function swapNeighbours(connectors: readonly FlowConnector[], first: string, second: string): FlowConnector[] | null {
  if (!connectors.some((c) => c.source === first && c.target === second)) return null
  return connectors.map((c) => {
    if (c.source === first && c.target === second) return { ...c, source: second, target: first }
    if (c.target === first) return { ...c, target: second }
    if (c.source === second) return { ...c, source: first }
    return c
  })
}
