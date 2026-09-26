// NodeConfigDialog: the one modal that edits a node's configuration. The form
// is chosen from the catalog entry's form kind; each form owns its footer.

import { useEffect, useRef, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'
import { InlineNotice } from '@fakhir/design-system'
import { nodeKindCatalog, type FormKind, type NodeKindCatalogStore } from '../catalog/kindCatalog'
import { humaniseKey, useRenderCatalog } from '../catalog/RenderCatalog'
import { SectionedModal } from '../internal/SectionedModal'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import { useDialogStack, useActiveDialog, type NodeConfigPayload } from '../state/dialogStack'
import { useOptionalFlowEditorStore } from '../state/editorState'
import { ComputeNodeForm, RuleNodeForm, SimulationNodeForm } from '../expressions'
import { AgentNodeForm, DataSourceNodeForm, DecisionNodeForm, GroupNodeForm, ReportOutputNodeForm, SchemaConfigForm, StartNodeForm } from '../forms'

export interface NodeConfigDialogLabels {
  eyebrow: string
  experimental: string
  /** Title per node kind; falls back to the catalog label. */
  titles: Record<string, string>
}

export const nodeConfigDialogLabels = defineLabels<NodeConfigDialogLabels>('NodeConfigDialog', {
  en: {
    eyebrow: 'Node configuration',
    experimental: 'This step is experimental: its configuration is saved, but the engine may pass inputs through unchanged.',
    titles: {},
  },
  'pt-BR': {
    eyebrow: 'Configuração do passo',
    experimental: 'Este passo é experimental: a configuração é salva, mas o motor pode repassar as entradas sem alterá-las.',
    titles: {},
  },
  es: {
    eyebrow: 'Configuración del paso',
    experimental: 'Este paso es experimental: su configuración se guarda, pero el motor puede pasar las entradas sin cambios.',
    titles: {},
  },
})
export const defaultNodeConfigDialogLabels = nodeConfigDialogLabels.bundles.en

export interface NodeConfigDataSource {
  id: string
  name: string
  dialect: string
}

export interface NodeConfigDialogProps {
  onSave: (nodeId: string, config: Record<string, unknown>) => void
  dataSources?: NodeConfigDataSource[]
  loadTables?: (dataSourceId: string) => Promise<string[]>
  loadColumns?: (dataSourceId: string, table: string) => Promise<Array<{ name: string; type: string; nullable?: boolean }>>
  /** Enables the compute form's dry run; hidden when absent. */
  runDryRun?: (request: unknown) => Promise<unknown>
  // Pass-throughs for the forms that pick a saved thing or a model.
  agents?: Array<{ id: string; name: string; model?: string }>
  loadAgents?: () => Promise<Array<{ id: string; name: string; model?: string }>>
  agentsHref?: string
  rules?: Array<{ id: string; name: string; condition?: unknown }>
  loadRules?: () => Promise<Array<{ id: string; name: string; condition?: unknown }>>
  onManageRules?: () => void
  providers?: Array<{ id: string; name: string }>
  models?: Array<{ id: string; name?: string; provider?: string }>
  /** Catalog to read form kinds from (defaults to the installed one). */
  catalog?: NodeKindCatalogStore
  labels?: Partial<NodeConfigDialogLabels>
}

// Forms are built by sibling groups; they are addressed through a loose prop shape here.
type AnyForm = ComponentType<Record<string, unknown>>
const asForm = (c: unknown) => c as AnyForm

/** Focuses the node's main control on the canvas, if it is there. */
export function focusCanvasNode(nodeId: string): void {
  const esc = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(nodeId) : nodeId
  const el = document.querySelector<HTMLElement>(`[data-fk-node-id="${esc}"] [data-fk-node-focus]`) ?? document.querySelector<HTMLElement>(`[data-fk-node-id="${esc}"]`)
  el?.focus()
}

export function NodeConfigDialog(props: NodeConfigDialogProps) {
  const { onSave, catalog = nodeKindCatalog } = props
  const l = useLabels(nodeConfigDialogLabels, props.labels)
  // The overlay is portalled outside the host's dir; the body carries the reading direction.
  const { direction } = useFlowLocale()
  useSyncExternalStore(catalog.subscribe, catalog.getVersion, catalog.getVersion)
  const active = useActiveDialog<NodeConfigPayload>('node-config')
  const stack = useDialogStack()
  const editor = useOptionalFlowEditorStore()
  const render = useRenderCatalog()
  const bodyRef = useRef<HTMLDivElement>(null)

  const payload = active?.payload ?? null
  const entry = payload ? catalog.entry(payload.kind) : undefined

  useEffect(() => {
    if (payload && !entry) console.warn(`NodeConfigDialog: no catalog entry for node kind "${payload.kind}"; the host must install the node catalog.`)
  }, [payload, entry])

  if (!payload || !entry) return null
  const { nodeId } = payload

  const close = () => {
    stack.close()
    editor?.actions.setEditingNode(null)
    requestAnimationFrame(() => focusCanvasNode(nodeId))
  }
  const save = (config: Record<string, unknown>) => {
    onSave(nodeId, config)
    close()
  }
  const formKind: FormKind = entry.formKind ?? 'schema'
  const common = { onSave: save, onCancel: close }
  const Icon = render.icon(payload.kind)
  const title = l.titles[payload.kind] ?? entry.label ?? humaniseKey(payload.kind)

  if (formKind === 'datasource') {
    const Form = asForm(DataSourceNodeForm)
    return (
      <Form
        open
        value={payload.config}
        sources={props.dataSources ?? []}
        loadTables={props.loadTables ?? (() => Promise.resolve([]))}
        loadColumns={props.loadColumns ?? (() => Promise.resolve([]))}
        {...common}
      />
    )
  }

  let form: ReactNode
  switch (formKind) {
    case 'compute': {
      const Form = asForm(ComputeNodeForm)
      form = <Form value={payload.config} references={payload.references} {...(props.runDryRun ? { onDryRun: props.runDryRun } : {})} {...common} />
      break
    }
    case 'simulation': {
      const Form = asForm(SimulationNodeForm)
      form = <Form value={payload.config} references={payload.references} {...common} />
      break
    }
    case 'start': {
      const Form = asForm(StartNodeForm)
      form = <Form config={payload.config} {...common} />
      break
    }
    case 'agent': {
      const Form = asForm(AgentNodeForm)
      form = <Form config={payload.config} agents={props.agents} loadAgents={props.loadAgents} agentsHref={props.agentsHref ?? ''} {...common} />
      break
    }
    case 'rule': {
      const Form = asForm(RuleNodeForm)
      form = <Form value={payload.config} rules={props.rules} loadRules={props.loadRules} onManageRules={props.onManageRules ?? (() => {})} {...common} />
      break
    }
    case 'report-output': {
      const Form = asForm(ReportOutputNodeForm)
      form = <Form value={payload.config} {...common} />
      break
    }
    case 'group': {
      const Form = asForm(GroupNodeForm)
      form = <Form value={payload.config} {...common} />
      break
    }
    case 'decision': {
      const Form = asForm(DecisionNodeForm)
      form = <Form value={payload.config} references={payload.references} providers={props.providers} models={props.models} {...common} />
      break
    }
    default: {
      const Form = asForm(SchemaConfigForm)
      form = <Form value={payload.config} schema={entry.configSchema ?? {}} {...common} />
    }
  }

  // Ctrl/Cmd+Enter: press the form's save control (marked by the form, else its primary button).
  const submitShortcut = () => {
    const body = bodyRef.current
    const save = body?.querySelector<HTMLButtonElement>('[data-fk-form-save]') ?? body?.querySelector<HTMLButtonElement>('button[data-variant="primary"]')
    if (save && !save.disabled && save.getAttribute('aria-disabled') !== 'true') save.click()
  }

  return (
    <SectionedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) close()
      }}
      title={title}
      subtitle={payload.label}
      eyebrow={l.eyebrow}
      icon={<Icon />}
      tone={render.tone(payload.kind)}
      onSubmitShortcut={submitShortcut}
      className="fk-node-config-dialog"
    >
      <div ref={bodyRef} className="fk-node-config-dialog__body" data-form-kind={formKind} dir={direction}>
        {catalog.isExperimental(payload.kind) ? (
          <InlineNotice tone="warning" urgency="none">
            {l.experimental}
          </InlineNotice>
        ) : null}
        {form}
      </div>
    </SectionedModal>
  )
}
