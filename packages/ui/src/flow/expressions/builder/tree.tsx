// The recursive part of the expression builder: an operation (picker plus its
// operand slots) and an operand (kind switch plus the editor of that kind).
// Operand kinds and slot kinds are both driven by descriptor tables.

import { useMemo, useState, type ReactNode } from 'react'
import { InlineNotice, ListboxSelect, SegmentedControl } from '../../../index'
import { fill } from '../../internal/labels'
import type { ExpressionBuilderLabels } from '../labels'
import { EXPRESSION_FAMILIES, entryIdOf, findOperation, inferSlots, isLiteral, isOperation, isReference, seedOperation, type ExpressionNode, type OperandSlotSpec, type OperationNode, type PickerEntry } from '../model'
import { ItemList } from './ItemList'
import { LiteralText, ParameterField, RawJson, ReferencePicker } from './leaves'
import { chipsWithLoopNames, entryLabel, groupName, SlotHeading, useBuilderEnv } from './shared'

type OperandKind = 'operation' | 'reference' | 'literal'

interface OperandEnv {
  value: unknown
  set: (v: ExpressionNode) => void
  depth: number
  refs: readonly string[]
  palette: PickerEntry[]
}

/** The three shapes an expression operand can take: its switch label, its starter and its editor. */
const OPERAND_KINDS: ReadonlyArray<{
  kind: OperandKind
  word: keyof ExpressionBuilderLabels
  matches: (v: unknown) => boolean
  starter: (e: OperandEnv) => ExpressionNode
  editor: (e: OperandEnv) => ReactNode
}> = [
  {
    kind: 'operation',
    word: 'kindOperation',
    matches: isOperation,
    starter: (e) => (e.palette[0] ? seedOperation(e.palette[0]) : { operation: '' }),
    editor: (e) => (
      <div className="ty-expr__nested" data-depth={e.depth}>
        <OperationEditor node={e.value as OperationNode} onNode={e.set} depth={e.depth} refs={e.refs} palette={e.palette} />
      </div>
    ),
  },
  {
    kind: 'reference',
    word: 'kindReference',
    matches: isReference,
    starter: (e) => ({ ref: e.refs[0] ?? '' }),
    editor: (e) => <ReferencePicker current={(e.value as { ref: string }).ref} offered={e.refs} onPick={(ref) => e.set({ ref })} />,
  },
  {
    kind: 'literal',
    word: 'kindLiteral',
    matches: () => true,
    starter: () => ({ value: '' }),
    editor: (e) => <LiteralText value={isLiteral(e.value) ? e.value.value : e.value} onValue={(v) => e.set({ value: v })} />,
  },
]

const kindOf = (v: unknown) => OPERAND_KINDS.find((k) => k.matches(v))!

export interface OperandEditorProps {
  slotKey: string
  value: unknown
  onValue: (v: ExpressionNode) => void
  depth: number
  refs: readonly string[]
  hint?: string
  palette?: PickerEntry[]
  switchRef?: (el: HTMLElement | null) => void
}

export function OperandEditor({ slotKey, value, onValue, depth, refs, hint, palette, switchRef }: OperandEditorProps) {
  const { words, innerPalette } = useBuilderEnv()
  const env: OperandEnv = { value, set: onValue, depth, refs, palette: palette ?? innerPalette }
  const current = kindOf(value)
  return (
    <div className="ty-expr__slot" role="group" aria-label={groupName(words, slotKey, depth)} data-depth={depth}>
      <SlotHeading
        slotKey={slotKey}
        trailing={
          <span className="ty-expr__level" aria-hidden="true">
            {depth + 1}
          </span>
        }
      />
      {hint ? <p className="ty-expr__hint">{hint}</p> : null}
      <div ref={switchRef} className="ty-expr__kind">
        <SegmentedControl
          label={words.kindSwitch}
          size="compact"
          value={current.kind}
          onChange={(k) => onValue(OPERAND_KINDS.find((d) => d.kind === k)!.starter(env))}
          options={OPERAND_KINDS.map((d) => ({ value: d.kind, label: words[d.word] as string }))}
        />
      </div>
      {current.editor(env)}
    </div>
  )
}

interface SlotEnv {
  slot: OperandSlotSpec
  value: unknown
  set: (v: unknown) => void
  depth: number
  refs: string[]
  words: ExpressionBuilderLabels
}

/** How each slot kind of an operation is edited. */
const SLOT_EDITORS: Record<OperandSlotSpec['kind'], (s: SlotEnv) => ReactNode> = {
  expression: (s) => (
    <OperandEditor
      slotKey={s.slot.key}
      value={s.value}
      onValue={s.set}
      depth={s.depth + 1}
      refs={s.refs}
      {...(s.slot.binds?.length ? { hint: fill(s.words.loopHint, { names: s.slot.binds.map((b) => s.words.bindings[b]).join(', ') }) } : {})}
    />
  ),
  list: (s) => (
    <ItemList
      slotKey={s.slot.key}
      items={Array.isArray(s.value) ? s.value : []}
      depth={s.depth}
      onItems={s.set}
      drawItem={({ item, name, onItem, switchRef }) => <OperandEditor slotKey={name} value={item} depth={s.depth + 1} refs={s.refs} onValue={onItem} switchRef={switchRef} />}
    />
  ),
  param: (s) => <ParameterField slot={s.slot} value={s.value} onValue={s.set} />,
  raw: (s) => <RawJson label={s.slot.key} value={s.value} onValue={s.set} />,
}

function SlotEditor({ slot, value, set, depth, refs }: { slot: OperandSlotSpec; value: unknown; set: (v: unknown) => void; depth: number; refs: readonly string[] }) {
  const { words } = useBuilderEnv()
  const scoped = useMemo(() => chipsWithLoopNames(refs, slot.binds), [refs, slot.binds])
  return <>{SLOT_EDITORS[slot.kind]({ slot, value, set, depth, refs: scoped, words })}</>
}

export interface OperationEditorProps {
  node: OperationNode | undefined
  onNode: (n: ExpressionNode) => void
  depth: number
  refs: readonly string[]
  palette: PickerEntry[]
}

/** An operation: at the depth limit a raw JSON slot; otherwise the picker and one editor per operand slot. */
export function OperationEditor({ node, onNode, depth, refs, palette }: OperationEditorProps) {
  const { words, catalog, depthLimit } = useBuilderEnv()
  if (node && depth >= depthLimit) {
    return (
      <>
        <InlineNotice tone="warning" urgency="none">
          {words.depthLimit}
        </InlineNotice>
        <RawJson label={words.raw} value={node} onValue={(v) => onNode(v as ExpressionNode)} />
      </>
    )
  }
  const definition = node ? findOperation(catalog, node.operation) : undefined
  const pickedId = node ? entryIdOf(node, palette) : null
  // A flattened verb (add, subtract …) is chosen in the picker, not edited as a slot.
  const hiddenSlot = palette.find((e) => e.id === pickedId)?.verb?.key
  const slots = node ? (definition ? definition.operands : inferSlots(node)).filter((s) => s.key !== hiddenSlot) : []
  const unknown = !!node && !!catalog && !definition && node.operation !== ''
  return (
    <div className="ty-expr__operation">
      <OperationPicker palette={palette} pickedId={pickedId} onPick={(entry) => onNode(seedOperation(entry))} />
      {unknown ? (
        <InlineNotice tone="warning" urgency="none">
          {fill(words.unknownOperation, { name: node!.operation })}
        </InlineNotice>
      ) : null}
      {slots.map((slot) => (
        <SlotEditor key={slot.key} slot={slot} value={node![slot.key]} depth={depth} refs={refs} set={(v) => onNode({ ...node!, [slot.key]: v })} />
      ))}
    </div>
  )
}

/** Family, then operation. Picking another family selects that family's first operation. */
function OperationPicker({ palette, pickedId, onPick }: { palette: PickerEntry[]; pickedId: string | null; onPick: (e: PickerEntry) => void }) {
  const { words, catalogPending } = useBuilderEnv()
  const families = EXPRESSION_FAMILIES.filter((f) => palette.some((e) => e.family === f))
  const pickedFamily = palette.find((e) => e.id === pickedId)?.family
  const [browsed, setBrowsed] = useState(pickedFamily ?? families[0])
  if (catalogPending && palette.length === 0) {
    return (
      <p className="ty-expr__loading" role="status">
        {words.loadingOperations}
      </p>
    )
  }
  const family = pickedFamily ?? browsed ?? families[0]
  return (
    <div className="ty-expr__picker">
      <ListboxSelect
        label={words.family}
        value={family ?? null}
        options={families.map((f) => ({ value: f, label: words.families[f] }))}
        onChange={(f) => {
          setBrowsed(f as typeof family)
          const lead = palette.find((e) => e.family === f)
          if (lead && f !== pickedFamily) onPick(lead)
        }}
      />
      <ListboxSelect
        label={words.operation}
        placeholder={words.choose}
        value={pickedId}
        options={palette.filter((e) => e.family === family).map((e) => ({ value: e.id, label: entryLabel(words, e) }))}
        onChange={(id) => {
          const entry = palette.find((e) => e.id === id)
          if (entry) onPick(entry)
        }}
      />
    </div>
  )
}
