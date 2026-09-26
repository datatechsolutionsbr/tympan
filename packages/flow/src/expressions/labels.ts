import { defineLabels } from '../internal/labels'
import type { ExpressionFamily } from './model'

export interface ExpressionBuilderLabels {
  families: Record<ExpressionFamily, string>
  /** Friendly names of vocabulary values (comparison, arithmetic, sort order). */
  vocabulary: Record<string, string>
  /** Friendly operation names; missing ones fall back to the engine name. */
  operations: Record<string, string>
  family: string
  operation: string
  choose: string
  kindSwitch: string
  kindOperation: string
  kindReference: string
  kindLiteral: string
  references: string
  referencePath: string
  literal: string
  literalHint: string
  addItem: string
  removeItem: string
  itemCount: string
  item: string
  raw: string
  rawError: string
  unknownOperation: string
  depthLimit: string
  loadingOperations: string
  level: string
  loopHint: string
  bindings: Record<'item' | 'index' | 'accumulator', string>
}

export const expressionBuilderLabels = defineLabels<ExpressionBuilderLabels>('expressionBuilder', {
  en: {
    families: {
      aggregation: 'Aggregation',
      list: 'List shaping',
      set: 'Set algebra',
      object: 'Object shaping',
      arithmetic: 'Arithmetic',
      text: 'Text',
      logic: 'Logic',
      conversion: 'Type conversion',
      datetime: 'Date and time',
      pattern: 'Pattern matching',
      utility: 'Utility',
      core: 'Core',
    },
    vocabulary: {
      eq: 'equals',
      ne: 'differs from',
      gt: 'greater than',
      gte: 'at least',
      lt: 'less than',
      lte: 'at most',
      add: 'add',
      subtract: 'subtract',
      multiply: 'multiply',
      divide: 'divide',
      modulo: 'remainder',
      power: 'power',
      asc: 'ascending',
      desc: 'descending',
    },
    operations: {},
    family: 'Family',
    operation: 'Operation',
    choose: 'Choose an operation',
    kindSwitch: 'Operand kind',
    kindOperation: 'Operation',
    kindReference: 'Reference',
    kindLiteral: 'Value',
    references: 'Available references',
    referencePath: 'Reference path',
    literal: 'Value',
    literalHint: 'Text, a number, true, false or structured data',
    addItem: 'Add item',
    removeItem: 'Remove item {n}',
    itemCount: '{count, plural, one {# item} other {# items}}',
    item: 'Item {n}',
    raw: 'Structured value',
    rawError: 'Not valid structured data: {detail}',
    unknownOperation: 'The engine does not list the operation {name}. Its operands stay editable.',
    depthLimit: 'Deepest nesting level reached. Edit this part as structured text.',
    loadingOperations: 'Loading operations',
    level: '{key}, level {level}',
    loopHint: 'Inside this part, {names} refer to the element being processed.',
    bindings: { item: 'item', index: 'index', accumulator: 'accumulator' },
  },
  'pt-BR': {
    operations: {},
    families: {
      aggregation: 'Agregação',
      list: 'Listas',
      set: 'Conjuntos',
      object: 'Objetos',
      arithmetic: 'Aritmética',
      text: 'Texto',
      logic: 'Lógica',
      conversion: 'Conversão de tipo',
      datetime: 'Data e hora',
      pattern: 'Padrões',
      utility: 'Utilidades',
      core: 'Núcleo',
    },
    vocabulary: {
      eq: 'igual a',
      ne: 'diferente de',
      gt: 'maior que',
      gte: 'pelo menos',
      lt: 'menor que',
      lte: 'no máximo',
      add: 'somar',
      subtract: 'subtrair',
      multiply: 'multiplicar',
      divide: 'dividir',
      modulo: 'resto',
      power: 'potência',
      asc: 'crescente',
      desc: 'decrescente',
    },
    family: 'Família',
    operation: 'Operação',
    choose: 'Escolha uma operação',
    kindSwitch: 'Tipo de operando',
    kindOperation: 'Operação',
    kindReference: 'Referência',
    kindLiteral: 'Valor',
    references: 'Referências disponíveis',
    referencePath: 'Caminho da referência',
    literal: 'Valor',
    literalHint: 'Texto, número, true, false ou dado estruturado',
    addItem: 'Adicionar item',
    removeItem: 'Remover item {n}',
    itemCount: '{count, plural, one {# item} other {# itens}}',
    item: 'Item {n}',
    raw: 'Valor estruturado',
    rawError: 'Dado estruturado inválido: {detail}',
    unknownOperation: 'O motor não lista a operação {name}. Os operandos continuam editáveis.',
    depthLimit: 'Nível máximo de aninhamento. Edite esta parte como texto estruturado.',
    loadingOperations: 'Carregando operações',
    level: '{key}, nível {level}',
    loopHint: 'Dentro desta parte, {names} se referem ao elemento em processamento.',
    bindings: { item: 'item', index: 'índice', accumulator: 'acumulador' },
  },
  es: {
    families: {
      aggregation: 'Agregación',
      list: 'Listas',
      set: 'Conjuntos',
      object: 'Objetos',
      arithmetic: 'Aritmética',
      text: 'Texto',
      logic: 'Lógica',
      conversion: 'Conversión de tipo',
      datetime: 'Fecha y hora',
      pattern: 'Patrones',
      utility: 'Utilidades',
      core: 'Núcleo',
    },
    vocabulary: {
      eq: 'igual a',
      ne: 'distinto de',
      gt: 'mayor que',
      gte: 'al menos',
      lt: 'menor que',
      lte: 'como máximo',
      add: 'sumar',
      subtract: 'restar',
      multiply: 'multiplicar',
      divide: 'dividir',
      modulo: 'resto',
      power: 'potencia',
      asc: 'ascendente',
      desc: 'descendente',
    },
    operations: {},
    family: 'Familia',
    operation: 'Operación',
    choose: 'Elija una operación',
    kindSwitch: 'Tipo de operando',
    kindOperation: 'Operación',
    kindReference: 'Referencia',
    kindLiteral: 'Valor',
    references: 'Referencias disponibles',
    referencePath: 'Ruta de la referencia',
    literal: 'Valor',
    literalHint: 'Texto, número, true, false o dato estructurado',
    addItem: 'Añadir elemento',
    removeItem: 'Quitar elemento {n}',
    itemCount: '{count, plural, one {# elemento} other {# elementos}}',
    item: 'Elemento {n}',
    raw: 'Valor estructurado',
    rawError: 'Dato estructurado no válido: {detail}',
    unknownOperation: 'El motor no incluye la operación {name}. Sus operandos siguen siendo editables.',
    depthLimit: 'Nivel máximo de anidamiento. Edite esta parte como texto estructurado.',
    loadingOperations: 'Cargando operaciones',
    level: '{key}, nivel {level}',
    loopHint: 'Dentro de esta parte, {names} se refieren al elemento en proceso.',
    bindings: { item: 'elemento', index: 'índice', accumulator: 'acumulador' },
  },
})
