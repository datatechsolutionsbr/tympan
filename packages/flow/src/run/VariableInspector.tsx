// VariableInspector: for each node in execution order, the variables it
// consumes and produces, so authors can trace data through the flow.

import { ChevronRight } from 'lucide-react'
import { Button as AriaButton, Disclosure, DisclosureGroup, DisclosurePanel, Heading } from 'react-aria-components'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { DockedPanel } from '../internal/DockedPanel'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { topologicalOrder } from '../model/graph'
import type { FlowNode } from '../model/types'
import { useFlowEditorState } from '../state/editorState'

export type VariableType = 'any' | 'array' | 'number' | 'boolean' | 'string'

export interface InferredVariable {
  name: string
  type: VariableType
}

export interface NodeVariables {
  inputs: InferredVariable[]
  outputs: InferredVariable[]
}

const cfg = (n: FlowNode): Record<string, unknown> => (n.data.config && typeof n.data.config === 'object' ? (n.data.config as Record<string, unknown>) : n.data)

const names = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' && typeof (x as { name?: unknown }).name === 'string' ? (x as { name: string }).name : '')).filter(Boolean) : []

const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback)

/** Variables a node consumes and produces, inferred from its kind and configuration. */
export function inferVariables(node: FlowNode): NodeVariables {
  const c = cfg(node)
  switch (node.kind) {
    case 'start':
      return { inputs: [], outputs: names(c.inputVariables).map((name) => ({ name, type: 'any' })) }
    case 'end':
      return { inputs: names(c.outputs ?? c.outputVariables).map((name) => ({ name, type: 'any' })), outputs: [] }
    case 'code':
    case 'compute': {
      const expr = (c.expression ?? c.root ?? c) as Record<string, unknown>
      return { inputs: [{ name: str(expr.operation, 'input'), type: 'any' }], outputs: [{ name: str(c.outputVariable, 'result'), type: 'any' }] }
    }
    case 'if-else':
    case 'branch': {
      const conditions = Array.isArray(c.conditions) ? (c.conditions as Array<Record<string, unknown>>) : []
      const vars = [...new Set(conditions.map((x) => str(x.variable ?? x.ref, '')).filter(Boolean))]
      return { inputs: vars.map((name) => ({ name, type: 'any' })), outputs: [{ name: 'true', type: 'boolean' }, { name: 'false', type: 'boolean' }] }
    }
    case 'iteration':
    case 'loop':
      return { inputs: [{ name: str(c.collection ?? c.iterator, 'items'), type: 'array' }], outputs: [{ name: 'item', type: 'any' }, { name: 'index', type: 'number' }] }
    case 'answer':
      return { inputs: [{ name: str(c.templateName, 'template'), type: 'string' }], outputs: names(c.outputs).map((name) => ({ name, type: 'any' })) }
    default:
      return { inputs: [], outputs: [] }
  }
}

export interface VariableInspectorLabels {
  title: string
  close: string
  inputs: string
  outputs: string
  variables: string
  noVariables: string
  noNodes: string
  any: string
  array: string
  number: string
  boolean: string
  string: string
}

export const variableInspectorLabels = defineLabels<VariableInspectorLabels>('variable-inspector', {
  en: {
    title: 'Variables',
    close: 'Close variables',
    inputs: 'Inputs',
    outputs: 'Outputs',
    variables: '{count, plural, =0 {no variables} one {# variable} other {# variables}}',
    noVariables: 'This step neither reads nor writes variables.',
    noNodes: 'Add steps to the flow to see their variables.',
    any: 'any',
    array: 'list',
    number: 'number',
    boolean: 'true or false',
    string: 'text',
  },
  'pt-BR': {
    title: 'Variáveis',
    close: 'Fechar variáveis',
    inputs: 'Entradas',
    outputs: 'Saídas',
    variables: '{count, plural, =0 {nenhuma variável} one {# variável} other {# variáveis}}',
    noVariables: 'Este passo não lê nem escreve variáveis.',
    noNodes: 'Adicione passos ao fluxo para ver suas variáveis.',
    any: 'qualquer',
    array: 'lista',
    number: 'número',
    boolean: 'verdadeiro ou falso',
    string: 'texto',
  },
  es: {
    title: 'Variables',
    close: 'Cerrar variables',
    inputs: 'Entradas',
    outputs: 'Salidas',
    variables: '{count, plural, =0 {sin variables} one {# variable} other {# variables}}',
    noVariables: 'Este paso no lee ni escribe variables.',
    noNodes: 'Agregue pasos al flujo para ver sus variables.',
    any: 'cualquiera',
    array: 'lista',
    number: 'número',
    boolean: 'verdadero o falso',
    string: 'texto',
  },
})
export const defaultVariableInspectorLabels: VariableInspectorLabels = variableInspectorLabels.bundles.en

export interface VariableInspectorProps {
  open: boolean
  onClose: () => void
  labels?: Partial<VariableInspectorLabels>
}

export function VariableInspector({ open, onClose, labels }: VariableInspectorProps) {
  if (!open) return null
  return <InspectorBody onClose={onClose} labels={labels} />
}

function InspectorBody({ onClose, labels }: Omit<VariableInspectorProps, 'open'>) {
  const l = useLabels(variableInspectorLabels, labels)
  const { locale } = useFlowLocale()
  const catalog = useRenderCatalog()
  const nodes = useFlowEditorState((s) => s.nodes)
  const connectors = useFlowEditorState((s) => s.connectors)
  const steps = nodes.filter((n) => n.kind !== 'note')
  const byId = new Map(steps.map((n) => [n.id, n]))
  const ordered = topologicalOrder(
    steps.map((n) => n.id),
    connectors,
  ).map((id) => byId.get(id)!)

  const varList = (vars: InferredVariable[], heading: string) => (
    <section className="fk-variables__group">
      <h4 className="fk-run-subtitle">{heading}</h4>
      <ul className="fk-variables__list">
        {vars.map((v) => (
          <li key={v.name} className="fk-variables__item">
            <code className="fk-run-mono">{v.name}</code>
            <span className="fk-variables__type">{l[v.type]}</span>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <DockedPanel title={l.title} onClose={onClose} closeLabel={l.close} className="fk-variables">
      {ordered.length === 0 ? (
        <p className="fk-run-empty">{l.noNodes}</p>
      ) : (
        <DisclosureGroup allowsMultipleExpanded className="fk-variables__entries">
          {ordered.map((n) => {
            const vars = inferVariables(n)
            const count = vars.inputs.length + vars.outputs.length
            const Icon = catalog.icon(n.kind)
            const label = typeof n.data.label === 'string' && n.data.label ? n.data.label : (catalog.entry(n.kind)?.label ?? n.id)
            return (
              <Disclosure key={n.id} id={n.id} className="fk-variables__entry">
                <Heading level={3} className="fk-variables__heading">
                  <AriaButton slot="trigger" className="fk-variables__trigger">
                    <ChevronRight className="fk-variables__chevron fk-run-mirror" aria-hidden="true" focusable="false" />
                    <Icon className="fk-variables__icon" aria-hidden="true" focusable="false" />
                    <span className="fk-variables__label">{label}</span>
                    <span className="fk-variables__count">{fill(l.variables, { count }, locale)}</span>
                  </AriaButton>
                </Heading>
                <DisclosurePanel className="fk-variables__panel">
                  {count === 0 ? (
                    <p className="fk-run-hint">{l.noVariables}</p>
                  ) : (
                    <>
                      {vars.inputs.length ? varList(vars.inputs, l.inputs) : null}
                      {vars.outputs.length ? varList(vars.outputs, l.outputs) : null}
                    </>
                  )}
                </DisclosurePanel>
              </Disclosure>
            )
          })}
        </DisclosureGroup>
      )}
    </DockedPanel>
  )
}
