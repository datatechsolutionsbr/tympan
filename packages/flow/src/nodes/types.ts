// Contract between node components and the canvases that draw them (the flow
// editor and the read-only preview). Node data lives in `FlowNode.data`; the
// keys each built-in kind reads are listed in registry.tsx.

import type { ComponentType } from 'react'
import type { DecisionResult } from '../decision/types'
import type { FlowNode, LayoutDirection, RunStatus } from '../model/types'
import type { CardDensity } from './GraphNodeCard'

/** A saved agent as the canvas shows it. */
export interface AgentSummary {
  id: string
  name: string
  role?: string
  /** Image address; when it fails the generated mark is shown. */
  avatar?: string
  /** Full model identifier (for example "provider/family-2025-06"). */
  modelId?: string
  provider?: string
}

/** Adjustment a stored rule applies. */
export interface RuleAdjustment {
  type: 'percent' | 'fixed' | 'formula'
  value?: number
}

/** A saved rule attached to a rule step. */
export interface StoredRule {
  id: string
  name: string
  adjustment?: RuleAdjustment
  priority?: number
  categories?: string[]
  enabled: boolean
}

/** An inline rule-engine step (no saved rule). */
export interface RuleEngineConfig {
  label?: string
  contextVariables?: string[]
  outputVariable?: string
}

/** A connection that data-source nodes read from. */
export interface DataSourceSummary {
  id: string
  name: string
  dialect?: string
  connected?: boolean
  /** Read-only sample source. */
  sample?: boolean
}

export interface FlowReferenceData {
  agents?: AgentSummary[]
  rules?: StoredRule[]
  dataSources?: DataSourceSummary[]
  dialects?: { key: string; displayName: string }[]
  /** Decision outcomes by node id (from the live or inspected run). */
  decisionResults?: Record<string, DecisionResult>
}

export interface FlowNodeProps {
  node: FlowNode
  density: CardDensity
  direction: LayoutDirection
  locked: boolean
  /** Read-only picture: no toolbars, no remove, decorative ports. */
  preview?: boolean
  selected?: boolean
  /** Status mark of a read-only preview; 'unknown' reads as "not run". */
  runStatus?: RunStatus
  onConfigure?(id: string): void
  onRemove?(id: string): void
  onDuplicate?(id: string): void
  onRename?(id: string, label: string): void
  onTextChange?(id: string, text: string): void
  onToggleExpanded?(id: string): void
  onEnterFocus?(id: string): void
  onToggleRule?(rule: StoredRule): void
  reference?: FlowReferenceData
}

export type FlowNodeComponent = ComponentType<FlowNodeProps>
