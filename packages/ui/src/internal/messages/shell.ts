// Copy of the "shell" group (wave 4 research shell). One namespace per
// component, English and Brazilian Portuguese. Merged into `Messages` by
// ../messages.ts.

export type StageStatus = 'done' | 'current' | 'upcoming' | 'attention'

export interface ShellMessages {
  actionBar: {
    /** Landmark name of the bar. */
    label: string
    more: string
    /** Accessible name of an item's menu chevron. */
    openMenu: (item: string) => string
    /** Count in words, appended to the item name. */
    count: (n: number) => string
    loading: string
    /** Skip-link text targeting the bar. */
    skipTo: string
    /** Entry of the tab bar's "more" menu that opens the rail drawer. */
    allSections: string
    confirm: string
    cancel: string
    /** Capped badge; receives the formatted cap (for example "99"). */
    capped: (cap: string) => string
  }
  rail: {
    label: string
    openNavigation: string
    closeNavigation: string
    count: (n: number) => string
    capped: (cap: string) => string
  }
  pageTrail: { label: string }
  evidencePanel: { close: string; resize: string }
  stageStrip: { status: Record<StageStatus, string> }
  attentionList: {
    empty: string
    seeAll: string
    actionName: (action: string, title: string) => string
    /** Visually hidden suffix that makes an action's name unique (": TAMM"). */
    actionTarget: (title: string) => string
  }
  activityFeed: { empty: string }
  phaseBar: { part: (label: string, value: string) => string; empty: string; named: (label: string, parts: string) => string }
}

export const shellEn: ShellMessages = {
  actionBar: {
    label: 'Actions',
    more: 'More',
    openMenu: (item) => `Open the menu of ${item}`,
    count: (n) => (new Intl.PluralRules('en').select(n) === 'one' ? `${n} pending` : `${n} pending`),
    loading: 'Loading actions',
    skipTo: 'Skip to the action bar',
    allSections: 'All sections',
    confirm: 'Confirm',
    capped: (cap) => `${cap}+`,
    cancel: 'Cancel',
  },
  rail: {
    label: 'Main',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    count: (n) => (new Intl.PluralRules('en').select(n) === 'one' ? `${n} pending` : `${n} pending`),
    capped: (cap) => `${cap}+`,
  },
  pageTrail: { label: 'Breadcrumb' },
  evidencePanel: { close: 'Close panel', resize: 'Resize panel' },
  stageStrip: { status: { done: 'done', current: 'current', upcoming: 'upcoming', attention: 'needs attention' } },
  attentionList: {
    empty: 'Nothing needs you right now.',
    seeAll: 'See all',
    actionName: (action, title) => `${action}: ${title}`,
    actionTarget: (title) => `: ${title}`,
  },
  activityFeed: { empty: 'No activity yet.' },
  phaseBar: { part: (label, value) => `${label} ${value}`, empty: 'No data yet', named: (label, parts) => `${label}: ${parts}` },
}

export const shellPtBR: ShellMessages = {
  actionBar: {
    label: 'Ações',
    more: 'Mais',
    openMenu: (item) => `Abrir o menu de ${item}`,
    count: (n) => (new Intl.PluralRules('pt-BR').select(n) === 'one' ? `${n} pendente` : `${n} pendentes`),
    loading: 'Carregando as ações',
    skipTo: 'Ir para a barra de ações',
    allSections: 'Todas as seções',
    confirm: 'Confirmar',
    capped: (cap) => `${cap}+`,
    cancel: 'Cancelar',
  },
  rail: {
    label: 'Principal',
    openNavigation: 'Abrir navegação',
    closeNavigation: 'Fechar navegação',
    count: (n) => (new Intl.PluralRules('pt-BR').select(n) === 'one' ? `${n} pendente` : `${n} pendentes`),
    capped: (cap) => `${cap}+`,
  },
  pageTrail: { label: 'Trilha de navegação' },
  evidencePanel: { close: 'Fechar painel', resize: 'Redimensionar painel' },
  stageStrip: { status: { done: 'concluída', current: 'em curso', upcoming: 'a seguir', attention: 'pede atenção' } },
  attentionList: {
    empty: 'Nada precisa de você agora.',
    seeAll: 'Ver tudo',
    actionName: (action, title) => `${action}: ${title}`,
    actionTarget: (title) => `: ${title}`,
  },
  activityFeed: { empty: 'Ainda não há atividade.' },
  phaseBar: { part: (label, value) => `${label} ${value}`, empty: 'Ainda sem dados', named: (label, parts) => `${label}: ${parts}` },
}

export const shellEs: ShellMessages = {
  actionBar: {
    label: 'Acciones',
    more: 'Más',
    openMenu: (item) => `Abrir el menú de ${item}`,
    count: (n) => (new Intl.PluralRules('es').select(n) === 'one' ? `${n} pendiente` : `${n} pendientes`),
    loading: 'Cargando las acciones',
    skipTo: 'Ir a la barra de acciones',
    allSections: 'Todas las secciones',
    confirm: 'Confirmar',
    capped: (cap) => `${cap}+`,
    cancel: 'Cancelar',
  },
  rail: {
    label: 'Principal',
    openNavigation: 'Abrir navegación',
    closeNavigation: 'Cerrar navegación',
    count: (n) => (new Intl.PluralRules('es').select(n) === 'one' ? `${n} pendiente` : `${n} pendientes`),
    capped: (cap) => `${cap}+`,
  },
  pageTrail: { label: 'Ruta de navegación' },
  evidencePanel: { close: 'Cerrar panel', resize: 'Redimensionar panel' },
  stageStrip: { status: { done: 'concluida', current: 'en curso', upcoming: 'siguiente', attention: 'requiere atención' } },
  attentionList: {
    empty: 'Nada requiere su atención ahora.',
    seeAll: 'Ver todo',
    actionName: (action, title) => `${action}: ${title}`,
    actionTarget: (title) => `: ${title}`,
  },
  activityFeed: { empty: 'Todavía no hay actividad.' },
  phaseBar: { part: (label, value) => `${label} ${value}`, empty: 'Todavía sin datos', named: (label, parts) => `${label}: ${parts}` },
}
