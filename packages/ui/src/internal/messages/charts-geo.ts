// Copy of the "charts-geo" group (wave 2/4): Chart, ReportView,
// LiveReportView, RegionMap and the subdivision kinds of RegionThemeData.
// English, Brazilian Portuguese and Spanish. Merged into `Messages` by ../messages.ts.

export type SubdivisionKind =
  | 'state'
  | 'province'
  | 'region'
  | 'department'
  | 'governorate'
  | 'prefecture'
  | 'county'
  | 'voivodeship'
  | 'district'
  | 'nation'

export type RunPhase = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type RunStepState = 'running' | 'done' | 'failed' | 'paused'

export interface ChartsGeoMessages {
  chart: {
    viewSwitch: string
    chartView: string
    tableView: string
    noData: string
    noDataHint: string
    /** Accessible description of the interactive plot. */
    plotHint: (title: string) => string
    readout: (category: string, series: string, value: string) => string
    missing: string
    categoryColumn: string
    legend: string
  }
  report: {
    empty: string
    emptyHint: string
    noValue: string
    recommendation: string
    unknownSection: (kind: string) => string
    inputRequestPending: string
    receipt: { description: string; quantity: string; unitPrice: string; total: string; subtotal: string; tax: string; grandTotal: string }
    approval: Record<'approved' | 'rejected' | 'pending', string> & { by: (who: string) => string; prompt: string; reason: string }
    document: { identifier: string; accessKey: string; number: string; series: string; environment: string; open: string }
    lifecycle: Record<'complete' | 'current' | 'upcoming', string>
    score: { outOf: (score: number) => string; reasoning: string }
    /** Receives the number of seconds; the catalogue formats it with Intl. */
    duration: (seconds: number) => string
    meta: string
  }
  liveReport: {
    phase: Record<RunPhase, string>
    step: Record<RunStepState, string>
    steps: string
    waiting: string
    pausedWaiting: string
    failed: string
    approve: string
    reject: string
  }
  regionMap: {
    map: string
    zoomIn: string
    zoomOut: string
    zoomValue: (percent: number) => string
    legendTitle: string
    more: (n: number) => string
    regionList: string
    regionItems: (name: string, count: number) => string
    loadError: string
    loading: string
  }
  regionKind: Record<SubdivisionKind, string>
}

export const chartsGeoEn: ChartsGeoMessages = {
  chart: {
    viewSwitch: 'Show as',
    chartView: 'Chart',
    tableView: 'Table',
    noData: 'No data to plot',
    noDataHint: 'The chart appears once the analysis returns values.',
    plotHint: (title) => `${title}. Use the arrow keys to read each value.`,
    readout: (category, series, value) => `${category}, ${series}: ${value}`,
    missing: 'no value',
    categoryColumn: 'Category',
    legend: 'Legend',
  },
  report: {
    empty: 'This report is empty',
    emptyHint: 'Content appears here when the run produces it.',
    noValue: 'no value',
    recommendation: 'Recommendation',
    unknownSection: (kind) => `Section of an unknown kind (${kind})`,
    inputRequestPending: 'Waiting for input',
    receipt: {
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      grandTotal: 'Total due',
    },
    approval: { approved: 'Approved', rejected: 'Rejected', pending: 'Pending', by: (who) => `by ${who}`, prompt: 'Original request', reason: 'Reason' },
    document: { identifier: 'Identifier', accessKey: 'Access key', number: 'Number', series: 'Series', environment: 'Environment', open: 'Open document' },
    lifecycle: { complete: 'complete', current: 'current', upcoming: 'upcoming' },
    score: { outOf: (score) => `${new Intl.NumberFormat('en').format(score)} of ${new Intl.NumberFormat('en').format(100)}`, reasoning: 'Reasoning' },
    duration: (s) => new Intl.NumberFormat('en', { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(s),
    meta: 'Report details',
  },
  liveReport: {
    phase: { pending: 'Pending', running: 'Running', paused: 'Paused', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' },
    step: { running: 'running', done: 'done', failed: 'failed', paused: 'paused' },
    steps: 'Steps',
    waiting: 'Waiting for data',
    pausedWaiting: 'Paused, waiting for input',
    failed: 'The run failed',
    approve: 'Approve',
    reject: 'Reject',
  },
  regionMap: {
    map: 'Map of regions',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomValue: (p) => `Zoom ${new Intl.NumberFormat('en', { style: 'percent' }).format(p / 100)}`,
    legendTitle: 'Regions with most items',
    more: (n) => `+${new Intl.NumberFormat('en').format(n)} more`,
    regionList: 'Regions',
    regionItems: (name, count) => `${name}, ${new Intl.NumberFormat('en').format(count)} ${new Intl.PluralRules('en').select(count) === 'one' ? 'item' : 'items'}`,
    loadError: 'The map shapes could not be loaded. The list of regions still works.',
    loading: 'Loading the map',
  },
  regionKind: {
    state: 'State',
    province: 'Province',
    region: 'Region',
    department: 'Department',
    governorate: 'Governorate',
    prefecture: 'Prefecture',
    county: 'County',
    voivodeship: 'Voivodeship',
    district: 'District',
    nation: 'Nation',
  },
}

export const chartsGeoPtBR: ChartsGeoMessages = {
  chart: {
    viewSwitch: 'Mostrar como',
    chartView: 'Gráfico',
    tableView: 'Tabela',
    noData: 'Sem dados para o gráfico',
    noDataHint: 'O gráfico aparece quando a análise devolver valores.',
    plotHint: (title) => `${title}. Use as setas para ler cada valor.`,
    readout: (category, series, value) => `${category}, ${series}: ${value}`,
    missing: 'sem valor',
    categoryColumn: 'Categoria',
    legend: 'Legenda',
  },
  report: {
    empty: 'Este relatório está vazio',
    emptyHint: 'O conteúdo aparece aqui quando a execução o produzir.',
    noValue: 'sem valor',
    recommendation: 'Recomendação',
    unknownSection: (kind) => `Seção de tipo desconhecido (${kind})`,
    inputRequestPending: 'Aguardando resposta',
    receipt: {
      description: 'Descrição',
      quantity: 'Quantidade',
      unitPrice: 'Preço unitário',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Imposto',
      grandTotal: 'Total devido',
    },
    approval: { approved: 'Aprovado', rejected: 'Rejeitado', pending: 'Pendente', by: (who) => `por ${who}`, prompt: 'Pedido original', reason: 'Motivo' },
    document: { identifier: 'Identificador', accessKey: 'Chave de acesso', number: 'Número', series: 'Série', environment: 'Ambiente', open: 'Abrir documento' },
    lifecycle: { complete: 'concluída', current: 'atual', upcoming: 'próxima' },
    score: { outOf: (score) => `${new Intl.NumberFormat('pt-BR').format(score)} de ${new Intl.NumberFormat('pt-BR').format(100)}`, reasoning: 'Justificativa' },
    duration: (s) => new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(s),
    meta: 'Detalhes do relatório',
  },
  liveReport: {
    phase: { pending: 'Pendente', running: 'Em execução', paused: 'Pausada', completed: 'Concluída', failed: 'Falhou', cancelled: 'Cancelada' },
    step: { running: 'em execução', done: 'concluído', failed: 'falhou', paused: 'pausado' },
    steps: 'Passos',
    waiting: 'Aguardando dados',
    pausedWaiting: 'Pausada, aguardando resposta',
    failed: 'A execução falhou',
    approve: 'Aprovar',
    reject: 'Rejeitar',
  },
  regionMap: {
    map: 'Mapa das regiões',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    zoomValue: (p) => `Zoom ${new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(p / 100)}`,
    legendTitle: 'Regiões com mais itens',
    more: (n) => `+${new Intl.NumberFormat('pt-BR').format(n)} outras`,
    regionList: 'Regiões',
    regionItems: (name, count) => `${name}, ${new Intl.NumberFormat('pt-BR').format(count)} ${new Intl.PluralRules('pt-BR').select(count) === 'one' ? 'item' : 'itens'}`,
    loadError: 'Não foi possível carregar as formas do mapa. A lista de regiões continua funcionando.',
    loading: 'Carregando o mapa',
  },
  regionKind: {
    state: 'Estado',
    province: 'Província',
    region: 'Região',
    department: 'Departamento',
    governorate: 'Governadoria',
    prefecture: 'Prefeitura',
    county: 'Condado',
    voivodeship: 'Voivodia',
    district: 'Distrito',
    nation: 'Nação',
  },
}

export const chartsGeoEs: ChartsGeoMessages = {
  chart: {
    viewSwitch: 'Mostrar como',
    chartView: 'Gráfico',
    tableView: 'Tabla',
    noData: 'No hay datos para el gráfico',
    noDataHint: 'El gráfico aparece cuando el análisis devuelve valores.',
    plotHint: (title) => `${title}. Use las flechas para leer cada valor.`,
    readout: (category, series, value) => `${category}, ${series}: ${value}`,
    missing: 'sin valor',
    categoryColumn: 'Categoría',
    legend: 'Leyenda',
  },
  report: {
    empty: 'Este informe está vacío',
    emptyHint: 'El contenido aparece aquí cuando la ejecución lo produce.',
    noValue: 'sin valor',
    recommendation: 'Recomendación',
    unknownSection: (kind) => `Sección de un tipo desconocido (${kind})`,
    inputRequestPending: 'Esperando respuesta',
    receipt: {
      description: 'Descripción',
      quantity: 'Cantidad',
      unitPrice: 'Precio unitario',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Impuesto',
      grandTotal: 'Total a pagar',
    },
    approval: { approved: 'Aprobado', rejected: 'Rechazado', pending: 'Pendiente', by: (who) => `por ${who}`, prompt: 'Solicitud original', reason: 'Motivo' },
    document: { identifier: 'Identificador', accessKey: 'Clave de acceso', number: 'Número', series: 'Serie', environment: 'Entorno', open: 'Abrir documento' },
    lifecycle: { complete: 'concluida', current: 'actual', upcoming: 'siguiente' },
    score: { outOf: (score) => `${new Intl.NumberFormat('es').format(score)} de ${new Intl.NumberFormat('es').format(100)}`, reasoning: 'Justificación' },
    duration: (s) => new Intl.NumberFormat('es', { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(s),
    meta: 'Detalles del informe',
  },
  liveReport: {
    phase: { pending: 'Pendiente', running: 'En ejecución', paused: 'En pausa', completed: 'Completada', failed: 'Falló', cancelled: 'Cancelada' },
    step: { running: 'en ejecución', done: 'hecho', failed: 'falló', paused: 'en pausa' },
    steps: 'Pasos',
    waiting: 'Esperando datos',
    pausedWaiting: 'En pausa, esperando respuesta',
    failed: 'La ejecución falló',
    approve: 'Aprobar',
    reject: 'Rechazar',
  },
  regionMap: {
    map: 'Mapa de las regiones',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    zoomValue: (p) => `Zoom ${new Intl.NumberFormat('es', { style: 'percent' }).format(p / 100)}`,
    legendTitle: 'Regiones con más elementos',
    more: (n) => `+${new Intl.NumberFormat('es').format(n)} más`,
    regionList: 'Regiones',
    regionItems: (name, count) => `${name}, ${new Intl.NumberFormat('es').format(count)} ${new Intl.PluralRules('es').select(count) === 'one' ? 'elemento' : 'elementos'}`,
    loadError: 'No se pudieron cargar las formas del mapa. La lista de regiones sigue funcionando.',
    loading: 'Cargando el mapa',
  },
  regionKind: {
    state: 'Estado',
    province: 'Provincia',
    region: 'Región',
    department: 'Departamento',
    governorate: 'Gobernación',
    prefecture: 'Prefectura',
    county: 'Condado',
    voivodeship: 'Voivodato',
    district: 'Distrito',
    nation: 'Nación',
  },
}
