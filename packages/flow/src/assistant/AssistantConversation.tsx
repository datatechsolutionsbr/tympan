// AssistantConversation: the dialogue surface over useAssistantChat. The log
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
import type { AssistantChat, ChatMessage, ChatPart } from './useAssistantChat'

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
  chat: AssistantChat
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
  const { chat, suggestions = [], variant = 'panel', appMark, onOpenCanvas, canOpenCanvas = false, locale, currency, composerRef, className } = props
  const l = useLabels(assistantLabels, props.labels)
  const { locale: providerLocale } = useFlowLocale()
  const loc = locale ?? providerLocale
  const logRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const [alert, setAlert] = useState('')
  const announcedFailure = useRef<string | null>(null)

  const last = chat.messages[chat.messages.length - 1]
  useEffect(() => {
    if (last?.state === 'failed' && announcedFailure.current !== last.id) {
      announcedFailure.current = last.id
      setAlert(fill(l.turnFailed, { message: last.error ?? '' }, loc))
    }
  }, [last, l.turnFailed, loc])

  useLayoutEffect(() => {
    const el = logRef.current
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight
  }, [chat.messages])

  const onScroll = () => {
    const el = logRef.current
    if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (chat.busy) return
    chat.send()
  }

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    submit()
  }

  const empty = !chat.isHydrating && chat.messages.length === 0

  return (
    <section className={['fk-chat', className].filter(Boolean).join(' ')} data-variant={variant} aria-label={l.log}>
      {chat.isHydrating ? (
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
                  <Button variant="secondary" size="compact" shape="pill" onPress={() => chat.send(s)}>
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
        aria-busy={chat.busy || undefined}
        hidden={empty || chat.isHydrating}
        tabIndex={-1}
        onScroll={onScroll}
      >
        {chat.messages.map((m, i) => (
          <Bubble key={m.id} message={m} l={l} loc={loc} currency={currency} isLast={i === chat.messages.length - 1} chat={chat} onOpenCanvas={onOpenCanvas} />
        ))}
      </div>
      <div className="fk-visually-hidden" role="alert">
        {alert}
      </div>
      <form className="fk-chat__composer" onSubmit={submit}>
        <TextField className="fk-chat__field" value={chat.input} onChange={chat.setInput}>
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
          {chat.busy ? (
            <Button variant="secondary" iconOnly accessibleLabel={l.stop} leadingIcon={<Square />} onPress={chat.stop} />
          ) : (
            <Button className="fk-chat__send" variant="primary" iconOnly accessibleLabel={l.send} leadingIcon={<SendHorizontal />} type="submit" disabled={!chat.input.trim()} />
          )}
        </div>
      </form>
    </section>
  )
}

function Bubble({ message, l, loc, currency, isLast, chat, onOpenCanvas }: { message: ChatMessage; l: AssistantLabels; loc: string; currency: string | undefined; isLast: boolean; chat: AssistantChat; onOpenCanvas: (() => void) | undefined }) {
  const user = message.role === 'user'
  return (
    <div className="fk-chat__message" data-role={message.role} data-align={user ? 'end' : 'start'} data-state={message.state}>
      <span className="fk-visually-hidden">{user ? l.you : l.assistant}</span>
      <div className="fk-chat__bubble" dir="auto">
        {message.state === 'pending' && !message.parts.length ? (
          <p className="fk-chat__thinking">
            {l.thinking}
            <span className="fk-chat__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        ) : null}
        {message.parts.map((p, i) => (
          <PartView key={i} part={p} user={user} l={l} loc={loc} currency={currency} onOpenCanvas={onOpenCanvas} />
        ))}
        {message.state === 'failed' ? (
          <div className="fk-chat__failure">
            <p className="fk-chat__error">
              <CircleX aria-hidden="true" focusable="false" />
              <span>{message.error}</span>
            </p>
            {isLast && chat.canRetry ? (
              <Button variant="secondary" size="compact" leadingIcon={<RotateCcw />} onPress={chat.retry}>
                {l.retry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PartView({ part, user, l, loc, currency, onOpenCanvas }: { part: ChatPart; user: boolean; l: AssistantLabels; loc: string; currency: string | undefined; onOpenCanvas: (() => void) | undefined }) {
  switch (part.type) {
    case 'text':
      return user ? <p className="fk-chat__plain">{part.text}</p> : <MarkdownView source={part.text} />
    case 'reasoning':
      return (
        <details className="fk-chat__reasoning">
          <summary>{l.reasoning}</summary>
          <p>{part.text}</p>
        </details>
      )
    case 'tool': {
      const Icon = part.state === 'running' ? LoaderCircle : part.state === 'succeeded' ? CircleCheck : CircleX
      const template = part.state === 'running' ? l.toolRunning : part.state === 'succeeded' ? l.toolSucceeded : l.toolFailed
      return (
        <p className="fk-chat__tool" data-state={part.state}>
          <Icon className="fk-chat__tool-icon" aria-hidden="true" focusable="false" />
          <span className="fk-chat__tool-name">{fill(template, { tool: part.toolName }, loc)}</span>
          {part.summary ? <span className="fk-chat__tool-summary">{part.summary}</span> : null}
        </p>
      )
    }
    case 'visual':
      return <AssistantVisualBlock envelope={part.envelope} locale={loc} {...(currency ? { currency } : {})} {...(onOpenCanvas ? { onOpen: onOpenCanvas } : {})} />
  }
}
