// Copy of the "overlays-nav" group (wave 2). One namespace per component,
// English and Brazilian Portuguese. Merged into `Messages` by ../messages.ts.

import { speaker } from './plural'

const en = speaker('en')
const pt = speaker('pt-BR')
const es = speaker('es')

export interface OverlaysNavMessages {
  sectionedModal: { close: string; cancel: string; save: string; sectionPicker: string }
  settingsDialog: {
    placeholder: string
    copy: (field: string) => string
    copied: string
    changePicture: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    changePassword: string
    passwordMismatch: string
  }
  confirm: { confirm: string; cancel: string; caution: string }
  detailsPopover: {
    tone: Record<'success' | 'pending' | 'error', string>
  }
  navigationFlyout: {
    title: string
    search: string
    noResults: string
    count: (n: number) => string
    notifications: string
    unseen: (n: number) => string
    darkTheme: string
    profile: string
    signOut: string
    destinations: string
  }
  appNavigation: {
    landmark: string
    home: string
    profile: string
    signOut: string
    theme: string
    themeLight: string
    themeDark: string
    language: string
    account: string
    openMenu: string
    closeMenu: string
    collapse: string
    expand: string
    pending: (label: string, n: number) => string
    submenu: (label: string) => string
  }
  appLauncher: {
    actions: string
    more: (label: string) => string
    shortcuts: (label: string) => string
    withCount: (label: string, n: number) => string
    withAlerts: (label: string, n: number) => string
    profileLoading: string
    profile: string
  }
  commandPalette: {
    label: string
    placeholder: string
    empty: string
    noResults: (query: string) => string
    loading: string
    removeScope: (scope: string) => string
    actionsFor: (item: string) => string
    recent: string
    results: (n: number) => string
    scopes: string
    fallback: string
    hints: { navigate: string; select: string; actions: string; back: string; close: string }
  }
  longPressMenu: { hint: string }
  floatingActionButton: { busy: string }
  stepList: {
    position: (n: number, total: number) => string
    status: Record<'complete' | 'current' | 'upcoming', string>
  }
  pageDots: { label: string; dot: (n: number, total: number) => string; counter: (n: number, total: number) => string }
  wizardPage: {
    previous: string
    next: string
    cancel: string
    submit: string
    submitting: string
    close: string
    actions: string
    documentTitle: (step: string, flow: string) => string
  }
}

export const overlaysNavEn: OverlaysNavMessages = {
  sectionedModal: { close: 'Close', cancel: 'Cancel', save: 'Save', sectionPicker: 'Section' },
  settingsDialog: {
    placeholder: 'Nothing to configure in this section yet.',
    copy: (f) => `Copy ${f}`,
    copied: 'Copied',
    changePicture: 'Change picture',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm the new password',
    changePassword: 'Change password',
    passwordMismatch: 'The two new passwords are different.',
  },
  confirm: { confirm: 'Confirm', cancel: 'Cancel', caution: 'Caution' },
  detailsPopover: { tone: { success: 'Success', pending: 'Pending', error: 'Error' } },
  navigationFlyout: {
    title: 'Navigation',
    search: 'Search destinations',
    noResults: 'No destination matches this search.',
    count: (n) => `${en.n(n)} ${en.word(n, { one: 'destination', other: 'destinations' })}`,
    notifications: 'Notifications',
    unseen: (n) => `${en.n(n)} unseen`,
    darkTheme: 'Dark theme',
    profile: 'Profile',
    signOut: 'Sign out',
    destinations: 'Destinations',
  },
  appNavigation: {
    landmark: 'Primary navigation',
    home: 'Home',
    profile: 'Profile',
    signOut: 'Sign out',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    account: 'Account',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    collapse: 'Collapse navigation',
    expand: 'Expand navigation',
    pending: (label, n) => `${label}, ${en.n(n)} pending`,
    submenu: (label) => `More in ${label}`,
  },
  appLauncher: {
    actions: 'Actions',
    more: (label) => `More for ${label}`,
    shortcuts: (label) => `Shortcuts of ${label}`,
    withCount: (label, n) => `${label}, ${en.n(n)} new`,
    withAlerts: (label, n) => `${label}, ${en.n(n)} ${en.word(n, { one: 'alert', other: 'alerts' })}`,
    profileLoading: 'Loading the profile',
    profile: 'Profile',
  },
  commandPalette: {
    label: 'Search and commands',
    placeholder: 'Search or type a command',
    empty: 'Type to search records, sources and screens.',
    noResults: (q) => `Nothing matches “${q}”.`,
    loading: 'Loading results',
    removeScope: (s) => `Remove scope ${s}`,
    actionsFor: (item) => `Actions for ${item}`,
    recent: 'Recent',
    results: (n) => `${en.n(n)} ${en.word(n, { one: 'result', other: 'results' })}`,
    scopes: 'Scopes',
    fallback: 'Other actions',
    hints: { navigate: 'move', select: 'open', actions: 'actions', back: 'back', close: 'close' },
  },
  longPressMenu: { hint: 'More actions: long press, right click or Shift+F10.' },
  floatingActionButton: { busy: 'Working' },
  stepList: {
    position: (n, total) => `Step ${en.n(n)} of ${en.n(total)}`,
    status: { complete: 'completed', current: 'current', upcoming: 'not started' },
  },
  pageDots: {
    label: 'Pages',
    dot: (n, total) => `Page ${en.n(n)} of ${en.n(total)}`,
    counter: (n, total) => `${en.n(n)} of ${en.n(total)}`,
  },
  wizardPage: {
    previous: 'Previous',
    next: 'Next',
    cancel: 'Cancel',
    submit: 'Submit',
    submitting: 'Submitting',
    close: 'Close',
    actions: 'Step actions',
    documentTitle: (step, flow) => `${step}: ${flow}`,
  },
}

export const overlaysNavPtBR: OverlaysNavMessages = {
  sectionedModal: { close: 'Fechar', cancel: 'Cancelar', save: 'Salvar', sectionPicker: 'Seção' },
  settingsDialog: {
    placeholder: 'Ainda não há o que configurar nesta seção.',
    copy: (f) => `Copiar ${f}`,
    copied: 'Copiado',
    changePicture: 'Trocar foto',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirme a nova senha',
    changePassword: 'Trocar senha',
    passwordMismatch: 'As duas senhas novas são diferentes.',
  },
  confirm: { confirm: 'Confirmar', cancel: 'Cancelar', caution: 'Atenção' },
  detailsPopover: { tone: { success: 'Sucesso', pending: 'Pendente', error: 'Erro' } },
  navigationFlyout: {
    title: 'Navegação',
    search: 'Buscar destinos',
    noResults: 'Nenhum destino corresponde à busca.',
    count: (n) => `${pt.n(n)} ${pt.word(n, { one: 'destino', other: 'destinos' })}`,
    notifications: 'Notificações',
    unseen: (n) => `${pt.n(n)} ${pt.word(n, { one: 'não vista', other: 'não vistas' })}`,
    darkTheme: 'Tema escuro',
    profile: 'Perfil',
    signOut: 'Sair',
    destinations: 'Destinos',
  },
  appNavigation: {
    landmark: 'Navegação principal',
    home: 'Início',
    profile: 'Perfil',
    signOut: 'Sair',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    language: 'Idioma',
    account: 'Conta',
    openMenu: 'Abrir navegação',
    closeMenu: 'Fechar navegação',
    collapse: 'Recolher navegação',
    expand: 'Expandir navegação',
    pending: (label, n) => `${label}, ${pt.n(n)} ${pt.word(n, { one: 'pendente', other: 'pendentes' })}`,
    submenu: (label) => `Mais em ${label}`,
  },
  appLauncher: {
    actions: 'Ações',
    more: (label) => `Mais opções de ${label}`,
    shortcuts: (label) => `Atalhos de ${label}`,
    withCount: (label, n) => `${label}, ${pt.n(n)} ${pt.word(n, { one: 'novo', other: 'novos' })}`,
    withAlerts: (label, n) => `${label}, ${pt.n(n)} ${pt.word(n, { one: 'alerta', other: 'alertas' })}`,
    profileLoading: 'Carregando o perfil',
    profile: 'Perfil',
  },
  commandPalette: {
    label: 'Busca e comandos',
    placeholder: 'Busque ou digite um comando',
    empty: 'Digite para buscar registros, fontes e telas.',
    noResults: (q) => `Nada corresponde a “${q}”.`,
    loading: 'Carregando resultados',
    removeScope: (s) => `Remover o escopo ${s}`,
    actionsFor: (item) => `Ações de ${item}`,
    recent: 'Recentes',
    results: (n) => `${pt.n(n)} ${pt.word(n, { one: 'resultado', other: 'resultados' })}`,
    scopes: 'Escopos',
    fallback: 'Outras ações',
    hints: { navigate: 'mover', select: 'abrir', actions: 'ações', back: 'voltar', close: 'fechar' },
  },
  longPressMenu: { hint: 'Mais ações: toque longo, clique direito ou Shift+F10.' },
  floatingActionButton: { busy: 'Processando' },
  stepList: {
    position: (n, total) => `Etapa ${pt.n(n)} de ${pt.n(total)}`,
    status: { complete: 'concluída', current: 'atual', upcoming: 'não iniciada' },
  },
  pageDots: {
    label: 'Páginas',
    dot: (n, total) => `Página ${pt.n(n)} de ${pt.n(total)}`,
    counter: (n, total) => `${pt.n(n)} de ${pt.n(total)}`,
  },
  wizardPage: {
    previous: 'Anterior',
    next: 'Próxima',
    cancel: 'Cancelar',
    submit: 'Enviar',
    submitting: 'Enviando',
    close: 'Fechar',
    actions: 'Ações da etapa',
    documentTitle: (step, flow) => `${step}: ${flow}`,
  },
}

/** Spanish (neutral Latin American). */
export const overlaysNavEs: OverlaysNavMessages = {
  sectionedModal: { close: 'Cerrar', cancel: 'Cancelar', save: 'Guardar', sectionPicker: 'Sección' },
  settingsDialog: {
    placeholder: 'Todavía no hay nada que configurar en esta sección.',
    copy: (f) => `Copiar ${f}`,
    copied: 'Copiado',
    changePicture: 'Cambiar imagen',
    currentPassword: 'Contraseña actual',
    newPassword: 'Contraseña nueva',
    confirmPassword: 'Confirme la contraseña nueva',
    changePassword: 'Cambiar contraseña',
    passwordMismatch: 'Las dos contraseñas nuevas son distintas.',
  },
  confirm: { confirm: 'Confirmar', cancel: 'Cancelar', caution: 'Atención' },
  detailsPopover: { tone: { success: 'Éxito', pending: 'Pendiente', error: 'Error' } },
  navigationFlyout: {
    title: 'Navegación',
    search: 'Buscar destinos',
    noResults: 'Ningún destino coincide con esta búsqueda.',
    count: (n) => `${es.n(n)} ${es.word(n, { one: 'destino', other: 'destinos' })}`,
    notifications: 'Notificaciones',
    unseen: (n) => `${es.n(n)} ${es.word(n, { one: 'sin ver', other: 'sin ver' })}`,
    darkTheme: 'Tema oscuro',
    profile: 'Perfil',
    signOut: 'Cerrar sesión',
    destinations: 'Destinos',
  },
  appNavigation: {
    landmark: 'Navegación principal',
    home: 'Inicio',
    profile: 'Perfil',
    signOut: 'Cerrar sesión',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    language: 'Idioma',
    account: 'Cuenta',
    openMenu: 'Abrir navegación',
    closeMenu: 'Cerrar navegación',
    collapse: 'Contraer navegación',
    expand: 'Expandir navegación',
    pending: (label, n) => `${label}, ${es.n(n)} ${es.word(n, { one: 'pendiente', other: 'pendientes' })}`,
    submenu: (label) => `Más en ${label}`,
  },
  appLauncher: {
    actions: 'Acciones',
    more: (label) => `Más para ${label}`,
    shortcuts: (label) => `Atajos de ${label}`,
    withCount: (label, n) => `${label}, ${es.n(n)} ${es.word(n, { one: 'nuevo', other: 'nuevos' })}`,
    withAlerts: (label, n) => `${label}, ${es.n(n)} ${es.word(n, { one: 'alerta', other: 'alertas' })}`,
    profileLoading: 'Cargando el perfil',
    profile: 'Perfil',
  },
  commandPalette: {
    label: 'Búsqueda y comandos',
    placeholder: 'Busque o escriba un comando',
    empty: 'Escriba para buscar registros, fuentes y pantallas.',
    noResults: (q) => `Nada coincide con «${q}».`,
    loading: 'Cargando resultados',
    removeScope: (s) => `Quitar el ámbito ${s}`,
    actionsFor: (item) => `Acciones de ${item}`,
    recent: 'Recientes',
    results: (n) => `${es.n(n)} ${es.word(n, { one: 'resultado', other: 'resultados' })}`,
    scopes: 'Ámbitos',
    fallback: 'Otras acciones',
    hints: { navigate: 'mover', select: 'abrir', actions: 'acciones', back: 'volver', close: 'cerrar' },
  },
  longPressMenu: { hint: 'Más acciones: mantenga pulsado, clic derecho o Mayús+F10.' },
  floatingActionButton: { busy: 'Trabajando' },
  stepList: {
    position: (n, total) => `Paso ${es.n(n)} de ${es.n(total)}`,
    status: { complete: 'completado', current: 'actual', upcoming: 'sin empezar' },
  },
  pageDots: {
    label: 'Páginas',
    dot: (n, total) => `Página ${es.n(n)} de ${es.n(total)}`,
    counter: (n, total) => `${es.n(n)} de ${es.n(total)}`,
  },
  wizardPage: {
    previous: 'Anterior',
    next: 'Siguiente',
    cancel: 'Cancelar',
    submit: 'Enviar',
    submitting: 'Enviando',
    close: 'Cerrar',
    actions: 'Acciones del paso',
    documentTitle: (step, flow) => `${step}: ${flow}`,
  },
}
