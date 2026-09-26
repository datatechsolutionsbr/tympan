// Copy of the "platform" group (wave 2/4). One namespace per component, English,
// Brazilian Portuguese and Spanish. Merged into `Messages` by ../messages.ts.

export interface PlatformMessages {
  formatters: { placeholder: string }
  swipeRow: {
    actionsFor: (row: string) => string
    delete: string
    archive: string
    edit: string
    favourite: string
  }
  pullToRefresh: { refreshing: string }
  glassCheck: { label: string; notApplicable: string }
}

export const platformEn: PlatformMessages = {
  formatters: { placeholder: 'not informed' },
  swipeRow: {
    actionsFor: (row) => `Actions for ${row}`,
    delete: 'Delete',
    archive: 'Archive',
    edit: 'Edit',
    favourite: 'Favourite',
  },
  pullToRefresh: { refreshing: 'Refreshing' },
  glassCheck: {
    label: 'Glass check',
    notApplicable: 'Surfaces are opaque in this display mode, so the check does not apply.',
  },
}

export const platformPtBR: PlatformMessages = {
  formatters: { placeholder: 'não informado' },
  swipeRow: {
    actionsFor: (row) => `Ações de ${row}`,
    delete: 'Excluir',
    archive: 'Arquivar',
    edit: 'Editar',
    favourite: 'Favoritar',
  },
  pullToRefresh: { refreshing: 'Atualizando' },
  glassCheck: {
    label: 'Teste do vidro',
    notApplicable: 'As superfícies ficam opacas neste modo de exibição, então o teste não se aplica.',
  },
}

export const platformEs: PlatformMessages = {
  formatters: { placeholder: 'no informado' },
  swipeRow: {
    actionsFor: (row) => `Acciones de ${row}`,
    delete: 'Eliminar',
    archive: 'Archivar',
    edit: 'Editar',
    favourite: 'Marcar como favorito',
  },
  pullToRefresh: { refreshing: 'Actualizando' },
  glassCheck: {
    label: 'Prueba del vidrio',
    notApplicable: 'Las superficies son opacas en este modo de visualización, así que la prueba no se aplica.',
  },
}
