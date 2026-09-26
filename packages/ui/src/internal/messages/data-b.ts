// Copy of the "data-b" group (wave 2/4): figures, cards and summaries. One
// namespace per component, English and Brazilian Portuguese. Merged into
// `Messages` by ../messages.ts.

export interface DataBMessages {
  statTile: {
    filtered: string
    explain: (label: string) => string
    attention: string
  }
  delta: { up: string; down: string; flat: string }
  agentOutput: {
    outcome: Record<'completed' | 'failed' | 'pending', string>
    duration: (d: string) => string
  }
  recordCard: {
    cancel: string
    working: string
  }
  contact: { email: string; phone: string }
  insight: {
    actions: string
    pending: string
    proposedBy: string
    failed: string
  }
  ticker: {
    value: string
    change: string
    empty: string
    loading: string
  }
}

export const dataBEn: DataBMessages = {
  statTile: {
    filtered: 'filtered',
    explain: (label) => `How "${label}" is computed`,
    attention: 'needs action',
  },
  delta: { up: 'up', down: 'down', flat: 'no change' },
  agentOutput: {
    outcome: { completed: 'completed', failed: 'failed', pending: 'pending' },
    duration: (d) => `took ${d}`,
  },
  recordCard: { cancel: 'Cancel', working: 'Working' },
  contact: { email: 'E-mail', phone: 'Phone' },
  insight: {
    actions: 'Actions on this proposal',
    pending: 'Working',
    proposedBy: 'Proposed by',
    failed: 'The action could not be completed.',
  },
  ticker: { value: 'value', change: 'change', empty: 'No entries to show.', loading: 'Loading entries' },
}

export const dataBPtBR: DataBMessages = {
  statTile: {
    filtered: 'filtrado',
    explain: (label) => `Como "${label}" é calculado`,
    attention: 'pede ação',
  },
  delta: { up: 'subiu', down: 'caiu', flat: 'sem mudança' },
  agentOutput: {
    outcome: { completed: 'concluída', failed: 'falhou', pending: 'pendente' },
    duration: (d) => `levou ${d}`,
  },
  recordCard: { cancel: 'Cancelar', working: 'Processando' },
  contact: { email: 'E-mail', phone: 'Telefone' },
  insight: {
    actions: 'Ações sobre esta proposta',
    pending: 'Processando',
    proposedBy: 'Proposta de',
    failed: 'Não foi possível concluir a ação.',
  },
  ticker: { value: 'valor', change: 'variação', empty: 'Nenhuma entrada para mostrar.', loading: 'Carregando entradas' },
}

/** Spanish (placeholder until translated: falls back to English). */
export const dataBEs: DataBMessages = dataBEn
