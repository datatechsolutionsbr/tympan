// Copy of the "auth-brand" group (wave 2/4). One namespace per component,
// English and Brazilian Portuguese. Merged into `Messages` by ../messages.ts.

export type HttpErrorKind = 'not-found' | 'bad-request' | 'server-error'

interface PageCopy {
  title: string
  message: string
}

export interface AuthBrandMessages {
  brand: { productName: string }
  federatedSignIn: { continueWith: (provider: string) => string; groupLabel: string }
  providerMark: { otherProvider: string }
  upgradeGate: {
    eyebrow: string
    title: string
    description: string
    cannotDismiss: string
    noticeTitle: string
    noticeBody: string
    viewPlans: string
    signOut: string
  }
  httpError: Record<HttpErrorKind, PageCopy> & { codeLabel: (code: number) => string; problemType: string }
  routeProgress: { label: string }
  consent: { label: string; message: string; learnMore: string; accept: string; reject: string }
  environment: {
    label: string
    message: string
    appName: string
    port: string
    apiBase: string
    email: string
    role: string
  }
  legalDocument: { contents: string; showContents: string }
}

export const authBrandEn: AuthBrandMessages = {
  brand: { productName: 'Fakhir' },
  federatedSignIn: { continueWith: (p) => `Continue with ${p}`, groupLabel: 'Other ways to sign in' },
  providerMark: { otherProvider: 'Other provider' },
  upgradeGate: {
    eyebrow: 'Subscription',
    title: 'Your organisation has no active plan',
    description: 'Choose a plan to keep working. This screen stays until a plan is active.',
    cannotDismiss: 'This message cannot be closed.',
    noticeTitle: 'Projects are read only',
    noticeBody: 'You can still sign out. Research data is kept and nothing is deleted.',
    viewPlans: 'View plans',
    signOut: 'Sign out',
  },
  httpError: {
    'not-found': { title: 'Page not found', message: 'The address may be wrong, or the page was moved or removed.' },
    'bad-request': { title: 'The request could not be read', message: 'Something in the address or the form was not understood. Check it and try again.' },
    'server-error': { title: 'The server failed', message: 'The server could not complete the request. Try again in a moment.' },
    codeLabel: (code) => `Error ${code}`,
    problemType: 'Problem type',
  },
  routeProgress: { label: 'Loading page' },
  consent: {
    label: 'Cookie choice',
    message: 'We use essential cookies to keep you signed in. With your consent we also measure how the platform is used.',
    learnMore: 'Privacy policy',
    accept: 'Accept measurement',
    reject: 'Only essential cookies',
  },
  environment: {
    label: 'Environment',
    message: 'Not the production platform. Data may be simulated.',
    appName: 'App',
    port: 'Port',
    apiBase: 'API',
    email: 'User',
    role: 'Role',
  },
  legalDocument: { contents: 'Contents', showContents: 'Show contents' },
}

export const authBrandPtBR: AuthBrandMessages = {
  brand: { productName: 'Fakhir' },
  federatedSignIn: { continueWith: (p) => `Continuar com ${p}`, groupLabel: 'Outras formas de entrar' },
  providerMark: { otherProvider: 'Outro provedor' },
  upgradeGate: {
    eyebrow: 'Assinatura',
    title: 'Sua organização não tem plano ativo',
    description: 'Escolha um plano para continuar. Esta tela fica até que um plano esteja ativo.',
    cannotDismiss: 'Esta mensagem não pode ser fechada.',
    noticeTitle: 'Os projetos estão só para leitura',
    noticeBody: 'Você ainda pode sair. Os dados da pesquisa são mantidos e nada é apagado.',
    viewPlans: 'Ver planos',
    signOut: 'Sair',
  },
  httpError: {
    'not-found': { title: 'Página não encontrada', message: 'O endereço pode estar errado, ou a página foi movida ou removida.' },
    'bad-request': { title: 'O pedido não pôde ser lido', message: 'Algo no endereço ou no formulário não foi entendido. Confira e tente de novo.' },
    'server-error': { title: 'O servidor falhou', message: 'O servidor não concluiu o pedido. Tente de novo em instantes.' },
    codeLabel: (code) => `Erro ${code}`,
    problemType: 'Tipo do problema',
  },
  routeProgress: { label: 'Carregando a página' },
  consent: {
    label: 'Escolha de cookies',
    message: 'Usamos cookies essenciais para manter você conectado. Com seu consentimento, também medimos como a plataforma é usada.',
    learnMore: 'Política de privacidade',
    accept: 'Aceitar medição',
    reject: 'Só cookies essenciais',
  },
  environment: {
    label: 'Ambiente',
    message: 'Não é a plataforma de produção. Os dados podem ser simulados.',
    appName: 'App',
    port: 'Porta',
    apiBase: 'API',
    email: 'Usuário',
    role: 'Papel',
  },
  legalDocument: { contents: 'Sumário', showContents: 'Mostrar sumário' },
}

/** Spanish (placeholder until translated: falls back to English). */
export const authBrandEs: AuthBrandMessages = authBrandEn
