import { useState } from 'react'
import { Button, FakhirProvider } from '@fakhir/design-system'
import { DataSourceNodeForm, DecisionNodeForm, OutputSchemaBuilder, ReportOutputNodeForm, StartNodeForm, type OutputSchema } from '../../../src'

const noop = () => {}
const sources = [
  { id: 'census', name: 'Censo IA gov · edição 2026-09-20', dialect: 'PostgreSQL' },
  { id: 'coding', name: 'Planilhas de codificação', dialect: 'SQLite' },
]
const tables = ['records', 'assertions', 'retrievals']
const columns = [
  { name: 'record_id', type: 'text' },
  { name: 'country', type: 'text' },
  { name: 'stage', type: 'integer' },
  { name: 'proof_state', type: 'text' },
]

/** Node configuration forms with research-census data, in English, Portuguese and Arabic (RTL). */
export function FormsSection() {
  const [dsOpen, setDsOpen] = useState(false)
  const [schema, setSchema] = useState<OutputSchema | Record<string, unknown> | undefined>({ type: 'object', properties: { position: { type: 'string' }, confidence: { type: 'number' } }, required: ['position'] })
  return (
    <section className="fk-gallery-section" aria-labelledby="forms-title">
      <h2 id="forms-title">Node forms</h2>
      <h3>Decision step (B-002)</h3>
      <DecisionNodeForm
        value={{ kind: 'decision', input: { ref: 'assertion.value' }, options: [{ value: 'confirmed_primary', label: 'Confirmed, primary source' }, { value: 'confirmed_secondary', label: 'Confirmed, secondary source' }, { value: 'not_confirmed', label: 'Not confirmed' }], provider: 'p1', model: 'm1', modelVersion: '2026-09-01', threshold: 0.7 }}
        references={['assertion.value', 'retrieval.text']}
        providers={[{ id: 'p1', name: 'Provider A' }]}
        models={[{ id: 'm1', name: 'Model one', provider: 'p1' }]}
        onSave={noop}
        onCancel={noop}
      />
      <h3>Report output</h3>
      <ReportOutputNodeForm value={{ report: { sections: [{ type: 'figures', data: { items: [{ label: 'Casos', value: 94 }, { label: 'Estágios 3 e 4', value: 37 }] } }] } }} onSave={noop} onCancel={noop} />
      <h3>Output schema</h3>
      <OutputSchemaBuilder value={schema} onChange={setSchema} />
      <h3>Data source</h3>
      <Button onPress={() => setDsOpen(true)}>Configure data source</Button>
      <DataSourceNodeForm
        open={dsOpen}
        value={{ sourceId: 'census', table: 'records', columns: ['record_id', 'stage'], filters: [{ column: 'country', operator: 'in', value: ['AE', 'EE', 'GB'] }], outputVariable: 'records', limit: 500 }}
        sources={sources}
        loadTables={() => Promise.resolve(tables)}
        loadColumns={() => Promise.resolve(columns)}
        onSave={() => setDsOpen(false)}
        onCancel={() => setDsOpen(false)}
      />
      <h3>Português</h3>
      <FakhirProvider locale="pt-BR">
        <StartNodeForm config={{ inputVariables: ['edicao', 'pais'], inputDefaults: { edicao: '2026-09-20' } }} onSave={noop} onCancel={noop} />
      </FakhirProvider>
      <h3>العربية (RTL)</h3>
      <FakhirProvider locale="ar">
        <div dir="rtl" lang="ar">
          <DecisionNodeForm value={{ kind: 'decision', input: { ref: 'assertion.value' }, options: [{ value: 'confirmed', label: 'مؤكد' }, { value: 'not_confirmed', label: 'غير مؤكد' }] }} onSave={noop} onCancel={noop} />
        </div>
      </FakhirProvider>
    </section>
  )
}
