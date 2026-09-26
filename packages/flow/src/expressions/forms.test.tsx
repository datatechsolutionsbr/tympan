import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { ExpressionCatalogProvider } from './catalogContext'
import { ComputeNodeForm } from './ComputeNodeForm'
import { exampleExpressionCatalog } from './exampleCatalog'
import { defaultRuleActions, defineRuleAction } from './ruleActions'
import { normalizeRuleCondition } from './ruleCondition'
import { defaultRule, RuleActionBuilder, RuleEditor, type RuleAction, type RuleValue } from './RuleEditor'
import { RuleNodeForm } from './RuleNodeForm'
import { SimulationNodeForm } from './SimulationNodeForm'

const withCatalog = (ui: React.ReactNode) => <ExpressionCatalogProvider catalog={exampleExpressionCatalog}>{ui}</ExpressionCatalogProvider>

async function toText() {
  await userEvent.click(screen.getAllByRole('radio', { name: 'Structured text' })[0]!)
}

describe('ComputeNodeForm', () => {
  const value = { kind: 'compute', expression: { operation: 'count', list: { ref: 'inputs' } } }

  it('disables save and names the parse problem for unreadable text', async () => {
    render(withCatalog(<ComputeNodeForm value={value} onSave={() => {}} onCancel={() => {}} />))
    await toText()
    const area = screen.getByRole('textbox', { name: /Expression/ })
    fireEvent.change(area, { target: { value: '{ nope' } })
    expect(screen.getByText(/could not be read/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('reports an operation outside the catalog', async () => {
    render(withCatalog(<ComputeNodeForm value={value} onSave={() => {}} onCancel={() => {}} />))
    await toText()
    fireEvent.change(screen.getByRole('textbox', { name: /Expression/ }), { target: { value: '{"operation":"teleport"}' } })
    expect(screen.getByText('teleport is not an operation of the engine.')).toBeInTheDocument()
  })

  it('inserts a reference at the caret and keeps focus in the editor', async () => {
    render(withCatalog(<ComputeNodeForm value={value} references={['record']} onSave={() => {}} onCancel={() => {}} />))
    await toText()
    const area = screen.getByRole('textbox', { name: /Expression/ }) as HTMLTextAreaElement
    fireEvent.change(area, { target: { value: '{"operation":"count","list":}' } })
    area.setSelectionRange(28, 28)
    await userEvent.click(screen.getByRole('radio', { name: 'References' }))
    await userEvent.click(screen.getByRole('button', { name: 'record' }))
    expect(area.value).toBe('{"operation":"count","list":{"ref":"record"}}')
    await waitFor(() => expect(area).toHaveFocus())
  })

  it('has no test panel without a dry-run callback', () => {
    render(withCatalog(<ComputeNodeForm value={value} onSave={() => {}} onCancel={() => {}} />))
    expect(screen.queryByRole('button', { name: 'Test with sample data' })).toBeNull()
  })

  it('refuses unreadable samples without calling the dry run, then shows the trace after a run and keeps it across modes', async () => {
    const onDryRun = vi.fn(() => Promise.resolve({ result: 3, trace: { trace: { kind: 'operation' as const, label: 'count', result: 3 }, truncated: false, frameCount: 1, frameLimit: 100 } }))
    render(withCatalog(<ComputeNodeForm value={value} onDryRun={onDryRun} onSave={() => {}} onCancel={() => {}} />))
    await userEvent.click(screen.getByRole('button', { name: 'Test with sample data' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Sample flow inputs/ }), { target: { value: '{bad' } })
    await userEvent.click(screen.getByRole('button', { name: 'Run test' }))
    expect(onDryRun).not.toHaveBeenCalled()
    expect(screen.getByText(/sample data could not be read/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: /Sample flow inputs/ }), { target: { value: '{"a":1}' } })
    await userEvent.click(screen.getByRole('button', { name: 'Run test' }))
    expect(await screen.findByRole('treegrid')).toBeInTheDocument()
    await toText()
    expect(screen.getByRole('treegrid')).toBeInTheDocument()
  })

  it('drops obsolete script keys on save', async () => {
    const onSave = vi.fn()
    const { container } = render(withCatalog(<ComputeNodeForm value={{ ...value, script: 'x()', language: 'js' }} onSave={onSave} onCancel={() => {}} />))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0]).not.toHaveProperty('script')
    expect(onSave.mock.calls[0]![0]).not.toHaveProperty('language')
    await expectNoAxeViolations(container)
  })
})

describe('SimulationNodeForm', () => {
  it('wraps a bare number in a first-non-empty operation', () => {
    const onSave = vi.fn()
    render(withCatalog(<SimulationNodeForm value={{ runs: 500 }} onSave={onSave} onCancel={() => {}} />))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0].runs).toEqual({ operation: 'coalesce', values: [{ value: 500 }] })
  })

  it('offers state, run index and step index as reference chips in the step field', () => {
    render(withCatalog(<SimulationNodeForm value={{ step: { ref: 'state' } }} onSave={() => {}} onCancel={() => {}} />))
    const step = screen.getAllByRole('group', { name: 'Step transition' })[0]!
    for (const r of ['state', 'run_index', 'step_index']) expect(within(step).getAllByRole('button', { name: r }).length).toBeGreaterThan(0)
  })

  it('rejects tracking text that is not a list', () => {
    render(withCatalog(<SimulationNodeForm value={{}} onSave={() => {}} onCancel={() => {}} />))
    fireEvent.change(screen.getByRole('textbox', { name: /Tracked values/ }), { target: { value: '{"a":1}' } })
    expect(screen.getByText('Tracked values must be a list.')).toBeInTheDocument()
  })

  it('saves the four expressions and the tracking list, keeping other keys', () => {
    const onSave = vi.fn()
    render(withCatalog(<SimulationNodeForm value={{ runs: 10, steps: 5, initialState: 0, step: { ref: 'state' }, tracking: ['state'], seed: 7 }} onSave={onSave} onCancel={() => {}} />))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const saved = onSave.mock.calls[0]![0]
    expect(saved).toMatchObject({ kind: 'simulation', seed: 7, tracking: ['state'] })
    for (const k of ['runs', 'steps', 'initialState', 'step']) expect(saved[k].operation).toBe('coalesce')
  })

  it('emits the last valid expression while the text does not parse', async () => {
    const onSave = vi.fn()
    render(withCatalog(<SimulationNodeForm value={{ runs: 3 }} onSave={onSave} onCancel={() => {}} />))
    await toText()
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Number of runs' })[0]!, { target: { value: '{ broken' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave.mock.calls[0]![0].runs).toEqual({ operation: 'coalesce', values: [{ value: 3 }] })
  })
})

function RuleHarness({ initial, onChange, ...rest }: { initial?: RuleValue; onChange?: (r: RuleValue) => void } & Partial<React.ComponentProps<typeof RuleEditor>>) {
  const [rule, setRule] = useState<RuleValue>(initial ?? defaultRule())
  return withCatalog(
    <RuleEditor
      {...rest}
      value={rule}
      onChange={(r) => {
        setRule(r)
        onChange?.(r)
      }}
    />,
  )
}

describe('RuleEditor', () => {
  it('starts from a default rule', () => {
    const r = defaultRule()
    expect(r).toMatchObject({ name: '', enabled: true, priority: 0, status: 'active', action: { kind: 'set-value' } })
    expect(r.condition).toMatchObject({ operation: 'compare', op: 'eq' })
    expect(defaultRule([]).action.kind).toBe('custom')
  })

  it('normalises a legacy comparison into a compare tree shown by the builder', () => {
    const tree = normalizeRuleCondition({ field: 'x', operator: 'equals', value: 3 })
    expect(tree).toEqual({ operation: 'compare', op: 'eq', left: { ref: 'x' }, right: { value: 3 } })
    render(<RuleHarness initial={{ ...defaultRule(), condition: tree }} />)
    expect(screen.getAllByText('compare').length).toBeGreaterThan(0)
  })

  it('turns a legacy truthy test into an "and" of three inequalities, and a non-object into never-matches', () => {
    const t = normalizeRuleCondition({ field: 'x', truthy: true }) as { operation: string; conditions: Array<{ op: string }> }
    expect(t.operation).toBe('and')
    expect(t.conditions.map((c) => c.op)).toEqual(['ne', 'ne', 'ne'])
    expect(normalizeRuleCondition('nonsense')).toEqual({ value: false })
  })

  it('reads custom parameter values as numbers when they look like one', async () => {
    const onChange = vi.fn()
    render(<RuleHarness initial={{ ...defaultRule(), action: { kind: 'custom', params: {} } }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add parameter' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Key' }), 'limit')
    await userEvent.type(screen.getAllByRole('textbox', { name: 'Value' }).at(-1)!, '5')
    expect(onChange.mock.calls.at(-1)![0].action.params).toEqual({ limit: 5 })
  })

  it('stores valid-from as the matching UTC instant', async () => {
    const onChange = vi.fn()
    render(<RuleHarness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Advanced' }))
    fireEvent.change(screen.getByLabelText('Valid from'), { target: { value: '2026-09-20T14:02' } })
    expect(onChange.mock.calls.at(-1)![0].validFrom).toBe(new Date('2026-09-20T14:02').toISOString())
  })

  it('opens the advanced section when tags exist', () => {
    render(<RuleHarness initial={{ ...defaultRule(), tags: ['census'] }} />)
    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('has headings for condition and action and no axe violations', async () => {
    const { container } = render(<RuleHarness />)
    expect(screen.getByRole('heading', { name: /Condition/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Action/ })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('uses Portuguese strings and keeps working in RTL', async () => {
    render(
      <FakhirProvider locale="pt-BR">
        <div dir="rtl">
          <RuleHarness />
        </div>
      </FakhirProvider>,
    )
    expect(screen.getByRole('textbox', { name: /Nome/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Avançado' }))
    expect(screen.getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-expanded', 'true')
  })
})

function ActionHarness(props: Partial<React.ComponentProps<typeof RuleActionBuilder>> & { initial: RuleAction; spy?: (a: RuleAction) => void }) {
  const { initial, spy, ...rest } = props
  const [a, setA] = useState(initial)
  return (
    <RuleActionBuilder
      {...rest}
      value={a}
      onChange={(n) => {
        setA(n)
        spy?.(n)
      }}
    />
  )
}

describe('RuleActionCatalog', () => {
  it('lists the seven generic kinds in order with custom last', () => {
    render(<ActionHarness initial={{ kind: 'set-value' }} />)
    const labels = within(screen.getByRole('combobox', { name: /Action/ }))
      .getAllByRole('option')
      .map((o) => o.textContent).filter((t) => t !== 'Select…')
    expect(labels).toEqual(['Set value', 'Add tag', 'Request review', 'Notify', 'Route', 'Stop', 'Custom'])
  })

  it('offers only the host kind when allowCustom is false', () => {
    const host = defineRuleAction({ kind: 'flag-source', labelKey: 'Flag source', params: [] })
    render(<ActionHarness initial={{ kind: 'flag-source' }} actionCatalog={[host]} allowCustom={false} />)
    expect(within(screen.getByRole('combobox', { name: /Action/ })).getAllByRole('option').map((o) => o.textContent).filter((t) => t !== 'Select…')).toEqual(['Flag source'])
  })

  it('blocks saving when a choice has no options (request review without roles)', () => {
    const onValidate = vi.fn()
    render(<ActionHarness initial={{ kind: 'request-review' }} onValidate={onValidate} />)
    expect(screen.getByText(/nothing to choose for Role/)).toBeInTheDocument()
    expect(onValidate.mock.calls.at(-1)![0]).toContainEqual({ key: 'role', code: 'noOptions' })
  })

  it('stores Set value text as a number for a numeric target', async () => {
    const spy = vi.fn()
    render(<ActionHarness initial={{ kind: 'set-value', params: { target: 'score', value: '' } }} references={['score']} referenceTypes={{ score: 'number' }} spy={spy} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Value' }), '5')
    expect(spy.mock.calls.at(-1)![0].params.value).toBe(5)
  })

  it('shows an unknown stored kind read-only with a notice', () => {
    render(<ActionHarness initial={{ kind: 'discount', params: { percent: 10 } }} />)
    expect(screen.getByText(/not available here/)).toBeInTheDocument()
    expect(screen.getByText('percent')).toBeInTheDocument()
  })

  it('throws on a duplicate key', () => {
    expect(() => defineRuleAction({ kind: 'notify', labelKey: 'x', params: [] })).toThrow(/already exists/)
    expect(() => defineRuleAction({ kind: 'k', labelKey: 'x', params: [{ key: 'a', labelKey: 'a', type: 'text' }, { key: 'a', labelKey: 'a', type: 'text' }] })).toThrow(/twice/)
    expect(defaultRuleActions).toHaveLength(6)
  })

  it('resets parameters when the kind changes', async () => {
    const spy = vi.fn()
    render(<ActionHarness initial={{ kind: 'notify', params: { recipient: 'coder', message: 'hi' } }} actionContext={{ branches: [{ value: 'b1', label: 'Branch one' }] }} spy={spy} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Action/ }), 'route')
    expect(spy.mock.calls.at(-1)![0]).toEqual({ kind: 'route', params: { branch: '' } })
  })
})

describe('RuleNodeForm', () => {
  const rules = [
    { id: 'r1', name: 'Confirmed only', condition: { operation: 'and', conditions: [{}, {}] } },
    { id: 'r2', name: 'Stage filter' },
  ]

  it('does not load when rules are given', () => {
    const loadRules = vi.fn()
    render(<RuleNodeForm value={{}} rules={rules} loadRules={loadRules} onManageRules={() => {}} onSave={() => {}} onCancel={() => {}} />)
    expect(loadRules).not.toHaveBeenCalled()
  })

  it('lists loaded rules as "name (id)"', async () => {
    render(<RuleNodeForm value={{}} loadRules={() => Promise.resolve(rules)} onManageRules={() => {}} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('Loading rules')).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: 'Confirmed only (r1)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Stage filter (r2)' })).toBeInTheDocument()
  })

  it('shows the load error text', async () => {
    render(<RuleNodeForm value={{}} loadRules={() => Promise.reject(new Error('offline'))} onManageRules={() => {}} onSave={() => {}} onCancel={() => {}} />)
    expect(await screen.findByText(/offline/)).toBeInTheDocument()
  })

  it('migrates a legacy inline condition to a reference on save', async () => {
    const onSave = vi.fn()
    const { container } = render(<RuleNodeForm value={{ condition: { field: 'x' } }} rules={rules} onManageRules={() => {}} onSave={onSave} onCancel={() => {}} />)
    expect(screen.getByText(/still has an inline condition/)).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Saved rule' }), 'r1')
    expect(screen.getByText('and with 2 clauses')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'rule', ruleId: 'r1', enabled: true })
    await expectNoAxeViolations(container)
  })

  it('says "New rule" for an empty list and calls onManageRules once', async () => {
    const onManageRules = vi.fn()
    render(<RuleNodeForm value={{}} rules={[]} onManageRules={onManageRules} onSave={() => {}} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'New rule' }))
    expect(onManageRules).toHaveBeenCalledTimes(1)
  })

  it('saves enabled false when the step switch is off', async () => {
    const onSave = vi.fn()
    render(<RuleNodeForm value={{ ruleId: 'r1' }} rules={rules} onManageRules={() => {}} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('switch', { name: /Step active/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'rule', ruleId: 'r1', enabled: false })
  })

  it('ignores a late response after unmount', async () => {
    let resolve: (v: typeof rules) => void = () => {}
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = render(<RuleNodeForm value={{}} loadRules={() => new Promise((r) => (resolve = r))} onManageRules={() => {}} onSave={() => {}} onCancel={() => {}} />)
    unmount()
    resolve(rules)
    await Promise.resolve()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
