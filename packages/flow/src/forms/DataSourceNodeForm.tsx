// DataSourceNodeForm: which connection, table, columns and filters a data
// source step reads, where the rows go and how many. A sectioned dialog: the
// rail moves through the five sections; choosing a connection or a table moves
// on by itself.

import { useEffect, useMemo, useState } from 'react'
import { Check, Database, Plus, Trash2 } from 'lucide-react'
import { ListBox, ListBoxItem, Radio, RadioGroup } from 'react-aria-components'
import { Button, Checkbox, CheckboxGroup, InlineNotice, NativeSelect, Skeleton, TextField } from '@fakhir/ui'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { SectionedModal } from '../internal/SectionedModal'
import { NodeFormFooter } from './NodeFormFooter'

export type FilterOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'in'
export const FILTER_OPERATORS: readonly FilterOperator[] = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'like', 'in']

export interface DataSourceFilter {
  column: string
  operator: FilterOperator
  value: string | string[]
}

export interface DataSourceNodeConfig {
  kind?: 'datasource'
  sourceId?: string
  dialect?: string
  table?: string
  columns?: string[]
  filters?: DataSourceFilter[]
  outputVariable?: string
  limit?: number
  /** Legacy shape: flow variable → column, read as "equals" filters. */
  filterMap?: Record<string, string>
  [key: string]: unknown
}

export interface DataSourceOption {
  id: string
  name: string
  dialect: string
}

export interface ColumnInfo {
  name: string
  type: string
  nullable?: boolean
}

export interface DataSourceNodeFormLabels {
  title: string
  subtitle: string
  rail: string
  connection: string
  table: string
  columns: string
  filters: string
  output: string
  connectionGroup: string
  tableSearch: string
  tableList: string
  columnSearch: string
  results: string
  selectedCount: string
  selectAll: string
  clearAll: string
  loadError: string
  retry: string
  noTables: string
  filterLegend: string
  filterColumn: string
  filterOperator: string
  filterValue: string
  filterValueHint: string
  removeFilter: string
  addFilter: string
  noColumn: string
  operators: Record<FilterOperator, string>
  outputVariable: string
  limit: string
  summary: string
  summaryConnection: string
  summaryTable: string
  summaryColumns: string
  summaryFilters: string
  none: string
  save: string
  cancel: string
}

const operators = (o: string[]) => Object.fromEntries(FILTER_OPERATORS.map((k, i) => [k, o[i]!])) as Record<FilterOperator, string>

export const dataSourceNodeFormLabels = defineLabels<DataSourceNodeFormLabels>('DataSourceNodeForm', {
  en: {
    title: 'Data source',
    subtitle: '{dialect} · {table}',
    rail: 'Sections',
    connection: 'Connection',
    table: 'Table',
    columns: 'Columns',
    filters: 'Filters',
    output: 'Output',
    connectionGroup: 'Connection',
    tableSearch: 'Find a table',
    tableList: 'Tables',
    columnSearch: 'Find a column',
    results: '{count, plural, =0 {No results} one {# result} other {# results}}',
    selectedCount: '{selected, number} of {total, number} selected',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    loadError: 'Could not load: {message}',
    retry: 'Try again',
    noTables: 'No tables in this connection.',
    filterLegend: 'Filter {n, number}',
    filterColumn: 'Column',
    filterOperator: 'Operator',
    filterValue: 'Value',
    filterValueHint: 'Separate list members with commas.',
    removeFilter: 'Remove filter {n, number}',
    addFilter: 'Add filter',
    noColumn: 'Choose a column',
    operators: operators(['equals', 'not equals', 'less than', 'at most', 'greater than', 'at least', 'matches pattern', 'member of list']),
    outputVariable: 'Output variable',
    limit: 'Row limit',
    summary: 'Summary',
    summaryConnection: 'Connection',
    summaryTable: 'Table',
    summaryColumns: 'Columns',
    summaryFilters: '{n, plural, =0 {No filters} one {# filter} other {# filters}}',
    none: 'None',
    save: 'Save',
    cancel: 'Cancel',
  },
  'pt-BR': {
    title: 'Fonte de dados',
    rail: 'Seções',
    connection: 'Conexão',
    table: 'Tabela',
    columns: 'Colunas',
    filters: 'Filtros',
    output: 'Saída',
    connectionGroup: 'Conexão',
    tableSearch: 'Encontrar uma tabela',
    tableList: 'Tabelas',
    columnSearch: 'Encontrar uma coluna',
    results: '{count, plural, =0 {Nenhum resultado} one {# resultado} other {# resultados}}',
    selectedCount: '{selected, number} de {total, number} selecionadas',
    selectAll: 'Selecionar todas',
    clearAll: 'Limpar todas',
    loadError: 'Não foi possível carregar: {message}',
    retry: 'Tentar de novo',
    noTables: 'Nenhuma tabela nesta conexão.',
    filterLegend: 'Filtro {n, number}',
    filterColumn: 'Coluna',
    filterOperator: 'Operador',
    filterValue: 'Valor',
    filterValueHint: 'Separe os itens da lista com vírgulas.',
    removeFilter: 'Remover filtro {n, number}',
    addFilter: 'Adicionar filtro',
    noColumn: 'Escolha uma coluna',
    operators: operators(['igual a', 'diferente de', 'menor que', 'no máximo', 'maior que', 'no mínimo', 'corresponde ao padrão', 'está na lista']),
    outputVariable: 'Variável de saída',
    limit: 'Limite de linhas',
    summary: 'Resumo',
    summaryConnection: 'Conexão',
    summaryTable: 'Tabela',
    summaryColumns: 'Colunas',
    summaryFilters: '{n, plural, =0 {Nenhum filtro} one {# filtro} other {# filtros}}',
    none: 'Nenhuma',
    save: 'Salvar',
    cancel: 'Cancelar',
  },
  es: {
    title: 'Fuente de datos',
    rail: 'Secciones',
    connection: 'Conexión',
    table: 'Tabla',
    columns: 'Columnas',
    filters: 'Filtros',
    output: 'Salida',
    connectionGroup: 'Conexión',
    tableSearch: 'Buscar una tabla',
    tableList: 'Tablas',
    columnSearch: 'Buscar una columna',
    results: '{count, plural, =0 {Sin resultados} one {# resultado} other {# resultados}}',
    selectedCount: '{selected, number} de {total, number} seleccionadas',
    selectAll: 'Seleccionar todas',
    clearAll: 'Borrar todas',
    loadError: 'No se pudo cargar: {message}',
    retry: 'Reintentar',
    noTables: 'No hay tablas en esta conexión.',
    filterLegend: 'Filtro {n, number}',
    filterColumn: 'Columna',
    filterOperator: 'Operador',
    filterValue: 'Valor',
    filterValueHint: 'Separe los elementos de la lista con comas.',
    removeFilter: 'Quitar filtro {n, number}',
    addFilter: 'Añadir filtro',
    noColumn: 'Elija una columna',
    operators: operators(['igual a', 'distinto de', 'menor que', 'como máximo', 'mayor que', 'como mínimo', 'coincide con el patrón', 'está en la lista']),
    outputVariable: 'Variable de salida',
    limit: 'Límite de filas',
    summary: 'Resumen',
    summaryConnection: 'Conexión',
    summaryTable: 'Tabla',
    summaryColumns: 'Columnas',
    summaryFilters: '{n, plural, =0 {Sin filtros} one {# filtro} other {# filtros}}',
    none: 'Ninguna',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
})

export const defaultDataSourceNodeFormLabels: DataSourceNodeFormLabels = dataSourceNodeFormLabels.bundles.en

export interface DataSourceNodeFormProps {
  open: boolean
  value: DataSourceNodeConfig
  sources: DataSourceOption[]
  loadTables: (sourceId: string) => Promise<string[]>
  loadColumns: (sourceId: string, table: string) => Promise<ColumnInfo[]>
  readOnly?: boolean
  /** Highest row limit accepted (from the contract). */
  maxLimit?: number
  onSave: (config: DataSourceNodeConfig) => void
  onCancel: () => void
  labels?: Partial<DataSourceNodeFormLabels>
}

type SectionId = 'connection' | 'table' | 'columns' | 'filters' | 'output'

/** Reads "a, b ,c," as ["a","b","c"]. */
export function parseListValue(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Keeps the value meaningful when the operator changes to or from "member of list". */
export function convertFilterValue(value: string | string[], to: FilterOperator): string | string[] {
  if (to === 'in') return Array.isArray(value) ? value : value === '' ? [] : [value]
  return Array.isArray(value) ? (value[0] ?? '') : value
}

function initialFilters(v: DataSourceNodeConfig): DataSourceFilter[] {
  const rows = [...(v.filters ?? [])]
  for (const [variable, column] of Object.entries(v.filterMap ?? {})) rows.push({ column, operator: 'eq', value: `{{${variable}}}` })
  return rows
}

type Load<T> = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: T }

function useLoader<T>(key: string | null, load: () => Promise<T>): [Load<T>, () => void] {
  const [result, setResult] = useState<Load<T>>({ state: 'idle' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!key) {
      setResult({ state: 'idle' })
      return
    }
    let live = true
    setResult({ state: 'loading' })
    load().then(
      (data) => live && setResult({ state: 'ready', data }),
      (e: unknown) => live && setResult({ state: 'error', message: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])
  return [result, () => setAttempt((a) => a + 1)]
}

export function DataSourceNodeForm(props: DataSourceNodeFormProps) {
  const { open, value, sources, loadTables, loadColumns, readOnly = false, maxLimit, onSave, onCancel } = props
  const l = useLabels(dataSourceNodeFormLabels, props.labels)
  const { locale } = useFlowLocale()
  const [sourceId, setSourceId] = useState(value.sourceId ?? '')
  const [table, setTable] = useState(value.table ?? '')
  const [columns, setColumns] = useState<string[]>(value.columns ?? [])
  const [filters, setFilters] = useState<DataSourceFilter[]>(() => initialFilters(value))
  const [outputVariable, setOutputVariable] = useState(value.outputVariable ?? 'rows')
  const [limit, setLimit] = useState(String(value.limit ?? 100))
  const [section, setSection] = useState<SectionId>(value.sourceId ? (value.table ? 'columns' : 'table') : 'connection')
  const [tableQuery, setTableQuery] = useState('')
  const [columnQuery, setColumnQuery] = useState('')
  // Raw text of "member of list" fields while typing (the stored value is the parsed list).
  const [listDrafts, setListDrafts] = useState<Record<number, string>>({})

  const source = sources.find((s) => s.id === sourceId)
  const [tables, retryTables] = useLoader(sourceId || null, () => loadTables(sourceId))
  const [columnList, retryColumns] = useLoader(sourceId && table ? `${sourceId}/${table}` : null, () => loadColumns(sourceId, table))

  const allColumns = columnList.state === 'ready' ? columnList.data : []
  const shownTables = useMemo(() => (tables.state === 'ready' ? tables.data.filter((t) => t.toLowerCase().includes(tableQuery.toLowerCase())) : []), [tables, tableQuery])
  const shownColumns = allColumns.filter((c) => c.name.toLowerCase().includes(columnQuery.toLowerCase()))

  const pickSource = (id: string) => {
    if (id === sourceId) return
    setSourceId(id)
    setTable('')
    setColumns([])
    setFilters([])
    setSection('table')
  }
  const pickTable = (name: string) => {
    if (name !== table) {
      setColumns([])
      setFilters([])
    }
    setTable(name)
    setSection('columns')
  }

  const canSave = !!sourceId && !!table && columns.length > 0
  const save = () => {
    if (!canSave) return
    const { filterMap: _legacy, ...rest } = value
    const n = Number(limit)
    onSave({
      ...rest,
      kind: 'datasource',
      sourceId,
      dialect: source?.dialect ?? value.dialect ?? '',
      table,
      columns,
      filters: filters.filter((f) => f.column),
      outputVariable: outputVariable.trim() || 'rows',
      limit: Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), maxLimit ?? Infinity) : 100,
    })
  }

  const loadState = (s: Load<unknown>, retry: () => void) =>
    s.state === 'loading' ? (
      <div aria-busy="true">
        <Skeleton lines={4} />
      </div>
    ) : s.state === 'error' ? (
      <InlineNotice
        tone="danger"
        actions={
          <Button variant="secondary" size="compact" onPress={retry}>
            {l.retry}
          </Button>
        }
      >
        {fill(l.loadError, { message: s.message }, locale)}
      </InlineNotice>
    ) : null

  const connectionPane = (
    <RadioGroup className="fk-ds-form__tiles" aria-label={l.connectionGroup} value={sourceId || null} onChange={pickSource} isDisabled={readOnly}>
      {sources.map((s) => (
        <Radio key={s.id} value={s.id} className="fk-ds-form__tile" isDisabled={readOnly && s.id !== sourceId}>
          {({ isSelected }) => (
            <>
              <Database className="fk-ds-form__tile-icon" aria-hidden="true" focusable="false" />
              <span className="fk-ds-form__tile-text">
                <span className="fk-ds-form__tile-name">{s.name}</span>
                <span className="fk-ds-form__tile-meta">{s.dialect}</span>
              </span>
              {isSelected ? <Check className="fk-ds-form__tile-check" aria-hidden="true" focusable="false" /> : null}
            </>
          )}
        </Radio>
      ))}
    </RadioGroup>
  )

  const tablePane = (
    <div className="fk-ds-form__pane">
      <TextField mode="search" label={l.tableSearch} value={tableQuery} onChange={setTableQuery} disabled={readOnly} />
      {loadState(tables, retryTables)}
      {tables.state === 'ready' ? (
        <>
          <p className="fk-visually-hidden" role="status">
            {tableQuery ? fill(l.results, { count: shownTables.length }, locale) : ''}
          </p>
          <ListBox
            className="fk-ds-form__list"
            aria-label={l.tableList}
            selectionMode="single"
            selectedKeys={table ? [table] : []}
            onSelectionChange={(keys) => {
              const [k] = keys === 'all' ? [] : [...keys]
              if (k !== undefined) pickTable(String(k))
            }}
            items={shownTables.map((t) => ({ id: t }))}
            disabledKeys={readOnly ? shownTables.filter((t) => t !== table) : []}
            renderEmptyState={() => <p className="fk-node-form__empty">{l.noTables}</p>}
          >
            {(item) => (
              <ListBoxItem id={item.id} textValue={item.id} className="fk-ds-form__option">
                {({ isSelected }) => (
                  <>
                    <span className="fk-ds-form__option-name fk-ltr-text">{item.id}</span>
                    {isSelected ? <Check className="fk-ds-form__tile-check" aria-hidden="true" focusable="false" /> : null}
                  </>
                )}
              </ListBoxItem>
            )}
          </ListBox>
        </>
      ) : null}
    </div>
  )

  const allSelected = allColumns.length > 0 && columns.length === allColumns.length
  const columnsPane = (
    <div className="fk-ds-form__pane">
      {loadState(columnList, retryColumns)}
      {columnList.state === 'ready' ? (
        <>
          <div className="fk-ds-form__bar">
            <span className="fk-ds-form__count">{fill(l.selectedCount, { selected: columns.length, total: allColumns.length }, locale)}</span>
            <Button variant="quiet" size="compact" disabled={readOnly} onPress={() => setColumns(allSelected ? [] : allColumns.map((c) => c.name))}>
              {allSelected ? l.clearAll : l.selectAll}
            </Button>
          </div>
          <TextField mode="search" label={l.columnSearch} value={columnQuery} onChange={setColumnQuery} />
          <p className="fk-visually-hidden" role="status">
            {columnQuery ? fill(l.results, { count: shownColumns.length }, locale) : ''}
          </p>
          <CheckboxGroup label={l.columns} value={columns} onChange={setColumns} disabled={readOnly}>
            {shownColumns.map((c) => (
              <Checkbox key={c.name} value={c.name} label={c.name} description={c.type} className="fk-ds-form__column" />
            ))}
          </CheckboxGroup>
        </>
      ) : null}
    </div>
  )

  const columnOptions = [{ value: '', label: l.noColumn }, ...allColumns.map((c) => ({ value: c.name, label: c.name })), ...filters.filter((f) => f.column && !allColumns.some((c) => c.name === f.column)).map((f) => ({ value: f.column, label: f.column }))]
  const patchFilter = (i: number, patch: Partial<DataSourceFilter>) => setFilters((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const filtersPane = (
    <div className="fk-ds-form__pane">
      {filters.map((f, i) => (
        <fieldset key={i} className="fk-ds-form__filter" disabled={readOnly}>
          <legend className="fk-ds-form__legend">{fill(l.filterLegend, { n: i + 1 }, locale)}</legend>
          <NativeSelect label={l.filterColumn} options={columnOptions} value={f.column} onChange={(column) => patchFilter(i, { column })} />
          <NativeSelect
            label={l.filterOperator}
            options={FILTER_OPERATORS.map((o) => ({ value: o, label: l.operators[o] }))}
            value={f.operator}
            onChange={(o) => {
              setListDrafts(({ [i]: _gone, ...rest }) => rest)
              patchFilter(i, { operator: o as FilterOperator, value: convertFilterValue(f.value, o as FilterOperator) })
            }}
          />
          <TextField
            label={l.filterValue}
            {...(f.operator === 'in' ? { hint: l.filterValueHint } : {})}
            value={f.operator === 'in' ? (listDrafts[i] ?? (Array.isArray(f.value) ? f.value.join(', ') : f.value)) : Array.isArray(f.value) ? f.value.join(', ') : f.value}
            onChange={(text) => {
              if (f.operator === 'in') setListDrafts((d) => ({ ...d, [i]: text }))
              patchFilter(i, { value: f.operator === 'in' ? parseListValue(text) : text })
            }}
          />
          {readOnly ? null : (
            <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.removeFilter, { n: i + 1 }, locale)} leadingIcon={<Trash2 />} onPress={() => {
                setListDrafts({})
                setFilters((fs) => fs.filter((_, j) => j !== i))
              }} />
          )}
        </fieldset>
      ))}
      {readOnly ? null : (
        <Button variant="secondary" size="compact" leadingIcon={<Plus />} onPress={() => setFilters((fs) => [...fs, { column: '', operator: 'eq', value: '' }])}>
          {l.addFilter}
        </Button>
      )}
    </div>
  )

  const outputPane = (
    <div className="fk-ds-form__pane">
      <TextField className="fk-ltr-text" label={l.outputVariable} value={outputVariable} onChange={setOutputVariable} readOnly={readOnly} />
      <TextField inputType="number" label={l.limit} value={limit} onChange={setLimit} readOnly={readOnly} />
      <section aria-label={l.summary} className="fk-ds-form__summary">
        <dl>
          <dt>{l.summaryConnection}</dt>
          <dd>{source ? `${source.name} · ${source.dialect}` : l.none}</dd>
          <dt>{l.summaryTable}</dt>
          <dd className="fk-ltr-text">{table || l.none}</dd>
          <dt>{l.summaryColumns}</dt>
          <dd>{columns.length ? columns.join(', ') : l.none}</dd>
        </dl>
        <p>{fill(l.summaryFilters, { n: filters.filter((f) => f.column).length }, locale)}</p>
      </section>
    </div>
  )

  return (
    <SectionedModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onCancel()
      }}
      title={source?.name ?? l.title}
      subtitle={source && table ? fill(l.subtitle, { dialect: source.dialect, table }, locale) : undefined}
      icon={<Database />}
      tone="categorical-6"
      className="fk-ds-form"
      railLabel={l.rail}
      activeSection={section}
      onActiveSectionChange={(id) => setSection(id as SectionId)}
      {...(readOnly ? {} : { onSubmitShortcut: save, footer: <NodeFormFooter onSave={save} onCancel={onCancel} saveDisabled={!canSave} labels={{ save: l.save, cancel: l.cancel }} /> })}
      sections={[
        { id: 'connection', label: l.connection, content: connectionPane },
        { id: 'table', label: l.table, content: tablePane },
        { id: 'columns', label: l.columns, content: columnsPane },
        { id: 'filters', label: l.filters, content: filtersPane },
        { id: 'output', label: l.output, content: outputPane },
      ]}
    />
  )
}
