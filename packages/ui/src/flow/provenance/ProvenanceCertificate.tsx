// ProvenanceCertificate ("Certificado"): the obligation tree a deterministic
// verifier checked for one claim, with the verdict and the facts needed to
// reproduce it (verifier version, run time, input edition, certificate hash).

import { useMemo } from 'react'
import { Button as AriaButton, Tree, TreeItem, TreeItemContent, type Key } from 'react-aria-components'
import { Check, ChevronRight, CircleCheck, CircleX, FileDown, Hourglass, ShieldCheck } from 'lucide-react'
import { Button } from '../../index'
import { ProofPill } from './ProvenanceNode'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { ObligationStatus, ProofCertificate, ProofObligation } from './proofTypes'

export interface ProvenanceCertificateLabels {
  title: string
  tree: string
  facts: string
  verdict: string
  verifier: string
  ranAt: string
  inputEdition: string
  hash: string
  rerun: string
  rerunning: string
  download: string
  deterministic: string
  empty: string
  obligation: string
  status: Record<ObligationStatus, string>
  verdicts: Record<'proved' | 'pending' | 'refuted', string>
  obligationsTitle: string
  /** Verdict line beside the pill: how many obligations are still open. */
  openCount: string
  allHold: string
}

export const provenanceCertificateLabels = defineLabels<ProvenanceCertificateLabels>('ProvenanceCertificate', {
  en: {
    title: 'Certificate',
    tree: 'Proof obligations of the claim',
    facts: 'Certificate details',
    verdict: 'Verdict',
    verifier: 'Verifier',
    ranAt: 'Run at',
    inputEdition: 'Input edition',
    hash: 'Certificate hash',
    rerun: 'Run again',
    rerunning: 'Running',
    download: 'Download certificate',
    deterministic: 'The verifier is deterministic: the same edition and rules always give the same certificate. It uses no language model.',
    empty: 'No certificate for this item yet.',
    obligation: '{label}, {status}',
    status: { ok: 'holds', pending: 'pending', failed: 'fails' },
    verdicts: { proved: 'proved', pending: 'pending', refuted: 'refuted' },
    obligationsTitle: 'Proof obligations',
    openCount: '{pending, plural, =0 {} one {# obligation pending} other {# obligations pending}}{failed, plural, =0 {} one { · # fails} other { · # fail}}',
    allHold: 'every obligation holds',
  },
  'pt-BR': {
    title: 'Certificado',
    tree: 'Obrigações da prova da afirmação',
    facts: 'Dados do certificado',
    verdict: 'Veredito',
    verifier: 'Verificador',
    ranAt: 'Rodou em',
    inputEdition: 'Edição de entrada',
    hash: 'Hash do certificado',
    rerun: 'Rodar de novo',
    rerunning: 'Rodando',
    download: 'Baixar certificado',
    deterministic: 'O verificador é determinístico: a mesma edição e as mesmas regras dão sempre o mesmo certificado. Ele não usa modelo de linguagem.',
    empty: 'Ainda não há certificado para este item.',
    obligation: '{label}, {status}',
    status: { ok: 'cumprida', pending: 'pendente', failed: 'falhou' },
    verdicts: { proved: 'provada', pending: 'pendente', refuted: 'refutada' },
    obligationsTitle: 'Obrigações da prova',
    openCount: '{pending, plural, =0 {} one {# obrigação pendente} other {# obrigações pendentes}}{failed, plural, =0 {} one { · # falhou} other { · # falharam}}',
    allHold: 'todas as obrigações cumpridas',
  },
  es: {
    title: 'Certificado',
    tree: 'Obligaciones de prueba de la afirmación',
    facts: 'Datos del certificado',
    verdict: 'Veredicto',
    verifier: 'Verificador',
    ranAt: 'Ejecutado el',
    inputEdition: 'Edición de entrada',
    hash: 'Hash del certificado',
    rerun: 'Ejecutar de nuevo',
    rerunning: 'Ejecutando',
    download: 'Descargar certificado',
    deterministic: 'El verificador es determinista: la misma edición y las mismas reglas dan siempre el mismo certificado. No usa ningún modelo de lenguaje.',
    empty: 'Todavía no hay certificado para este elemento.',
    obligation: '{label}, {status}',
    status: { ok: 'cumplida', pending: 'pendiente', failed: 'falla' },
    verdicts: { proved: 'probada', pending: 'pendiente', refuted: 'refutada' },
    obligationsTitle: 'Obligaciones de prueba',
    openCount: '{pending, plural, =0 {} one {# obligación pendiente} other {# obligaciones pendientes}}{failed, plural, =0 {} one { · # falla} other { · # fallan}}',
    allHold: 'todas las obligaciones se cumplen',
  },
})

export const defaultProvenanceCertificateLabels = provenanceCertificateLabels.bundles.en

export interface ProvenanceCertificateProps {
  certificate: ProofCertificate | null
  onRerun?: () => void
  onDownload?: () => void
  busy?: boolean
  labels?: Partial<ProvenanceCertificateLabels>
  className?: string
}

const STATUS_ICON = { ok: CircleCheck, pending: Hourglass, failed: CircleX } as const

function allKeys(list: readonly ProofObligation[], prefix: string): string[] {
  return list.flatMap((o) => [`${prefix}/${o.id}`, ...allKeys(o.children ?? [], `${prefix}/${o.id}`)])
}

export function ProvenanceCertificate({ certificate, onRerun, onDownload, busy = false, labels, className }: ProvenanceCertificateProps) {
  const l = useLabels(provenanceCertificateLabels, labels)
  const { locale } = useFlowLocale()
  const expanded = useMemo<Key[]>(() => (certificate ? ['root', ...allKeys(certificate.obligations, 'root')] : []), [certificate])

  if (!certificate) {
    return (
      <section className={['ty-cert', className].filter(Boolean).join(' ')} aria-label={l.title}>
        <p className="ty-cert__empty">
          <ShieldCheck aria-hidden="true" focusable="false" />
          <span>{l.empty}</span>
        </p>
      </section>
    )
  }

  const open = countOpen(certificate.obligations)
  const ranAt = Number.isFinite(Date.parse(certificate.ranAt)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(Date.parse(certificate.ranAt)) : certificate.ranAt

  const obligationRow = (o: ProofObligation, key: string) => {
    const Icon = STATUS_ICON[o.status]
    return (
      <TreeItem key={key} id={key} textValue={fill(l.obligation, { label: o.label, status: l.status[o.status] }, locale)} className="ty-cert__item">
        <TreeItemContent>
          {({ hasChildItems }) => (
            <div className="ty-cert__row" data-status={o.status}>
              {hasChildItems ? (
                <AriaButton slot="chevron" className="ty-cert__chevron">
                  <ChevronRight aria-hidden="true" focusable="false" />
                </AriaButton>
              ) : (
                <span className="ty-cert__spacer" aria-hidden="true" />
              )}
              <Icon className="ty-cert__icon" aria-hidden="true" focusable="false" />
              <span className="ty-cert__text">
                <span className="ty-cert__label">{o.label}</span>
                {o.detail ? (
                  <code className="ty-cert__detail" dir="ltr">
                    {o.detail}
                  </code>
                ) : null}
              </span>
              <span className="ty-cert__status">{l.status[o.status]}</span>
            </div>
          )}
        </TreeItemContent>
        {(o.children ?? []).map((c) => obligationRow(c, `${key}/${c.id}`))}
      </TreeItem>
    )
  }

  return (
    <section className={['ty-cert', className].filter(Boolean).join(' ')} aria-label={l.title}>
      <div className="ty-cert__main">
        <h3 className="ty-cert__heading">{l.obligationsTitle}</h3>
        <Tree aria-label={l.tree} className="ty-cert__tree" defaultExpandedKeys={expanded}>
          <TreeItem id="root" textValue={`${certificate.claim}, ${l.verdicts[certificate.verdict]}`} className="ty-cert__item" data-root="">
            <TreeItemContent>
              {() => (
                <div className="ty-cert__row ty-cert__row--root" data-status={certificate.verdict === 'proved' ? 'ok' : certificate.verdict === 'refuted' ? 'failed' : 'pending'}>
                  <AriaButton slot="chevron" className="ty-cert__chevron">
                    <ChevronRight aria-hidden="true" focusable="false" />
                  </AriaButton>
                  {(() => {
                    const Icon = STATUS_ICON[certificate.verdict === 'proved' ? 'ok' : certificate.verdict === 'refuted' ? 'failed' : 'pending']
                    return <Icon className="ty-cert__icon" aria-hidden="true" focusable="false" />
                  })()}
                  <span className="ty-cert__text">
                    <span className="ty-cert__claim" dir="auto">
                      {certificate.claim}
                    </span>
                    {certificate.note ? (
                      <code className="ty-cert__detail" dir="auto">
                        {certificate.note}
                      </code>
                    ) : null}
                  </span>
                  <span className="ty-cert__status">{l.verdicts[certificate.verdict]}</span>
                </div>
              )}
            </TreeItemContent>
            {certificate.obligations.map((o) => obligationRow(o, `root/${o.id}`))}
          </TreeItem>
        </Tree>
      </div>
      <aside className="ty-cert__side" aria-label={l.facts}>
        <span className="ty-cert__eyebrow">{l.verdict}</span>
        <div className="ty-cert__verdict">
          <ProofPill state={certificate.verdict} word={l.verdicts[certificate.verdict]} />
          <span className="ty-cert__open">{open.pending || open.failed ? fill(l.openCount, open, locale) : l.allHold}</span>
        </div>
        <p className="ty-cert__note">{l.deterministic}</p>
        <dl className="ty-cert__facts">
          <div>
            <dt>{l.verifier}</dt>
            <dd className="ty-cert__mono" dir="ltr">
              {certificate.verifier}
            </dd>
          </div>
          <div>
            <dt>{l.ranAt}</dt>
            <dd className="ty-cert__mono">
              <time dateTime={certificate.ranAt}>{ranAt}</time>
            </dd>
          </div>
          <div>
            <dt>{l.inputEdition}</dt>
            <dd className="ty-cert__mono" dir="ltr">
              {certificate.inputEdition}
            </dd>
          </div>
          <div>
            <dt>{l.hash}</dt>
            <dd className="ty-cert__mono ty-cert__hash" dir="ltr">
              {certificate.hash}
            </dd>
          </div>
        </dl>
        <div className="ty-cert__actions">
          {onRerun ? (
            <Button variant="secondary" leadingIcon={<Check />} busy={busy} busyLabel={l.rerunning} onPress={onRerun}>
              {l.rerun}
            </Button>
          ) : null}
          {onDownload ? (
            <Button variant="quiet" leadingIcon={<FileDown />} onPress={onDownload}>
              {l.download}
            </Button>
          ) : null}
        </div>
      </aside>
    </section>
  )
}

/** Pending and failed obligations, at every level. */
function countOpen(list: readonly ProofObligation[]): { pending: number; failed: number } {
  return list.reduce(
    (acc, o) => {
      const inner = countOpen(o.children ?? [])
      return { pending: acc.pending + inner.pending + (o.status === 'pending' ? 1 : 0), failed: acc.failed + inner.failed + (o.status === 'failed' ? 1 : 0) }
    },
    { pending: 0, failed: 0 },
  )
}
