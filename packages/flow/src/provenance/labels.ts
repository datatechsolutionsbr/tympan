// Strings of the provenance viewer. English is complete; pt-BR is the
// product's language. Hosts override through `labels` or FlowMessagesProvider.

import { defineLabels } from '../internal/labels'
import type { LaneKey, ProofKey, ProvActorKind, ProvKind, ProvRelation } from './model'

export interface ProvenanceLabels {
  graphName: string
  graphRole: string
  treeName: string
  queryBar: string
  focus: string
  focusAll: string
  direction: string
  backward: string
  forward: string
  both: string
  hops: string
  view: string
  viewGraph: string
  viewTree: string
  filters: string
  filtersActive: string
  filterKinds: string
  filterActors: string
  filterActorName: string
  filterProof: string
  actorsAsNodes: string
  clearFilters: string
  legend: string
  inspector: string
  closeInspector: string
  cameFrom: string
  madeFrom: string
  noRelations: string
  details: string
  when: string
  attributedTo: string
  /** Accessible name of a node: kind, title, proof word, actor. */
  nodeName: string
  actorNodeName: string
  /** Tree row relation prefix, e.g. "was derived from". */
  treeVia: string
  emptyTitle: string
  emptyText: string
  isolated: string
  focusFiltered: string
  noMatches: string
  deep: string
  loading: string
  errorTitle: string
  retry: string
  count: string
  question: string
  questionHint: string
  questionEmpty: string
  hopsBack: string
  hopsForward: string
  viewTimeline: string
  viewCertificate: string
  viewCompare: string
  onlyPath: string
  proofPath: string
  offPath: string
  focusWord: string
  lanes: Record<LaneKey, string>
  relationLegend: string
  hash: Record<'match' | 'not-reread' | 'mismatch', string>
  reason: string
  evidence: string
  obligations: string
  obligationStatus: Record<'ok' | 'pending' | 'failed', string>
  reread: string
  requestVerification: string
  treeBackward: string
  treeForward: string
  treeWay: string
  openInGraph: string
  noCertificate: string
  noComparison: string
  kinds: Record<ProvKind, string>
  relations: Record<ProvRelation, string>
  /** Relation read from the older end ("used by", "source of"). */
  relationsReversed: Record<ProvRelation, string>
  proof: Record<ProofKey, string>
  actorKinds: Record<ProvActorKind, string>
}

export const defaultProvenanceLabels: ProvenanceLabels = {
  graphName: 'Provenance graph',
  graphRole: 'graph',
  treeName: 'Provenance list',
  queryBar: 'Provenance query',
  focus: 'Item in focus',
  focusAll: 'Whole graph',
  direction: 'Direction',
  backward: 'Back to sources',
  forward: 'Forward to uses',
  both: 'Both',
  hops: 'Steps',
  view: 'View',
  viewGraph: 'Graph',
  viewTree: 'Tree',
  filters: 'Filters',
  filtersActive: 'Filters ({count, plural, one {# active} other {# active}})',
  filterKinds: 'Item types',
  filterActors: 'Who acted',
  filterActorName: 'Actor name',
  filterProof: 'Proof state',
  actorsAsNodes: 'Show actors as nodes',
  clearFilters: 'Clear filters',
  legend: 'Proof states',
  inspector: 'Evidence',
  closeInspector: 'Close evidence',
  cameFrom: 'Came from',
  madeFrom: 'Used by',
  noRelations: 'None',
  details: 'Details',
  when: 'When',
  attributedTo: 'Attributed to',
  nodeName: '{kind}: {title}, {proof}, {actor}',
  actorNodeName: '{kind}: {name}',
  treeVia: '{relation}',
  emptyTitle: 'No provenance yet',
  emptyText: 'Nothing has been recorded for this project. Items appear here as searches, sources and assertions are registered.',
  isolated: 'This item has no recorded links.',
  focusFiltered: 'The item in focus is hidden by the filters.',
  noMatches: 'No item matches these filters.',
  deep: 'This view is large ({count} items). Reduce the number of steps to read it more easily.',
  loading: 'Loading the provenance graph',
  errorTitle: 'The provenance could not be loaded',
  retry: 'Try again',
  count: '{count, plural, one {# item} other {# items}}',
  question: 'Where did this come from',
  questionHint: 'Any value, record, number or manuscript sentence',
  questionEmpty: 'Nothing matches',
  hopsBack: 'Steps back',
  hopsForward: 'Steps forward',
  viewTimeline: 'Timeline',
  viewCertificate: 'Certificate',
  viewCompare: 'Compare editions',
  onlyPath: 'Only the proof path',
  proofPath: 'on the proof path',
  offPath: 'off the proof path',
  focusWord: 'in focus',
  lanes: { search: 'Search', read: 'Reading', source: 'Source', assertion: 'Assertion', base: 'Base and verification', analysis: 'Analysis', edition: 'Edition', manuscript: 'Manuscript', actors: 'Actors' },
  relationLegend: 'Relations',
  hash: { match: 'hash matches', 'not-reread': 'not reread', mismatch: 'hash does not match' },
  reason: 'Why',
  evidence: 'Quoted evidence',
  obligations: 'Proof obligations',
  obligationStatus: { ok: 'met', pending: 'pending', failed: 'failed' },
  reread: 'Reread the source now',
  requestVerification: 'Ask for verification',
  treeBackward: 'Where it came from',
  treeForward: 'Where it was used',
  treeWay: 'Direction of the list',
  openInGraph: 'Enter shows it in the graph',
  noCertificate: 'This item has no certificate yet.',
  noComparison: 'No editions to compare.',
  kinds: {
    query: 'query',
    retrieval: 'retrieval',
    source: 'source',
    assertion: 'assertion',
    record: 'record',
    analysis: 'analysis',
    edition: 'edition',
    manuscript: 'manuscript sentence',
    verification: 'verification',
  },
  relations: { wasDerivedFrom: 'was derived from', used: 'used', wasGeneratedBy: 'was generated by', wasAttributedTo: 'was attributed to' },
  relationsReversed: { wasDerivedFrom: 'source of', used: 'used by', wasGeneratedBy: 'generated', wasAttributedTo: 'responsible for' },
  proof: { proved: 'proved', pending: 'pending', refuted: 'refuted', not_disclosed: 'not disclosed', none: 'no proof' },
  actorKinds: { person: 'person', agent: 'agent', system: 'system' },
}

export const provenanceLabelsPtBR: ProvenanceLabels = {
  graphName: 'Grafo de proveniência',
  graphRole: 'grafo',
  treeName: 'Lista de proveniência',
  queryBar: 'Consulta de proveniência',
  focus: 'Item em foco',
  focusAll: 'Grafo inteiro',
  direction: 'Direção',
  backward: 'Até as fontes',
  forward: 'Até os usos',
  both: 'As duas',
  hops: 'Saltos',
  view: 'Vista',
  viewGraph: 'Grafo',
  viewTree: 'Árvore',
  filters: 'Filtros',
  filtersActive: 'Filtros ({count, plural, one {# ativo} other {# ativos}})',
  filterKinds: 'Tipos de item',
  filterActors: 'Quem agiu',
  filterActorName: 'Nome do ator',
  filterProof: 'Estado de prova',
  actorsAsNodes: 'Mostrar atores como nós',
  clearFilters: 'Limpar filtros',
  legend: 'Estados de prova',
  inspector: 'Evidência',
  closeInspector: 'Fechar evidência',
  cameFrom: 'Veio de',
  madeFrom: 'Usado por',
  noRelations: 'Nenhum',
  details: 'Detalhes',
  when: 'Quando',
  attributedTo: 'Atribuído a',
  nodeName: '{kind}: {title}, {proof}, {actor}',
  actorNodeName: '{kind}: {name}',
  treeVia: '{relation}',
  emptyTitle: 'Nenhuma proveniência ainda',
  emptyText: 'Nada foi registrado neste projeto. Os itens aparecem aqui à medida que buscas, fontes e asserções são registradas.',
  isolated: 'Este item não tem ligações registradas.',
  focusFiltered: 'O item em foco está oculto pelos filtros.',
  noMatches: 'Nenhum item com esses filtros.',
  deep: 'Esta vista é grande ({count} itens). Reduza o número de saltos para ler melhor.',
  loading: 'Carregando o grafo de proveniência',
  errorTitle: 'Não foi possível carregar a proveniência',
  retry: 'Tentar de novo',
  count: '{count, plural, one {# item} other {# itens}}',
  question: 'De onde veio',
  questionHint: 'Qualquer valor, registro, número ou frase do manuscrito',
  questionEmpty: 'Nada corresponde',
  hopsBack: 'Para trás',
  hopsForward: 'Para a frente',
  viewTimeline: 'Linha do tempo',
  viewCertificate: 'Certificado',
  viewCompare: 'Comparar edições',
  onlyPath: 'Só o caminho da prova',
  proofPath: 'no caminho da prova',
  offPath: 'fora do caminho da prova',
  focusWord: 'em foco',
  lanes: { search: 'Busca', read: 'Leitura', source: 'Fonte', assertion: 'Afirmação', base: 'Base e verificação', analysis: 'Análise', edition: 'Edição', manuscript: 'Manuscrito', actors: 'Atores' },
  relationLegend: 'Relações',
  hash: { match: 'hash confere', 'not-reread': 'não relido', mismatch: 'hash não confere' },
  reason: 'Por quê',
  evidence: 'Evidência citada',
  obligations: 'Obrigações da prova',
  obligationStatus: { ok: 'cumprida', pending: 'pendente', failed: 'falhou' },
  reread: 'Reler a fonte agora',
  requestVerification: 'Pedir verificação',
  treeBackward: 'De onde veio',
  treeForward: 'Onde foi usado',
  treeWay: 'Sentido da lista',
  openInGraph: 'Enter mostra no grafo',
  noCertificate: 'Este item ainda não tem certificado.',
  noComparison: 'Nenhuma edição para comparar.',
  kinds: {
    query: 'consulta',
    retrieval: 'recuperação',
    source: 'fonte',
    assertion: 'asserção',
    record: 'registro',
    analysis: 'análise',
    edition: 'edição',
    manuscript: 'frase do manuscrito',
    verification: 'verificação',
  },
  relations: { wasDerivedFrom: 'derivou de', used: 'usou', wasGeneratedBy: 'gerado por', wasAttributedTo: 'atribuído a' },
  relationsReversed: { wasDerivedFrom: 'origem de', used: 'usado por', wasGeneratedBy: 'gerou', wasAttributedTo: 'responsável por' },
  proof: { proved: 'provada', pending: 'pendente', refuted: 'refutada', not_disclosed: 'não informada', none: 'sem prova' },
  actorKinds: { person: 'pessoa', agent: 'agente', system: 'sistema' },
}

export const provenanceLabelsEs: ProvenanceLabels = {
  graphName: 'Grafo de procedencia',
  graphRole: 'grafo',
  treeName: 'Lista de procedencia',
  queryBar: 'Consulta de procedencia',
  focus: 'Elemento en foco',
  focusAll: 'Grafo completo',
  direction: 'Dirección',
  backward: 'Hacia las fuentes',
  forward: 'Hacia los usos',
  both: 'Ambas',
  hops: 'Pasos',
  view: 'Vista',
  viewGraph: 'Grafo',
  viewTree: 'Árbol',
  filters: 'Filtros',
  filtersActive: 'Filtros ({count, plural, one {# activo} other {# activos}})',
  filterKinds: 'Tipos de elemento',
  filterActors: 'Quién actuó',
  filterActorName: 'Nombre del actor',
  filterProof: 'Estado de prueba',
  actorsAsNodes: 'Mostrar actores como nodos',
  clearFilters: 'Borrar filtros',
  legend: 'Estados de prueba',
  inspector: 'Evidencia',
  closeInspector: 'Cerrar evidencia',
  cameFrom: 'Proviene de',
  madeFrom: 'Usado por',
  noRelations: 'Ninguno',
  details: 'Detalles',
  when: 'Cuándo',
  attributedTo: 'Atribuido a',
  nodeName: '{kind}: {title}, {proof}, {actor}',
  actorNodeName: '{kind}: {name}',
  treeVia: '{relation}',
  emptyTitle: 'Todavía no hay procedencia',
  emptyText: 'No se ha registrado nada en este proyecto. Los elementos aparecen aquí a medida que se registran búsquedas, fuentes y aserciones.',
  isolated: 'Este elemento no tiene vínculos registrados.',
  focusFiltered: 'El elemento en foco está oculto por los filtros.',
  noMatches: 'Ningún elemento coincide con estos filtros.',
  deep: 'Esta vista es grande ({count} elementos). Reduzca el número de pasos para leerla mejor.',
  loading: 'Cargando el grafo de procedencia',
  errorTitle: 'No se pudo cargar la procedencia',
  retry: 'Reintentar',
  count: '{count, plural, one {# elemento} other {# elementos}}',
  question: 'De dónde vino',
  questionHint: 'Cualquier valor, registro, número o frase del manuscrito',
  questionEmpty: 'Nada coincide',
  hopsBack: 'Hacia atrás',
  hopsForward: 'Hacia adelante',
  viewTimeline: 'Línea de tiempo',
  viewCertificate: 'Certificado',
  viewCompare: 'Comparar ediciones',
  onlyPath: 'Solo el camino de la prueba',
  proofPath: 'en el camino de la prueba',
  offPath: 'fuera del camino de la prueba',
  focusWord: 'en foco',
  lanes: { search: 'Búsqueda', read: 'Lectura', source: 'Fuente', assertion: 'Afirmación', base: 'Base y verificación', analysis: 'Análisis', edition: 'Edición', manuscript: 'Manuscrito', actors: 'Actores' },
  relationLegend: 'Relaciones',
  hash: { match: 'el hash coincide', 'not-reread': 'no releído', mismatch: 'el hash no coincide' },
  reason: 'Por qué',
  evidence: 'Evidencia citada',
  obligations: 'Obligaciones de la prueba',
  obligationStatus: { ok: 'cumplida', pending: 'pendiente', failed: 'falló' },
  reread: 'Releer la fuente ahora',
  requestVerification: 'Pedir verificación',
  treeBackward: 'De dónde vino',
  treeForward: 'Dónde se usó',
  treeWay: 'Sentido de la lista',
  openInGraph: 'Enter lo muestra en el grafo',
  noCertificate: 'Este elemento aún no tiene certificado.',
  noComparison: 'No hay ediciones para comparar.',
  kinds: {
    query: 'consulta',
    retrieval: 'recuperación',
    source: 'fuente',
    assertion: 'aserción',
    record: 'registro',
    analysis: 'análisis',
    edition: 'edición',
    manuscript: 'frase del manuscrito',
    verification: 'verificación',
  },
  relations: { wasDerivedFrom: 'derivó de', used: 'usó', wasGeneratedBy: 'generado por', wasAttributedTo: 'atribuido a' },
  relationsReversed: { wasDerivedFrom: 'origen de', used: 'usado por', wasGeneratedBy: 'generó', wasAttributedTo: 'responsable de' },
  proof: { proved: 'probada', pending: 'pendiente', refuted: 'refutada', not_disclosed: 'no informada', none: 'sin prueba' },
  actorKinds: { person: 'persona', agent: 'agente', system: 'sistema' },
}

export const provenanceLabels = defineLabels<ProvenanceLabels>('provenance', { en: defaultProvenanceLabels, 'pt-BR': provenanceLabelsPtBR, es: provenanceLabelsEs })
