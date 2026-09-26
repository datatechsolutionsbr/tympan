import { ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useReducer, useRef, type KeyboardEvent } from 'react'
import { Button as AriaButton, Dialog, Modal, ModalOverlay, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { markPieces } from '../../internal/overlays-nav/fuzzy'
import { readChoices, recordChoice, type ChoiceStat } from '../../internal/overlays-nav/recent'
import { useHeldOrOwn } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { Skeleton } from '../skeleton/Skeleton'
import { buildView, type CommandAction, type CommandGroup, type CommandItem, type CommandScope, type Row } from './model'

export type { CommandAction, CommandGroup, CommandItem, CommandScope } from './model'

type Copy = ReturnType<typeof useMessages>['commandPalette']

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  groups: CommandGroup[]
  scopes?: CommandScope[]
  activeScope?: string | null
  onScopeChange?: (id: string | null) => void
  loading?: boolean
  fallbackActions?: CommandAction[]
  labels?: Partial<Omit<Copy, 'hints'>> & { hints?: Partial<Copy['hints']> }
  /** Accessible name of the dialog and the field. */
  label?: string
  recent?: { storageKey: string; visible?: number; keep?: number }
  className?: string
}

interface State {
  query: string
  cursor: number
  sub: CommandItem | null
  recent: ChoiceStat[]
}

type Event =
  | { type: 'reset'; recent: ChoiceStat[] }
  | { type: 'type'; query: string }
  | { type: 'point'; cursor: number }
  | { type: 'open-sub'; item: CommandItem }
  | { type: 'close-sub' }

function reduce(s: State, e: Event): State {
  switch (e.type) {
    case 'reset':
      return { query: '', cursor: 0, sub: null, recent: e.recent }
    case 'type':
      return { ...s, query: e.query, cursor: 0, sub: null }
    case 'point':
      return { ...s, cursor: e.cursor }
    case 'open-sub':
      return { ...s, sub: e.item, cursor: 0 }
    case 'close-sub':
      return { ...s, sub: null, cursor: 0 }
  }
}

function Marked({ text, marks }: { text: string; marks: number[] }) {
  if (!marks.length) return <>{text}</>
  return (
    <>
      {markPieces(text, marks).map((p, i) =>
        p.marked ? (
          <mark key={i} className="ty-palette__mark">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}

/** Global "jump to anything" dialog (spec: wave-2/command-palette.md). */
export function CommandPalette(props: CommandPaletteProps) {
  const base = useMessages().commandPalette
  const copy: Copy = { ...base, ...props.labels, hints: { ...base.hints, ...props.labels?.hints } }
  const name = props.label ?? copy.label
  const listId = useId()
  const optionPrefix = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const scopes = props.scopes ?? []
  const { locale, direction } = useLocale()
  const [scope, setScope] = useHeldOrOwn<string | null>(props.activeScope, null, props.onScopeChange)
  const [state, send] = useReducer(reduce, { query: '', cursor: 0, sub: null, recent: [] })
  const storageKey = props.recent?.storageKey

  useEffect(() => {
    if (props.open) send({ type: 'reset', recent: storageKey ? readChoices(storageKey) : [] })
  }, [props.open, storageKey])

  const sections = useMemo(
    () =>
      props.loading
        ? []
        : buildView({
            locale,
            groups: props.groups,
            scope,
            query: state.query,
            subItem: state.sub,
            fallbackActions: props.fallbackActions ?? [],
            recent: state.recent,
            recentVisible: props.recent?.visible ?? 5,
            headings: { recent: copy.recent, actionsFor: copy.actionsFor, fallback: copy.fallback },
          }),
    // copy functions are stable per catalogue
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.loading, props.groups, props.fallbackActions, scope, state.query, state.sub, state.recent, props.recent?.visible, locale],
  )
  const rows = sections.flatMap((s) => s.rows)
  const cursor = rows.length ? Math.min(state.cursor, rows.length - 1) : -1
  const current: Row | undefined = rows[cursor]
  const optionId = (row: Row) => `${optionPrefix}-${row.key}`
  const scopeLabel = scopes.find((s) => s.id === scope)?.label

  useEffect(() => {
    if (!current) return
    document.getElementById(optionId(current))?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.key])

  const run = (row: Row) => {
    if (row.kind === 'item' && row.item && storageKey) recordChoice(storageKey, row.item.id, props.recent?.keep ?? 12)
    props.onClose()
    row.run()
  }

  const pickScope = (id: string) => {
    setScope(scope === id ? null : id)
    send({ type: 'type', query: '' })
    inputRef.current?.focus()
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const empty = state.query.length === 0
    const step = (to: number) => {
      e.preventDefault()
      if (rows.length) send({ type: 'point', cursor: (to + rows.length) % rows.length })
    }
    // Inline-axis keys follow the reading direction: "into" the sub-list is the inline end.
    const mirrored: Record<string, string> = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' }
    switch (direction === 'rtl' ? (mirrored[e.key] ?? e.key) : e.key) {
      case 'ArrowDown':
        return step(cursor + 1)
      case 'ArrowUp':
        return step(cursor - 1)
      case 'Home':
        return step(0)
      case 'End':
        return step(rows.length - 1)
      case 'Enter':
        e.preventDefault()
        if (current) run(current)
        return
      case 'ArrowRight':
        if (!state.sub && current?.item?.actions?.length) {
          e.preventDefault()
          send({ type: 'open-sub', item: current.item })
        } else if (empty && !scope && scopes[0]) {
          e.preventDefault()
          pickScope(scopes[0].id)
        }
        return
      case 'ArrowLeft':
        if (state.sub) {
          e.preventDefault()
          send({ type: 'close-sub' })
        }
        return
      case 'Tab': {
        if (!scopes.length || e.shiftKey) return
        const typed = state.query.trim().toLocaleLowerCase()
        const target = empty ? (scope ? undefined : scopes[0]) : scopes.find((s) => s.label.toLocaleLowerCase().startsWith(typed))
        if (target) {
          e.preventDefault()
          setScope(target.id)
          send({ type: 'type', query: '' })
        }
        return
      }
      case 'Backspace':
        if (empty && scope) {
          e.preventDefault()
          setScope(null)
        }
        return
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        if (state.sub) send({ type: 'close-sub' })
        else if (scope) setScope(null)
        else props.onClose()
        return
    }
  }

  const announcement = props.loading
    ? copy.loading
    : state.query.trim()
      ? rows.length
        ? copy.results(rows.length)
        : copy.noResults(state.query.trim())
      : ''

  return (
    <ModalOverlay isOpen={props.open} onOpenChange={(o) => !o && props.onClose()} isDismissable isKeyboardDismissDisabled className="ty-palette__backdrop">
      <Modal className={cx('ty-palette', props.className)}>
        <Dialog className="ty-palette__dialog" aria-label={name}>
          <div className="ty-palette__field">
            <Search className="ty-palette__search-icon" aria-hidden="true" />
            {scopeLabel ? (
              <AriaButton className="ty-palette__chip" aria-label={copy.removeScope(scopeLabel)} onPress={() => setScope(null)}>
                {scopeLabel}
                <X aria-hidden="true" />
              </AriaButton>
            ) : null}
            <input
              ref={inputRef}
              className="ty-palette__input"
              role="combobox"
              aria-label={name}
              aria-autocomplete="list"
              aria-expanded={rows.length > 0}
              aria-controls={listId}
              aria-activedescendant={current ? optionId(current) : undefined}
              placeholder={copy.placeholder}
              value={state.query}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => send({ type: 'type', query: e.target.value })}
              onKeyDown={onKey}
            />
          </div>
          <div className="ty-palette__main">
            {scopes.length ? (
              <div className="ty-palette__scopes" role="group" aria-label={copy.scopes}>
                {scopes.map((s) => (
                  <AriaButton key={s.id} className="ty-palette__scope" aria-pressed={scope === s.id} excludeFromTabOrder onPress={() => pickScope(s.id)}>
                    {s.icon ? <span aria-hidden="true">{s.icon}</span> : null}
                    {s.label}
                  </AriaButton>
                ))}
              </div>
            ) : null}
            <div className="ty-palette__results">
              {props.loading ? (
                <div className="ty-palette__loading" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} shape="line" />
                  ))}
                </div>
              ) : null}
              <div id={listId} role="listbox" aria-label={name} className="ty-palette__list">
                {sections.map((section) => (
                  <div key={section.key} role="group" aria-labelledby={`${listId}-${section.key}`} className="ty-palette__group">
                    <div id={`${listId}-${section.key}`} role="presentation" className="ty-palette__heading">
                      {section.heading}
                    </div>
                    {section.rows.map((row) => {
                      const on = row === current
                      return (
                        <div
                          key={row.key}
                          id={optionId(row)}
                          role="option"
                          aria-selected={on}
                          data-highlighted={on || undefined}
                          data-kind={row.kind}
                          className="ty-palette__option"
                          onPointerMove={() => !on && send({ type: 'point', cursor: rows.indexOf(row) })}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => run(row)}
                        >
                          {row.icon ? (
                            <span className="ty-palette__icon" aria-hidden="true">
                              {row.icon}
                            </span>
                          ) : null}
                          <span className="ty-palette__text">
                            <span className="ty-palette__label">
                              <Marked text={row.label} marks={row.marks} />
                            </span>
                            {row.description ? <span className="ty-palette__description">{row.description}</span> : null}
                          </span>
                          {row.hint ? <span className="ty-palette__hint">{row.hint}</span> : null}
                          {row.shortcut ? <kbd className="ty-palette__kbd">{row.shortcut}</kbd> : null}
                          {row.item?.actions?.length && !state.sub ? (
                            <span
                              className="ty-palette__chevron"
                              aria-hidden="true"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (row.item) send({ type: 'open-sub', item: row.item })
                              }}
                            >
                              <ChevronRight className="ty-mirror-rtl" />
                            </span>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              {!props.loading && !rows.length ? (
                <p className="ty-palette__empty">{state.query.trim() ? copy.noResults(state.query.trim()) : copy.empty}</p>
              ) : null}
            </div>
          </div>
          <div className="ty-palette__footer" aria-hidden="true">
            <span>
              <kbd className="ty-palette__kbd">↑↓</kbd> {copy.hints.navigate}
            </span>
            <span>
              <kbd className="ty-palette__kbd">↵</kbd> {copy.hints.select}
            </span>
            <span>
              <kbd className="ty-palette__kbd">→</kbd> {copy.hints.actions}
            </span>
            <span>
              <kbd className="ty-palette__kbd">←</kbd> {copy.hints.back}
            </span>
            <span>
              <kbd className="ty-palette__kbd">esc</kbd> {copy.hints.close}
            </span>
          </div>
          <span role="status" className="ty-visually-hidden">
            {announcement}
          </span>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
