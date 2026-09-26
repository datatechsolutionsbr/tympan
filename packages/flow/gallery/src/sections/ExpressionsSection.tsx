import { useState } from 'react'
import { TympanProvider } from '@datatechsolutions/tympan'
import { ComputeNodeForm, defaultRule, ExpressionCatalogProvider, exampleExpressionCatalog, RuleEditor, RuleNodeForm, SimulationNodeForm, TraceTree, type RuleValue } from '../../../src'

const noop = () => {}
const trace = {
  trace: {
    kind: 'operation' as const,
    label: 'count',
    args: {},
    result: 37,
    children: [{ kind: 'operation' as const, label: 'filter', result: [1, 2, 3], children: [{ kind: 'ref' as const, label: 'records', result: new Array(12).fill(0) }] }],
  },
  truncated: false,
  frameCount: 3,
  frameLimit: 500,
}

/** Expressions, rules and traces with neutral sample data, and an Arabic (RTL) rule editor. */
export function ExpressionsSection() {
  const [rule, setRule] = useState<RuleValue>({ ...defaultRule(), name: 'Sample rule', tags: ['sample'] })
  const [ruleAr, setRuleAr] = useState<RuleValue>(defaultRule())
  return (
    <ExpressionCatalogProvider catalog={exampleExpressionCatalog}>
      <section className="ty-gallery-section" aria-labelledby="expr-title">
        <h2 id="expr-title">Expressions and rules</h2>
        <h3>Compute step</h3>
        <ComputeNodeForm value={{ kind: 'compute', expression: { operation: 'count', list: { ref: 'records' } } }} references={['records', 'assertions']} onSave={noop} onCancel={noop} onDryRun={() => Promise.resolve({ result: 37, trace })} />
        <h3>Simulation step</h3>
        <SimulationNodeForm value={{ runs: 1000, steps: 12, initialState: 0, step: { ref: 'state' }, tracking: ['state'] }} onSave={noop} onCancel={noop} />
        <h3>Rule editor</h3>
        <RuleEditor value={rule} onChange={setRule} references={['inputs', 'assertion.value']} actionContext={{ roles: [{ value: 'verifier', label: 'Verifier' }], branches: [{ value: 'yes', label: 'Confirmed' }] }} />
        <h3>Rule step</h3>
        <RuleNodeForm value={{ ruleId: 'r1' }} rules={[{ id: 'r1', name: 'Only primary confirmations', condition: { operation: 'and', conditions: [{}, {}] } }]} onManageRules={noop} onSave={noop} onCancel={noop} />
        <h3>Trace</h3>
        <TraceTree report={trace} />
        <h3>العربية (RTL)</h3>
        <TympanProvider locale="ar">
          <div dir="rtl" lang="ar">
            <RuleEditor value={ruleAr} onChange={setRuleAr} />
          </div>
        </TympanProvider>
      </section>
    </ExpressionCatalogProvider>
  )
}
