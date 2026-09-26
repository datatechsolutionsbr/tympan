// FlowSwitcherBar: the person's flows above the editor. Each flow is a button
// (aria-current on the open one) followed by its own delete button, never
// nested. Arrow keys move between flow buttons. Below 640 px: a select.

import { useRef, type KeyboardEvent } from 'react'
import { CircleCheck, PencilLine, Plus, Trash2 } from 'lucide-react'
import { Button, NativeSelect, Skeleton, StatusPill, useMediaQuery } from '@fakhir/ui'
import { formatRelative } from '../internal/format'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export interface FlowSummary {
  id: string
  name: string
  version: number
  isDraft: boolean
  updatedAt?: string | Date
}

export interface FlowSwitcherLabels {
  bar: string
  draft: string
  published: string
  newFlow: string
  delete: string
  loading: string
  version: string
  select: string
}

export const flowSwitcherLabels = defineLabels<FlowSwitcherLabels>('FlowSwitcherBar', {
  en: { bar: 'Flows', draft: 'Draft', published: 'Published', newFlow: 'New flow', delete: 'Delete flow {name}', loading: 'Loading flows', version: 'v{version}', select: 'Open flow' },
  'pt-BR': { bar: 'Fluxos', draft: 'Rascunho', published: 'Publicado', newFlow: 'Novo fluxo', delete: 'Excluir o fluxo {name}', loading: 'Carregando os fluxos', version: 'v{version}', select: 'Abrir fluxo' },
  es: { bar: 'Flujos', draft: 'Borrador', published: 'Publicado', newFlow: 'Nuevo flujo', delete: 'Eliminar el flujo {name}', loading: 'Cargando los flujos', version: 'v{version}', select: 'Abrir flujo' },
})
export const defaultFlowSwitcherLabels: FlowSwitcherLabels = flowSwitcherLabels.bundles.en

export interface FlowSwitcherBarProps {
  flows: FlowSummary[]
  activeFlowId: string | null
  isLoading: boolean
  onSelect: (flow: FlowSummary) => void
  onCreate: () => void
  onDelete: (id: string, name: string) => void
  labels?: Partial<FlowSwitcherLabels>
  /** Reference time for relative dates (tests). */
  now?: Date
  className?: string
}

export function FlowSwitcherBar({ flows, activeFlowId, isLoading, onSelect, onCreate, onDelete, labels, now, className }: FlowSwitcherBarProps) {
  const l = useLabels(flowSwitcherLabels, labels)
  const { locale } = useFlowLocale()
  const narrow = !useMediaQuery('(min-width: 640px)', true)
  const listRef = useRef<HTMLUListElement>(null)
  const canDelete = flows.length > 1

  if (isLoading) {
    return (
      <nav className={['fk-flow-switcher', className].filter(Boolean).join(' ')} aria-label={l.bar} aria-busy="true">
        <span role="status" className="fk-visually-hidden">
          {l.loading}
        </span>
        <div className="fk-flow-switcher__skeletons" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} shape="rect" width="160px" />
          ))}
        </div>
      </nav>
    )
  }

  if (narrow) {
    const active = flows.find((f) => f.id === activeFlowId)
    return (
      <nav className={['fk-flow-switcher', className].filter(Boolean).join(' ')} aria-label={l.bar} data-narrow="">
        <NativeSelect
          label={l.select}
          options={flows.map((f) => ({ value: f.id, label: `${f.name} · ${fill(l.version, { version: f.version }, locale)}` }))}
          value={activeFlowId ?? ''}
          onChange={(id) => {
            const f = flows.find((x) => x.id === id)
            if (f) onSelect(f)
          }}
        />
        {active && canDelete ? <Button variant="quiet" iconOnly accessibleLabel={fill(l.delete, { name: active.name }, locale)} leadingIcon={<Trash2 />} onPress={() => onDelete(active.id, active.name)} /> : null}
        <Button variant="secondary" leadingIcon={<Plus />} onPress={onCreate}>
          {l.newFlow}
        </Button>
      </nav>
    )
  }

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const buttons = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-flow-button]') ?? [])]
    const at = buttons.indexOf(document.activeElement as HTMLElement)
    if (at < 0) return
    e.preventDefault()
    const rtl = getComputedStyle(listRef.current!).direction === 'rtl'
    const forward = (e.key === 'ArrowRight') !== rtl
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (at + (forward ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return (
    <nav className={['fk-flow-switcher', className].filter(Boolean).join(' ')} aria-label={l.bar}>
      <ul className="fk-flow-switcher__list" ref={listRef} onKeyDown={onKeyDown}>
        {flows.map((f) => {
          const current = f.id === activeFlowId
          const when = f.updatedAt ? formatRelative(f.updatedAt, locale, now) : ''
          return (
            <li key={f.id} className="fk-flow-switcher__item" data-current={current || undefined}>
              <button type="button" className="fk-flow-switcher__flow" data-flow-button="" aria-current={current ? 'page' : undefined} onClick={() => onSelect(f)}>
                <span className="fk-flow-switcher__name">{f.name}</span>
                <span className="fk-flow-switcher__meta">
                  <code className="fk-flow-switcher__version">{fill(l.version, { version: f.version }, locale)}</code>
                  {when ? <time dateTime={new Date(f.updatedAt!).toISOString()}>{when}</time> : null}
                </span>
              </button>
              <StatusPill
                status={f.isDraft ? 'draft' : 'published'}
                size="small"
                statusMap={{
                  draft: { label: l.draft, tone: 'warning', icon: <PencilLine /> },
                  published: { label: l.published, tone: 'success', icon: <CircleCheck /> },
                }}
              />
              {canDelete ? (
                <Button className="fk-flow-switcher__delete" variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.delete, { name: f.name }, locale)} leadingIcon={<Trash2 />} onPress={() => onDelete(f.id, f.name)} />
              ) : null}
            </li>
          )
        })}
      </ul>
      <Button variant="secondary" leadingIcon={<Plus />} onPress={onCreate}>
        {l.newFlow}
      </Button>
    </nav>
  )
}
