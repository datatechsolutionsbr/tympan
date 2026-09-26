// ProvenanceTree: the keyboard and screen-reader alternative to the canvas
// (APG Tree View through React Aria Tree). Same subgraph, same selection:
// the focus item is the root; its children are what it came from (back) or
// what was made from it (ahead), each row saying the relation in words.
// Up/Down move, Right/Left expand/collapse (mirrored in RTL by React Aria),
// Home/End jump, Enter/Space select.

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Button as AriaButton, Radio, RadioGroup, Tree, TreeItem, TreeItemContent, type Key, type Selection } from 'react-aria-components'
import { ChevronRight } from 'lucide-react'
import { useControllable } from '../internal/useControllable'
import { fill } from '../internal/labels'
import { FALLBACK_KIND_ICONS, resolveIcon } from '../catalog/icons'
import type { HopDirection } from '../model/graph'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, provenanceTree, treeKeys, type ProvTreeRow, type ProvView } from './model'
import { ActorMark, HashCheck, itemAccessibleName, showsProof } from './ProvenanceNode'

export interface ProvenanceTreeProps {
  view: ProvView
  focusId: string | null
  /** 'backward' lists where the focus came from; 'forward' where it was used. */
  way?: 'backward' | 'forward'
  defaultWay?: 'backward' | 'forward'
  onWayChange?: (way: 'backward' | 'forward') => void
  selectedId: string | null
  onSelect: (id: string) => void
  /** Enter on a row: show that node in the graph. */
  onOpenInGraph?: (id: string) => void
  labels: ProvenanceLabels
  locale?: string
  className?: string
}

export function ProvenanceTree({ view, focusId, selectedId, onSelect, onOpenInGraph, labels: l, locale, className, ...rest }: ProvenanceTreeProps) {
  const [way, setWay] = useControllable<'backward' | 'forward'>(rest.way, rest.defaultWay ?? 'backward', rest.onWayChange)
  const direction: HopDirection = focusId ? way : 'forward'
  const rows = useMemo(() => provenanceTree(view, focusId, direction), [view, focusId, direction])
  const allKeys = useMemo(() => treeKeys(rows), [rows])
  const [expanded, setExpanded] = useState<Set<Key>>(() => new Set(allKeys))
  // A new query opens every row again.
  useEffect(() => setExpanded(new Set(allKeys)), [allKeys])

  const byId = useMemo(() => new Map(view.vertices.map((v) => [v.id, v])), [view])
  const selectedKey = useMemo(() => (selectedId ? allKeys.find((k) => lastId(k) === selectedId) : undefined), [allKeys, selectedId])

  const renderRow = (row: ProvTreeRow): ReactNode => {
    const vertex = byId.get(row.id)
    if (!vertex) return null
    const via = row.via ? (row.via.way === 'back' ? l.relations[row.via.relation] : l.relationsReversed[row.via.relation]) : null
    const text = vertex.type === 'item' ? itemAccessibleName(vertex.item, l, locale) : `${l.actorKinds[vertex.actor.kind]}: ${vertex.actor.name}`
    const Icon = vertex.type === 'item' ? resolveIcon(FALLBACK_KIND_ICONS[vertex.item.kind]) : null
    const meta = vertex.type === 'item' ? vertex.item.meta?.[0] : undefined
    const proofWord = vertex.type === 'item' && showsProof(vertex.item) ? l.proof[proofKeyOf(vertex.item)] : undefined
    return (
      <TreeItem key={row.key} id={row.key} textValue={via ? `${via}: ${text}` : text} className="fk-prov-tree__item" style={({ level }) => ({ '--fk-tree-level': level }) as CSSProperties}>
        <TreeItemContent>
          {({ hasChildItems }) => (
            <div className="fk-prov-tree__row">
              {hasChildItems ? (
                <AriaButton slot="chevron" className="fk-prov-tree__chevron">
                  <ChevronRight aria-hidden="true" focusable="false" />
                </AriaButton>
              ) : (
                <span className="fk-prov-tree__spacer" aria-hidden="true" />
              )}
              {Icon ? <Icon className="fk-prov-tree__icon" aria-hidden="true" focusable="false" /> : <span className="fk-prov-tree__icon" aria-hidden="true" />}
              <span className="fk-prov-tree__text">
                <span className="fk-prov-tree__line">
                  {via ? <span className="fk-visually-hidden">{via} </span> : null}
                  <span className="fk-prov-tree__kind">{vertex.type === 'item' ? l.kinds[vertex.item.kind] : l.actorKinds[vertex.actor.kind]}</span>
                  <span className="fk-prov-tree__title" dir="auto">
                    {vertex.type === 'item' ? vertex.item.title : vertex.actor.name}
                  </span>
                </span>
                {meta || proofWord ? (
                  <span className="fk-prov-tree__meta">
                    {meta ? <code dir="ltr">{meta}</code> : null}
                    {meta && proofWord ? ' · ' : null}
                    {proofWord ?? null}
                  </span>
                ) : null}
              </span>
              {vertex.type === 'item' && vertex.item.actor ? <ActorMark actor={vertex.item.actor} className="fk-prov-tree__actor" /> : null}
              {vertex.type === 'item' && vertex.item.hashCheck ? <HashCheck state={vertex.item.hashCheck} labels={l} /> : null}
            </div>
          )}
        </TreeItemContent>
        {row.children.map(renderRow)}
      </TreeItem>
    )
  }

  const counts = useMemo(() => {
    const items = view.vertices.flatMap((v) => (v.type === 'item' ? [v.item] : []))
    const actors = new Set(items.flatMap((i) => (i.actor ? [`${i.actor.kind}:${i.actor.name}`] : [])))
    return { nodes: view.vertices.length, actors: actors.size, hashes: items.filter((i) => i.hashCheck === 'match').length }
  }, [view])

  return (
    <div className="fk-prov-tree-wrap">
    <div className="fk-prov-tree__bar">
      {focusId ? (
        <RadioGroup className="fk-prov-tree__way" aria-label={l.treeWay} orientation="horizontal" value={way} onChange={(v) => setWay(v as 'backward' | 'forward')}>
          <Radio value="backward" className="fk-prov-chip fk-prov-tree__way-option">
            {l.treeBackward}
          </Radio>
          <Radio value="forward" className="fk-prov-chip fk-prov-tree__way-option">
            {l.treeForward}
          </Radio>
        </RadioGroup>
      ) : null}
      <span className="fk-prov__spacer" />
      <p className="fk-prov-tree__count">{fill(l.treeCount, counts, locale)}</p>
    </div>
    <Tree
      aria-label={l.treeName}
      className={['fk-prov-tree', className].filter(Boolean).join(' ')}
      selectionMode="single"
      selectionBehavior={onOpenInGraph ? 'replace' : 'toggle'}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={(keys: Selection) => {
        if (keys === 'all') return
        const [first] = [...keys]
        if (first !== undefined) onSelect(lastId(String(first)))
      }}
      expandedKeys={expanded}
      onExpandedChange={setExpanded}
      renderEmptyState={() => <p className="fk-prov-tree__empty">{l.noMatches}</p>}
      {...(onOpenInGraph ? { onAction: (key: Key) => onOpenInGraph(lastId(String(key))) } : {})}
    >
      {rows.map(renderRow)}
    </Tree>
    <p className="fk-prov-tree__hint">{onOpenInGraph ? l.treeKeys : null}</p>
    </div>
  )
}

/** Row keys are paths ("a/b/c"); the item id is the last segment. */
function lastId(key: string): string {
  const i = key.lastIndexOf('/')
  return i < 0 ? key : key.slice(i + 1)
}
