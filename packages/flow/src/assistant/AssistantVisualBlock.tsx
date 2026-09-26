// AssistantVisualBlock: a parsed visual answer drawn with the same ReportView
// as reports, or a flow card with an "open in canvas" action.

import { useId } from 'react'
import { Workflow } from 'lucide-react'
import { useLocale } from 'react-aria-components'
import { Button } from '@fakhir/design-system'
import { defineLabels, fill, useLabels } from '../internal/labels'
import { ReportView } from '../report/ReportView'
import { envelopeToReport, type VisualEnvelope } from './visual'

export interface AssistantVisualBlockLabels {
  open: string
  flow: string
}

export const assistantVisualBlockLabels = defineLabels<AssistantVisualBlockLabels>('AssistantVisualBlock', {
  en: { open: 'Open {title} in canvas', flow: 'Flow' },
  'pt-BR': { open: 'Abrir {title} no canvas', flow: 'Fluxo' },
  es: { open: 'Abrir {title} en el lienzo', flow: 'Flujo' },
})

export const defaultAssistantVisualBlockLabels: AssistantVisualBlockLabels = assistantVisualBlockLabels.bundles.en

export interface AssistantVisualBlockProps {
  envelope: VisualEnvelope
  /** Honoured only for flow graph payloads. */
  onOpen?: () => void
  locale?: string
  /** ISO 4217 code from the project settings; needed only for currency values. */
  currency?: string
  /** Country used by region maps that do not name one. */
  defaultCountry?: string
  labels?: Partial<AssistantVisualBlockLabels>
  className?: string
}

export function AssistantVisualBlock({ envelope, onOpen, locale, currency, defaultCountry, labels, className }: AssistantVisualBlockProps) {
  const l = useLabels(assistantVisualBlockLabels, labels)
  const provider = useLocale()
  const loc = locale ?? provider.locale
  const titleId = useId()
  const cls = ['fk-visual-block', className].filter(Boolean).join(' ')

  if (envelope.type === 'flow') {
    return (
      <figure className={cls} data-type="flow" aria-labelledby={titleId}>
        <figcaption className="fk-visual-block__flow">
          <Workflow className="fk-visual-block__flow-icon" aria-hidden="true" focusable="false" />
          <span className="fk-visual-block__flow-text">
            <span className="fk-visual-block__flow-kind">{l.flow}</span>
            <span id={titleId} className="fk-visual-block__title" dir="auto">
              {envelope.title}
            </span>
          </span>
          {onOpen ? (
            <Button variant="secondary" size="compact" onPress={onOpen}>
              {fill(l.open, { title: envelope.title }, loc)}
            </Button>
          ) : null}
        </figcaption>
      </figure>
    )
  }

  const spec = envelopeToReport(envelope, defaultCountry ? { defaultCountry } : {})
  return (
    <figure className={cls} data-type={envelope.type} aria-labelledby={titleId}>
      <figcaption id={titleId} className="fk-visually-hidden">
        {envelope.title}
      </figcaption>
      <ReportView spec={spec} locale={loc} {...(currency ? { currency } : {})} headingLevel={3} />
    </figure>
  )
}
