import { useState } from 'react'
import { TympanProvider } from '../../../../src'
import { ComputeNodeForm, defaultRule, ExpressionCatalogProvider, exampleExpressionCatalog, RuleEditor, RuleNodeForm, SimulationNodeForm, TraceTree, type RuleValue } from '../../../../src/flow'
import { Section } from '../../Section'

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

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 640, background: 'var(--ty-surface)', border: '1px solid var(--ty-line)', borderRadius: 'var(--ty-radius-card)', padding: 'var(--ty-space-4)' }}>
      {children}
    </div>
  )
}

export function ExpressionsSection() {
  const [rule, setRule] = useState<RuleValue>({ ...defaultRule(), name: 'Sample rule', tags: ['sample'] })
  const [ruleAr, setRuleAr] = useState<RuleValue>(defaultRule())
  return (
    <ExpressionCatalogProvider catalog={exampleExpressionCatalog}>
      <Section id="expr-compute" title="ComputeNodeForm">
        <Container>
          <ComputeNodeForm value={{ kind: 'compute', expression: { operation: 'count', list: { ref: 'records' } } }} references={['records', 'assertions']} onSave={noop} onCancel={noop} onDryRun={() => Promise.resolve({ result: 37, trace })} />
        </Container>
      </Section>
      <Section id="expr-simulation" title="SimulationNodeForm">
        <Container>
          <SimulationNodeForm value={{ runs: 1000, steps: 12, initialState: 0, step: { ref: 'state' }, tracking: ['state'] }} onSave={noop} onCancel={noop} />
        </Container>
      </Section>
      <Section id="expr-rule-editor" title="RuleEditor">
        <Container>
          <RuleEditor value={rule} onChange={setRule} references={['inputs', 'assertion.value']} actionContext={{ roles: [{ value: 'verifier', label: 'Verifier' }], branches: [{ value: 'yes', label: 'Confirmed' }] }} />
        </Container>
      </Section>
      <Section id="expr-rule-step" title="RuleNodeForm">
        <Container>
          <RuleNodeForm value={{ ruleId: 'r1' }} rules={[{ id: 'r1', name: 'Only primary confirmations', condition: { operation: 'and', conditions: [{}, {}] } }]} onManageRules={noop} onSave={noop} onCancel={noop} />
        </Container>
      </Section>
      <Section id="expr-trace" title="TraceTree">
        <Container>
          <TraceTree report={trace} />
        </Container>
      </Section>
      <Section id="expr-ar" title="RuleEditor">
        <TympanProvider locale="ar">
          <div dir="rtl" lang="ar">
            <Container>
              <RuleEditor value={ruleAr} onChange={setRuleAr} />
            </Container>
          </div>
        </TympanProvider>
      </Section>
    </ExpressionCatalogProvider>
  )
}
