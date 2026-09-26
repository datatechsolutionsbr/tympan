// ExpressionBuilder: compose a computation (or a yes/no condition) as a tree
// of operations without writing code. Each nested level is a labelled group
// ("‹operand›, level n") with an indent and a leading rail; the level number
// is text, so depth never depends on colour.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToggleButton } from 'react-aria-components'
import { Plus, Trash2 } from 'lucide-react'
import { Button, InlineNotice, ListboxSelect, SegmentedControl, Tag, TextArea, TextField } from '@fakhir/design-system'
import { fill, useFlowLocale, useLabels } from '../internal/labels'
import { useExpressionCatalog } from './catalogContext'
import { expressionBuilderLabels, type ExpressionBuilderLabels } from './labels'
import {
  EXPRESSION_FAMILIES,
  MAX_EXPRESSION_DEPTH,
  entryIdOf,
  findOperation,
  inferSlots,
  isLiteral,
  isOperation,
  isReference,
  pickerEntries,
  prettyJson,
  readLiteral,
  seedOperation,
  vocabularyOf,
  writeLiteral,
  type ExpressionCatalog,
  type ExpressionNode,
  type LoopBinding,
  type OperandSlotSpec,
  type OperationNode,
  type PickerEntry,
} from './model'

export { expressionBuilderLabels, type ExpressionBuilderLabels }
export const defaultExpressionBuilderLabels: ExpressionBuilderLabels = expressionBuilderLabels.bundles.en

export interface ExpressionBuilderProps {
  value: ExpressionNode | undefined
  onChange: (next: ExpressionNode) => void
  /** Upstream references offered as chips. */
  references?: readonly string[]
  mode?: 'expression' | 'predicate'
  /** Internal recursion depth (0 at the root). */
  depth?: number
  maxDepth?: number
  /** Overrides the ExpressionCatalogProvider. */
  catalog?: ExpressionCatalog
  labels?: Partial<ExpressionBuilderLabels>
  /** Accessible name of the root group. */
  label?: string
}

interface Shared {
  l: ExpressionBuilderLabels
  locale: string
  catalog: ExpressionCatalog | undefined
  loading: boolean
  maxDepth: number
  /** Operation entries in expression mode (nested levels). */
  entries: PickerEntry[]
}

const opName = (l: ExpressionBuilderLabels, entry: PickerEntry) => {
  if (entry.verb) return l.vocabulary[entry.verb.value] ?? entry.verb.value
  return l.operations[entry.op.name] ?? entry.op.name
}

export function ExpressionBuilder(props: ExpressionBuilderProps) {
  const { value, onChange, references = [], mode = 'expression', depth = 0, maxDepth = MAX_EXPRESSION_DEPTH, label } = props
  const l = useLabels(expressionBuilderLabels, props.labels)
  const { catalog, loading } = useExpressionCatalog(props.catalog)
  const { locale } = useFlowLocale()
  const entries = useMemo(() => pickerEntries(catalog, 'expression'), [catalog])
  const rootEntries = useMemo(() => pickerEntries(catalog, mode), [catalog, mode])
  const shared: Shared = { l, locale, catalog, loading: !!loading || !catalog, maxDepth, entries }

  const body =
    value !== undefined && !isOperation(value) ? (
      <OperandEditor shared={shared} slot={{ key: label ?? l.kindLiteral, kind: 'expression' }} value={value} onChange={onChange} depth={depth} references={references} rootEntries={rootEntries} />
    ) : (
      <OperationEditor shared={shared} node={value} onChange={onChange} depth={depth} references={references} entries={rootEntries} />
    )
  return (
    <div className="fk-expr" data-depth={depth} role="group" aria-label={label ?? fill(l.level, { key: l.operation, level: depth + 1 })}>
      {body}
    </div>
  )
}

function OperationEditor({ shared, node, onChange, depth, references, entries }: { shared: Shared; node: OperationNode | undefined; onChange: (n: ExpressionNode) => void; depth: number; references: readonly string[]; entries: PickerEntry[] }) {
  const { l, catalog, maxDepth } = shared
  if (node && depth >= maxDepth) {
    return (
      <>
        <InlineNotice tone="warning" urgency="none">
          {l.depthLimit}
        </InlineNotice>
        <RawSlot shared={shared} label={l.raw} value={node} onChange={(v) => onChange(v as ExpressionNode)} />
      </>
    )
  }
  const spec = node ? findOperation(catalog, node.operation) : undefined
  const unknown = !!node && !!catalog && !spec && node.operation !== ''
  const slots: OperandSlotSpec[] = node ? (spec ? [...spec.operands] : inferSlots(node)) : []
  const current = node ? entryIdOf(node, entries) : null
  const verbKey = current ? entries.find((e) => e.id === current)?.verb?.key : undefined

  return (
    <div className="fk-expr__operation">
      <OperationPicker shared={shared} entries={entries} current={current} onPick={(entry) => onChange(seedOperation(entry))} />
      {unknown ? (
        <InlineNotice tone="warning" urgency="none">
          {fill(l.unknownOperation, { name: node!.operation })}
        </InlineNotice>
      ) : null}
      {node
        ? slots
            .filter((s) => s.key !== verbKey)
            .map((slot) => (
              <SlotEditor
                key={slot.key}
                shared={shared}
                slot={slot}
                value={node[slot.key]}
                depth={depth}
                references={references}
                onChange={(v) => onChange({ ...node, [slot.key]: v })}
              />
            ))
        : null}
    </div>
  )
}

function OperationPicker({ shared, entries, current, onPick }: { shared: Shared; entries: PickerEntry[]; current: string | null; onPick: (e: PickerEntry) => void }) {
  const { l, loading } = shared
  const families = EXPRESSION_FAMILIES.filter((f) => entries.some((e) => e.family === f))
  const currentFamily = entries.find((e) => e.id === current)?.family
  const [chosenFamily, setChosenFamily] = useState(currentFamily ?? families[0])
  const family = currentFamily ?? chosenFamily ?? families[0]
  const inFamily = entries.filter((e) => e.family === family)
  if (loading && !entries.length) {
    return (
      <p className="fk-expr__loading" role="status">
        {l.loadingOperations}
      </p>
    )
  }
  return (
    <div className="fk-expr__picker">
      <ListboxSelect
        label={l.family}
        value={family ?? null}
        options={families.map((f) => ({ value: f, label: l.families[f] }))}
        onChange={(f) => {
          setChosenFamily(f as typeof family)
          // Changing family selects that family's first operation.
          const first = entries.find((e) => e.family === f)
          if (first && f !== currentFamily) onPick(first)
        }}
      />
      <ListboxSelect
        label={l.operation}
        placeholder={l.choose}
        value={current}
        options={inFamily.map((e) => ({ value: e.id, label: opName(l, e) }))}
        onChange={(id) => {
          const e = entries.find((x) => x.id === id)
          if (e) onPick(e)
        }}
      />
    </div>
  )
}

function SlotEditor({ shared, slot, value, onChange, depth, references }: { shared: Shared; slot: OperandSlotSpec; value: unknown; onChange: (v: unknown) => void; depth: number; references: readonly string[] }) {
  const { l } = shared
  const refs = useMemo(() => withBindings(references, slot.binds, l), [references, slot.binds, l])
  switch (slot.kind) {
    case 'expression':
      return (
        <OperandEditor shared={shared} slot={slot} value={value} onChange={onChange} depth={depth + 1} references={refs} hint={slot.binds?.length ? fill(l.loopHint, { names: slot.binds.map((b) => l.bindings[b]).join(', ') }) : undefined} />
      )
    case 'list':
      return <ListSlot shared={shared} slot={slot} value={Array.isArray(value) ? value : []} onChange={onChange} depth={depth} references={refs} />
    case 'param':
      return <ParamField shared={shared} slot={slot} value={value} onChange={onChange} />
    case 'raw':
      return <RawSlot shared={shared} label={slot.key} value={value} onChange={onChange} />
  }
}

// Loop variables are engine identifiers (never translated); the hint names them in words.
function withBindings(references: readonly string[], binds: readonly LoopBinding[] | undefined, _l: ExpressionBuilderLabels): string[] {
  if (!binds?.length) return [...references]
  const extra = binds.filter((b) => !references.includes(b))
  return [...extra, ...references]
}

type OperandKindChoice = 'operation' | 'reference' | 'literal'

function kindOf(v: unknown): OperandKindChoice {
  if (isOperation(v)) return 'operation'
  if (isReference(v)) return 'reference'
  return 'literal'
}

function OperandEditor({
  shared,
  slot,
  value,
  onChange,
  depth,
  references,
  hint,
  rootEntries,
  kindSwitchRef,
}: {
  shared: Shared
  slot: OperandSlotSpec
  value: unknown
  onChange: (v: ExpressionNode) => void
  depth: number
  references: readonly string[]
  hint?: string | undefined
  rootEntries?: PickerEntry[]
  kindSwitchRef?: (el: HTMLDivElement | null) => void
}) {
  const { l, entries } = shared
  const kind = kindOf(value)
  const ownEntries = rootEntries ?? entries
  const switchKind = (k: string) => {
    if (k === 'operation') onChange(ownEntries[0] ? seedOperation(ownEntries[0]) : { operation: '' })
    else if (k === 'reference') onChange({ ref: references[0] ?? '' })
    else onChange({ value: '' })
  }
  return (
    <div className="fk-expr__slot" role="group" aria-label={fill(l.level, { key: slot.key, level: depth + 1 })} data-depth={depth}>
      <div className="fk-expr__slot-head">
        <code className="fk-expr__slot-key" dir="ltr">{slot.key}</code>
        <span className="fk-expr__level" aria-hidden="true">
          {depth + 1}
        </span>
      </div>
      {hint ? <p className="fk-expr__hint">{hint}</p> : null}
      <div ref={kindSwitchRef} className="fk-expr__kind">
        <SegmentedControl
          label={l.kindSwitch}
          size="compact"
          value={kind}
          onChange={switchKind}
          options={[
            { value: 'operation', label: l.kindOperation },
            { value: 'reference', label: l.kindReference },
            { value: 'literal', label: l.kindLiteral },
          ]}
        />
      </div>
      {kind === 'operation' ? (
        <div className="fk-expr__nested" data-depth={depth}>
          <OperationEditor shared={shared} node={value as OperationNode} onChange={onChange} depth={depth} references={references} entries={ownEntries} />
        </div>
      ) : kind === 'reference' ? (
        <ReferencePicker l={l} value={(value as { ref: string }).ref} references={references} onChange={(ref) => onChange({ ref })} />
      ) : (
        <LiteralField l={l} value={isLiteral(value) ? value.value : value} onChange={(v) => onChange({ value: v })} />
      )}
    </div>
  )
}

function ReferencePicker({ l, value, references, onChange }: { l: ExpressionBuilderLabels; value: string; references: readonly string[]; onChange: (ref: string) => void }) {
  return (
    <div className="fk-expr__reference">
      {references.length ? (
        <div className="fk-expr__chips" role="group" aria-label={l.references}>
          {references.map((r) => (
            <ToggleButton key={r} className="fk-expr__chip" isSelected={r === value} onChange={() => onChange(r)}>
              <code dir="ltr">{r}</code>
            </ToggleButton>
          ))}
        </div>
      ) : null}
      <TextField label={l.referencePath} value={value} onChange={onChange} className="fk-expr__mono" />
    </div>
  )
}

function LiteralField({ l, value, onChange }: { l: ExpressionBuilderLabels; value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => writeLiteral(value))
  const last = useRef(value)
  useEffect(() => {
    if (JSON.stringify(last.current) !== JSON.stringify(value)) {
      last.current = value
      setText(writeLiteral(value))
    }
  }, [value])
  return (
    <TextField
      label={l.literal}
      hint={l.literalHint}
      value={text}
      onChange={(t) => {
        setText(t)
        const v = readLiteral(t)
        last.current = v
        onChange(v)
      }}
    />
  )
}

function ParamField({ shared, slot, value, onChange }: { shared: Shared; slot: OperandSlotSpec; value: unknown; onChange: (v: unknown) => void }) {
  const { l } = shared
  const vocab = vocabularyOf(slot)
  if (vocab) {
    return <ListboxSelect label={slot.key} value={typeof value === 'string' ? value : null} options={vocab.map((v) => ({ value: v, label: l.vocabulary[v] ?? v }))} onChange={onChange} />
  }
  return <TextField label={slot.key} value={value === undefined || value === null ? '' : String(value)} onChange={(t) => onChange(readLiteral(t))} />
}

function RawSlot({ shared, label, value, onChange }: { shared: Shared; label: string; value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => prettyJson(value ?? {}))
  const [error, setError] = useState<string | null>(null)
  return (
    <TextArea
      label={label}
      monospace
      rows={4}
      value={text}
      errorMessage={error ?? undefined}
      onChange={(t) => {
        setText(t)
        try {
          const parsed = JSON.parse(t)
          setError(null)
          onChange(parsed)
        } catch (e) {
          setError(fill(shared.l.rawError, { detail: e instanceof Error ? e.message : String(e) }))
        }
      }}
    />
  )
}

function ListSlot({ shared, slot, value, onChange, depth, references }: { shared: Shared; slot: OperandSlotSpec; value: unknown[]; onChange: (v: unknown) => void; depth: number; references: readonly string[] }) {
  const { l } = shared
  const switches = useRef(new Map<number, HTMLDivElement>())
  const addRef = useRef<HTMLButtonElement>(null)
  const [focusAfter, setFocusAfter] = useState<number | null>(null)

  useEffect(() => {
    if (focusAfter === null) return
    const next = switches.current.get(focusAfter)
    const radio = next?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ?? next?.querySelector<HTMLInputElement>('input[type="radio"]')
    if (radio) radio.focus()
    else addRef.current?.focus()
    setFocusAfter(null)
  }, [focusAfter, value.length])

  const items: ReactNode[] = value.map((item, i) => (
    <li key={i} className="fk-expr__item">
      <span className="fk-expr__item-number" aria-hidden="true">
        {i + 1}
      </span>
      <div className="fk-expr__item-body">
        <OperandEditor
          shared={shared}
          slot={{ key: fill(l.item, { n: i + 1 }), kind: 'expression' }}
          value={item}
          depth={depth + 1}
          references={references}
          onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
          kindSwitchRef={(el) => {
            if (el) switches.current.set(i, el)
            else switches.current.delete(i)
          }}
        />
      </div>
      <Button
        variant="quiet"
        size="compact"
        shape="circle"
        iconOnly
        accessibleLabel={fill(l.removeItem, { n: i + 1 })}
        leadingIcon={<Trash2 />}
        onPress={() => {
          onChange(value.filter((_, j) => j !== i))
          // The next item takes this index; past the end, focus "add item".
          setFocusAfter(i < value.length - 1 ? i : -1)
        }}
      />
    </li>
  ))

  return (
    <div className="fk-expr__list" role="group" aria-label={fill(l.level, { key: slot.key, level: depth + 1 })}>
      <div className="fk-expr__slot-head">
        <code className="fk-expr__slot-key" dir="ltr">{slot.key}</code>
        <Tag size="small">{fill(l.itemCount, { count: value.length }, shared.locale)}</Tag>
      </div>
      {items.length ? <ol className="fk-expr__items">{items}</ol> : null}
      <Button ref={addRef} variant="secondary" size="compact" leadingIcon={<Plus />} onPress={() => onChange([...value, { value: null }])}>
        {l.addItem}
      </Button>
    </div>
  )
}
