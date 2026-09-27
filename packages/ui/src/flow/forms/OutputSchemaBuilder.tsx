// OutputSchemaBuilder: visual editor for the structured output of an agent
// node, limited to the object-with-fields subset of JSON Schema the engine
// validates. One nested level below the top; deeper levels are raw schema.

import { useEffect, useId, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Checkbox, NativeSelect, TextField } from '../../index'
import { createId } from '../internal/ids'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'

export type OutputFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'

export type OutputSchema = {
  type: 'object'
  properties: Record<string, OutputFieldSchema>
  required?: string[]
  description?: string
}

export type OutputFieldSchema =
  | { type: 'string' | 'number' | 'integer' | 'boolean'; description?: string }
  | { type: 'object'; properties: Record<string, OutputFieldSchema>; required?: string[]; description?: string }
  | { type: 'array'; items: { type: 'object'; properties: Record<string, OutputFieldSchema>; required?: string[] }; description?: string }

export interface OutputSchemaBuilderLabels {
  emptyText: string
  addSchema: string
  unsupportedText: string
  reset: string
  heading: string
  removeSchema: string
  addField: string
  newField: string
  name: string
  type: string
  typeNames: Record<OutputFieldType, string>
  required: string
  description: string
  remove: string
  nested: string
  itemShape: string
  nestedRegion: string
  depthNotice: string
  duplicate: string
}

export const outputSchemaBuilderLabels = defineLabels<OutputSchemaBuilderLabels>('OutputSchemaBuilder', {
  en: {
    emptyText: 'Without an output schema the agent returns its text as it is.',
    addSchema: 'Add output schema',
    unsupportedText: 'The top level of an output schema must be an object with fields.',
    reset: 'Reset to object',
    heading: 'Top-level fields',
    removeSchema: 'Remove schema',
    addField: 'Add field',
    newField: 'New field',
    name: 'Field name',
    type: 'Type',
    typeNames: { string: 'Text', number: 'Number', integer: 'Whole number', boolean: 'True or false', object: 'Nested object', array: 'List of objects' },
    required: 'Required',
    description: 'Description',
    remove: 'Remove field {name}',
    nested: 'Nested fields',
    itemShape: 'Item shape',
    nestedRegion: 'Nested fields of {name}',
    depthNotice: 'Deeper levels must be edited as raw schema.',
    duplicate: 'Another field already has this name.',
  },
  'pt-BR': {
    emptyText: 'Sem esquema de saída, o agente devolve o texto como está.',
    addSchema: 'Adicionar esquema de saída',
    unsupportedText: 'O nível superior de um esquema de saída precisa ser um objeto com campos.',
    reset: 'Voltar a objeto',
    heading: 'Campos do nível superior',
    removeSchema: 'Remover esquema',
    addField: 'Adicionar campo',
    newField: 'Novo campo',
    name: 'Nome do campo',
    type: 'Tipo',
    typeNames: { string: 'Texto', number: 'Número', integer: 'Número inteiro', boolean: 'Verdadeiro ou falso', object: 'Objeto aninhado', array: 'Lista de objetos' },
    required: 'Obrigatório',
    description: 'Descrição',
    remove: 'Remover campo {name}',
    nested: 'Campos aninhados',
    itemShape: 'Forma de cada item',
    nestedRegion: 'Campos aninhados de {name}',
    depthNotice: 'Níveis mais profundos precisam ser editados como esquema bruto.',
    duplicate: 'Outro campo já tem este nome.',
  },
  es: {
    emptyText: 'Sin esquema de salida, el agente devuelve su texto tal cual.',
    addSchema: 'Añadir esquema de salida',
    unsupportedText: 'El nivel superior de un esquema de salida debe ser un objeto con campos.',
    reset: 'Volver a objeto',
    heading: 'Campos de nivel superior',
    removeSchema: 'Quitar esquema',
    addField: 'Añadir campo',
    newField: 'Campo nuevo',
    name: 'Nombre del campo',
    type: 'Tipo',
    typeNames: { string: 'Texto', number: 'Número', integer: 'Número entero', boolean: 'Verdadero o falso', object: 'Objeto anidado', array: 'Lista de objetos' },
    required: 'Obligatorio',
    description: 'Descripción',
    remove: 'Quitar campo {name}',
    nested: 'Campos anidados',
    itemShape: 'Forma de cada elemento',
    nestedRegion: 'Campos anidados de {name}',
    depthNotice: 'Los niveles más profundos deben editarse como esquema sin procesar.',
    duplicate: 'Otro campo ya tiene este nombre.',
  },
})

export const defaultOutputSchemaBuilderLabels: OutputSchemaBuilderLabels = outputSchemaBuilderLabels.bundles.en

/** Nesting levels offered below the top level. */
export const OUTPUT_SCHEMA_MAX_DEPTH = 1

interface Row {
  key: string
  name: string
  type: OutputFieldType
  required: boolean
  description: string
  children: Row[]
  /** Sub-schema beyond the editable depth, carried through untouched. */
  raw?: Record<string, OutputFieldSchema>
  rawRequired?: string[]
}

const TYPES: OutputFieldType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array']

function rowsOf(properties: Record<string, OutputFieldSchema> | undefined, required: string[] | undefined, depth: number): Row[] {
  return Object.entries(properties ?? {}).map(([name, f]) => {
    const inner = f.type === 'object' ? f : f.type === 'array' ? f.items : null
    const tooDeep = depth >= OUTPUT_SCHEMA_MAX_DEPTH
    return {
      key: createId('field'),
      name,
      type: f.type,
      required: (required ?? []).includes(name),
      description: f.description ?? '',
      children: inner && !tooDeep ? rowsOf(inner.properties, inner.required, depth + 1) : [],
      ...(inner && tooDeep ? { raw: inner.properties, ...(inner.required ? { rawRequired: inner.required } : {}) } : {}),
    }
  })
}

function objectOf(rows: Row[]): { properties: Record<string, OutputFieldSchema>; required?: string[] } {
  const properties: Record<string, OutputFieldSchema> = {}
  const required: string[] = []
  for (const r of rows) {
    const name = r.name.trim()
    if (!name) continue
    const desc = r.description.trim() ? { description: r.description.trim() } : {}
    if (r.type === 'object' || r.type === 'array') {
      const inner = r.raw ? { properties: r.raw, ...(r.rawRequired?.length ? { required: r.rawRequired } : {}) } : objectOf(r.children)
      properties[name] = r.type === 'object' ? { type: 'object', ...inner, ...desc } : { type: 'array', items: { type: 'object', ...inner }, ...desc }
    } else {
      properties[name] = { type: r.type, ...desc }
    }
    if (r.required) required.push(name)
  }
  return { properties, ...(required.length ? { required } : {}) }
}

export interface OutputSchemaBuilderProps {
  value: OutputSchema | Record<string, unknown> | undefined
  onChange: (next: OutputSchema | undefined) => void
  /** Current nesting level (0 at the top). */
  depth?: number
  labels?: Partial<OutputSchemaBuilderLabels>
}

export function OutputSchemaBuilder({ value, onChange, labels }: OutputSchemaBuilderProps) {
  const l = useLabels(outputSchemaBuilderLabels, labels)
  const headingId = useId()
  const supported = !!value && (value as { type?: unknown }).type === 'object'
  const [rows, setRows] = useState<Row[]>(() => (supported ? rowsOf((value as OutputSchema).properties, (value as OutputSchema).required, 0) : []))
  // Keeps editor rows in step when the host replaces the schema from outside.
  const lastEmitted = useRef<unknown>(value)
  useEffect(() => {
    if (value === lastEmitted.current) return
    lastEmitted.current = value
    setRows(supported ? rowsOf((value as OutputSchema).properties, (value as OutputSchema).required, 0) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const emit = (next: Row[]) => {
    setRows(next)
    const base = supported ? (value as OutputSchema) : undefined
    const schema: OutputSchema = { type: 'object', ...objectOf(next), ...(base?.description ? { description: base.description } : {}) }
    lastEmitted.current = schema
    onChange(schema)
  }

  if (value === undefined) {
    return (
      <div className="ty-output-schema" data-state="empty">
        <p className="ty-output-schema__text">{l.emptyText}</p>
        <Button variant="secondary" leadingIcon={<Plus />} onPress={() => onChange({ type: 'object', properties: {} })}>
          {l.addSchema}
        </Button>
      </div>
    )
  }
  if (!supported) {
    return (
      <div className="ty-output-schema" data-state="unsupported">
        <p className="ty-output-schema__text">{l.unsupportedText}</p>
        <Button variant="secondary" onPress={() => onChange({ type: 'object', properties: {} })}>
          {l.reset}
        </Button>
      </div>
    )
  }
  return (
    <section className="ty-output-schema" data-state="editing" aria-labelledby={headingId}>
      <div className="ty-output-schema__head">
        <h3 id={headingId} className="ty-output-schema__heading">
          {l.heading}
        </h3>
        <Button variant="quiet" size="compact" leadingIcon={<Trash2 />} onPress={() => onChange(undefined)}>
          {l.removeSchema}
        </Button>
      </div>
      <FieldRows rows={rows} onRows={emit} depth={0} l={l} />
    </section>
  )
}

function FieldRows({ rows, onRows, depth, l }: { rows: Row[]; onRows: (rows: Row[]) => void; depth: number; l: OutputSchemaBuilderLabels }) {
  const { locale } = useFlowLocale()
  const nameRefs = useRef(new Map<string, HTMLInputElement | null>())
  const addRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null)
  const focusNext = useRef<string | 'add' | null>(null)

  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    if (target === 'add') addRef.current?.focus()
    else nameRefs.current.get(target)?.focus()
  })

  const patch = (key: string, p: Partial<Row>) => onRows(rows.map((r) => (r.key === key ? { ...r, ...p } : r)))
  const counts = new Map<string, number>()
  for (const r of rows) if (r.name.trim()) counts.set(r.name.trim(), (counts.get(r.name.trim()) ?? 0) + 1)

  return (
    <div className="ty-output-schema__rows" data-depth={depth}>
      {rows.map((r, index) => {
        const display = r.name.trim() || l.newField
        const nestedType = r.type === 'object' || r.type === 'array'
        const duplicate = !!r.name.trim() && (counts.get(r.name.trim()) ?? 0) > 1
        return (
          <div key={r.key} className="ty-output-schema__row" role="group" aria-label={display}>
            <div className="ty-output-schema__controls">
              <TextField
                ref={(el) => {
                  nameRefs.current.set(r.key, el)
                }}
                className="ty-output-schema__name ty-ltr-text"
                label={l.name}
                value={r.name}
                onChange={(name) => patch(r.key, { name })}
                {...(duplicate ? { errorMessage: l.duplicate } : {})}
              />
              <NativeSelect
                className="ty-output-schema__type"
                label={l.type}
                options={TYPES.map((t) => ({ value: t, label: l.typeNames[t] }))}
                value={r.type}
                onChange={(t) => {
                  const type = t as OutputFieldType
                  const nested = type === 'object' || type === 'array'
                  // A new nested type starts as an empty object; a primitive drops any sub-schema.
                  const { raw: _r, rawRequired: _rr, ...rest } = r
                  onRows(rows.map((x) => (x.key === r.key ? { ...rest, type, children: nested ? (nestedType ? r.children : []) : [], ...(nested && nestedType && r.raw ? { raw: r.raw } : nested && depth >= OUTPUT_SCHEMA_MAX_DEPTH ? { raw: {} } : {}) } : x)))
                }}
              />
              <Checkbox className="ty-output-schema__required" label={l.required} isSelected={r.required} onChange={(required) => patch(r.key, { required })} />
              <Button
                variant="quiet"
                size="compact"
                shape="circle"
                iconOnly
                accessibleLabel={fill(l.remove, { name: display }, locale)}
                leadingIcon={<Trash2 />}
                onPress={() => {
                  const next = rows.filter((x) => x.key !== r.key)
                  focusNext.current = next[index]?.key ?? next[index - 1]?.key ?? 'add'
                  onRows(next)
                }}
              />
            </div>
            <TextField className="ty-output-schema__description" label={l.description} value={r.description} onChange={(description) => patch(r.key, { description })} />
            {nestedType ? (
              depth >= OUTPUT_SCHEMA_MAX_DEPTH ? (
                <p className="ty-output-schema__depth">{l.depthNotice}</p>
              ) : (
                <section className="ty-output-schema__nested" aria-label={fill(l.nestedRegion, { name: display }, locale)}>
                  <p className="ty-output-schema__nested-title">{r.type === 'array' ? l.itemShape : l.nested}</p>
                  <FieldRows rows={r.children} onRows={(children) => patch(r.key, { children })} depth={depth + 1} l={l} />
                </section>
              )
            ) : null}
          </div>
        )
      })}
      <Button
        ref={addRef}
        variant="secondary"
        size="compact"
        leadingIcon={<Plus />}
        onPress={() => {
          const row: Row = { key: createId('field'), name: '', type: 'string', required: false, description: '', children: [] }
          focusNext.current = row.key
          onRows([...rows, row])
        }}
      >
        {l.addField}
      </Button>
    </div>
  )
}
