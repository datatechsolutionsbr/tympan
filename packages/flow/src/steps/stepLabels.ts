// Interface words of the research-step editor parts (palette, add picker,
// card, issue bar, side panel, list view, dock items).

import { defineLabels } from '../internal/labels'

export interface StepEditorWords {
  paletteTitle: string
  search: string
  searchKey: string
  show: string
  all: string
  noAI: string
  recent: string
  ai: string
  aiOff: string
  noMatch: string
  noRecent: string
  dragHint: string
  addNamed: string
  pickerAfter: string
  pickerBetween: string
  pickerFree: string
  pickerSearch: string
  accepts: string
  nothingAccepts: string
  results: string
  addAfter: string
  notSet: string
  runOk: string
  runRunning: string
  runFailed: string
  mismatch: string
  nothing: string
  inputs: string
  output: string
  dropHere: string
  issueCount: string
  fixInsert: string
  fixUnlink: string
  flowOk: string
  summaryTitle: string
  version: string
  runs: string
  stepCount: string
  usesAI: string
  yes: string
  no: string
  deterministic: string
  seed: string
  citable: string
  none: string
  runFlow: string
  validate: string
  validOk: string
  stepTitle: string
  preview: string
  noPreview: string
  testStep: string
  remove: string
  backToSummary: string
  listTitle: string
  listHint: string
  addHere: string
  more: string
  moveUp: string
  moveDown: string
  configure: string
  toolAdd: string
  toolArrange: string
  toolFit: string
  toolList: string
  toolSearch: string
  toolSelect: string
  toolPan: string
  added: string
  moved: string
}

export const stepEditorWords = defineLabels<StepEditorWords>('stepEditor', {
  en: {
    paletteTitle: 'Steps', search: 'Find a step', searchKey: 'Shortcut: /', show: 'Show', all: 'All', noAI: 'Without AI', recent: 'Recent',
    ai: 'AI', aiOff: 'AI is off in this project', noMatch: 'No step matches “{query}”', noRecent: 'Steps you add appear here',
    dragHint: 'Drag onto the canvas or press Enter', addNamed: 'Add {name}',
    pickerAfter: 'Add after “{name}”', pickerBetween: 'Insert between “{from}” and “{to}”', pickerFree: 'Add a step', pickerSearch: 'Find a step',
    accepts: 'Takes {shape}', nothingAccepts: 'No step takes {shape}', results: '{count, plural, =0 {No steps} one {# step} other {# steps}}',
    addAfter: 'Add a step after “{name}”', notSet: 'not configured', runOk: 'ok', runRunning: 'running', runFailed: 'failed',
    mismatch: 'expects {expects}; gets {gets}', nothing: 'nothing', inputs: 'Takes', output: 'Gives', dropHere: 'Drop to add “{name}”',
    issueCount: '{count, plural, one {# link with a mismatched type} other {# links with mismatched types}}',
    fixInsert: 'Insert “{step}” between “{from}” and “{to}”', fixUnlink: 'Remove the link from “{from}” to “{to}”', flowOk: 'Every link fits',
    summaryTitle: 'Flow summary', version: 'Version', runs: 'Runs over the edition', stepCount: 'Steps', usesAI: 'Uses AI', yes: 'yes', no: 'no',
    deterministic: 'Deterministic', seed: 'seed {seed}', citable: 'Citable outputs', none: 'none', runFlow: 'Run over the edition', validate: 'Validate flow',
    validOk: 'No problems found', stepTitle: 'Title', preview: 'Output preview', noPreview: 'No preview yet. Test this step to see its output.',
    testStep: 'Test this step', remove: 'Remove', backToSummary: 'Back to the summary',
    listTitle: 'Flow steps', listHint: 'Arrows move, Alt+arrows reorder, A adds, Enter configures', addHere: 'Add a step here', more: 'More for “{name}”',
    moveUp: 'Move up', moveDown: 'Move down', configure: 'Configure',
    toolAdd: 'Add a step', toolArrange: 'Rearrange', toolFit: 'Fit to view', toolList: 'Show as list', toolSearch: 'Find a step', toolSelect: 'Select', toolPan: 'Move the view',
    added: '{name} added', moved: '{name} moved to position {position}',
  },
  'pt-BR': {
    paletteTitle: 'Passos', search: 'Buscar passo', searchKey: 'Atalho: /', show: 'Mostrar', all: 'Todos', noAI: 'Sem IA', recent: 'Recentes',
    ai: 'IA', aiOff: 'IA desativada neste projeto', noMatch: 'Nenhum passo corresponde a “{query}”', noRecent: 'Os passos que você adicionar aparecem aqui',
    dragHint: 'Arraste para o canvas ou pressione Enter', addNamed: 'Adicionar {name}',
    pickerAfter: 'Adicionar depois de “{name}”', pickerBetween: 'Inserir entre “{from}” e “{to}”', pickerFree: 'Adicionar passo', pickerSearch: 'Buscar passo',
    accepts: 'Recebe {shape}', nothingAccepts: 'Nenhum passo recebe {shape}', results: '{count, plural, =0 {Nenhum passo} one {# passo} other {# passos}}',
    addAfter: 'Adicionar passo depois de “{name}”', notSet: 'não configurado', runOk: 'ok', runRunning: 'rodando', runFailed: 'falhou',
    mismatch: 'espera {expects}; recebe {gets}', nothing: 'nada', inputs: 'Recebe', output: 'Entrega', dropHere: 'Solte para adicionar “{name}”',
    issueCount: '{count, plural, one {# ligação com tipo incompatível} other {# ligações com tipos incompatíveis}}',
    fixInsert: 'Inserir “{step}” entre “{from}” e “{to}”', fixUnlink: 'Remover a ligação de “{from}” para “{to}”', flowOk: 'Todas as ligações encaixam',
    summaryTitle: 'Resumo do fluxo', version: 'Versão', runs: 'Execuções sobre a edição', stepCount: 'Passos', usesAI: 'Usa IA', yes: 'sim', no: 'não',
    deterministic: 'Determinístico', seed: 'semente {seed}', citable: 'Saídas citáveis', none: 'nenhuma', runFlow: 'Executar sobre a edição', validate: 'Validar fluxo',
    validOk: 'Nenhum problema encontrado', stepTitle: 'Título', preview: 'Prévia da saída', noPreview: 'Ainda sem prévia. Teste este passo para ver a saída.',
    testStep: 'Testar este passo', remove: 'Remover', backToSummary: 'Voltar ao resumo',
    listTitle: 'Passos do fluxo', listHint: 'Setas movem, Alt+setas reordenam, A adiciona, Enter configura', addHere: 'Adicionar passo aqui', more: 'Mais ações para “{name}”',
    moveUp: 'Subir', moveDown: 'Descer', configure: 'Configurar',
    toolAdd: 'Adicionar passo', toolArrange: 'Reorganizar', toolFit: 'Ajustar à tela', toolList: 'Ver como lista', toolSearch: 'Buscar passo', toolSelect: 'Selecionar', toolPan: 'Mover',
    added: '{name} adicionado', moved: '{name} movido para a posição {position}',
  },
  es: {
    paletteTitle: 'Pasos', search: 'Buscar paso', searchKey: 'Atajo: /', show: 'Mostrar', all: 'Todos', noAI: 'Sin IA', recent: 'Recientes',
    ai: 'IA', aiOff: 'IA desactivada en este proyecto', noMatch: 'Ningún paso coincide con “{query}”', noRecent: 'Los pasos que añadas aparecen aquí',
    dragHint: 'Arrastra al lienzo o pulsa Enter', addNamed: 'Añadir {name}',
    pickerAfter: 'Añadir después de “{name}”', pickerBetween: 'Insertar entre “{from}” y “{to}”', pickerFree: 'Añadir paso', pickerSearch: 'Buscar paso',
    accepts: 'Recibe {shape}', nothingAccepts: 'Ningún paso recibe {shape}', results: '{count, plural, =0 {Ningún paso} one {# paso} other {# pasos}}',
    addAfter: 'Añadir paso después de “{name}”', notSet: 'sin configurar', runOk: 'ok', runRunning: 'en curso', runFailed: 'falló',
    mismatch: 'espera {expects}; recibe {gets}', nothing: 'nada', inputs: 'Recibe', output: 'Entrega', dropHere: 'Suelta para añadir “{name}”',
    issueCount: '{count, plural, one {# enlace con tipo incompatible} other {# enlaces con tipos incompatibles}}',
    fixInsert: 'Insertar “{step}” entre “{from}” y “{to}”', fixUnlink: 'Quitar el enlace de “{from}” a “{to}”', flowOk: 'Todos los enlaces encajan',
    summaryTitle: 'Resumen del flujo', version: 'Versión', runs: 'Ejecuciones sobre la edición', stepCount: 'Pasos', usesAI: 'Usa IA', yes: 'sí', no: 'no',
    deterministic: 'Determinista', seed: 'semilla {seed}', citable: 'Salidas citables', none: 'ninguna', runFlow: 'Ejecutar sobre la edición', validate: 'Validar flujo',
    validOk: 'No se encontraron problemas', stepTitle: 'Título', preview: 'Vista previa de la salida', noPreview: 'Aún sin vista previa. Prueba este paso para ver la salida.',
    testStep: 'Probar este paso', remove: 'Quitar', backToSummary: 'Volver al resumen',
    listTitle: 'Pasos del flujo', listHint: 'Flechas mueven, Alt+flechas reordenan, A añade, Enter configura', addHere: 'Añadir paso aquí', more: 'Más acciones para “{name}”',
    moveUp: 'Subir', moveDown: 'Bajar', configure: 'Configurar',
    toolAdd: 'Añadir paso', toolArrange: 'Reorganizar', toolFit: 'Ajustar a la vista', toolList: 'Ver como lista', toolSearch: 'Buscar paso', toolSelect: 'Seleccionar', toolPan: 'Mover',
    added: '{name} añadido', moved: '{name} movido a la posición {position}',
  },
})
