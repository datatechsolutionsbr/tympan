// Copy of the "data-a" group (wave 2): lists, records, disclosure lists,
// identifiers and markdown. One namespace per component, English and
// Brazilian Portuguese. Merged into `Messages` by ../messages.ts.

export interface PluralNoun {
  one: string
  other: string
}

export interface DataAMessages {
  listRow: {
    /** Textual marker of the emphasised row (never only the background). */
    current: string
  }
  countBadge: {
    /** Default noun counted by a badge. */
    item: PluralNoun
    /** Accessible sentence, e.g. "3 notifications". */
    describe: (count: number, noun: string) => string
  }
  notificationCenter: {
    bell: string
    /** Bell name with unseen entries, e.g. "Notifications, 3 unread". */
    bellUnseen: (label: string, unseen: number) => string
    title: string
    clearAll: string
    cleared: string
    empty: string
    dismiss: (title: string) => string
    tone: Record<'success' | 'error' | 'warning' | 'info', string>
    time: { justNow: string; minutes: (n: number) => string; hours: (n: number) => string; days: (n: number) => string }
  }
  profileAvatar: { profile: string }
  copyIdentifier: {
    copy: string
    copied: string
    copiedStatus: (value: string) => string
    failed: string
  }
  recoveryCodes: {
    hidden: string
    reveal: string
    copyAll: string
    copied: string
    copyFailed: string
    download: string
    fileTitle: string
    generatedAt: (iso: string) => string
    keepSafe: string
    fileName: string
    listLabel: string
  }
  markdown: { codeBlock: (language?: string) => string }
}

export const dataAEn: DataAMessages = {
  listRow: { current: 'Current' },
  countBadge: {
    item: { one: 'item', other: 'items' },
    describe: (n, noun) => `${n} ${noun}`,
  },
  notificationCenter: {
    bell: 'Notifications',
    bellUnseen: (label, n) => `${label}, ${n} unread`,
    title: 'Notifications',
    clearAll: 'Clear all',
    cleared: 'Notifications cleared',
    empty: 'There are no notifications in this session.',
    dismiss: (title) => `Dismiss, ${title}`,
    tone: { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' },
    time: {
      justNow: 'just now',
      minutes: (n) => (n === 1 ? '1 minute ago' : `${n} minutes ago`),
      hours: (n) => (n === 1 ? '1 hour ago' : `${n} hours ago`),
      days: (n) => (n === 1 ? '1 day ago' : `${n} days ago`),
    },
  },
  profileAvatar: { profile: 'Profile' },
  copyIdentifier: {
    copy: 'Copy',
    copied: 'copied',
    copiedStatus: (v) => `Copied ${v}`,
    failed: 'Copying failed. Select the text to copy it by hand.',
  },
  recoveryCodes: {
    hidden: 'The recovery codes are hidden.',
    reveal: 'Show codes',
    copyAll: 'Copy all',
    copied: 'Copied',
    copyFailed: 'The clipboard is not available. Select the codes to copy them.',
    download: 'Download',
    fileTitle: 'Recovery codes',
    generatedAt: (iso) => `Generated at ${iso}`,
    keepSafe: 'Keep these codes somewhere safe. Each code works once.',
    fileName: 'recovery-codes.txt',
    listLabel: 'Recovery codes',
  },
  markdown: { codeBlock: (lang) => (lang ? `Code block, ${lang}` : 'Code block') },
}

export const dataAPtBR: DataAMessages = {
  listRow: { current: 'Atual' },
  countBadge: {
    item: { one: 'item', other: 'itens' },
    describe: (n, noun) => `${n} ${noun}`,
  },
  notificationCenter: {
    bell: 'Notificações',
    bellUnseen: (label, n) => `${label}, ${n} não ${n === 1 ? 'lida' : 'lidas'}`,
    title: 'Notificações',
    clearAll: 'Limpar tudo',
    cleared: 'Notificações apagadas',
    empty: 'Não há notificações nesta sessão.',
    dismiss: (title) => `Dispensar, ${title}`,
    tone: { success: 'Sucesso', error: 'Erro', warning: 'Atenção', info: 'Informação' },
    time: {
      justNow: 'agora mesmo',
      minutes: (n) => (n === 1 ? 'há 1 minuto' : `há ${n} minutos`),
      hours: (n) => (n === 1 ? 'há 1 hora' : `há ${n} horas`),
      days: (n) => (n === 1 ? 'há 1 dia' : `há ${n} dias`),
    },
  },
  profileAvatar: { profile: 'Perfil' },
  copyIdentifier: {
    copy: 'Copiar',
    copied: 'copiado',
    copiedStatus: (v) => `${v} copiado`,
    failed: 'Não foi possível copiar. Selecione o texto para copiar à mão.',
  },
  recoveryCodes: {
    hidden: 'Os códigos de recuperação estão ocultos.',
    reveal: 'Mostrar códigos',
    copyAll: 'Copiar todos',
    copied: 'Copiados',
    copyFailed: 'A área de transferência não está disponível. Selecione os códigos para copiá-los.',
    download: 'Baixar',
    fileTitle: 'Códigos de recuperação',
    generatedAt: (iso) => `Gerados em ${iso}`,
    keepSafe: 'Guarde estes códigos em lugar seguro. Cada código funciona uma vez.',
    fileName: 'codigos-de-recuperacao.txt',
    listLabel: 'Códigos de recuperação',
  },
  markdown: { codeBlock: (lang) => (lang ? `Bloco de código, ${lang}` : 'Bloco de código') },
}

/** Spanish (placeholder until translated: falls back to English). */
export const dataAEs: DataAMessages = dataAEn
