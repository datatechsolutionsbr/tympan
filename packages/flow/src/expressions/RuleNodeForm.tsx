// RuleNodeForm: a rule step points at one saved rule and says whether the
// step is active; the rule itself is authored elsewhere (onManageRules).

import { useEffect, useState } from 'react'
import { Button, InlineNotice, NativeSelect, Spinner, Switch } from '@datatechsolutions/tympan'
import { NodeFormFooter } from '../forms/NodeFormFooter'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { conditionSummary } from './ruleCondition'

export interface SavedRuleSummary {
  id: string
  name: string
  condition?: unknown
}

export interface RuleNodeFormLabels {
  rule: string
  placeholder: string
  option: string
  loading: string
  loadError: string
  legacy: string
  summary: string
  newRule: string
  manageRules: string
  enabled: string
  enabledHint: string
  save: string
  cancel: string
}

export const ruleNodeFormLabels = defineLabels<RuleNodeFormLabels>('RuleNodeForm', {
  en: {
    rule: 'Saved rule',
    placeholder: 'Choose a saved rule',
    option: '{name} ({id})',
    loading: 'Loading rules',
    loadError: 'Rules could not be loaded: {message}',
    legacy: 'This step still has an inline condition. Pick a saved rule to replace it.',
    summary: '{root} with {clauses, plural, one {# clause} other {# clauses}}',
    newRule: 'New rule',
    manageRules: 'Manage rules',
    enabled: 'Step active',
    enabledHint: 'Turns this step on or off for runs, whatever the rule’s own state.',
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    rule: 'Regra salva',
    placeholder: 'Escolha uma regra salva',
    option: '{name} ({id})',
    loading: 'Carregando regras',
    loadError: 'Não foi possível carregar as regras: {message}',
    legacy: 'Esta etapa ainda tem uma condição própria. Escolha uma regra salva para substituí-la.',
    summary: '{root} com {clauses, plural, one {# cláusula} other {# cláusulas}}',
    newRule: 'Nova regra',
    manageRules: 'Gerenciar regras',
    enabled: 'Etapa ativa',
    enabledHint: 'Liga ou desliga esta etapa nas execuções, qualquer que seja o estado da regra.',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    rule: 'Regla guardada',
    placeholder: 'Elija una regla guardada',
    option: '{name} ({id})',
    loading: 'Cargando reglas',
    loadError: 'No se pudieron cargar las reglas: {message}',
    legacy: 'Este paso aún tiene una condición propia. Elija una regla guardada para reemplazarla.',
    summary: '{root} con {clauses, plural, one {# cláusula} other {# cláusulas}}',
    newRule: 'Nueva regla',
    manageRules: 'Gestionar reglas',
    enabled: 'Paso activo',
    enabledHint: 'Activa o desactiva este paso en las ejecuciones, sea cual sea el estado de la regla.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultRuleNodeFormLabels: RuleNodeFormLabels = ruleNodeFormLabels.bundles.en

export interface RuleNodeFormProps {
  value: { ruleId?: string; enabled?: boolean; [key: string]: unknown }
  rules?: SavedRuleSummary[]
  loadRules?: () => Promise<SavedRuleSummary[]>
  onManageRules: () => void
  onSave: (value: { kind: 'rule'; ruleId?: string; enabled: boolean }) => void
  onCancel: () => void
  labels?: Partial<RuleNodeFormLabels>
}

const LEGACY_KEYS = ['condition', 'conditions', 'expression', 'rule']

export function RuleNodeForm({ value, rules, loadRules, onManageRules, onSave, onCancel, labels }: RuleNodeFormProps) {
  const l = useLabels(ruleNodeFormLabels, labels)
  const { locale } = useFlowLocale()
  const [loaded, setLoaded] = useState<{ state: 'ready'; list: SavedRuleSummary[] } | { state: 'loading' } | { state: 'error'; message: string }>(() => (rules ? { state: 'ready', list: rules } : loadRules ? { state: 'loading' } : { state: 'ready', list: [] }))
  const [ruleId, setRuleId] = useState(value.ruleId ?? '')
  const [enabled, setEnabled] = useState(value.enabled !== false)

  useEffect(() => {
    if (rules) {
      setLoaded({ state: 'ready', list: rules })
      return
    }
    if (!loadRules) return
    let live = true
    setLoaded({ state: 'loading' })
    loadRules().then(
      (list) => {
        if (live) setLoaded({ state: 'ready', list })
      },
      (e: unknown) => {
        if (live) setLoaded({ state: 'error', message: e instanceof Error ? e.message : String(e) })
      },
    )
    return () => {
      live = false
    }
  }, [rules, loadRules])

  const list = loaded.state === 'ready' ? loaded.list : []
  const legacy = !value.ruleId && LEGACY_KEYS.some((k) => k in value)
  const chosen = list.find((r) => r.id === ruleId)
  const options = [{ value: '', label: l.placeholder }, ...list.map((r) => ({ value: r.id, label: fill(l.option, { name: r.name, id: r.id }, locale) })), ...(ruleId && !chosen ? [{ value: ruleId, label: ruleId }] : [])]
  const summary = chosen ? conditionSummary(chosen.condition) : null

  return (
    <div className="ty-node-form ty-rule-node-form">
      {legacy ? (
        <InlineNotice tone="warning" urgency="polite">
          {l.legacy}
        </InlineNotice>
      ) : null}
      {loaded.state === 'error' ? (
        <InlineNotice tone="danger" urgency="assertive">
          {fill(l.loadError, { message: loaded.message }, locale)}
        </InlineNotice>
      ) : null}
      {loaded.state === 'loading' ? (
        <div className="ty-rule-node-form__loading" aria-busy="true">
          <Spinner size="small" label={l.loading} showLabel />
        </div>
      ) : (
        <NativeSelect label={l.rule} options={options} value={ruleId} onChange={setRuleId} />
      )}
      {chosen ? (
        <div className="ty-rule-node-form__summary">
          <p className="ty-rule-node-form__summary-name">{chosen.name}</p>
          {summary ? <p className="ty-rule-node-form__summary-line">{fill(l.summary, { root: summary.root, clauses: summary.clauses }, locale)}</p> : null}
        </div>
      ) : null}
      <Button variant="secondary" onPress={onManageRules}>
        {loaded.state === 'ready' && list.length === 0 ? l.newRule : l.manageRules}
      </Button>
      <Switch label={l.enabled} description={l.enabledHint} isSelected={enabled} onChange={setEnabled} />
      <NodeFormFooter
        onSave={() => onSave({ kind: 'rule', ...(ruleId ? { ruleId } : {}), enabled })}
        onCancel={onCancel}
        saveDisabled={loaded.state === 'loading' && !value.ruleId}
        labels={{ save: l.save, cancel: l.cancel }}
      />
    </div>
  )
}
