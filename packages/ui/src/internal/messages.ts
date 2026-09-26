// Default copy of the library. Components never hard-code strings: they read
// this catalogue through `useMessages()`, and hosts override any entry through
// `<FakhirProvider messages={…}>` (for example from their own i18n adapter).

import { formsAEn, formsAEs, formsAPtBR, type FormsAMessages } from './messages/forms-a'
import { formsBEn, formsBEs, formsBPtBR, type FormsBMessages } from './messages/forms-b'
import { overlaysNavEn, overlaysNavEs, overlaysNavPtBR, type OverlaysNavMessages } from './messages/overlays-nav'
import { dataAEn, dataAEs, dataAPtBR, type DataAMessages } from './messages/data-a'
import { dataBEn, dataBEs, dataBPtBR, type DataBMessages } from './messages/data-b'
import { chartsGeoEn, chartsGeoEs, chartsGeoPtBR, type ChartsGeoMessages } from './messages/charts-geo'
import { authBrandEn, authBrandEs, authBrandPtBR, type AuthBrandMessages } from './messages/auth-brand'
import { platformEn, platformEs, platformPtBR, type PlatformMessages } from './messages/platform'
import { showcaseEn, showcaseEs, showcasePtBR, type ShowcaseMessages } from './messages/showcase'
import { shellEn, shellEs, shellPtBR, type ShellMessages } from './messages/shell'
import { coreEs } from './messages/core-es'

export type ProofStateKey = 'proved' | 'pending' | 'refuted' | 'not_disclosed' | 'none'
export type ErrorKind = 'generic' | 'network' | 'server' | 'permission' | 'not-found' | 'conflict'
export type EmptyReason = 'no-data' | 'no-results' | 'offline'

/** Group catalogues of waves 2 and 4 (see ./messages/). */
export type GroupMessages = FormsAMessages & FormsBMessages & OverlaysNavMessages & DataAMessages & DataBMessages & ChartsGeoMessages & AuthBrandMessages & PlatformMessages & ShowcaseMessages & ShellMessages

/** Wave 1 copy plus one interface per wave 2/4 group (see ./messages/). */
export interface Messages
  extends FormsAMessages, FormsBMessages, OverlaysNavMessages, DataAMessages, DataBMessages, ChartsGeoMessages, AuthBrandMessages, PlatformMessages, ShowcaseMessages, ShellMessages {
  close: string
  dismiss: string
  loading: string
  required: string
  moreActions: string
  inProgress: string
  breadcrumbs: { label: string; backTo: (parent: string) => string; overflow: string }
  link: { opensInNewTab: string }
  textField: {
    clear: string
    showPassword: string
    hidePassword: string
    counter: (count: number, max: number) => string
    overLimit: (count: number, max: number) => string
  }
  select: { placeholder: string; done: string }
  notice: { toneWord: Record<'danger' | 'warning' | 'info' | 'success', string> }
  empty: Record<EmptyReason, { title: string; description: string }> & { clearFilters: string; retry: string }
  error: Record<ErrorKind, { title: string; message: string }> & {
    retry: string
    details: string
    statusCode: (code: number) => string
  }
  pagination: {
    navigation: string
    previous: string
    next: string
    pageSize: string
    range: (from: number, to: number, total: number) => string
    page: (n: number) => string
    pageOf: (n: number, count: number) => string
  }
  skipLink: string
  status: Record<'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'processing' | 'error' | 'success', string>
  tag: { remove: (text: string) => string }
  toast: { region: string; dismiss: string }
  avatar: { open: (name: string) => string }
  frame: {
    navigation: string
    openNavigation: string
    closeNavigation: string
    collapseNavigation: string
    expandNavigation: string
    loadingPage: string
    closePanel: string
  }
  table: {
    loading: string
    selectAll: string
    selectRow: (label: string) => string
    empty: string
    sortAscending: string
    sortDescending: string
  }
  proof: Record<ProofStateKey, string> & {
    provedBy: (who: string) => string
    rule: (rule: string) => string
  }
  actor: { person: string; agent: string; system: string }
}

export const defaultMessages: Messages = {
  ...formsAEn,
  ...formsBEn,
  ...overlaysNavEn,
  ...dataAEn,
  ...dataBEn,
  ...chartsGeoEn,
  ...authBrandEn,
  ...platformEn,
  ...showcaseEn,
  ...shellEn,
  close: 'Close',
  dismiss: 'Dismiss',
  loading: 'Loading',
  required: 'required',
  moreActions: 'More actions',
  inProgress: 'In progress',
  breadcrumbs: { label: 'Breadcrumb', backTo: (p) => `Back to ${p}`, overflow: 'Show hidden levels' },
  link: { opensInNewTab: '(opens in a new tab)' },
  textField: {
    clear: 'Clear',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    counter: (n, max) => `${n} of ${max} characters`,
    overLimit: (n, max) => `${n} of ${max} characters, ${n - max} over the limit`,
  },
  select: { placeholder: 'Select…', done: 'Done' },
  notice: { toneWord: { danger: 'Error:', warning: 'Warning:', info: 'Information:', success: 'Success:' } },
  empty: {
    'no-data': { title: 'Nothing here yet', description: 'Items appear here once they are added.' },
    'no-results': { title: 'No records match these filters', description: 'Change the filters or clear them to see every record.' },
    offline: { title: 'You are offline', description: 'Check the connection and try again.' },
    clearFilters: 'Clear filters',
    retry: 'Try again',
  },
  error: {
    generic: { title: 'Something went wrong', message: 'The content could not be loaded.' },
    network: { title: 'Connection problem', message: 'The server could not be reached. Check the connection and try again.' },
    server: { title: 'The server failed', message: 'The server could not complete the request. Try again in a moment.' },
    permission: { title: 'No access', message: 'Your role does not allow you to see this content.' },
    'not-found': { title: 'Not found', message: 'This item does not exist or was removed.' },
    conflict: { title: 'Changed by someone else', message: 'Someone changed this item before you. Reload it to see the latest version.' },
    retry: 'Try again',
    details: 'Technical details',
    statusCode: (code) => `Status ${code}`,
  },
  pagination: {
    navigation: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    pageSize: 'Items per page',
    range: (from, to, total) => `${from} to ${to} of ${total}`,
    page: (n) => `Page ${n}`,
    pageOf: (n, count) => `Page ${n} of ${count}`,
  },
  skipLink: 'Skip to main content',
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    processing: 'Processing',
    error: 'Error',
    success: 'Success',
  },
  tag: { remove: (text) => `Remove ${text}` },
  toast: { region: 'Notifications', dismiss: 'Dismiss notification' },
  avatar: { open: (name) => `Open profile of ${name}` },
  frame: {
    navigation: 'Main',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    collapseNavigation: 'Collapse navigation',
    expandNavigation: 'Expand navigation',
    loadingPage: 'Loading the page',
    closePanel: 'Close panel',
  },
  table: {
    loading: 'Loading the list',
    selectAll: 'Select all rows',
    selectRow: (label) => `Select ${label}`,
    empty: 'No rows to show',
    sortAscending: 'sorted ascending',
    sortDescending: 'sorted descending',
  },
  proof: {
    proved: 'proved',
    pending: 'pending',
    refuted: 'refuted',
    not_disclosed: 'not disclosed',
    none: 'no proof',
    provedBy: (who) => `by ${who}`,
    rule: (rule) => `rule ${rule}`,
  },
  actor: { person: 'person', agent: 'agent', system: 'system' },
}

/** Portuguese (Brazil) catalogue, the platform's first language. */
export const messagesPtBR: Messages = {
  ...formsAPtBR,
  ...formsBPtBR,
  ...overlaysNavPtBR,
  ...dataAPtBR,
  ...dataBPtBR,
  ...chartsGeoPtBR,
  ...authBrandPtBR,
  ...platformPtBR,
  ...showcasePtBR,
  ...shellPtBR,
  close: 'Fechar',
  dismiss: 'Dispensar',
  loading: 'Carregando',
  required: 'obrigatório',
  moreActions: 'Mais ações',
  inProgress: 'Em andamento',
  breadcrumbs: { label: 'Trilha de navegação', backTo: (p) => `Voltar para ${p}`, overflow: 'Mostrar níveis ocultos' },
  link: { opensInNewTab: '(abre em nova aba)' },
  textField: {
    clear: 'Limpar',
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
    counter: (n, max) => `${n} de ${max} caracteres`,
    overLimit: (n, max) => `${n} de ${max} caracteres, ${n - max} acima do limite`,
  },
  select: { placeholder: 'Selecione…', done: 'Concluir' },
  notice: { toneWord: { danger: 'Erro:', warning: 'Atenção:', info: 'Informação:', success: 'Sucesso:' } },
  empty: {
    'no-data': { title: 'Ainda não há nada aqui', description: 'Os itens aparecem aqui quando forem adicionados.' },
    'no-results': { title: 'Nenhum registro com esses filtros', description: 'Mude os filtros ou limpe-os para ver todos os registros.' },
    offline: { title: 'Você está sem conexão', description: 'Confira a conexão e tente de novo.' },
    clearFilters: 'Limpar filtros',
    retry: 'Tentar de novo',
  },
  error: {
    generic: { title: 'Algo deu errado', message: 'O conteúdo não pôde ser carregado.' },
    network: { title: 'Problema de conexão', message: 'Não foi possível falar com o servidor. Confira a conexão e tente de novo.' },
    server: { title: 'O servidor falhou', message: 'O servidor não concluiu o pedido. Tente de novo em instantes.' },
    permission: { title: 'Sem acesso', message: 'Seu papel não permite ver este conteúdo.' },
    'not-found': { title: 'Não encontrado', message: 'Este item não existe ou foi removido.' },
    conflict: { title: 'Alterado por outra pessoa', message: 'Alguém alterou este item antes de você. Recarregue para ver a versão atual.' },
    retry: 'Tentar de novo',
    details: 'Detalhes técnicos',
    statusCode: (code) => `Código ${code}`,
  },
  pagination: {
    navigation: 'Paginação',
    previous: 'Anterior',
    next: 'Próxima',
    pageSize: 'Itens por página',
    range: (from, to, total) => `${from} a ${to} de ${total}`,
    page: (n) => `Página ${n}`,
    pageOf: (n, count) => `Página ${n} de ${count}`,
  },
  skipLink: 'Ir para o conteúdo',
  status: {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    active: 'Ativo',
    inactive: 'Inativo',
    processing: 'Processando',
    error: 'Erro',
    success: 'Sucesso',
  },
  tag: { remove: (text) => `Remover ${text}` },
  toast: { region: 'Notificações', dismiss: 'Dispensar notificação' },
  avatar: { open: (name) => `Abrir perfil de ${name}` },
  frame: {
    navigation: 'Principal',
    openNavigation: 'Abrir navegação',
    closeNavigation: 'Fechar navegação',
    collapseNavigation: 'Recolher navegação',
    expandNavigation: 'Expandir navegação',
    loadingPage: 'Carregando a página',
    closePanel: 'Fechar painel',
  },
  table: {
    loading: 'Carregando a lista',
    selectAll: 'Selecionar todas as linhas',
    selectRow: (label) => `Selecionar ${label}`,
    empty: 'Nenhuma linha para mostrar',
    sortAscending: 'em ordem crescente',
    sortDescending: 'em ordem decrescente',
  },
  proof: {
    proved: 'provada',
    pending: 'pendente',
    refuted: 'refutada',
    not_disclosed: 'não informada',
    none: 'sem prova',
    provedBy: (who) => `por ${who}`,
    rule: (rule) => `regra ${rule}`,
  },
  actor: { person: 'pessoa', agent: 'agente', system: 'sistema' },
}

export const messagesEs: Messages = {
  ...formsAEs,
  ...formsBEs,
  ...overlaysNavEs,
  ...dataAEs,
  ...dataBEs,
  ...chartsGeoEs,
  ...authBrandEs,
  ...platformEs,
  ...showcaseEs,
  ...shellEs,
  ...coreEs,
}

/** The wave-1 part of the catalogue (the keys not owned by a group). */
export type CoreMessages = Omit<Messages, keyof GroupMessages>

/** Catalogues shipped as defaults. Other locales fall back to English copy with locale-aware formatting. */
export const shippedCatalogues = { en: defaultMessages, 'pt-BR': messagesPtBR, es: messagesEs } as const

/** Default catalogue for a BCP 47 locale: Portuguese and Spanish by language subtag, English otherwise. */
export function catalogueForLocale(locale: string | undefined): Messages {
  const language = (locale ?? 'en').toLowerCase().split(/[-_]/)[0]
  return language === 'pt' ? messagesPtBR : language === 'es' ? messagesEs : defaultMessages
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...args: never[]) => unknown ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] }
export type MessageOverrides = DeepPartial<Messages>

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

export function mergeMessages(base: Messages, overrides?: MessageOverrides): Messages {
  if (!overrides) return base
  const walk = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...a }
    for (const [k, v] of Object.entries(b)) {
      if (v === undefined) continue
      out[k] = isPlainObject(v) && isPlainObject(a[k]) ? walk(a[k] as Record<string, unknown>, v) : v
    }
    return out
  }
  return walk(base as unknown as Record<string, unknown>, overrides as Record<string, unknown>) as unknown as Messages
}
