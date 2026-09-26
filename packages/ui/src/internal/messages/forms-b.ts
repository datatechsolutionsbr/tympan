// Copy of the "forms-b" group (wave 2). One namespace per component, English
// and Brazilian Portuguese. Merged into `Messages` by ../messages.ts.

export interface FormsBMessages {
  tagField: {
    remove: (display: string) => string
    chosen: (field: string) => string
    suggestions: string
  }
  currencyField: {
    currency: (name: string) => string
  }
  dateField: {
    placeholder: string
    previousMonth: string
    nextMonth: string
    previousYear: string
    nextYear: string
    today: string
    todayMarker: string
    chooseMonth: (current: string) => string
    backToDays: string
    months: string
    years: string
  }
  timeField: {
    placeholder: string
    hours: string
    minutes: string
    confirm: string
    future: string
  }
  monthField: {
    placeholder: string
    previousYear: string
    nextYear: string
    months: string
    years: string
  }
  localePicker: {
    title: string
    trigger: (title: string, language: string) => string
    current: (language: string, code: string) => string
    list: string
  }
  imagePicker: {
    change: string
    wrongType: string
    tooLarge: (limit: string) => string
    failed: string
    updated: string
    uploading: string
  }
  requestForm: {
    submit: string
    reject: string
    sending: string
    choose: string
    required: string
    notNumber: string
    atLeast: (min: number) => string
    atMost: (max: number) => string
    defaultReason: string
    approved: string
    rejected: string
    approvedSentence: string
    rejectedSentence: string
    failed: string
  }
  formActions: {
    saving: string
  }
}

export const formsBEn: FormsBMessages = {
  tagField: {
    remove: (d) => `Remove ${d}`,
    chosen: (f) => `${f}: chosen values`,
    suggestions: 'Suggestions',
  },
  currencyField: {
    currency: (name) => `Currency: ${name}`,
  },
  dateField: {
    placeholder: 'Select a date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    today: 'Today',
    todayMarker: 'today',
    chooseMonth: (c) => `${c}, choose month and year`,
    backToDays: 'Back to days',
    months: 'Months',
    years: 'Years',
  },
  timeField: {
    placeholder: 'Select a time',
    hours: 'Hours',
    minutes: 'Minutes',
    confirm: 'Confirm',
    future: 'This time is still in the future. Choose a time up to now.',
  },
  monthField: {
    placeholder: 'Select a month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    months: 'Months',
    years: 'Years with data',
  },
  localePicker: {
    title: 'Language',
    trigger: (t, l) => `${t}: ${l}`,
    current: (l, c) => `Current language: ${l} (${c})`,
    list: 'Available languages',
  },
  imagePicker: {
    change: 'Change picture',
    wrongType: 'This file type is not accepted. Choose a JPEG, PNG or WebP image.',
    tooLarge: (limit) => `The file is larger than ${limit}. Choose a smaller image.`,
    failed: 'The picture could not be uploaded. Try again.',
    updated: 'Picture updated',
    uploading: 'Uploading the picture',
  },
  requestForm: {
    submit: 'Submit',
    reject: 'Reject',
    sending: 'Sending',
    choose: 'Choose…',
    required: 'Fill in this field.',
    notNumber: 'Enter a number.',
    atLeast: (n) => `Enter ${n} or more.`,
    atMost: (n) => `Enter ${n} or less.`,
    defaultReason: 'Rejected by the reviewer',
    approved: 'Approved',
    rejected: 'Rejected',
    approvedSentence: 'Answer sent. The run resumed.',
    rejectedSentence: 'Request rejected. The run was closed.',
    failed: 'The answer could not be sent.',
  },
  formActions: {
    saving: 'Saving',
  },
}

export const formsBPtBR: FormsBMessages = {
  tagField: {
    remove: (d) => `Remover ${d}`,
    chosen: (f) => `${f}: valores escolhidos`,
    suggestions: 'Sugestões',
  },
  currencyField: {
    currency: (name) => `Moeda: ${name}`,
  },
  dateField: {
    placeholder: 'Selecione uma data',
    previousMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    previousYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    today: 'Hoje',
    todayMarker: 'hoje',
    chooseMonth: (c) => `${c}, escolher mês e ano`,
    backToDays: 'Voltar aos dias',
    months: 'Meses',
    years: 'Anos',
  },
  timeField: {
    placeholder: 'Selecione um horário',
    hours: 'Horas',
    minutes: 'Minutos',
    confirm: 'Confirmar',
    future: 'Este horário ainda está no futuro. Escolha um horário até agora.',
  },
  monthField: {
    placeholder: 'Selecione um mês',
    previousYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    months: 'Meses',
    years: 'Anos com dados',
  },
  localePicker: {
    title: 'Idioma',
    trigger: (t, l) => `${t}: ${l}`,
    current: (l, c) => `Idioma atual: ${l} (${c})`,
    list: 'Idiomas disponíveis',
  },
  imagePicker: {
    change: 'Trocar imagem',
    wrongType: 'Este tipo de arquivo não é aceito. Escolha uma imagem JPEG, PNG ou WebP.',
    tooLarge: (limit) => `O arquivo tem mais de ${limit}. Escolha uma imagem menor.`,
    failed: 'Não foi possível enviar a imagem. Tente de novo.',
    updated: 'Imagem atualizada',
    uploading: 'Enviando a imagem',
  },
  requestForm: {
    submit: 'Enviar',
    reject: 'Rejeitar',
    sending: 'Enviando',
    choose: 'Escolha…',
    required: 'Preencha este campo.',
    notNumber: 'Digite um número.',
    atLeast: (n) => `Digite ${n} ou mais.`,
    atMost: (n) => `Digite ${n} ou menos.`,
    defaultReason: 'Rejeitado por quem revisou',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    approvedSentence: 'Resposta enviada. A execução foi retomada.',
    rejectedSentence: 'Pedido rejeitado. A execução foi encerrada.',
    failed: 'Não foi possível enviar a resposta.',
  },
  formActions: {
    saving: 'Salvando',
  },
}

/** Spanish (placeholder until translated: falls back to English). */
export const formsBEs: FormsBMessages = formsBEn
