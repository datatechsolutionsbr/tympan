import { ExpressionsSection } from '../sections/ExpressionsSection'
import { FormsSection } from '../sections/FormsSection'
import { RunSection } from '../sections/RunSection'
import { AssistantVisualBlock, parseAssistantVisual } from '../../../../src/flow'
import { Section } from '../../Section'

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
    <>
      <Section id="g-assistant" title="AssistantVisualBlock">
        <p>Dados de exemplo / Sample data: every name and value on this page is fictional (Vila Aurora air-quality study).</p>
        {envelope ? <AssistantVisualBlock envelope={envelope} locale="pt-BR" /> : null}
      </Section>
      <RunSection />
      <FormsSection />
      <ExpressionsSection />
    </>
  )
}
