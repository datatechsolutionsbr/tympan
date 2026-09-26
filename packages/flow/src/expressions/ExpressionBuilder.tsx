// ExpressionBuilder: builds a computation (or, in predicate mode, a yes/no
// test) as a tree of operations, without code. What a level needs from the
// root (strings, catalog, limits) travels through a context; every operand is
// its own labelled group ("‹key›, level n"), indented with a rail and a level
// number in text, so depth is never told by colour alone.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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

/** What every level of one builder shares. */
interface Scope {
  l: ExpressionBuilderLabels
  locale: string
  catalog: ExpressionCatalog | undefined
  waiting: boolean
  maxDepth: number
  /** Operations offered below the root (always the full expression palette). */
  nestedChoices: PickerEntry[]
}

const ScopeContext = createContext<Scope | null>(null)
const useScope = (): Scope => useContext(ScopeContext)!

/** Visible name of an operation: the flattened verb when it has one, else the operation. */
const choiceName = (l: ExpressionBuilderLabels, entry: PickerEntry) => (entry.verb ? (l.vocabulary[entry.verb.value] ?? entry.verb.value) : (l.operations[entry.op.name] ?? entry.op.name))

export function ExpressionBuilder(props: ExpressionBuilderProps) {
  const { value, onChange, references = [], mode = 'expression', depth = 0, maxDepth = MAX_EXPRESSION_DEPTH, label } = props
  const l = useLabels(expressionBuilderLabels, props.labels)
  const { catalog, loading } = useExpressionCatalog(props.catalog)
  const { locale } = useFlowLocale()
  const nestedChoices = useMemo(() => pickerEntries(catalog, 'expression'), [catalog])
  const rootChoices = useMemo(() => pickerEntries(catalog, mode), [catalog, mode])
  const scope = useMemo<Scope>(() => ({ l, locale, catalog, waiting: !!loading || !catalog, maxDepth, nestedChoices }), [l, locale, catalog, loading, maxDepth, nestedChoices])
  const rootIsOperand = value !== undefined && !isOperation(value)
  return (
    <ScopeContext.Provider value={scope}>
      <div className="fk-expr" data-depth={depth} role="group" aria-label={label ?? fill(l.level, { key: l.operation, level: depth + 1 })}>
        {rootIsOperand ? (
          <Operand slotKey={label ?? l.kindLiteral} value={value} onChange={onChange} depth={depth} references={references} choices={rootChoices} />
        ) : (
          <OperationBlock node={value} onChange={onChange} depth={depth} references={references} choices={rootChoices} />
        )}
      </div>
    </ScopeContext.Provider>
  )
}

interface BlockProps {
  node: OperationNode | undefined
  onChange: (n: ExpressionNode) => void
  depth: number
  references: readonly string[]
  choices: PickerEntry[]
}

function OperationBlock({ node, onChange, depth, references, choices }: BlockProps) {
  const { l, catalog, maxDepth } = useScope()
  if (node && depth >= maxDepth) {
    return (
      <>
        <InlineNotice tone="warning" urgency="none">
          {l.depthLimit}
        </InlineNotice>
        <RawOperand label={l.raw} value={node} onChange={(v) => onChange(v as ExpressionNode)} />
      </>
    )
  }
  const known = node ? findOperation(catalog, node.operation) : undefined
  const chosen = node ? entryIdOf(node, choices) : null
  // A flattened verb (add, subtract …) is picked in the menu, not edited as a slot.
  const verbSlot = choices.find((e) => e.id === chosen)?.verb?.key
  const operands = !node ? [] : (known ? [...known.operands] : inferSlots(node)).filter((slot) => slot.key !== verbSlot)
  const notInCatalog = !!node && !!catalog && !known && node.operation !== ''
  return (
    <div className="fk-expr__operation">
      <Chooser choices={choices} chosen={chosen} onChoose={(entry) => onChange(seedOperation(entry))} />
      {notInCatalog && (
        <InlineNotice tone="warning" urgency="none">
          {fill(l.unknownOperation, { name: node!.operation })}
        </InlineNotice>
      )}
      {node &&
        operands.map((slot) => <Slot key={slot.key} slot={slot} value={node[slot.key]} depth={depth} references={references} onChange={(v) => onChange({ ...node, [slot.key]: v })} />)}
    </div>
  )
}

/** Family then operation; picking another family jumps to its first operation. */
function Chooser({ choices, chosen, onChoose }: { choices: PickerEntry[]; chosen: string | null; onChoose: (e: PickerEntry) => void }) {
  const { l, waiting } = useScope()
  const offered = EXPRESSION_FAMILIES.filter((f) => choices.some((e) => e.family === f))
  const familyOfChosen = choices.find((e) => e.id === chosen)?.family
  const [browsing, setBrowsing] = useState(familyOfChosen ?? offered[0])
  const family = familyOfChosen ?? browsing ?? offered[0]
  if (waiting && choices.length === 0) {
    return (
      <p className="fk-expr__loading" role="status">
        {l.loadingOperations}
      </p>
    )
  }
  const byId = (id: string) => choices.find((e) => e.id === id)
  return (
    <div className="fk-expr__picker">
      <ListboxSelect
        label={l.family}
        value={family ?? null}
        options={offered.map((f) => ({ value: f, label: l.families[f] }))}
        onChange={(f) => {
          setBrowsing(f as typeof family)
          const first = choices.find((e) => e.family === f)
          if (first && f !== familyOfChosen) onChoose(first)
        }}
      />
      <ListboxSelect
        label={l.operation}
        placeholder={l.choose}
        value={chosen}
        options={choices.filter((e) => e.family === family).map((e) => ({ value: e.id, label: choiceName(l, e) }))}
        onChange={(id) => {
          const entry = byId(id)
          if (entry) onChoose(entry)
        }}
      />
    </div>
  )
}

interface SlotProps {
  slot: OperandSlotSpec
  value: unknown
  onChange: (v: unknown) => void
  depth: number
  references: readonly string[]
}

/** Loop variables (engine identifiers, never translated) come first in the chips inside their subtree. */
const withLoopNames = (references: readonly string[], binds: readonly LoopBinding[] | undefined): string[] => [...(binds ?? []).filter((b) => !references.includes(b)), ...references]

const SLOT_KINDS: Record<OperandSlotSpec['kind'], (p: SlotProps & { l: ExpressionBuilderLabels; refs: string[] }) => ReactNode> = {
  expression: ({ slot, value, onChange, depth, refs, l }) => (
    <Operand
      slotKey={slot.key}
      value={value}
      onChange={onChange}
      depth={depth + 1}
      references={refs}
      {...(slot.binds?.length ? { hint: fill(l.loopHint, { names: slot.binds.map((b) => l.bindings[b]).join(', ') }) } : {})}
    />
  ),
  list: ({ slot, value, onChange, depth, refs }) => <ListOperand slotKey={slot.key} items={Array.isArray(value) ? value : []} onChange={onChange} depth={depth} references={refs} />,
  param: ({ slot, value, onChange }) => <ParamOperand slot={slot} value={value} onChange={onChange} />,
  raw: ({ slot, value, onChange }) => <RawOperand label={slot.key} value={value} onChange={onChange} />,
}

function Slot(props: SlotProps) {
  const { l } = useScope()
  const refs = useMemo(() => withLoopNames(props.references, props.slot.binds), [props.references, props.slot.binds])
  return <>{SLOT_KINDS[props.slot.kind]({ ...props, l, refs })}</>
}

type OperandForm = 'operation' | 'reference' | 'literal'
const formOf = (v: unknown): OperandForm => (isOperation(v) ? 'operation' : isReference(v) ? 'reference' : 'literal')

interface OperandProps {
  slotKey: string
  value: unknown
  onChange: (v: ExpressionNode) => void
  depth: number
  references: readonly string[]
  hint?: string
  /** Operations offered here (the root's own palette at the root, else the full one). */
  choices?: PickerEntry[]
  switchRef?: (el: HTMLDivElement | null) => void
}

function Operand({ slotKey, value, onChange, depth, references, hint, choices, switchRef }: OperandProps) {
  const { l, nestedChoices } = useScope()
  const offered = choices ?? nestedChoices
  const form = formOf(value)
  const starters: Record<OperandForm, () => ExpressionNode> = {
    operation: () => (offered[0] ? seedOperation(offered[0]) : { operation: '' }),
    reference: () => ({ ref: references[0] ?? '' }),
    literal: () => ({ value: '' }),
  }
  const editors: Record<OperandForm, () => ReactNode> = {
    operation: () => (
      <div className="fk-expr__nested" data-depth={depth}>
        <OperationBlock node={value as OperationNode} onChange={onChange} depth={depth} references={references} choices={offered} />
      </div>
    ),
    reference: () => <ReferenceChips value={(value as { ref: string }).ref} references={references} onChange={(ref) => onChange({ ref })} />,
    literal: () => <LiteralOperand value={isLiteral(value) ? value.value : value} onChange={(v) => onChange({ value: v })} />,
  }
  return (
    <div className="fk-expr__slot" role="group" aria-label={fill(l.level, { key: slotKey, level: depth + 1 })} data-depth={depth}>
      <div className="fk-expr__slot-head">
        <code className="fk-expr__slot-key" dir="ltr">
          {slotKey}
        </code>
        <span className="fk-expr__level" aria-hidden="true">
          {depth + 1}
        </span>
      </div>
      {hint && <p className="fk-expr__hint">{hint}</p>}
      <div ref={switchRef} className="fk-expr__kind">
        <SegmentedControl
          label={l.kindSwitch}
          size="compact"
          value={form}
          onChange={(f) => onChange(starters[f as OperandForm]())}
          options={[
            { value: 'operation', label: l.kindOperation },
            { value: 'reference', label: l.kindReference },
            { value: 'literal', label: l.kindLiteral },
          ]}
        />
      </div>
      {editors[form]()}
    </div>
  )
}

function ReferenceChips({ value, references, onChange }: { value: string; references: readonly string[]; onChange: (ref: string) => void }) {
  const { l } = useScope()
  return (
    <div className="fk-expr__reference">
      {references.length > 0 && (
        <div className="fk-expr__chips" role="group" aria-label={l.references}>
          {references.map((r) => (
            <ToggleButton key={r} className="fk-expr__chip" isSelected={r === value} onChange={() => onChange(r)}>
              <code dir="ltr">{r}</code>
            </ToggleButton>
          ))}
        </div>
      )}
      <TextField label={l.referencePath} value={value} onChange={onChange} className="fk-expr__mono" />
    </div>
  )
}

/** Free text read as structured data when it parses; follows outside changes without fighting the typist. */
function LiteralOperand({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const { l } = useScope()
  const [typed, setTyped] = useState(() => writeLiteral(value))
  const echoed = useRef<unknown>(value)
  useEffect(() => {
    if (JSON.stringify(echoed.current) === JSON.stringify(value)) return
    echoed.current = value
    setTyped(writeLiteral(value))
  }, [value])
  return (
    <TextField
      label={l.literal}
      hint={l.literalHint}
      value={typed}
      onChange={(t) => {
        setTyped(t)
        echoed.current = readLiteral(t)
        onChange(echoed.current)
      }}
    />
  )
}

function ParamOperand({ slot, value, onChange }: { slot: OperandSlotSpec; value: unknown; onChange: (v: unknown) => void }) {
  const { l } = useScope()
  const words = vocabularyOf(slot)
  return words ? (
    <ListboxSelect label={slot.key} value={typeof value === 'string' ? value : null} options={words.map((w) => ({ value: w, label: l.vocabulary[w] ?? w }))} onChange={onChange} />
  ) : (
    <TextField label={slot.key} value={value === undefined || value === null ? '' : String(value)} onChange={(t) => onChange(readLiteral(t))} />
  )
}

/** JSON area for operands the builder cannot shape; keeps the last valid value while the text is broken. */
function RawOperand({ label, value, onChange }: { label: string; value: unknown; onChange: (v: unknown) => void }) {
  const { l } = useScope()
  const [typed, setTyped] = useState(() => prettyJson(value ?? {}))
  const [complaint, setComplaint] = useState<string | undefined>(undefined)
  const edit = (t: string) => {
    setTyped(t)
    let parsed: unknown
    try {
      parsed = JSON.parse(t)
    } catch (why) {
      return setComplaint(fill(l.rawError, { detail: why instanceof Error ? why.message : String(why) }))
    }
    setComplaint(undefined)
    onChange(parsed)
  }
  return <TextArea label={label} monospace rows={4} value={typed} errorMessage={complaint} onChange={edit} />
}

/** Numbered operands; removing one sends focus to the operand that takes its place, or to "add item". */
function ListOperand({ slotKey, items, onChange, depth, references }: { slotKey: string; items: unknown[]; onChange: (v: unknown) => void; depth: number; references: readonly string[] }) {
  const { l, locale } = useScope()
  const kindSwitches = useRef(new Map<number, HTMLDivElement>())
  const addButton = useRef<HTMLButtonElement>(null)
  const [landing, setLanding] = useState<number | null>(null)

  useEffect(() => {
    if (landing === null) return
    const holder = kindSwitches.current.get(landing)
    const radio = holder?.querySelector<HTMLInputElement>('input[type="radio"]:checked') ?? holder?.querySelector<HTMLInputElement>('input[type="radio"]')
    ;(radio ?? addButton.current)?.focus()
    setLanding(null)
  }, [landing, items.length])

  const replaceAt = (i: number, v: unknown) => onChange(items.map((x, j) => (j === i ? v : x)))
  const removeAt = (i: number) => {
    onChange(items.filter((_, j) => j !== i))
    setLanding(i < items.length - 1 ? i : -1)
  }

  return (
    <div className="fk-expr__list" role="group" aria-label={fill(l.level, { key: slotKey, level: depth + 1 })}>
      <div className="fk-expr__slot-head">
        <code className="fk-expr__slot-key" dir="ltr">
          {slotKey}
        </code>
        <Tag size="small">{fill(l.itemCount, { count: items.length }, locale)}</Tag>
      </div>
      {items.length > 0 && (
        <ol className="fk-expr__items">
          {items.map((item, i) => (
            <li key={i} className="fk-expr__item">
              <span className="fk-expr__item-number" aria-hidden="true">
                {i + 1}
              </span>
              <div className="fk-expr__item-body">
                <Operand
                  slotKey={fill(l.item, { n: i + 1 })}
                  value={item}
                  depth={depth + 1}
                  references={references}
                  onChange={(v) => replaceAt(i, v)}
                  switchRef={(el) => {
                    if (el) kindSwitches.current.set(i, el)
                    else kindSwitches.current.delete(i)
                  }}
                />
              </div>
              <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.removeItem, { n: i + 1 })} leadingIcon={<Trash2 />} onPress={() => removeAt(i)} />
            </li>
          ))}
        </ol>
      )}
      <Button ref={addButton} variant="secondary" size="compact" leadingIcon={<Plus />} onPress={() => onChange([...items, { value: null }])}>
        {l.addItem}
      </Button>
    </div>
  )
}
