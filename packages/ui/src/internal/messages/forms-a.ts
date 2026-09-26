// Copy of the "forms-a" group (wave 2). One namespace per component, English
// and Brazilian Portuguese. Merged into `Messages` by ../messages.ts.

export interface FormsAMessages {
  themeSwitcher: { label: string; toLight: string; toDark: string }
  stateSwitch: { off: string; on: string }
  /** `box`: {0} = 1-based position, {1} = total boxes. */
  oneTimeCode: { label: string; box: (position: number, total: number) => string }
  passwordStrength: {
    label: string
    levels: [string, string, string, string]
    met: string
    notMet: string
    /** Polite announcement of the level; {0} = level word. */
    announce: (level: string) => string
    rules: {
      minLength: (count: number) => string
      uppercase: string
      lowercase: string
      digit: string
      symbol: string
    }
  }
  searchBar: {
    label: string
    placeholder: string
    refinePlaceholder: string
    clearSearch: string
    clearAll: string
    cancel: string
    filters: string
    /** {0} = number of active filters. */
    filtersActive: (count: number) => string
    filtersTitle: string
    clear: string
    done: string
  }
  filterField: { clear: string }
  filterChips: { group: string; remove: (label: string) => string; removed: (label: string) => string; clearAll: string }
  choiceCard: { unavailable: string }
  chipGroup: {
    /** {0} = number of selected chips. */
    selected: (count: number) => string
    selectAll: string
    clear: string
    empty: string
    loading: string
    addPlaceholder: string
    addLabel: string
    remove: (name: string) => string
  }
  flagSetPicker: { presets: string; options: string }
}

export const formsAEn: FormsAMessages = {
  themeSwitcher: { label: 'Dark mode', toLight: 'Switch to light mode', toDark: 'Switch to dark mode' },
  stateSwitch: { off: 'Inactive', on: 'Active' },
  oneTimeCode: { label: 'Verification code', box: (n, total) => `Character ${n} of ${total}` },
  passwordStrength: {
    label: 'Password strength',
    levels: ['Weak', 'Fair', 'Good', 'Strong'],
    met: 'met:',
    notMet: 'not met:',
    announce: (word) => `Password strength: ${word}`,
    rules: {
      minLength: (n) => `At least ${n} characters`,
      uppercase: 'An uppercase letter',
      lowercase: 'A lowercase letter',
      digit: 'A digit',
      symbol: 'A symbol',
    },
  },
  searchBar: {
    label: 'Search',
    placeholder: 'Search',
    refinePlaceholder: 'Refine within the filters',
    clearSearch: 'Clear search',
    clearAll: 'Clear all',
    cancel: 'Cancel',
    filters: 'Filters',
    filtersActive: (n) => `Filters, ${n} active`,
    filtersTitle: 'Filters',
    clear: 'Clear',
    done: 'Done',
  },
  filterField: { clear: 'Clear filter' },
  filterChips: {
    group: 'Active filters',
    remove: (label) => `Remove ${label}`,
    removed: (label) => `${label} removed`,
    clearAll: 'Clear all',
  },
  choiceCard: { unavailable: 'Unavailable' },
  chipGroup: {
    selected: (n) => `${n} selected`,
    selectAll: 'Select all',
    clear: 'Clear',
    empty: 'No items to choose from',
    loading: 'Loading items',
    addPlaceholder: 'Add and press Enter',
    addLabel: 'Add an item',
    remove: (name) => `Remove ${name}`,
  },
  flagSetPicker: { presets: 'Presets', options: 'Options' },
}

export const formsAPtBR: FormsAMessages = {
  themeSwitcher: { label: 'Modo escuro', toLight: 'Mudar para o modo claro', toDark: 'Mudar para o modo escuro' },
  stateSwitch: { off: 'Inativo', on: 'Ativo' },
  oneTimeCode: { label: 'Código de verificação', box: (n, total) => `Caractere ${n} de ${total}` },
  passwordStrength: {
    label: 'Força da senha',
    levels: ['Fraca', 'Razoável', 'Boa', 'Forte'],
    met: 'atendido:',
    notMet: 'não atendido:',
    announce: (word) => `Força da senha: ${word}`,
    rules: {
      minLength: (n) => `Pelo menos ${n} caracteres`,
      uppercase: 'Uma letra maiúscula',
      lowercase: 'Uma letra minúscula',
      digit: 'Um número',
      symbol: 'Um símbolo',
    },
  },
  searchBar: {
    label: 'Busca',
    placeholder: 'Buscar',
    refinePlaceholder: 'Refinar dentro dos filtros',
    clearSearch: 'Limpar busca',
    clearAll: 'Limpar tudo',
    cancel: 'Cancelar',
    filters: 'Filtros',
    filtersActive: (n) => (n === 1 ? 'Filtros, 1 ativo' : `Filtros, ${n} ativos`),
    filtersTitle: 'Filtros',
    clear: 'Limpar',
    done: 'Concluir',
  },
  filterField: { clear: 'Limpar filtro' },
  filterChips: {
    group: 'Filtros ativos',
    remove: (label) => `Remover ${label}`,
    removed: (label) => `${label} removido`,
    clearAll: 'Limpar tudo',
  },
  choiceCard: { unavailable: 'Indisponível' },
  chipGroup: {
    selected: (n) => (n === 1 ? '1 selecionado' : `${n} selecionados`),
    selectAll: 'Selecionar todos',
    clear: 'Limpar',
    empty: 'Nenhum item para escolher',
    loading: 'Carregando itens',
    addPlaceholder: 'Digite e pressione Enter',
    addLabel: 'Adicionar item',
    remove: (name) => `Remover ${name}`,
  },
  flagSetPicker: { presets: 'Predefinições', options: 'Opções' },
}

/** Spanish (neutral Latin-American). */
export const formsAEs: FormsAMessages = {
  themeSwitcher: { label: 'Modo oscuro', toLight: 'Cambiar al modo claro', toDark: 'Cambiar al modo oscuro' },
  stateSwitch: { off: 'Inactivo', on: 'Activo' },
  oneTimeCode: { label: 'Código de verificación', box: (n, total) => `Carácter ${n} de ${total}` },
  passwordStrength: {
    label: 'Seguridad de la contraseña',
    levels: ['Débil', 'Aceptable', 'Buena', 'Fuerte'],
    met: 'cumplido:',
    notMet: 'no cumplido:',
    announce: (word) => `Seguridad de la contraseña: ${word}`,
    rules: {
      minLength: (n) => `Al menos ${n} caracteres`,
      uppercase: 'Una letra mayúscula',
      lowercase: 'Una letra minúscula',
      digit: 'Un número',
      symbol: 'Un símbolo',
    },
  },
  searchBar: {
    label: 'Búsqueda',
    placeholder: 'Buscar',
    refinePlaceholder: 'Refinar dentro de los filtros',
    clearSearch: 'Borrar búsqueda',
    clearAll: 'Borrar todo',
    cancel: 'Cancelar',
    filters: 'Filtros',
    filtersActive: (n) => (n === 1 ? 'Filtros, 1 activo' : `Filtros, ${n} activos`),
    filtersTitle: 'Filtros',
    clear: 'Borrar',
    done: 'Listo',
  },
  filterField: { clear: 'Borrar filtro' },
  filterChips: {
    group: 'Filtros activos',
    remove: (label) => `Quitar ${label}`,
    removed: (label) => `${label} quitado`,
    clearAll: 'Borrar todo',
  },
  choiceCard: { unavailable: 'No disponible' },
  chipGroup: {
    selected: (n) => (n === 1 ? '1 seleccionado' : `${n} seleccionados`),
    selectAll: 'Seleccionar todo',
    clear: 'Borrar',
    empty: 'No hay elementos para elegir',
    loading: 'Cargando elementos',
    addPlaceholder: 'Escribe y presiona Enter',
    addLabel: 'Agregar un elemento',
    remove: (name) => `Quitar ${name}`,
  },
  flagSetPicker: { presets: 'Ajustes predefinidos', options: 'Opciones' },
}
