// FlowOutline: the keyboard and screen-reader alternative to the canvas. Every
// step in reading order (rank, then position), with its outgoing connections,
// and every editing operation as an ordinary button or menu: add, configure,
// connect ("Connect to…"), remove a connection, move earlier or later, delete.

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Crosshair, Link2, Pencil, Trash2, Unlink } from 'lucide-react'
import { ActionMenu, Button, NativeSelect } from '@fakhir/ui'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowConnector, FlowNode } from '../model/types'
import { flowReadingOrder } from './FlowPreview'
import { nodeName, nodeTitle } from './nodeBridge'

export interface FlowOutlineLabels {
  outline: string
  steps: string
  empty: string
  addKind: string
  add: string
  configure: string
  connect: string
  noTargets: string
  disconnect: string
  moveUp: string
  moveDown: string
  delete: string
  show: string
  leadsTo: string
  branch: string
  count: string
}

export const flowOutlineLabels = defineLabels<FlowOutlineLabels>('FlowOutline', {
  en: {
    outline: 'Flow as a list',
    steps: 'Steps in reading order',
    empty: 'This flow has no steps yet.',
    addKind: 'Step to add',
    add: 'Add step',
    configure: 'Configure {name}',
    connect: 'Connect {name} to',
    noTargets: 'No step can receive a connection from here',
    disconnect: 'Remove connection from {source} to {target}',
    moveUp: 'Move {name} earlier',
    moveDown: 'Move {name} later',
    delete: 'Delete {name}',
    show: 'Show {name} on the canvas',
    leadsTo: 'Leads to',
    branch: '{branch} branch',
    count: '{count, plural, one {# step} other {# steps}}',
  },
  'pt-BR': {
    outline: 'Fluxo como lista',
    steps: 'Passos em ordem de leitura',
    empty: 'Este fluxo ainda não tem passos.',
    addKind: 'Passo a adicionar',
    add: 'Adicionar passo',
    configure: 'Configurar {name}',
    connect: 'Conectar {name} a',
    noTargets: 'Nenhum passo pode receber uma conexão daqui',
    disconnect: 'Remover a conexão de {source} para {target}',
    moveUp: 'Mover {name} para antes',
    moveDown: 'Mover {name} para depois',
    delete: 'Excluir {name}',
    show: 'Mostrar {name} no canvas',
    leadsTo: 'Leva a',
    branch: 'ramo {branch}',
    count: '{count, plural, one {# passo} other {# passos}}',
  },
  es: {
    outline: 'Flujo como lista',
    steps: 'Pasos en orden de lectura',
    empty: 'Este flujo aún no tiene pasos.',
    addKind: 'Paso para añadir',
    add: 'Añadir paso',
    configure: 'Configurar {name}',
    connect: 'Conectar {name} con',
    noTargets: 'Ningún paso puede recibir una conexión desde aquí',
    disconnect: 'Quitar la conexión de {source} a {target}',
    moveUp: 'Mover {name} antes',
    moveDown: 'Mover {name} después',
    delete: 'Eliminar {name}',
    show: 'Mostrar {name} en el lienzo',
    leadsTo: 'Lleva a',
    branch: 'rama {branch}',
    count: '{count, plural, one {# paso} other {# pasos}}',
  },
})
export const defaultFlowOutlineLabels: FlowOutlineLabels = flowOutlineLabels.bundles.en

export interface FlowOutlineProps {
  nodes: FlowNode[]
  connectors: FlowConnector[]
  /** Kinds the "add" picker offers. */
  addableKinds?: Array<{ kind: string; label: string }>
  locked?: boolean
  horizontal?: boolean
  canConnect: (source: FlowNode, target: FlowNode) => boolean
  onAdd?: (kind: string) => void
  onConfigure?: (id: string) => void
  onConnect?: (sourceId: string, targetId: string) => void
  onDisconnect?: (connectorId: string) => void
  /** Swap with the neighbour before (-1) or after (+1) in reading order. */
  onMove?: (id: string, towards: -1 | 1) => void
  onDelete?: (id: string) => void
  onShow?: (id: string) => void
  labels?: Partial<FlowOutlineLabels>
  className?: string
}

export function FlowOutline(props: FlowOutlineProps) {
  const { nodes, connectors, addableKinds = [], locked = false, horizontal = false, canConnect } = props
  const l = useLabels(flowOutlineLabels, props.labels)
  const { locale } = useFlowLocale()
  const catalog = useRenderCatalog()
  const [kindToAdd, setKindToAdd] = useState(addableKinds[0]?.kind ?? '')
  const ordered = useMemo(() => flowReadingOrder(nodes, connectors, horizontal), [nodes, connectors, horizontal])
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edit = !locked

  return (
    <section className={['fk-flow-outline', props.className].filter(Boolean).join(' ')} aria-label={l.outline}>
      {edit && props.onAdd && addableKinds.length ? (
        <div className="fk-flow-outline__add">
          <NativeSelect label={l.addKind} options={addableKinds.map((k) => ({ value: k.kind, label: k.label }))} value={kindToAdd} onChange={setKindToAdd} />
          <Button variant="secondary" onPress={() => kindToAdd && props.onAdd?.(kindToAdd)}>
            {l.add}
          </Button>
        </div>
      ) : null}
      <h3 className="fk-flow-outline__title">
        {l.steps} <span className="fk-flow-outline__count">{fill(l.count, { count: ordered.length }, locale)}</span>
      </h3>
      {ordered.length === 0 ? <p className="fk-flow-outline__empty">{l.empty}</p> : null}
      <ol className="fk-flow-outline__list">
        {ordered.map((n, i) => {
          const name = nodeName(n, catalog)
          const title = nodeTitle(n, catalog)
          const out = connectors.filter((c) => c.source === n.id)
          const targets = edit ? ordered.filter((t) => t.id !== n.id && !out.some((c) => c.target === t.id) && canConnect(n, t)) : []
          return (
            <li key={n.id} className="fk-flow-outline__item" data-kind={n.kind}>
              <div className="fk-flow-outline__row">
                <span className="fk-flow-outline__bubble" data-tone={catalog.tone(n.kind)} aria-hidden="true" />
                <span className="fk-flow-outline__name">{name}</span>
                <div className="fk-flow-outline__actions">
                  {props.onShow ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.show, { name: title }, locale)} leadingIcon={<Crosshair />} onPress={() => props.onShow!(n.id)} /> : null}
                  {edit && props.onConfigure ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.configure, { name: title }, locale)} leadingIcon={<Pencil />} onPress={() => props.onConfigure!(n.id)} /> : null}
                  {edit && props.onConnect && n.kind !== 'note' ? (
                    <ActionMenu
                      label={fill(l.connect, { name: title }, locale)}
                      trigger={<Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.connect, { name: title }, locale)} leadingIcon={<Link2 />} />}
                      items={targets.length ? targets.map((t) => ({ id: t.id, label: nodeName(t, catalog) })) : [{ id: '__none', label: l.noTargets, disabled: true }]}
                      onAction={(id) => {
                        if (id !== '__none') props.onConnect!(n.id, id)
                      }}
                    />
                  ) : null}
                  {edit && props.onMove ? (
                    <>
                      <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.moveUp, { name: title }, locale)} leadingIcon={<ArrowUp />} disabled={i === 0} onPress={() => props.onMove!(n.id, -1)} />
                      <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.moveDown, { name: title }, locale)} leadingIcon={<ArrowDown />} disabled={i === ordered.length - 1} onPress={() => props.onMove!(n.id, 1)} />
                    </>
                  ) : null}
                  {edit && props.onDelete ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.delete, { name: title }, locale)} leadingIcon={<Trash2 />} onPress={() => props.onDelete!(n.id)} /> : null}
                </div>
              </div>
              {out.length ? (
                <ul className="fk-flow-outline__links" aria-label={`${l.leadsTo}: ${title}`}>
                  {out.map((c) => {
                    const t = byId.get(c.target)
                    if (!t) return null
                    const tTitle = nodeTitle(t, catalog)
                    const branch = c.label ?? c.sourcePort
                    return (
                      <li key={c.id} className="fk-flow-outline__link">
                        <span>
                          {l.leadsTo} {nodeName(t, catalog)}
                          {branch && branch !== 'out' ? <span className="fk-flow-outline__branch"> · {fill(l.branch, { branch }, locale)}</span> : null}
                        </span>
                        {edit && props.onDisconnect ? (
                          <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.disconnect, { source: title, target: tTitle }, locale)} leadingIcon={<Unlink />} onPress={() => props.onDisconnect!(c.id)} />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
