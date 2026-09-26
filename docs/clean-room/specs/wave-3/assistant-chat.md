# AssistantChat

Wave 3 · data display · Status: specified

## Purpose
A transport-agnostic conversation with the platform assistant: a state hook that runs one turn at a time (streamed or one-shot) and a conversation surface that shows the dialogue, tool activity, rich visual answers and a composer.

## Anatomy
- Dialogue list: user bubbles (end-aligned) and assistant bubbles (start-aligned).
- Assistant message parts, in arrival order: text (rendered by MarkdownView), reasoning (quieter secondary text, collapsible), tool activity (a quiet one-line status: running, succeeded or failed, tool name, summary), visual answer (AssistantVisualBlock when the reserved visualization tool succeeded).
- Pending indicator: "thinking" text with a subtle animated indicator until the first part arrives.
- Failed turn: the bubble shows the error text and a retry action.
- Empty state: app mark, title, hint and starter prompt chips (activating one sends it).
- Loading state: skeleton bubbles while a stored conversation is being fetched.
- Composer: multi-line text area, send action; while busy, a stop action replaces send; optional "open canvas" action when a graph artifact exists but its panel is closed.

## Properties and events
Hook `useAssistantChat(options)`:
| option | type | meaning |
|---|---|---|
| streamTransport | `(turn, { signal, onEvent }) => Promise<void>` | Used when present. Events: start, text delta, reasoning delta, tool input start/available, tool output, action, finish, error. |
| transport | `(turn) => Promise<{ reply; actions; toolEvents; connectionId; conversationId }>` | One-shot path, used only when no stream transport. Never a fallback. |
| currentPath, screenTitle | strings | Screen context sent with each turn, read at send time. |
| mode | `'app' \| 'conversation' \| 'admin'` | Sent with each turn. |
| onNavigate | `(path) => void` | Applied for "navigate" actions whose path is app-relative (starts with "/"). |
| boundFlowId | `string` | Flow a new conversation is bound to. |
Returns `{ messages, status: 'ready'\|'submitted'\|'streaming'\|'error', busy, isHydrating, conversationId, send, stop, retry, canRetry, setHydrating, newConversation, hydrate(stored) }`.

Surface `AssistantConversation`: `chat`, `labels`, `suggestions`, `variant: 'panel' | 'full'`, `appMark`, `onOpenCanvas`, `canOpenCanvas`.

Rules: history sent excludes pending and failed bubbles and empty texts; text and reasoning deltas append to the last part of the same kind or open a new part; conversation id is pinned on "start" and "finish"; `stop` aborts and keeps the partial answer as final; a stream error appends its message and marks the turn failed; `retry` drops the failed bubble and re-sends the last prompt; `newConversation` and `hydrate` abort any turn and clear the composer; `hydrate` accepts only well-formed stored parts.

## States
Ready, submitted, streaming, error; empty, hydrating, populated.

## Keyboard and ARIA
- Dialogue is APG-style log: `role="log"` with `aria-live="polite"`; announce each completed assistant turn once (not every delta) and failures assertively.
- Composer: RAC `TextField` (multi-line) with a visible or accessible label; Enter sends, Shift+Enter inserts a line break; the composer stays editable while busy (the fork disables it; not acceptable), only send is blocked.
- Send, stop, retry, open-canvas are RAC `Button`s with accessible names.
- Auto-scroll to the newest message only when the user is already near the bottom.

## Responsive, touch, motion, forced colours
- `panel` variant fills a side panel; `full` variant centres a readable column (§2.2, 68ch) with a full-width composer.
- 44 px targets; typing indicator and skeleton stop animating under reduced motion; bubbles keep boundaries in forced colours; failed bubbles use icon plus word, not only colour.

## Acceptance tests
- Given a stream transport, when a prompt is sent, then status goes submitted, then streaming on the first delta, then ready on end.
- Given text, tool, text events, then the message has three parts in that order.
- Given the user presses stop mid-stream, then the partial text remains and the turn is not failed.
- Given the stream emits an error, then the bubble shows the message and a retry action; retry re-sends the same prompt without duplicating the user bubble.
- Given a navigate action to "https://x", then `onNavigate` is not called; to "/records", it is.
- Given no transport at all, when sending, then the turn fails with a configuration message.
- Given `hydrate` with a malformed part, then that part is skipped.
- Given Shift+Enter in the composer, then a line break is inserted and nothing is sent.

## Renamed in implementation
`useAssistantChat` → `useAssistantSession`; options `streamTransport` → `openStream` (callback `onEvent` → `deliver`), `transport` → `askOnce`, `currentPath` → `path`, `screenTitle` → `screenName`, `mode` → `audience`, `onNavigate` → `onGoTo`, `boundFlowId` → `flowId`. Returned `messages` → `utterances`, `status` (`ready | submitted | streaming | error`) → `phase` (`idle | asking | receiving | broken`), `busy` → `working`, `isHydrating` → `loadingHistory`, `conversationId` → `threadId`, `send` → `ask`, `stop` → `halt`, `retry`/`canRetry` → `askAgain`/`canAskAgain`, `newConversation` → `reset`, `hydrate` → `restore`. Message parts → blocks (`text` → `prose`, `reasoning` → `thinking`, `tool` → `toolCall`, `visual` → `figure`); stream events → signals (`start` → `opened`, `text-delta` → `prose`, `reasoning-delta` → `thinking`, `tool-input-start` → `toolAnnounced`, `tool-input-available` → `toolArgs`, `tool-output` → `toolResult`, `action` → `directive`, `finish` → `closed`, `error` → `fault`); the navigate action → directive `goTo`. The surface `AssistantConversation` takes `session` instead of `chat`. Behaviour is unchanged.
