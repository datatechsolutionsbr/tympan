import { useState } from 'react'
import { Button, TympanProvider } from '../../../../src'
import { DataSourceNodeForm, DecisionNodeForm, OutputSchemaBuilder, ReportOutputNodeForm, StartNodeForm, type OutputSchema } from '../../../../src/flow'

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

/** Node configuration forms with neutral sample data, in English, Portuguese and Arabic (RTL). */
export function FormsSection() {
  const [dsOpen, setDsOpen] = useState(false)
  const [schema, setSchema] = useState<OutputSchema | Record<string, unknown> | undefined>({ type: 'object', properties: { position: { type: 'string' }, confidence: { type: 'number' } }, required: ['position'] })
  return (
    <section className="ty-flow-gallery-section" aria-labelledby="forms-title">
      <h2 id="forms-title">Node forms</h2>
      <h3>Decision step (B-002)</h3>
      <DecisionNodeForm
        value={{ kind: 'decision', input: { ref: 'item.value' }, options: [{ value: 'option_a', label: 'Option A' }, { value: 'option_b', label: 'Option B' }, { value: 'option_c', label: 'Option C' }], provider: 'p1', model: 'm1', modelVersion: '[version]', threshold: 0.7 }}
        references={['item.value', 'item.text']}
        providers={[{ id: 'p1', name: 'Provider A' }]}
        models={[{ id: 'm1', name: 'Model one', provider: 'p1' }]}
        onSave={noop}
        onCancel={noop}
      />
      <h3>Report output</h3>
      <ReportOutputNodeForm value={{ report: { sections: [{ type: 'figures', data: { items: [{ label: 'Valor A', value: 12 }, { label: 'Valor B', value: 30 }] } }] } }} onSave={noop} onCancel={noop} />
      <h3>Output schema</h3>
      <OutputSchemaBuilder value={schema} onChange={setSchema} />
      <h3>Data source</h3>
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
      <h3>Português</h3>
      <TympanProvider locale="pt-BR">
        <StartNodeForm config={{ inputVariables: ['edicao', 'grupo'], inputDefaults: { edicao: '[edição]' } }} onSave={noop} onCancel={noop} />
      </TympanProvider>
      <h3>العربية (RTL)</h3>
      <TympanProvider locale="ar">
        <div dir="rtl" lang="ar">
          <DecisionNodeForm value={{ kind: 'decision', input: { ref: 'item.value' }, options: [{ value: 'option_a', label: 'الخيار أ' }, { value: 'option_b', label: 'الخيار ب' }] }} onSave={noop} onCancel={noop} />
        </div>
      </TympanProvider>
    </section>
  )
}
