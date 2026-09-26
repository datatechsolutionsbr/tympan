// RuleNode: a stored rule (adjustment, priority, categories, on/off) or an
// inline rule-engine step. The enabled switch and remove are siblings of the
// card's main control, so toggling never opens the editor.

import { Scale } from 'lucide-react'
import { Switch } from '@datatechsolutions/tympan'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection } from '../model/types'
import { ConnectionPorts } from './ConnectionPorts'
import { GraphNodeCard, NodeBadge, type CardDensity } from './GraphNodeCard'
import { useKindPresentation } from './nodeChrome'
import { NodeRunIndicator, useRunWords } from './NodeRunIndicator'
import type { RuleAdjustment, RuleEngineConfig, StoredRule } from './types'

export interface RuleNodeLabels {
  kind: string
  engine: string
  formula: string
  priority: string
  variables: string
  output: string
  enabled: string
  off: string
  missing: string
  remove: string
}

export const ruleNodeLabels = defineLabels<RuleNodeLabels>('ruleNode', {
  en: {
    kind: 'rule',
    engine: 'Rule engine',
    formula: 'formula',
    priority: 'priority {value, number}',
    variables: '{count, plural, one {# variable} other {# variables}}',
    output: 'output {name}',
    enabled: '{name} enabled',
    off: 'off',
    missing: 'No rule is attached to this step.',
    remove: 'Remove {title}',
  },
  'pt-BR': {
    kind: 'regra',
    engine: 'Motor de regras',
    formula: 'fórmula',
    priority: 'prioridade {value, number}',
    variables: '{count, plural, one {# variável} other {# variáveis}}',
    output: 'saída {name}',
    enabled: '{name} ativa',
    off: 'desligada',
    missing: 'Nenhuma regra está ligada a esta etapa.',
    remove: 'Remover {title}',
  },
  es: {
    kind: 'regla',
    engine: 'Motor de reglas',
    formula: 'fórmula',
    priority: 'prioridad {value, number}',
    variables: '{count, plural, one {# variable} other {# variables}}',
    output: 'salida {name}',
    enabled: '{name} activada',
    off: 'desactivada',
    missing: 'Ninguna regla está vinculada a este paso.',
    remove: 'Quitar {title}',
  },
})
export const defaultRuleNodeLabels = ruleNodeLabels.bundles.en

/**
 * Signed adjustment text: "+10%", "−5" (true minus sign), "0", or the formula
 * word. Digits follow the locale.
 */
export function formatAdjustment(adj: RuleAdjustment | undefined, locale: string, formulaWord: string): string | null {
  if (!adj) return null
  if (adj.type === 'formula' || adj.value === undefined) return formulaWord
  const magnitude = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Math.abs(adj.value))
  const sign = adj.value > 0 ? '+' : adj.value < 0 ? '−' : ''
  return `${sign}${magnitude}${adj.type === 'percent' ? '%' : ''}`
}

export interface RuleNodeProps {
  id: string
  rule?: StoredRule | null
  config?: RuleEngineConfig | null
  label?: string
  density?: CardDensity
  onOpen?: (ruleOrId: StoredRule | string) => void
  onToggleEnabled?: (rule: StoredRule) => void
  onRemove?: (id: string) => void
  selected?: boolean
  locked?: boolean
  preview?: boolean
  direction?: LayoutDirection
  labels?: Partial<RuleNodeLabels>
}

export function RuleNode(props: RuleNodeProps) {
  const { id, rule, config, label, density = 'detailed', onOpen, onToggleEnabled, onRemove, selected = false, locked = false, preview = false, direction = 'right' } = props
  const l = useLabels(ruleNodeLabels, props.labels)
  const { locale } = useFlowLocale()
  const node: FlowNode = { id, kind: 'rule', position: { x: 0, y: 0 }, data: {} }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const canEdit = !preview && !locked
  const title = rule?.name ?? config?.label ?? label ?? (config ? l.engine : l.kind)

  let meta = null
  if (rule) {
    const adj = formatAdjustment(rule.adjustment, locale, l.formula)
    meta = (
      <>
        {adj ? <span className="ty-rule-node__adjustment">{adj}</span> : null}
        {rule.priority !== undefined ? <span className="ty-rule-node__priority">{fill(l.priority, { value: rule.priority }, locale)}</span> : null}
        {(rule.categories ?? []).map((c) => (
          <NodeBadge key={c}>{c}</NodeBadge>
        ))}
      </>
    )
  } else if (config) {
    meta = (
      <>
        <span>{fill(l.variables, { count: config.contextVariables?.length ?? 0 }, locale)}</span>
        {config.outputVariable ? <span className="ty-rule-node__output">{fill(l.output, { name: config.outputVariable }, locale)}</span> : null}
      </>
    )
  }

  const toggle =
    rule && onToggleEnabled && !preview ? (
      <span className="ty-rule-node__switch" data-ty-above="" data-ty-no-drag="">
        <Switch size="small" isSelected={rule.enabled} accessibleLabel={fill(l.enabled, { name: rule.name })} disabled={locked} onChange={() => onToggleEnabled(rule)} />
        {!rule.enabled ? <span className="ty-rule-node__off">{l.off}</span> : null}
      </span>
    ) : rule && !rule.enabled ? (
      <span className="ty-rule-node__off">{l.off}</span>
    ) : null

  return (
    <GraphNodeCard
      kind="rule"
      kindLabel={l.kind}
      title={title}
      icon={<Scale />}
      tone={k.tone}
      width="standard"
      density={density}
      selected={selected}
      locked={locked}
      runState={run.runState}
      problem={!rule && !config ? l.missing : false}
      {...(run.words ? { stateWords: [run.words] } : {})}
      {...(onOpen && (canEdit || preview) && (rule || config) ? { onActivate: () => onOpen(rule ?? id) } : {})}
      {...(onRemove && canEdit ? { onDelete: () => onRemove(id) } : {})}
      labels={{ remove: l.remove }}
      headerActions={toggle}
      meta={meta}
      className="ty-flow-node ty-rule-node"
    >
      <ConnectionPorts nodeId={id} nodeLabel={title} inputs={k.inputs} outputs={k.outputs} tone={k.tone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind="rule" nodeLabel={title} />
    </GraphNodeCard>
  )
}
