// Everything that is not a full canvas: forms, expressions, run inspection,
// and an assistant answer rendered as a report block.
import { ExpressionsSection } from '../sections/ExpressionsSection'
import { FormsSection } from '../sections/FormsSection'
import { RunSection } from '../sections/RunSection'
import { AssistantVisualBlock, parseAssistantVisual } from '../../../src'

const envelope = parseAssistantVisual({
  type: 'bar',
  titulo: 'Casos por estágio (edição 2026-09-20)',
  dados: [
    { estagio: '1', casos: 18 },
    { estagio: '2', casos: 21 },
    { estagio: '3', casos: 19 },
    { estagio: '4', casos: 18 },
    { estagio: '5', casos: 18 },
  ],
})

export function ComponentsPage() {
  return (
    <div className="fk-gallery-sections">
      <section className="fk-gallery-section" aria-labelledby="g-assistant">
        <h2 id="g-assistant">Assistant answer</h2>
        {envelope ? <AssistantVisualBlock envelope={envelope} locale="pt-BR" /> : null}
      </section>
      <RunSection />
      <FormsSection />
      <ExpressionsSection />
    </div>
  )
}
