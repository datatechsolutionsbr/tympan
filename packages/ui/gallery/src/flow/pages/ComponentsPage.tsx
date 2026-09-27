// Everything that is not a full canvas: forms, expressions, run inspection,
// and an assistant answer rendered as a report block.
import { ExpressionsSection } from '../sections/ExpressionsSection'
import { FormsSection } from '../sections/FormsSection'
import { RunSection } from '../sections/RunSection'
import { AssistantVisualBlock, parseAssistantVisual } from '../../../../src/flow'

// Sample data only: fictional days above the PM2.5 limit in Vila Aurora.
const envelope = parseAssistantVisual({
  type: 'bar',
  titulo: 'Dias acima do limite de PM2.5 (dados fictícios)',
  dados: [
    { categoria: 'Centro', valor: 12 },
    { categoria: 'Porto', valor: 31 },
    { categoria: 'Parque', valor: 7 },
  ],
})

export function ComponentsPage() {
  return (
    <div className="ty-flow-gallery-sections">
      <p className="ty-flow-gallery-section">Dados de exemplo / Sample data: every name and value on this page is fictional (Vila Aurora air-quality study).</p>
      <section className="ty-flow-gallery-section" aria-labelledby="g-assistant">
        <h2 id="g-assistant">Assistant answer</h2>
        <p>Dados de exemplo / Sample data</p>
        {envelope ? <AssistantVisualBlock envelope={envelope} locale="pt-BR" /> : null}
      </section>
      <RunSection />
      <FormsSection />
      <ExpressionsSection />
    </div>
  )
}
