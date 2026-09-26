// ProvenanceTree: the keyboard and screen-reader alternative to the canvas
// (APG Tree View through React Aria Tree). Same subgraph, same selection:
// the focus item is the root; its children are what it came from (back) or
// what was made from it (ahead), each row saying the relation in words.
// Up/Down move, Right/Left expand/collapse (mirrored in RTL by React Aria),
// Home/End jump, Enter/Space select.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button as AriaButton, Tree, TreeItem, TreeItemContent, type Key, type Selection } from 'react-aria-components'
import { ChevronRight } from 'lucide-react'
import { ActorChip, ProofBadge } from '@fakhir/design-system'
import { FALLBACK_KIND_ICONS, resolveIcon } from '../catalog/icons'
import { kindTone } from '../catalog/palette'
import type { HopDirection } from '../model/graph'
import type { ProvenanceLabels } from './labels'
import { proofKeyOf, provenanceTree, treeKeys, type ProvTreeRow, type ProvView } from './model'
import { itemAccessibleName } from './ProvenanceNode'

export interface ProvenanceTreeProps {
  view: ProvView
  focusId: string | null
  direction: HopDirection
  selectedId: string | null
  onSelect: (id: string) => void
  labels: ProvenanceLabels
  locale?: string
  className?: string
}

export function ProvenanceTree({ view, focusId, direction, selectedId, onSelect, labels: l, locale, className }: ProvenanceTreeProps) {
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
    return (
      <TreeItem key={row.key} id={row.key} textValue={via ? `${via}: ${text}` : text} className="fk-prov-tree__item">
        <TreeItemContent>
          {({ hasChildItems, isExpanded }) => (
            <div className="fk-prov-tree__row" data-expanded={isExpanded || undefined}>
              {hasChildItems ? (
                <AriaButton slot="chevron" className="fk-prov-tree__chevron">
                  <ChevronRight aria-hidden="true" focusable="false" />
                </AriaButton>
              ) : (
                <span className="fk-prov-tree__spacer" aria-hidden="true" />
              )}
              {Icon && vertex.type === 'item' ? (
                <span className="fk-prov-tree__bubble" data-tone={kindTone(vertex.item.kind)} aria-hidden="true">
                  <Icon focusable="false" />
                </span>
              ) : null}
              <span className="fk-prov-tree__text">
                {via ? <span className="fk-prov-tree__via">{via}</span> : null}
                <span className="fk-prov-tree__kind">{vertex.type === 'item' ? l.kinds[vertex.item.kind] : l.actorKinds[vertex.actor.kind]}</span>
                <span className="fk-prov-tree__title">{vertex.type === 'item' ? vertex.item.title : vertex.actor.name}</span>
              </span>
              {vertex.type === 'item' ? (
                <span className="fk-prov-tree__facts">
                  <ProofBadge state={vertex.item.proofState ?? null} size="inline" label={l.proof[proofKeyOf(vertex.item)]} />
                  {vertex.item.actor ? <ActorChip kind={vertex.item.actor.kind} name={vertex.item.actor.name} compact /> : null}
                </span>
              ) : null}
            </div>
          )}
        </TreeItemContent>
        {row.children.map(renderRow)}
      </TreeItem>
    )
  }

  return (
    <Tree
      aria-label={l.treeName}
      className={['fk-prov-tree', className].filter(Boolean).join(' ')}
      selectionMode="single"
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={(keys: Selection) => {
        if (keys === 'all') return
        const [first] = [...keys]
        if (first !== undefined) onSelect(lastId(String(first)))
      }}
      expandedKeys={expanded}
      onExpandedChange={setExpanded}
      renderEmptyState={() => <p className="fk-prov-tree__empty">{l.noMatches}</p>}
    >
      {rows.map(renderRow)}
    </Tree>
  )
}

/** Row keys are paths ("a/b/c"); the item id is the last segment. */
function lastId(key: string): string {
  const i = key.lastIndexOf('/')
  return i < 0 ? key : key.slice(i + 1)
}
