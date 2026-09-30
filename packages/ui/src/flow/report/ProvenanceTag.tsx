// ProvenanceTag: a small marker (icon + node name) that carries provenance
// outside the canvas — under a KPI, beside a chart, in a report line. With
// `href` (or `onPress`) it is a link (or button) to the node's detail; plain,
// it is a labelled tag. The name is always visible text; the icon reinforces.

import { Workflow } from 'lucide-react'
import type { ReactNode } from 'react'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export interface ProvenanceTagLabels {
  /** Accessible prefix before the node name: "Provenance: {node}". */
  provenance: string
  /** Hint of a linked tag: "Open {node}". */
  open: string
}

export const provenanceTagLabels = defineLabels<ProvenanceTagLabels>('provenance-tag', {
  en: { provenance: 'Provenance', open: 'Open {node}' },
  'pt-BR': { provenance: 'Procedência', open: 'Abrir {node}' },
  es: { provenance: 'Procedencia', open: 'Abrir {node}' },
})

export interface ProvenanceTagProps {
  /** Name of the node (or actor) this value comes from. */
  nodeName: string
  /** Optional icon; defaults to the flow mark. Always aria-hidden. */
  icon?: ReactNode
  /** Makes the tag a link to the node's detail. */
  href?: string
  labels?: Partial<ProvenanceTagLabels>
  className?: string
}

export function ProvenanceTag({ nodeName, icon, href, labels, className }: ProvenanceTagProps) {
  const l = useLabels(provenanceTagLabels, labels)
  const { locale } = useFlowLocale()
  const classNames = ['ty-provenance-tag', className].filter(Boolean).join(' ')
  const body = (
    <>
      <span className="ty-provenance-tag__icon" aria-hidden="true">
        {icon ?? <Workflow focusable="false" />}
      </span>
      <span className="ty-provenance-tag__name">{nodeName}</span>
    </>
  )
  if (href) {
    return (
      <a className={classNames} href={href} aria-label={`${l.provenance}: ${fill(l.open, { node: nodeName }, locale)}`}>
        {body}
      </a>
    )
  }
  return (
    <span className={classNames} aria-label={`${l.provenance}: ${nodeName}`}>
      {body}
    </span>
  )
}
