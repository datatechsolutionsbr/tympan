// Renderers of the typed report sections, looked up by `kind`.
import type { ReactNode } from 'react'
import type { ChartsGeoMessages } from '../../internal/messages/charts-geo'
import { ActorChip, type ActorKind } from '../actor-chip/ActorChip'
import { InlineNotice } from '../inline-notice/InlineNotice'
import { StatusPill } from '../status-pill/StatusPill'
import type { ReportSection } from './types'

export interface SectionContext {
  copy: ChartsGeoMessages['report']
  number: (v: number) => string
  money: (v: number, currency?: string) => string
  renderMarkdown?: (source: string) => ReactNode
  renderInputRequest?: (data: ReportSection) => ReactNode
  renderRegionMap?: (data: ReportSection) => ReactNode
}

type Renderer = (data: ReportSection, ctx: SectionContext) => ReactNode

const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const rows = (v: unknown): Array<Record<string, unknown>> => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [])
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Key/value list shared by several kinds. */
function Pairs({ pairs }: { pairs: Array<[string, ReactNode]> }) {
  const shown = pairs.filter(([, v]) => v !== '' && v !== null && v !== undefined)
  if (!shown.length) return null
  return (
    <dl className="fk-report__pairs">
      {shown.map(([k, v]) => (
        <div key={k} className="fk-report__pair">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function fieldPairs(fields: unknown): Array<[string, ReactNode]> {
  if (Array.isArray(fields)) return rows(fields).map((f) => [text(f.label), text(f.value)])
  if (fields && typeof fields === 'object') return Object.entries(fields as Record<string, unknown>).map(([k, v]) => [k, text(v)])
  return []
}

const entity: Renderer = (d) => (
  <>
    {d.status ? <StatusPill status={text(d.status)} label={text(d.statusLabel ?? d.status)} tone="neutral" size="small" /> : null}
    {d.subtitle ? <p className="fk-report__muted">{text(d.subtitle)}</p> : null}
    <Pairs pairs={fieldPairs(d.fields)} />
  </>
)

const narrative: Renderer = (d, ctx) => {
  const actor = d.actor && typeof d.actor === 'object' ? (d.actor as { kind?: ActorKind; name?: string }) : null
  const seconds = num(d.durationSeconds)
  return (
    <>
      {actor?.name || seconds !== null ? (
        <div className="fk-report__byline">
          {actor?.name ? <ActorChip kind={actor.kind ?? 'agent'} name={actor.name} compact /> : null}
          {seconds !== null ? <span className="fk-report__muted">{ctx.copy.duration(seconds)}</span> : null}
        </div>
      ) : null}
      {text(d.text ?? d.body)
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="fk-report__prose">
            {para}
          </p>
        ))}
    </>
  )
}

const lifecycle: Renderer = (d, ctx) => (
  <ol className="fk-report__steps">
    {rows(d.steps).map((step, i) => {
      const state = (['complete', 'current', 'upcoming'] as const).find((s) => s === step.state) ?? 'upcoming'
      return (
        <li key={i} className="fk-report__step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="fk-report__step-label">{text(step.label)}</span>
          <span className="fk-report__step-state">{ctx.copy.lifecycle[state]}</span>
        </li>
      )
    })}
  </ol>
)

const receipt: Renderer = (d, ctx) => {
  const c = ctx.copy.receipt
  const cur = typeof d.currency === 'string' ? d.currency : undefined
  const money = (v: unknown) => (num(v) === null ? '' : ctx.money(num(v)!, cur))
  const lines = rows(d.items)
  return (
    <>
      <table className="fk-report__receipt">
        <thead>
          <tr>
            <th scope="col">{c.description}</th>
            <th scope="col" data-numeric="">{c.quantity}</th>
            <th scope="col" data-numeric="">{c.unitPrice}</th>
            <th scope="col" data-numeric="">{c.total}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const q = num(l.quantity)
            const unit = num(l.unitPrice)
            const total = num(l.total) ?? (q !== null && unit !== null ? q * unit : null)
            return (
              <tr key={i}>
                <td>{text(l.description)}</td>
                <td data-numeric="">{q === null ? '' : ctx.number(q)}</td>
                <td data-numeric="">{money(unit)}</td>
                <td data-numeric="">{money(total)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pairs
        pairs={[
          [c.subtotal, money(d.subtotal)],
          [c.tax, money(d.tax)],
          [c.grandTotal, money(d.total)],
        ]}
      />
    </>
  )
}

const approval: Renderer = (d, ctx) => {
  const a = ctx.copy.approval
  const decision = (['approved', 'rejected', 'pending'] as const).find((x) => x === d.decision) ?? 'pending'
  const tone = decision === 'approved' ? 'success' : decision === 'rejected' ? 'danger' : 'warning'
  return (
    <>
      <div className="fk-report__byline">
        <StatusPill status={decision} tone={tone} label={a[decision]} />
        {d.by ? <span className="fk-report__muted">{a.by(text(d.by))}</span> : null}
        {d.at ? <span className="fk-report__muted fk-report__mono">{text(d.at)}</span> : null}
      </div>
      <Pairs
        pairs={[
          [a.reason, text(d.reason)],
          [a.prompt, text(d.prompt)],
        ]}
      />
    </>
  )
}

const documentKind: Renderer = (d, ctx) => {
  const c = ctx.copy.document
  const mono = (v: unknown) => (v ? <span className="fk-report__mono">{text(v)}</span> : '')
  return (
    <>
      <Pairs
        pairs={[
          [c.identifier, mono(d.identifier)],
          [c.accessKey, mono(d.accessKey)],
          [c.number, mono(d.number)],
          [c.series, mono(d.series)],
          [c.environment, text(d.environment)],
        ]}
      />
      {typeof d.href === 'string' ? (
        <a className="fk-report__link" href={d.href}>
          {c.open}
        </a>
      ) : null}
    </>
  )
}

const feed: Renderer = (d) => (
  <ul className="fk-report__feed">
    {rows(d.entries).map((e, i) => (
      <li key={i} className="fk-report__feed-entry" data-tone={text(e.tone) || 'default'}>
        <span className="fk-report__mono fk-report__muted">{text(e.at)}</span>
        <span>{text(e.text)}</span>
      </li>
    ))}
  </ul>
)

const score: Renderer = (d, ctx) => {
  const value = Math.max(0, Math.min(100, num(d.score) ?? 0))
  const label = text(d.label)
  return (
    <>
      <div className="fk-report__score">
        <span className="fk-report__score-value">{ctx.copy.score.outOf(value)}</span>
        {d.bucket ? <span className="fk-report__muted">{text(d.bucket)}</span> : null}
      </div>
      <meter className="fk-report__meter" min={0} max={100} value={value} aria-label={label || ctx.copy.score.outOf(value)} />
      {d.reasoning ? <Pairs pairs={[[ctx.copy.score.reasoning, text(d.reasoning)]]} /> : null}
    </>
  )
}

const note: Renderer = (d) => {
  const tone = text(d.tone)
  const body = text(d.text ?? d.body)
  if (tone === 'danger' || tone === 'warning' || tone === 'info' || tone === 'success') return <InlineNotice tone={tone}>{body}</InlineNotice>
  return <p className="fk-report__note">{body}</p>
}

const markdown: Renderer = (d, ctx) => {
  const source = text(d.markdown ?? d.text)
  return ctx.renderMarkdown ? ctx.renderMarkdown(source) : narrative({ kind: 'narrative', text: source }, ctx)
}

const regionMap: Renderer = (d, ctx) => {
  if (ctx.renderRegionMap) return ctx.renderRegionMap(d)
  return (
    <ul className="fk-report__feed">
      {rows(d.items).map((item, i) => (
        <li key={i} className="fk-report__feed-entry">
          <span className="fk-report__mono">{text(item.code)}</span>
          <span>{text(item.label ?? item.name)}</span>
        </li>
      ))}
    </ul>
  )
}

const inputRequest: Renderer = (d, ctx) => {
  if (ctx.renderInputRequest) return ctx.renderInputRequest(d)
  const fields = rows(d.fields)
  return (
    <div className="fk-report__request" data-readonly="">
      <p className="fk-report__muted">{ctx.copy.inputRequestPending}</p>
      <p className="fk-report__prose">{text(d.prompt)}</p>
      {fields.length ? (
        <ul className="fk-report__field-list">
          {fields.map((f, i) => (
            <li key={i}>{text(f.label ?? f.name)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

const unknown: Renderer = (d, ctx) => {
  let raw = ''
  try {
    raw = JSON.stringify(d, null, 2)
  } catch {
    raw = String(d.kind)
  }
  return (
    <div className="fk-report__note" data-unknown="">
      <p>{ctx.copy.unknownSection(text(d.kind))}</p>
      <pre className="fk-report__raw">{raw}</pre>
    </div>
  )
}

const RENDERERS: Record<string, Renderer> = {
  entity,
  narrative,
  lifecycle,
  receipt,
  approval,
  document: documentKind,
  feed,
  score,
  note,
  markdown,
  regionMap,
  inputRequest,
}

/** The renderer for a section kind; unknown kinds get the neutral note. */
export function rendererFor(kind: unknown): Renderer {
  return (typeof kind === 'string' && Object.hasOwn(RENDERERS, kind) ? RENDERERS[kind] : undefined) ?? unknown
}
