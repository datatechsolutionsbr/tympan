import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/ui'
import { expectNoAxeViolations } from '../../test/axe'
import { NodeKindCatalogStore } from '../catalog/kindCatalog'
import { createDialogStack, DialogStackProvider, type NodeConfigPayload } from '../state/dialogStack'
import { FlowEditorStateProvider } from '../state/editorState'
import { NodeConfigDialog } from './NodeConfigDialog'

// The forms are built by sibling groups; stand-ins show which one was chosen.
function fakeForm(name: string) {
  return function FakeForm(props: { onSave: (c: Record<string, unknown>) => void; onCancel: () => void; onDryRun?: unknown }) {
    return (
      <div data-testid={`form-${name}`}>
        <label>
          {name} field
          <input />
        </label>
        {props.onDryRun ? <button type="button">Dry run</button> : null}
        <button type="button" onClick={props.onCancel}>
          Cancel
        </button>
        <button type="button" data-fk-form-save="" onClick={() => props.onSave({ kind: name, x: 1 })}>
          Save
        </button>
      </div>
    )
  }
}
vi.mock('../expressions', () => ({ ComputeNodeForm: fakeForm('compute'), SimulationNodeForm: fakeForm('simulation'), RuleNodeForm: fakeForm('rule') }))
vi.mock('../forms', () => ({
  SchemaConfigForm: fakeForm('schema'),
  StartNodeForm: fakeForm('start'),
  AgentNodeForm: fakeForm('agent'),
  ReportOutputNodeForm: fakeForm('report-output'),
  GroupNodeForm: fakeForm('group'),
  DecisionNodeForm: fakeForm('decision'),
  DataSourceNodeForm: fakeForm('datasource'),
}))

function catalog() {
  const c = new NodeKindCatalogStore()
  c.install([
    { kind: 'code', label: 'Compute', category: 'Data', formKind: 'compute' },
    { kind: 'http', label: 'Web request', category: 'Data', configSchema: { properties: { url: { type: 'string' } } } },
    { kind: 'beta', label: 'Beta step', category: 'Data', experimental: true },
  ])
  return c
}

function setup(payload: Partial<NodeConfigPayload> & { kind: string }, extra: Record<string, unknown> = {}, locale?: string) {
  const stack = createDialogStack()
  const onSave = vi.fn()
  const store = catalog()
  const Wrap = ({ children }: { children: ReactNode }) => (
    <FakhirProvider {...(locale ? { locale } : {})}>
      <FlowEditorStateProvider>
        <DialogStackProvider stack={stack}>{children}</DialogStackProvider>
      </FlowEditorStateProvider>
    </FakhirProvider>
  )
  const view = render(
    <Wrap>
      <div data-fk-node-id="n1">
        <button type="button" data-fk-node-focus="">
          node n1
        </button>
      </div>
      <NodeConfigDialog onSave={onSave} catalog={store} {...extra} />
    </Wrap>,
  )
  act(() => stack.open('node-config', { nodeId: 'n1', label: 'Sum of cases', config: { kind: payload.kind }, references: [], ...payload }))
  return { ...view, stack, onSave }
}

afterEach(() => vi.restoreAllMocks())

describe('NodeConfigDialog', () => {
  it('shows the compute form for a compute node', async () => {
    const { baseElement } = setup({ kind: 'code' })
    expect(screen.getByTestId('form-compute')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /Compute/ })).toHaveAccessibleDescription('Sum of cases')
    await expectNoAxeViolations(baseElement)
  })

  it('shows a schema-generated form when the catalog form kind is schema (default)', () => {
    setup({ kind: 'http' })
    expect(screen.getByTestId('form-schema')).toBeInTheDocument()
  })

  it('warns above the form for an experimental kind', () => {
    setup({ kind: 'beta' })
    const warning = screen.getByText(/experimental/)
    const form = screen.getByTestId('form-schema')
    expect(warning.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('passes the node id and the saved config to onSave', async () => {
    const { onSave } = setup({ kind: 'code' })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('n1', { kind: 'compute', x: 1 })
  })

  it('hides the dry run without a runner and shows it with one', () => {
    setup({ kind: 'code' })
    expect(screen.queryByRole('button', { name: 'Dry run' })).toBeNull()
  })

  it('offers the dry run when a runner is supplied', () => {
    setup({ kind: 'code' }, { runDryRun: vi.fn() })
    expect(screen.getByRole('button', { name: 'Dry run' })).toBeInTheDocument()
  })

  it('returns focus to the edited node when it closes', async () => {
    setup({ kind: 'code' })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await act(() => new Promise((r) => requestAnimationFrame(() => r(null))))
    expect(screen.getByRole('button', { name: 'node n1' })).toHaveFocus()
  })

  it('saves with Ctrl+Enter from inside the form', async () => {
    const { onSave } = setup({ kind: 'code' })
    screen.getByRole('textbox').focus()
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(onSave).toHaveBeenCalledWith('n1', { kind: 'compute', x: 1 })
  })

  it('renders nothing and warns for a kind the catalog does not know', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setup({ kind: 'mystery' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('uses the built-in pt-BR and es strings', () => {
    setup({ kind: 'code' }, {}, 'pt-BR')
    expect(screen.getByText('Configuração do passo')).toBeInTheDocument()
  })

  it('uses the built-in es strings', () => {
    setup({ kind: 'code' }, {}, 'es')
    expect(screen.getByText('Configuración del paso')).toBeInTheDocument()
  })

  it('lays the form out right to left in Arabic', () => {
    setup({ kind: 'code' }, {}, 'ar')
    expect(screen.getByTestId('form-compute').closest('[dir]')).toHaveAttribute('dir', 'rtl')
  })
})
