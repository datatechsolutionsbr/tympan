// Research steps: what a researcher adds to an analysis flow, shelved by
// research verb (take in, prepare, analyse, decide, give out). A host may pass
// its own shelves and steps; the built-in set below is the default. Engine
// primitives (start, end, branch) stay reachable on a collapsed shelf.

import {
  Archive,
  Bot,
  ChartColumn,
  ClipboardList,
  Filter,
  Flag,
  Gauge,
  GitBranch,
  GitMerge,
  Group,
  Hash,
  Play,
  Replace,
  Scale,
  Sigma,
  Table2,
  UserCheck,
  Users,
} from 'lucide-react'
import type { IconComponent } from '@fakhir/design-system'
import { resolveIcon } from '../catalog/icons'
import { defineLabels, fill } from '../internal/labels'
import type { FlowNode } from '../model/types'
import type { DataShape } from './shapes'

/** A value field of a step's configuration form. */
export interface StepField {
  key: string
  type: 'text' | 'number'
  /** Visible label; the built-in word for `key`, else the key. */
  label?: string
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
    'shelf.input': 'Input', 'shelf.input.purpose': 'Where the flow’s data comes from',
    'shelf.prepare': 'Prepare', 'shelf.prepare.purpose': 'Clean, join and reshape records',
    'shelf.analyse': 'Analyse', 'shelf.analyse.purpose': 'Count, measure and combine',
    'shelf.decide': 'Decide', 'shelf.decide.purpose': 'Classify or choose a path',
    'shelf.output': 'Output', 'shelf.output.purpose': 'What the flow hands over to cite',
    'shelf.advanced': 'Advanced', 'shelf.advanced.purpose': 'Engine pieces: start, end and branch',
    'frozen-edition': 'Frozen edition', 'frozen-edition.about': 'Records of a published edition, with hashes', 'frozen-edition.line': '{edition} · {count, plural, one {# record} other {# records}}',
    dataset: 'Dataset', 'dataset.about': 'A table uploaded or linked to the project', 'dataset.line': '{name}',
    'instrument-answers': 'Instrument answers', 'instrument-answers.about': 'Answers from people or agents to an instrument', 'instrument-answers.line': '{instrument}',
    filter: 'Filter', 'filter.about': 'Keeps only the records that meet a criterion', 'filter.line': '{before} → {after} records',
    join: 'Join', 'join.about': 'Joins two sets of records on a key', 'join.line': 'on {key}',
    group: 'Group', 'group.about': 'Gathers records by one or more columns', 'group.line': 'by {keys}',
    recode: 'Recode', 'recode.about': 'Maps a column’s values to categories', 'recode.line': '{column}: {scheme}',
    describe: 'Counts and descriptives', 'describe.about': 'Counts, means and spread', 'describe.line': '{counts}',
    reliability: 'Reliability α/AC1', 'reliability.about': 'Agreement between coders (Krippendorff’s α, Gwet’s AC1)', 'reliability.line': '{measure} · {coders} coders',
    'composite-index': 'Composite index', 'composite-index.about': 'Combines dimensions into one index', 'composite-index.line': '{formula}',
    'person-decision': 'Decision by a person', 'person-decision.about': 'A person reviews and chooses', 'person-decision.line': '{question}',
    'agent-decision': 'Decision by an agent', 'agent-decision.about': 'An AI agent classifies each record; every call is kept', 'agent-decision.line': '{model}',
    rule: 'Rule', 'rule.about': 'A deterministic rule chooses the path', 'rule.line': '{rule}',
    'citable-table': 'Citable table', 'citable-table.about': 'A table with a stable address for the manuscript', 'citable-table.line': '{caption}',
    'citable-chart': 'Citable chart', 'citable-chart.about': 'A chart with a stable address for the manuscript', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Number for the manuscript', 'manuscript-number.about': 'One value with its proof, ready to cite in the text', 'manuscript-number.line': '{name}',
    start: 'Start', 'start.about': 'Where the engine begins',
    end: 'End', 'end.about': 'Where the engine stops',
    branch: 'Branch', 'branch.about': 'Follows one of two paths',
    'field.edition': 'Edition', 'field.count': 'Records', 'field.name': 'Name', 'field.instrument': 'Instrument', 'field.criterion': 'Criterion',
    'field.before': 'Records in', 'field.after': 'Records out', 'field.key': 'Key', 'field.keys': 'Columns', 'field.column': 'Column', 'field.scheme': 'Scheme',
    'field.counts': 'Counts', 'field.measure': 'Measure', 'field.coders': 'Coders', 'field.formula': 'Formula', 'field.question': 'Question',
    'field.model': 'Model', 'field.rule': 'Rule', 'field.caption': 'Caption',
  },
  'pt-BR': {
    'shelf.input': 'Entrada', 'shelf.input.purpose': 'De onde vêm os dados do fluxo',
    'shelf.prepare': 'Preparar', 'shelf.prepare.purpose': 'Limpar, juntar e reorganizar registros',
    'shelf.analyse': 'Analisar', 'shelf.analyse.purpose': 'Contar, medir e combinar',
    'shelf.decide': 'Decidir', 'shelf.decide.purpose': 'Classificar ou escolher um caminho',
    'shelf.output': 'Saída', 'shelf.output.purpose': 'O que o fluxo entrega para citar',
    'shelf.advanced': 'Avançado', 'shelf.advanced.purpose': 'Peças do motor: início, fim e desvio',
    'frozen-edition': 'Edição congelada', 'frozen-edition.about': 'Registros de uma edição publicada, com hashes', 'frozen-edition.line': '{edition} · {count, plural, one {# registro} other {# registros}}',
    dataset: 'Conjunto de dados', 'dataset.about': 'Uma tabela enviada ou ligada ao projeto', 'dataset.line': '{name}',
    'instrument-answers': 'Respostas de instrumento', 'instrument-answers.about': 'Respostas de pessoas ou agentes a um instrumento', 'instrument-answers.line': '{instrument}',
    filter: 'Filtrar', 'filter.about': 'Mantém só os registros que atendem a um critério', 'filter.line': '{before} → {after} registros',
    join: 'Juntar', 'join.about': 'Une dois conjuntos de registros por uma chave', 'join.line': 'por {key}',
    group: 'Agrupar', 'group.about': 'Reúne registros por uma ou mais colunas', 'group.line': 'por {keys}',
    recode: 'Recodificar', 'recode.about': 'Troca os valores de uma coluna por categorias', 'recode.line': '{column}: {scheme}',
    describe: 'Contagem e descritivas', 'describe.about': 'Contagens, médias e dispersão', 'describe.line': '{counts}',
    reliability: 'Confiabilidade α/AC1', 'reliability.about': 'Concordância entre codificadores (α de Krippendorff, AC1 de Gwet)', 'reliability.line': '{measure} · {coders} codificadores',
    'composite-index': 'Índice composto', 'composite-index.about': 'Combina dimensões em um único índice', 'composite-index.line': '{formula}',
    'person-decision': 'Decisão por pessoa', 'person-decision.about': 'Uma pessoa revisa e escolhe', 'person-decision.line': '{question}',
    'agent-decision': 'Decisão por agente', 'agent-decision.about': 'Um agente de IA classifica cada registro; cada chamada fica guardada', 'agent-decision.line': '{model}',
    rule: 'Regra', 'rule.about': 'Uma regra determinística escolhe o caminho', 'rule.line': '{rule}',
    'citable-table': 'Tabela citável', 'citable-table.about': 'Tabela com endereço estável para o manuscrito', 'citable-table.line': '{caption}',
    'citable-chart': 'Gráfico citável', 'citable-chart.about': 'Gráfico com endereço estável para o manuscrito', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Número para o manuscrito', 'manuscript-number.about': 'Um valor com sua prova, pronto para citar no texto', 'manuscript-number.line': '{name}',
    start: 'Início', 'start.about': 'Onde o motor começa',
    end: 'Fim', 'end.about': 'Onde o motor para',
    branch: 'Desvio', 'branch.about': 'Segue por um de dois caminhos',
    'field.edition': 'Edição', 'field.count': 'Registros', 'field.name': 'Nome', 'field.instrument': 'Instrumento', 'field.criterion': 'Critério',
    'field.before': 'Registros de entrada', 'field.after': 'Registros de saída', 'field.key': 'Chave', 'field.keys': 'Colunas', 'field.column': 'Coluna', 'field.scheme': 'Esquema',
    'field.counts': 'Contagens', 'field.measure': 'Medida', 'field.coders': 'Codificadores', 'field.formula': 'Fórmula', 'field.question': 'Pergunta',
    'field.model': 'Modelo', 'field.rule': 'Regra', 'field.caption': 'Legenda',
  },
  es: {
    'shelf.input': 'Entrada', 'shelf.input.purpose': 'De dónde vienen los datos del flujo',
    'shelf.prepare': 'Preparar', 'shelf.prepare.purpose': 'Limpiar, unir y reorganizar registros',
    'shelf.analyse': 'Analizar', 'shelf.analyse.purpose': 'Contar, medir y combinar',
    'shelf.decide': 'Decidir', 'shelf.decide.purpose': 'Clasificar o elegir un camino',
    'shelf.output': 'Salida', 'shelf.output.purpose': 'Lo que el flujo entrega para citar',
    'shelf.advanced': 'Avanzado', 'shelf.advanced.purpose': 'Piezas del motor: inicio, fin y desvío',
    'frozen-edition': 'Edición congelada', 'frozen-edition.about': 'Registros de una edición publicada, con hashes', 'frozen-edition.line': '{edition} · {count, plural, one {# registro} other {# registros}}',
    dataset: 'Conjunto de datos', 'dataset.about': 'Una tabla subida o vinculada al proyecto', 'dataset.line': '{name}',
    'instrument-answers': 'Respuestas de instrumento', 'instrument-answers.about': 'Respuestas de personas o agentes a un instrumento', 'instrument-answers.line': '{instrument}',
    filter: 'Filtrar', 'filter.about': 'Conserva solo los registros que cumplen un criterio', 'filter.line': '{before} → {after} registros',
    join: 'Unir', 'join.about': 'Une dos conjuntos de registros por una clave', 'join.line': 'por {key}',
    group: 'Agrupar', 'group.about': 'Reúne registros por una o más columnas', 'group.line': 'por {keys}',
    recode: 'Recodificar', 'recode.about': 'Cambia los valores de una columna por categorías', 'recode.line': '{column}: {scheme}',
    describe: 'Conteo y descriptivos', 'describe.about': 'Conteos, medias y dispersión', 'describe.line': '{counts}',
    reliability: 'Fiabilidad α/AC1', 'reliability.about': 'Acuerdo entre codificadores (α de Krippendorff, AC1 de Gwet)', 'reliability.line': '{measure} · {coders} codificadores',
    'composite-index': 'Índice compuesto', 'composite-index.about': 'Combina dimensiones en un solo índice', 'composite-index.line': '{formula}',
    'person-decision': 'Decisión de una persona', 'person-decision.about': 'Una persona revisa y elige', 'person-decision.line': '{question}',
    'agent-decision': 'Decisión de un agente', 'agent-decision.about': 'Un agente de IA clasifica cada registro; cada llamada queda guardada', 'agent-decision.line': '{model}',
    rule: 'Regla', 'rule.about': 'Una regla determinista elige el camino', 'rule.line': '{rule}',
    'citable-table': 'Tabla citable', 'citable-table.about': 'Tabla con dirección estable para el manuscrito', 'citable-table.line': '{caption}',
    'citable-chart': 'Gráfico citable', 'citable-chart.about': 'Gráfico con dirección estable para el manuscrito', 'citable-chart.line': '{caption}',
    'manuscript-number': 'Número para el manuscrito', 'manuscript-number.about': 'Un valor con su prueba, listo para citar en el texto', 'manuscript-number.line': '{name}',
    start: 'Inicio', 'start.about': 'Donde empieza el motor',
    end: 'Fin', 'end.about': 'Donde se detiene el motor',
    branch: 'Desvío', 'branch.about': 'Sigue uno de dos caminos',
    'field.edition': 'Edición', 'field.count': 'Registros', 'field.name': 'Nombre', 'field.instrument': 'Instrumento', 'field.criterion': 'Criterio',
    'field.before': 'Registros de entrada', 'field.after': 'Registros de salida', 'field.key': 'Clave', 'field.keys': 'Columnas', 'field.column': 'Columna', 'field.scheme': 'Esquema',
    'field.counts': 'Conteos', 'field.measure': 'Medida', 'field.coders': 'Codificadores', 'field.formula': 'Fórmula', 'field.question': 'Pregunta',
    'field.model': 'Modelo', 'field.rule': 'Regla', 'field.caption': 'Leyenda',
  },
})

// ---- built-in catalog ----------------------------------------------------

const f = (...keys: string[]): StepField[] => keys.map((key) => ({ key, type: key === 'count' || key === 'before' || key === 'coders' ? 'number' : 'text' }))
const R = ['records'] as const
const T = ['table'] as const

const BUILT_IN: StepCatalog = {
  shelves: [{ id: 'input' }, { id: 'prepare' }, { id: 'analyse' }, { id: 'decide' }, { id: 'output' }, { id: 'advanced', folded: true }],
  steps: [
    { id: 'frozen-edition', verb: 'input', icon: Archive, inputs: [], output: 'records', fields: f('edition', 'count') },
    { id: 'dataset', verb: 'input', icon: Table2, inputs: [], output: 'table', fields: f('name') },
    { id: 'instrument-answers', verb: 'input', icon: ClipboardList, inputs: [], output: 'records', fields: f('instrument') },
    { id: 'filter', verb: 'prepare', icon: Filter, inputs: [R], output: 'records', fields: f('criterion', 'before', 'after') },
    { id: 'join', verb: 'prepare', icon: GitMerge, inputs: [R, R], output: 'records', fields: f('key') },
    { id: 'group', verb: 'prepare', icon: Group, inputs: [R], output: 'table', fields: f('keys') },
    { id: 'recode', verb: 'prepare', icon: Replace, inputs: [R], output: 'records', fields: f('column', 'scheme') },
    { id: 'describe', verb: 'analyse', icon: Sigma, inputs: [['table', 'records']], output: 'table', fields: f('counts') },
    { id: 'reliability', verb: 'analyse', icon: Users, inputs: [R], output: 'number', fields: f('measure', 'coders') },
    { id: 'composite-index', verb: 'analyse', icon: Gauge, inputs: [T], output: 'number', fields: f('formula') },
    { id: 'person-decision', verb: 'decide', icon: UserCheck, inputs: [['records', 'table', 'number']], output: 'decision', fields: f('question') },
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

/** The card's one-line summary, or null while a value it names is not set. */
export function summaryLine(step: Pick<ReadyStep, 'summary'>, data: Record<string, unknown>, locale: string): string | null {
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
