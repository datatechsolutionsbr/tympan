// AssistantConversation: the dialogue surface over useAssistantSession. The log
// is a polite live region marked busy while a turn streams, so a completed
// turn is read once instead of every delta; failures go to an assertive
// region. The composer stays editable while the assistant answers.

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { CircleCheck, CircleX, LoaderCircle, PanelRight, RotateCcw, SendHorizontal, Square } from 'lucide-react'
import { Label, TextArea, TextField } from 'react-aria-components'
import { Button, Skeleton } from '@fakhir/design-system'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { AssistantVisualBlock } from './AssistantVisualBlock'
import { MarkdownView } from './MarkdownView'
import type { AssistantSession, Block, Utterance } from './useAssistantSession'

export interface AssistantLabels {
  log: string
  you: string
  assistant: string
  thinking: string
  composer: string
  placeholder: string
  send: string
  stop: string
  retry: string
  openCanvas: string
  emptyTitle: string
  emptyHint: string
  suggestions: string
  loading: string
  reasoning: string
  toolRunning: string
  toolSucceeded: string
  toolFailed: string
  turnFailed: string
  // ConversationShell
  history: string
  newConversation: string
  favouritesOnly: string
  favourite: string
  delete: string
  deleteTitle: string
  deleteMessage: string
  confirmDelete: string
  cancel: string
  historyEmpty: string
  noResults: string
  today: string
  yesterday: string
  lastWeek: string
  older: string
  moreAgents: string
  liveCanvas: string
  closeCanvas: string
  openHistory: string
  flowId: string
  canvasUnavailable: string
}

export const assistantLabels = defineLabels<AssistantLabels>('Assistant', {
  en: {
    log: 'Conversation',
    you: 'You',
    assistant: 'Assistant',
    thinking: 'Thinking',
    composer: 'Message to the assistant',
    placeholder: 'Ask about your research',
    send: 'Send',
    stop: 'Stop',
    retry: 'Try again',
    openCanvas: 'Open canvas',
    emptyTitle: 'Ask the research assistant',
    emptyHint: 'It can read your records, run analyses and build flows. Start from a suggestion or write your own question.',
    suggestions: 'Suggestions',
    loading: 'Loading the conversation',
    reasoning: 'Reasoning',
    toolRunning: '{tool}: running',
    toolSucceeded: '{tool}: done',
    toolFailed: '{tool}: failed',
    turnFailed: 'The assistant could not answer: {message}',
    history: 'Conversation history',
    newConversation: 'New conversation',
    favouritesOnly: 'Favourites only',
    favourite: 'Favourite {title}',
    delete: 'Delete {title}',
    deleteTitle: 'Delete “{title}”?',
    deleteMessage: 'The conversation and its messages will be removed.',
    confirmDelete: 'Delete',
    cancel: 'Cancel',
    historyEmpty: 'No conversations yet.',
    noResults: 'No conversation matches this filter.',
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last 7 days',
    older: 'Older',
    moreAgents: '+{n, number}',
    liveCanvas: 'Live canvas',
    closeCanvas: 'Close canvas',
    openHistory: 'Conversations',
    flowId: 'Flow {id}',
    canvasUnavailable: 'The canvas preview is not available here.',
  },
  'pt-BR': {
    log: 'Conversa',
    you: 'Você',
    assistant: 'Assistente',
    thinking: 'Pensando',
    composer: 'Mensagem para o assistente',
    placeholder: 'Pergunte sobre a sua pesquisa',
    send: 'Enviar',
    stop: 'Parar',
    retry: 'Tentar de novo',
    openCanvas: 'Abrir canvas',
    emptyTitle: 'Pergunte ao assistente de pesquisa',
    emptyHint: 'Ele lê os registros, executa análises e monta fluxos. Comece por uma sugestão ou escreva a sua pergunta.',
    suggestions: 'Sugestões',
    loading: 'Carregando a conversa',
    reasoning: 'Raciocínio',
    toolRunning: '{tool}: em execução',
    toolSucceeded: '{tool}: concluída',
    toolFailed: '{tool}: falhou',
    turnFailed: 'O assistente não conseguiu responder: {message}',
    history: 'Histórico de conversas',
    newConversation: 'Nova conversa',
    favouritesOnly: 'Só favoritas',
    favourite: 'Favoritar {title}',
    delete: 'Excluir {title}',
    deleteTitle: 'Excluir “{title}”?',
    deleteMessage: 'A conversa e as mensagens serão removidas.',
    confirmDelete: 'Excluir',
    cancel: 'Cancelar',
    historyEmpty: 'Ainda não há conversas.',
    noResults: 'Nenhuma conversa com esse filtro.',
    today: 'Hoje',
    yesterday: 'Ontem',
    lastWeek: 'Últimos 7 dias',
    older: 'Anteriores',
    moreAgents: '+{n, number}',
    liveCanvas: 'Canvas ao vivo',
    closeCanvas: 'Fechar canvas',
    openHistory: 'Conversas',
    flowId: 'Fluxo {id}',
    canvasUnavailable: 'A prévia do canvas não está disponível aqui.',
  },
  es: {
    log: 'Conversación',
    you: 'Tú',
    assistant: 'Asistente',
    thinking: 'Pensando',
    composer: 'Mensaje para el asistente',
    placeholder: 'Pregunta sobre tu investigación',
    send: 'Enviar',
    stop: 'Detener',
    retry: 'Intentar de nuevo',
    openCanvas: 'Abrir lienzo',
    emptyTitle: 'Pregunta al asistente de investigación',
    emptyHint: 'Lee los registros, ejecuta análisis y arma flujos. Empieza por una sugerencia o escribe tu pregunta.',
    suggestions: 'Sugerencias',
    loading: 'Cargando la conversación',
    reasoning: 'Razonamiento',
    toolRunning: '{tool}: en curso',
    toolSucceeded: '{tool}: listo',
    toolFailed: '{tool}: falló',
    turnFailed: 'El asistente no pudo responder: {message}',
    history: 'Historial de conversaciones',
    newConversation: 'Nueva conversación',
    favouritesOnly: 'Solo favoritas',
    favourite: 'Marcar {title} como favorita',
    delete: 'Eliminar {title}',
    deleteTitle: '¿Eliminar «{title}»?',
    deleteMessage: 'Se eliminarán la conversación y sus mensajes.',
    confirmDelete: 'Eliminar',
    cancel: 'Cancelar',
    historyEmpty: 'Todavía no hay conversaciones.',
    noResults: 'Ninguna conversación coincide con este filtro.',
    today: 'Hoy',
    yesterday: 'Ayer',
    lastWeek: 'Últimos 7 días',
    older: 'Anteriores',
    moreAgents: '+{n, number}',
    liveCanvas: 'Lienzo en vivo',
    closeCanvas: 'Cerrar lienzo',
    openHistory: 'Conversaciones',
    flowId: 'Flujo {id}',
    canvasUnavailable: 'La vista previa del lienzo no está disponible aquí.',
  },
})

export const defaultAssistantLabels: AssistantLabels = assistantLabels.bundles.en

export interface AssistantConversationProps {
  session: AssistantSession
  labels?: Partial<AssistantLabels>
  suggestions?: string[]
  variant?: 'panel' | 'full'
  appMark?: ReactNode
  onOpenCanvas?: () => void
  canOpenCanvas?: boolean
  /** Number formatting of visual answers. */
  locale?: string
  currency?: string
  composerRef?: Ref<HTMLTextAreaElement>
  className?: string
}

const NEAR_BOTTOM = 96

export function AssistantConversation(props: AssistantConversationProps) {
  const { session, suggestions = [], variant = 'panel', appMark, onOpenCanvas, canOpenCanvas = false, locale, currency, composerRef, className } = props
  const l = useLabels(assistantLabels, props.labels)
  const { locale: providerLocale } = useFlowLocale()
  const loc = locale ?? providerLocale
  const logRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const [alert, setAlert] = useState('')
  const announcedFailure = useRef<string | null>(null)

  const last = session.utterances[session.utterances.length - 1]
  useEffect(() => {
    if (last?.phase === 'broken' && announcedFailure.current !== last.key) {
      announcedFailure.current = last.key
      setAlert(fill(l.turnFailed, { message: last.problem ?? '' }, loc))
    }
  }, [last, l.turnFailed, loc])

  useLayoutEffect(() => {
    const el = logRef.current
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight
  }, [session.utterances])

  const onScroll = () => {
    const el = logRef.current
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (session.working) return
    session.ask()
  }

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    submit()
  }

  const empty = !session.loadingHistory && session.utterances.length === 0

  return (
    <section className={['fk-chat', className].filter(Boolean).join(' ')} data-variant={variant} aria-label={l.log}>
      {session.loadingHistory ? (
        <div className="fk-chat__loading" role="status" aria-busy="true">
          <span className="fk-visually-hidden">{l.loading}</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="fk-chat__ghost" data-align={i % 2 ? 'end' : 'start'} aria-hidden="true">
              <Skeleton shape="rect" width={i % 2 ? 'medium' : 'long'} />
            </div>
          ))}
        </div>
      ) : empty ? (
        <div className="fk-chat__empty">
          {appMark ? (
            <div className="fk-chat__mark" aria-hidden="true">
              {appMark}
            </div>
          ) : null}
          <h2 className="fk-chat__empty-title">{l.emptyTitle}</h2>
          <p className="fk-chat__empty-hint">{l.emptyHint}</p>
          {suggestions.length ? (
            <ul className="fk-chat__suggestions" aria-label={l.suggestions}>
              {suggestions.map((s) => (
                <li key={s}>
                  <Button variant="secondary" size="compact" shape="pill" onPress={() => session.ask(s)}>
                    <span dir="auto">{s}</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div
        ref={logRef}
        className="fk-chat__log"
        role="log"
        aria-live="polite"
        aria-label={l.log}
        aria-busy={session.working || undefined}
        hidden={empty || session.loadingHistory}
        tabIndex={-1}
        onScroll={onScroll}
      >
        {session.utterances.map((m, i) => (
          <Bubble key={m.key} utterance={m} l={l} loc={loc} currency={currency} isLast={i === session.utterances.length - 1} session={session} onOpenCanvas={onOpenCanvas} />
        ))}
      </div>
      <div className="fk-visually-hidden" role="alert">
        {alert}
      </div>
      <form className="fk-chat__composer" onSubmit={submit}>
        <TextField className="fk-chat__field" value={session.draft} onChange={session.setDraft}>
          <Label className="fk-visually-hidden">
            {l.composer}
          </Label>
          <TextArea ref={composerRef} className="fk-chat__input" rows={2} placeholder={l.placeholder} dir="auto" data-fk-composer="" onKeyDown={onComposerKey} />
        </TextField>
        <div className="fk-chat__actions">
          {canOpenCanvas && onOpenCanvas ? (
            <Button variant="quiet" size="compact" leadingIcon={<PanelRight />} onPress={onOpenCanvas}>
              {l.openCanvas}
            </Button>
          ) : null}
          {session.working ? (
            <Button variant="secondary" iconOnly accessibleLabel={l.stop} leadingIcon={<Square />} onPress={session.halt} />
          ) : (
            <Button className="fk-chat__send" variant="primary" iconOnly accessibleLabel={l.send} leadingIcon={<SendHorizontal />} type="submit" disabled={!session.draft.trim()} />
          )}
        </div>
      </form>
    </section>
  )
}

function Bubble({ utterance, l, loc, currency, isLast, session, onOpenCanvas }: { utterance: Utterance; l: AssistantLabels; loc: string; currency: string | undefined; isLast: boolean; session: AssistantSession; onOpenCanvas: (() => void) | undefined }) {
  const user = utterance.speaker === 'person'
  return (
    <div className="fk-chat__message" data-speaker={utterance.speaker} data-align={user ? 'end' : 'start'} data-phase={utterance.phase}>
      <span className="fk-visually-hidden">{user ? l.you : l.assistant}</span>
      <div className="fk-chat__bubble" dir="auto">
        {utterance.phase === 'waiting' && !utterance.blocks.length ? (
          <p className="fk-chat__thinking">
            {l.thinking}
            <span className="fk-chat__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        ) : null}
        {utterance.blocks.map((p, i) => (
          <BlockView key={i} block={p} user={user} l={l} loc={loc} currency={currency} onOpenCanvas={onOpenCanvas} />
        ))}
        {utterance.phase === 'broken' ? (
          <div className="fk-chat__failure">
            <p className="fk-chat__error">
              <CircleX aria-hidden="true" focusable="false" />
              <span>{utterance.problem}</span>
            </p>
            {isLast && session.canAskAgain ? (
              <Button variant="secondary" size="compact" leadingIcon={<RotateCcw />} onPress={session.askAgain}>
                {l.retry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Icon, label key and CSS state of a tool call in each phase. */
const TOOL_LOOK = {
  working: { icon: LoaderCircle, label: 'toolRunning', state: 'running' },
  ok: { icon: CircleCheck, label: 'toolSucceeded', state: 'succeeded' },
  broken: { icon: CircleX, label: 'toolFailed', state: 'failed' },
} as const

function BlockView({ block, user, l, loc, currency, onOpenCanvas }: { block: Block; user: boolean; l: AssistantLabels; loc: string; currency: string | undefined; onOpenCanvas: (() => void) | undefined }) {
  const kind = block.kind
  if (kind === 'prose') return user ? <p className="fk-chat__plain">{block.body}</p> : <MarkdownView source={block.body} />
  if (kind === 'thinking')
    return (
      <details className="fk-chat__reasoning">
        <summary>{l.reasoning}</summary>
        <p>{block.body}</p>
      </details>
    )
  if (kind === 'figure') return <AssistantVisualBlock envelope={block.envelope} locale={loc} {...(currency ? { currency } : {})} {...(onOpenCanvas ? { onOpen: onOpenCanvas } : {})} />
  const look = TOOL_LOOK[block.phase]
  const Icon = look.icon
  return (
    <p className="fk-chat__tool" data-state={look.state}>
      <Icon className="fk-chat__tool-icon" aria-hidden="true" focusable="false" />
      <span className="fk-chat__tool-name">{fill(l[look.label], { tool: block.tool }, loc)}</span>
      {block.note ? <span className="fk-chat__tool-summary">{block.note}</span> : null}
    </p>
  )
}
