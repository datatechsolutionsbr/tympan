// Everything that is not a full canvas: forms, expressions, run inspection,
// and an assistant answer rendered as a report block.
import { ExpressionsSection } from '../sections/ExpressionsSection'
import { FormsSection } from '../sections/FormsSection'
import { RunSection } from '../sections/RunSection'
import { AssistantVisualBlock, parseAssistantVisual } from '../../../src'

// Sample data only: neutral categories and counts.
const envelope = parseAssistantVisual({
  type: 'bar',
  titulo: 'Gráfico de exemplo',
  dados: [
    { categoria: 'A', valor: 4 },
    { categoria: 'B', valor: 7 },
    { categoria: 'C', valor: 5 },
  ],
})

export function ComponentsPage() {
  return (
    <div className="ty-gallery-sections">
      <p className="ty-gallery-section">Dados de exemplo / Sample data: every name and value on this page is a neutral placeholder.</p>
      <section className="ty-gallery-section" aria-labelledby="g-assistant">
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
