// Research steps: what a researcher adds to an analysis flow, shelved by
// research verb (take in, prepare, analyse, decide, give out). A host may pass
// its own shelves and steps; the built-in set below is the default. Engine
// primitives (start, end, branch) stay reachable on a collapsed shelf.

import { Bot, ChartColumn, CornerDownRight, FileText, Filter, Flag, GitBranch, Hash, Lock, Play, Scale, Shapes, Sigma, Split, SunMedium, Table2, UserCheck } from 'lucide-react'
import type { IconComponent } from '@fakhir/design-system'
import { resolveIcon } from '../catalog/icons'
import { defineLabels, fill } from '../internal/labels'
import type { FlowNode } from '../model/types'
import type { DataShape } from './shapes'

/** A value field of a step's configuration form. */
export interface StepField {
  key: string
  /** `choice` picks one of `options` (the current value is always offered). */
  type: 'text' | 'number' | 'choice'
  /** Visible label; the built-in word for `key`, else the key. */
  label?: string
  /** Option values of a choice; each shows its built-in word `option.<value>` when there is one. */
  options?: readonly string[]
}

export interface StepSpec {
  id: string
  /** Shelf id (research verb). */
  verb: string
  icon: IconComponent | string
  /** Node kind created on the canvas: 'step' unless an engine primitive. */
  kind?: string
  name?: string
  description?: string
  /** Accepted shapes per input, in port order (empty for a source step). */
  inputs: ReadonlyArray<readonly DataShape[]>
  output: DataShape | null
  usesAI?: boolean
  /** ICU template over the node data: the one-line summary on the card. */
  summary?: string
  fields?: readonly StepField[]
  defaults?: Record<string, unknown>
  /** Engine primitive: no typed ports. */
  primitive?: boolean
}

export interface VerbShelf {
  id: string
  title?: string
  purpose?: string
  /** Starts folded (the engine primitives). */
  folded?: boolean
}

export interface StepCatalog {
  shelves: readonly VerbShelf[]
  steps: readonly StepSpec[]
}

/** A spec with its words for the current locale. */
export interface ReadyStep extends Omit<StepSpec, 'icon'> {
  icon: IconComponent
  kind: string
  name: string
  description: string
}

export interface ReadyShelf extends VerbShelf {
  title: string
  purpose: string
  steps: ReadyStep[]
}

// ---- built-in words ------------------------------------------------------

type Words = Record<string, string>

export const researchStepWords = defineLabels<Words>('researchSteps', {
  en: {
    'shelf.input': 'Input', 'shelf.input.purpose': 'Where the data comes in',
    'shelf.prepare': 'Prepare', 'shelf.prepare.purpose': 'Get the data ready',
    'shelf.analyse': 'Analyse', 'shelf.analyse.purpose': 'Calculate',
    'shelf.decide': 'Decide', 'shelf.decide.purpose': 'Recorded choices',
    'shelf.output': 'Output', 'shelf.output.purpose': 'What becomes citable',
    'shelf.advanced': 'Advanced', 'shelf.advanced.purpose': 'Engine pieces: start, end and branch',
    'frozen-edition': 'Frozen edition', 'frozen-edition.about': 'records of a citable edition', 'frozen-edition.line': '{edition} · {count, plural, one {# record} other {# records}}',
    'dataset': 'Dataset', 'dataset.about': 'imported table, with codebook', 'dataset.line': '{name}',
    'instrument-answers': 'Instrument answers', 'instrument-answers.about': 'submitted answers, by assignment', 'instrument-answers.line': '{instrument}',
    'filter': 'Filter', 'filter.about': 'keeps what meets a condition', 'filter.line': '{before} → {after} records',
    'join': 'Join', 'join.about': 'joins two inputs on a key', 'join.line': 'on {key}',
    'group': 'Group', 'group.about': 'groups by fields and summarises', 'group.line': 'by {keys}',
    'recode': 'Recode', 'recode.about': 'maps values to categories', 'recode.line': '{column}: {scheme}',
    'describe': 'Counts and descriptives', 'describe.about': 'frequencies, mean, median, CI', 'describe.line': '{counts}',
    'reliability': 'Reliability', 'reliability.about': 'Krippendorff\'s α, Gwet\'s AC1', 'reliability.line': '{measure}',
    'composite-index': 'Composite index', 'composite-index.about': 'declared × lived, gap per dimension', 'composite-index.line': '{formula}',
    'person-decision': 'Decision by a person', 'person-decision.about': 'a person chooses between options', 'person-decision.line': '{question}',
    'agent-decision': 'Decision by an agent', 'agent-decision.about': 'typed choice with probabilities', 'agent-decision.line': '{model}',
    'rule': 'Rule', 'rule.about': 'deterministic condition, no model', 'rule.line': '{rule}',
    'citable-table': 'Citable table', 'citable-table.about': 'with edition, version and hash', 'citable-table.line': '{caption}',
    'citable-chart': 'Citable chart', 'citable-chart.about': 'Vega-Lite generated from the run', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Number for the manuscript', 'manuscript-number.about': 'links a value to a sentence', 'manuscript-number.line': '{name}',
    'start': 'Start', 'start.about': 'Where the engine begins',
    'end': 'End', 'end.about': 'Where the engine stops',
    'branch': 'Branch', 'branch.about': 'Follows one of two paths',
    'field.edition': 'Edition', 'field.count': 'Records', 'field.name': 'Name', 'field.instrument': 'Instrument', 'field.criterion': 'Condition', 'field.before': 'Records in', 'field.after': 'Records out', 'field.key': 'Key', 'field.keys': 'Group by', 'field.aggregate': 'Summary per group', 'field.column': 'Column', 'field.scheme': 'Scheme', 'field.counts': 'Counts', 'field.measure': 'Measure', 'field.formula': 'Formula', 'field.question': 'Question', 'field.model': 'Model', 'field.rule': 'Rule', 'field.caption': 'Caption',
    'option.count': 'count of records', 'option.mean': 'mean', 'option.median': 'median',
  },
  'pt-BR': {
    'shelf.input': 'Entrada', 'shelf.input.purpose': 'Onde os dados entram',
    'shelf.prepare': 'Preparar', 'shelf.prepare.purpose': 'Deixar os dados prontos',
    'shelf.analyse': 'Analisar', 'shelf.analyse.purpose': 'Calcular',
    'shelf.decide': 'Decidir', 'shelf.decide.purpose': 'Escolhas registradas',
    'shelf.output': 'Saída', 'shelf.output.purpose': 'O que vira citável',
    'shelf.advanced': 'Avançado', 'shelf.advanced.purpose': 'Peças do motor: início, fim e desvio',
    'frozen-edition': 'Edição congelada', 'frozen-edition.about': 'registros de uma edição citável', 'frozen-edition.line': '{edition} · {count, plural, one {# registro} other {# registros}}',
    'dataset': 'Conjunto de dados', 'dataset.about': 'tabela importada, com codebook', 'dataset.line': '{name}',
    'instrument-answers': 'Respostas de instrumento', 'instrument-answers.about': 'respostas enviadas, por atribuição', 'instrument-answers.line': '{instrument}',
    'filter': 'Filtrar', 'filter.about': 'mantém o que atende a uma condição', 'filter.line': '{before} → {after} registros',
    'join': 'Juntar', 'join.about': 'une duas entradas por uma chave', 'join.line': 'por {key}',
    'group': 'Agrupar', 'group.about': 'agrupa por campos e resume', 'group.line': 'por {keys}',
    'recode': 'Recodificar', 'recode.about': 'mapeia valores para categorias', 'recode.line': '{column}: {scheme}',
    'describe': 'Contagem e descritivas', 'describe.about': 'frequências, média, mediana, IC', 'describe.line': '{counts}',
    'reliability': 'Confiabilidade', 'reliability.about': 'α de Krippendorff, AC1 de Gwet', 'reliability.line': '{measure}',
    'composite-index': 'Índice composto', 'composite-index.about': 'declarado × vivido, lacuna por dimensão', 'composite-index.line': '{formula}',
    'person-decision': 'Decisão por pessoa', 'person-decision.about': 'uma pessoa escolhe entre opções', 'person-decision.line': '{question}',
    'agent-decision': 'Decisão por agente', 'agent-decision.about': 'escolha tipada com probabilidades', 'agent-decision.line': '{model}',
    'rule': 'Regra', 'rule.about': 'condição determinística, sem modelo', 'rule.line': '{rule}',
    'citable-table': 'Tabela citável', 'citable-table.about': 'com edição, versão e hash', 'citable-table.line': '{caption}',
    'citable-chart': 'Gráfico citável', 'citable-chart.about': 'Vega-Lite gerado da execução', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Número para o manuscrito', 'manuscript-number.about': 'liga um valor a uma frase', 'manuscript-number.line': '{name}',
    'start': 'Início', 'start.about': 'Onde o motor começa',
    'end': 'Fim', 'end.about': 'Onde o motor para',
    'branch': 'Desvio', 'branch.about': 'Segue por um de dois caminhos',
    'field.edition': 'Edição', 'field.count': 'Registros', 'field.name': 'Nome', 'field.instrument': 'Instrumento', 'field.criterion': 'Condição', 'field.before': 'Registros de entrada', 'field.after': 'Registros de saída', 'field.key': 'Chave', 'field.keys': 'Agrupar por', 'field.aggregate': 'Resumo por grupo', 'field.column': 'Coluna', 'field.scheme': 'Esquema', 'field.counts': 'Contagens', 'field.measure': 'Medida', 'field.formula': 'Fórmula', 'field.question': 'Pergunta', 'field.model': 'Modelo', 'field.rule': 'Regra', 'field.caption': 'Legenda',
    'option.count': 'contagem de registros', 'option.mean': 'média', 'option.median': 'mediana',
  },
  es: {
    'shelf.input': 'Entrada', 'shelf.input.purpose': 'Dónde entran los datos',
    'shelf.prepare': 'Preparar', 'shelf.prepare.purpose': 'Dejar los datos listos',
    'shelf.analyse': 'Analizar', 'shelf.analyse.purpose': 'Calcular',
    'shelf.decide': 'Decidir', 'shelf.decide.purpose': 'Elecciones registradas',
    'shelf.output': 'Salida', 'shelf.output.purpose': 'Lo que se vuelve citable',
    'shelf.advanced': 'Avanzado', 'shelf.advanced.purpose': 'Piezas del motor: inicio, fin y desvío',
    'frozen-edition': 'Edición congelada', 'frozen-edition.about': 'registros de una edición citable', 'frozen-edition.line': '{edition} · {count, plural, one {# registro} other {# registros}}',
    'dataset': 'Conjunto de datos', 'dataset.about': 'tabla importada, con libro de códigos', 'dataset.line': '{name}',
    'instrument-answers': 'Respuestas de instrumento', 'instrument-answers.about': 'respuestas enviadas, por asignación', 'instrument-answers.line': '{instrument}',
    'filter': 'Filtrar', 'filter.about': 'conserva lo que cumple una condición', 'filter.line': '{before} → {after} registros',
    'join': 'Unir', 'join.about': 'une dos entradas por una clave', 'join.line': 'por {key}',
    'group': 'Agrupar', 'group.about': 'agrupa por campos y resume', 'group.line': 'por {keys}',
    'recode': 'Recodificar', 'recode.about': 'asigna valores a categorías', 'recode.line': '{column}: {scheme}',
    'describe': 'Conteo y descriptivos', 'describe.about': 'frecuencias, media, mediana, IC', 'describe.line': '{counts}',
    'reliability': 'Fiabilidad', 'reliability.about': 'α de Krippendorff, AC1 de Gwet', 'reliability.line': '{measure}',
    'composite-index': 'Índice compuesto', 'composite-index.about': 'declarado × vivido, brecha por dimensión', 'composite-index.line': '{formula}',
    'person-decision': 'Decisión de una persona', 'person-decision.about': 'una persona elige entre opciones', 'person-decision.line': '{question}',
    'agent-decision': 'Decisión de un agente', 'agent-decision.about': 'elección tipada con probabilidades', 'agent-decision.line': '{model}',
    'rule': 'Regla', 'rule.about': 'condición determinista, sin modelo', 'rule.line': '{rule}',
    'citable-table': 'Tabla citable', 'citable-table.about': 'con edición, versión y hash', 'citable-table.line': '{caption}',
    'citable-chart': 'Gráfico citable', 'citable-chart.about': 'Vega-Lite generado de la ejecución', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Número para el manuscrito', 'manuscript-number.about': 'vincula un valor a una frase', 'manuscript-number.line': '{name}',
    'start': 'Inicio', 'start.about': 'Donde empieza el motor',
    'end': 'Fin', 'end.about': 'Donde se detiene el motor',
    'branch': 'Desvío', 'branch.about': 'Sigue uno de dos caminos',
    'field.edition': 'Edición', 'field.count': 'Registros', 'field.name': 'Nombre', 'field.instrument': 'Instrumento', 'field.criterion': 'Condición', 'field.before': 'Registros de entrada', 'field.after': 'Registros de salida', 'field.key': 'Clave', 'field.keys': 'Agrupar por', 'field.aggregate': 'Resumen por grupo', 'field.column': 'Columna', 'field.scheme': 'Esquema', 'field.counts': 'Conteos', 'field.measure': 'Medida', 'field.formula': 'Fórmula', 'field.question': 'Pregunta', 'field.model': 'Modelo', 'field.rule': 'Regla', 'field.caption': 'Leyenda',
    'option.count': 'conteo de registros', 'option.mean': 'media', 'option.median': 'mediana',
  },
})

// ---- built-in catalog ----------------------------------------------------

const f = (...keys: string[]): StepField[] => keys.map((key) => ({ key, type: key === 'count' || key === 'before' || key === 'coders' ? 'number' : 'text' }))
const R = ['records'] as const
const T = ['table'] as const

const BUILT_IN: StepCatalog = {
  shelves: [{ id: 'input' }, { id: 'prepare' }, { id: 'analyse' }, { id: 'decide' }, { id: 'output' }, { id: 'advanced', folded: true }],
  steps: [
    { id: 'frozen-edition', verb: 'input', icon: Lock, inputs: [], output: 'records', fields: f('edition', 'count') },
    { id: 'dataset', verb: 'input', icon: Table2, inputs: [], output: 'table', fields: f('name') },
    { id: 'instrument-answers', verb: 'input', icon: FileText, inputs: [], output: 'table', fields: f('instrument') },
    { id: 'filter', verb: 'prepare', icon: Filter, inputs: [R], output: 'records', fields: f('criterion', 'before', 'after') },
    { id: 'join', verb: 'prepare', icon: CornerDownRight, inputs: [T, T], output: 'table', fields: f('key') },
    { id: 'group', verb: 'prepare', icon: Split, inputs: [R], output: 'table', fields: [{ key: 'keys', type: 'choice' }, { key: 'aggregate', type: 'choice', options: ['count', 'mean', 'median'] }] },
    { id: 'recode', verb: 'prepare', icon: SunMedium, inputs: [R], output: 'records', fields: f('column', 'scheme') },
    { id: 'describe', verb: 'analyse', icon: Sigma, inputs: [T], output: 'table', fields: f('counts') },
    { id: 'reliability', verb: 'analyse', icon: ChartColumn, inputs: [T], output: 'number', fields: f('measure') },
    { id: 'composite-index', verb: 'analyse', icon: Shapes, inputs: [T], output: 'table', fields: f('formula') },
    { id: 'person-decision', verb: 'decide', icon: UserCheck, inputs: [R], output: 'decision', fields: f('question') },
    { id: 'agent-decision', verb: 'decide', icon: Bot, inputs: [R], output: 'decision', usesAI: true, fields: f('model') },
    { id: 'rule', verb: 'decide', icon: Scale, inputs: [R], output: 'decision', fields: f('rule') },
    { id: 'citable-table', verb: 'output', icon: Table2, inputs: [T], output: 'table', fields: f('caption') },
    { id: 'citable-chart', verb: 'output', icon: ChartColumn, inputs: [T], output: 'chart', fields: f('caption') },
    { id: 'manuscript-number', verb: 'output', icon: Hash, inputs: [['number']], output: 'number', fields: f('name') },
    { id: 'start', verb: 'advanced', icon: Play, kind: 'start', inputs: [], output: null, primitive: true },
    { id: 'end', verb: 'advanced', icon: Flag, kind: 'end', inputs: [], output: null, primitive: true },
    { id: 'branch', verb: 'advanced', icon: GitBranch, kind: 'if-else', inputs: [], output: null, primitive: true },
  ],
}
export const researchStepCatalog: StepCatalog = Object.freeze(BUILT_IN)

/** Node kind research steps are drawn with. */
export const STEP_KIND = 'step'

/** Words for a catalog in one locale: host text wins, then the built-in words, then the id. */
export function readyCatalog(catalog: StepCatalog, words: Words): { shelves: ReadyShelf[]; steps: ReadyStep[]; byId: Map<string, ReadyStep> } {
  const steps: ReadyStep[] = catalog.steps.map((s) => ({
    ...s,
    icon: typeof s.icon === 'string' ? resolveIcon(s.icon) : s.icon,
    kind: s.kind ?? STEP_KIND,
    name: s.name ?? words[s.id] ?? s.id,
    description: s.description ?? words[`${s.id}.about`] ?? '',
    ...(s.summary ?? words[`${s.id}.line`] ? { summary: s.summary ?? words[`${s.id}.line`] } : {}),
    ...(s.fields ? { fields: s.fields.map((x) => ({ ...x, label: x.label ?? words[`field.${x.key}`] ?? x.key })) } : {}),
  }))
  const shelves = catalog.shelves.map((sh) => ({
    ...sh,
    title: sh.title ?? words[`shelf.${sh.id}`] ?? sh.id,
    purpose: sh.purpose ?? words[`shelf.${sh.id}.purpose`] ?? '',
    steps: steps.filter((s) => s.verb === sh.id),
  }))
  return { shelves, steps, byId: new Map(steps.map((s) => [s.id, s])) }
}

/** The spec a node was made from (research steps and the engine primitives). */
export function specOfNode(node: Pick<FlowNode, 'kind' | 'data'>, byId: ReadonlyMap<string, ReadyStep>): ReadyStep | undefined {
  if (node.kind === STEP_KIND) return typeof node.data.stepId === 'string' ? byId.get(node.data.stepId) : undefined
  for (const s of byId.values()) if (s.primitive && s.kind === node.kind) return s
  return undefined
}

const SLOT = /\{(\w+)/g

/** The card's one-line summary (a host `line` wins), or null while a value it names is not set. */
export function summaryLine(step: Pick<ReadyStep, 'summary'>, data: Record<string, unknown>, locale: string): string | null {
  if (typeof data.line === 'string' && data.line) return data.line
  if (!step.summary) return null
  const values: Record<string, string | number> = {}
  for (const [, key] of step.summary.matchAll(SLOT)) {
    const v = data[key!]
    if (v === undefined || v === null || v === '') return null
    if (typeof v === 'string' || typeof v === 'number') values[key!] = v
    else return null
  }
  return fill(step.summary, values, locale)
}
