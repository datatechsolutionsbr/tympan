import { useState } from 'react'
import { Button, TympanProvider } from '../../../../src'
import { DataSourceNodeForm, DecisionNodeForm, OutputSchemaBuilder, ReportOutputNodeForm, StartNodeForm, type OutputSchema } from '../../../../src/flow'
import { Section } from '../../Section'

const noop = () => {}
const sources = [
  { id: 'source-a', name: 'Fonte de dados A', dialect: 'PostgreSQL' },
  { id: 'source-b', name: 'Fonte de dados B', dialect: 'SQLite' },
]
const tables = ['tabela_a', 'tabela_b', 'tabela_c']
const columns = [
  { name: 'col_a', type: 'text' },
  { name: 'col_b', type: 'text' },
  { name: 'col_c', type: 'integer' },
  { name: 'col_d', type: 'text' },
]

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, background: 'var(--ty-surface)', border: '1px solid var(--ty-line)', borderRadius: 'var(--ty-radius-card)', padding: 'var(--ty-space-4)' }}>
      {children}
    </div>
  )
}

export function FormsSection() {
  const [dsOpen, setDsOpen] = useState(false)
  const [schema, setSchema] = useState<OutputSchema | Record<string, unknown> | undefined>({ type: 'object', properties: { position: { type: 'string' }, confidence: { type: 'number' } }, required: ['position'] })
  return (
    <>
      <Section id="forms-decision" title="DecisionNodeForm">
        <Container>
          <DecisionNodeForm
            value={{ kind: 'decision', input: { ref: 'item.value' }, options: [{ value: 'option_a', label: 'Option A' }, { value: 'option_b', label: 'Option B' }, { value: 'option_c', label: 'Option C' }], provider: 'p1', model: 'm1', modelVersion: '[version]', threshold: 0.7 }}
            references={['item.value', 'item.text']}
            providers={[{ id: 'p1', name: 'Provider A' }]}
            models={[{ id: 'm1', name: 'Model one', provider: 'p1' }]}
            onSave={noop}
            onCancel={noop}
          />
        </Container>
      </Section>
      <Section id="forms-report" title="ReportOutputNodeForm">
        <Container>
          <ReportOutputNodeForm value={{ report: { sections: [{ type: 'figures', data: { items: [{ label: 'Valor A', value: 12 }, { label: 'Valor B', value: 30 }] } }] } }} onSave={noop} onCancel={noop} />
        </Container>
      </Section>
      <Section id="forms-schema" title="OutputSchemaBuilder">
        <Container>
          <OutputSchemaBuilder value={schema} onChange={setSchema} />
        </Container>
      </Section>
      <Section id="forms-datasource" title="DataSourceNodeForm">
        <Container>
          <Button onPress={() => setDsOpen(true)}>Configure data source</Button>
          <DataSourceNodeForm
            open={dsOpen}
            value={{ sourceId: 'source-a', table: 'tabela_a', columns: ['col_a', 'col_c'], filters: [{ column: 'col_b', operator: 'in', value: ['x', 'y'] }], outputVariable: 'rows', limit: 500 }}
            sources={sources}
            loadTables={() => Promise.resolve(tables)}
            loadColumns={() => Promise.resolve(columns)}
            onSave={() => setDsOpen(false)}
            onCancel={() => setDsOpen(false)}
          />
        </Container>
      </Section>
      <Section id="forms-ptbr" title="StartNodeForm">
        <TympanProvider locale="pt-BR">
          <Container>
            <StartNodeForm config={{ inputVariables: ['edicao', 'grupo'], inputDefaults: { edicao: '[edição]' } }} onSave={noop} onCancel={noop} />
          </Container>
        </TympanProvider>
      </Section>
      <Section id="forms-ar" title="DecisionNodeForm">
        <TympanProvider locale="ar">
          <div dir="rtl" lang="ar">
            <Container>
              <DecisionNodeForm value={{ kind: 'decision', input: { ref: 'item.value' }, options: [{ value: 'option_a', label: 'الخيار أ' }, { value: 'option_b', label: 'الخيار ب' }] }} onSave={noop} onCancel={noop} />
            </Container>
          </div>
        </TympanProvider>
      </Section>
    </>
  )
}
