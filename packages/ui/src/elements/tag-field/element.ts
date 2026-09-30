import { TyElement } from '../base.ts'
import { tagFieldDefinition } from './definition.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Case-insensitive (accent-keeping) equality, the React TagField's `same`. */
const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0

function el(tag: string, className: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** The remove control's × (lucide strokes, ISC, THIRD_PARTY_NOTICES). */
function xIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'ty-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const d of ['M18 6 6 18', 'm6 6 12 12']) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

/**
 * `<ty-tag-field>`. Self-rendering: the field is data-driven (a pill per
 * committed value, an option per matching suggestion) and stateful (the
 * draft, the popup, the highlight), so the element owns its whole subtree —
 * built once on connect, then kept in step with the attributes and the
 * field's own state. The DOM mirrors the React TagField's parts
 * (`ty-tag-field__well`, `__chip`, `__drop`, `__menu-layer`, …) so the
 * shared TagField.css paints both.
 *
 * The value is controlled: committing (Enter, comma, an option press) or
 * removing (a remove control, Backspace on an empty entry) only emits
 * `ty-change` with the next list as JSON; the host writes it back to the
 * `value` attribute. Every entry passes the React gate in order: trim,
 * `validate` (a property — functions cannot be attributes), then the
 * refusals (blank, invalid, duplicate ignoring case, past `max`, unlisted
 * with `allow-free-text="false"`).
 *
 * With suggestions the entry is an APG combobox: focus stays in the input,
 * the highlight is `aria-activedescendant`, ArrowDown/ArrowUp move it with
 * wrap-around, Enter commits the highlighted option, Escape closes without
 * committing, and options commit on mousedown with the default prevented so
 * the input never loses focus.
 */
export class TyTagFieldElement extends TyElement {
  static override definition = tagFieldDefinition

  /** Normalises an entry (after trimming) or rejects it with null. Assigned by the host, not an attribute. */
  validate?: (raw: string) => string | null

  #draft = ''
  #open = false
  #active: number | null = null
  /** Signatures of the last render, so a sync rebuilds only what changed. */
  #chipsKey = ''
  #menuKey = ''

  #root: HTMLElement | null = null
  #caption: HTMLLabelElement | null = null
  #well: HTMLElement | null = null
  #chipList: HTMLElement | null = null
  #input: HTMLInputElement | null = null
  #menuLayer: HTMLElement | null = null
  #menu: HTMLElement | null = null
  #note: HTMLElement | null = null
  #fault: HTMLElement | null = null

  get field(): HTMLInputElement | null {
    return this.#input
  }

  /* ------------------------------------------------------------ data -- */

  #json<T>(raw: unknown, fallback: T): T {
    if (typeof raw !== 'string' || raw === '') return fallback
    try {
      const parsed: unknown = JSON.parse(raw)
      return (parsed ?? fallback) as T
    } catch {
      return fallback
    }
  }

  /** The committed values (controlled, from the `value` attribute). */
  held(): string[] {
    const list = this.#json<unknown>(this.props.value, [])
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []
  }

  #suggestions(): string[] {
    const list = this.#json<unknown>(this.props.suggestions, [])
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []
  }

  #labels(): Record<string, string> {
    const map = this.#json<unknown>(this.props.suggestionLabels, {})
    if (typeof map !== 'object' || map === null || Array.isArray(map)) return {}
    return Object.fromEntries(Object.entries(map).filter(([, v]) => typeof v === 'string')) as Record<string, string>
  }

  #freeText(): boolean {
    return String(this.props.allowFreeText ?? 'true') !== 'false'
  }

  #disabled(): boolean {
    return Boolean(this.props.disabled)
  }

  #atMax(held: readonly string[]): boolean {
    const max = this.props.max
    return max !== undefined && held.length >= Number(max)
  }

  /** Suggestions not yet chosen, matching the draft against value and display text. */
  #offers(): Array<{ id: string; text: string }> {
    const held = this.held()
    const labels = this.#labels()
    const query = this.#draft.trim().toLocaleLowerCase()
    return this.#suggestions().flatMap((s) => {
      if (held.some((h) => same(h, s))) return []
      const text = labels[s] ?? s
      const hit = !query || s.toLocaleLowerCase().includes(query) || text.toLocaleLowerCase().includes(query)
      return hit ? [{ id: s, text }] : []
    })
  }

  /** The gate every entry passes (the React TagField's `judge`): the value to commit, or null to refuse. */
  #judge(raw: string): string | null {
    const bare = raw.trim()
    if (bare === '') return null
    const shaped = this.validate ? this.validate(bare) : bare
    if (!shaped) return null
    const held = this.held()
    if (held.some((h) => same(h, shaped))) return null
    if (this.#atMax(held)) return null
    const suggestions = this.#suggestions()
    if (suggestions.length > 0 && !this.#freeText() && !suggestions.includes(shaped)) return null
    return shaped
  }

  /* ------------------------------------------------------------ tree -- */

  #build(): void {
    const instance = this.instanceId
    this.#caption = el('label', 'ty-tag-field__caption') as HTMLLabelElement
    this.#well = el('div', 'ty-tag-field__well')
    const chips = el('span', 'ty-tag-field__chips')
    this.#chipList = el('span', 'ty-tag-field__chip-list', { role: 'list' })
    chips.append(this.#chipList)
    this.#input = el('input', 'ty-tag-field__typing', { id: `${instance}-input`, type: 'text', autocomplete: 'off' }) as HTMLInputElement
    const typingHost = el('span', 'ty-tag-field__typing-host')
    typingHost.append(this.#input)
    this.#well.append(chips, typingHost)
    this.#menu = el('ul', 'ty-tag-field__menu', { id: `${instance}-listbox`, role: 'listbox' })
    this.#menuLayer = el('div', 'ty-tag-field__menu-layer', { hidden: '' })
    this.#menuLayer.append(this.#menu)
    const frame = el('div', 'ty-tag-field__frame')
    frame.append(this.#well, this.#menuLayer)
    this.#note = el('p', 'ty-tag-field__note', { id: `${instance}-note`, hidden: '' })
    this.#fault = el('p', 'ty-tag-field__fault', { id: `${instance}-fault`, hidden: '' })
    this.#root = el('div', 'ty-tag-field')
    this.#root.append(this.#caption, frame, this.#note, this.#fault)
    this.replaceChildren(this.#root)
  }

  /** Bring the tree in step with the attributes and the field state. */
  #sync(): void {
    this.#normaliseCategory()
    const { props } = this
    const root = this.#root
    const input = this.#input
    if (!root || !input || !this.#caption || !this.#well || !this.#chipList || !this.#menuLayer || !this.#menu || !this.#note || !this.#fault) return
    const instance = this.instanceId
    const held = this.held()
    const labels = this.#labels()
    const shown = (v: string) => labels[v] ?? v
    const disabled = this.#disabled()
    const atMax = this.#atMax(held)
    const suggestions = this.#suggestions()
    const hasSuggestions = suggestions.length > 0
    const error = props.errorText ? String(props.errorText) : ''
    const helper = props.helperText ? String(props.helperText) : ''
    const label = props.label ? String(props.label) : ''

    // Category wins over tone; the tint travels as the same custom property
    // the React component sets.
    const category = props.categoryIndex !== undefined && Number.isFinite(Number(props.categoryIndex)) ? Number(props.categoryIndex) : undefined
    root.setAttribute('data-tone', category !== undefined ? 'category' : String(props.tone))
    root.style.setProperty('--ty-tag-field-tint', category !== undefined ? `var(--ty-categorical-${category})` : '')
    root.toggleAttribute('data-invalid', Boolean(error))
    if (props.testId) root.setAttribute('data-testid', String(props.testId))
    else root.removeAttribute('data-testid')

    this.#caption.hidden = !label
    this.#caption.textContent = label
    this.#caption.htmlFor = `${instance}-input`
    this.#well.toggleAttribute('data-disabled', disabled)

    input.id = `${instance}-input`
    input.placeholder = props.placeholder ? String(props.placeholder) : ''
    input.disabled = disabled || atMax
    if (error) input.setAttribute('aria-invalid', 'true')
    else input.removeAttribute('aria-invalid')
    if (!label && props.accessibleLabel) input.setAttribute('aria-label', String(props.accessibleLabel))
    else input.removeAttribute('aria-label')
    input.setAttribute('aria-describedby', [helper && `${instance}-note`, error && `${instance}-fault`].filter(Boolean).join(' ') || '')
    if (!input.getAttribute('aria-describedby')) input.removeAttribute('aria-describedby')

    const offers = this.#offers()
    const listOpen = hasSuggestions && this.#open && offers.length > 0
    if (hasSuggestions) {
      input.setAttribute('role', 'combobox')
      input.setAttribute('aria-expanded', listOpen ? 'true' : 'false')
      input.setAttribute('aria-controls', `${instance}-listbox`)
      input.setAttribute('aria-autocomplete', 'list')
      if (listOpen && this.#active !== null && offers[this.#active]) input.setAttribute('aria-activedescendant', `${instance}-option-${this.#active}`)
      else input.removeAttribute('aria-activedescendant')
    } else {
      for (const name of ['role', 'aria-expanded', 'aria-controls', 'aria-autocomplete', 'aria-activedescendant']) input.removeAttribute(name)
    }

    this.#note.hidden = !helper
    this.#note.textContent = helper
    this.#note.id = `${instance}-note`
    this.#fault.hidden = !error
    this.#fault.textContent = error
    this.#fault.id = `${instance}-fault`
    this.#menu.id = `${instance}-listbox`
    this.#menu.setAttribute('aria-label', String(props.suggestionsLabel))

    // The pills rebuild only when they changed (a focused remove control
    // keeps its node while the draft moves).
    const chipsKey = JSON.stringify([held, labels, disabled, props.removeLabel, props.chosenLabel, label, props.accessibleLabel, instance])
    if (chipsKey !== this.#chipsKey) {
      this.#chipsKey = chipsKey
      const field = label || String(props.accessibleLabel ?? '')
      const chosen = String(props.chosenLabel).replaceAll('{field}', field)
      this.#chipList.setAttribute('aria-label', field ? chosen : chosen.replace(/^:\s*/, ''))
      const template = String(props.removeLabel)
      this.#chipList.replaceChildren(
        ...held.map((value) => {
          const chip = el('span', 'ty-tag-field__chip', { role: 'listitem' })
          const text = el('span', 'ty-tag-field__chip-text')
          text.textContent = shown(value)
          const drop = el('button', 'ty-tag-field__drop', { type: 'button', 'aria-label': template.replaceAll('{value}', shown(value)), 'data-value': value }) as HTMLButtonElement
          drop.disabled = disabled
          drop.append(xIcon())
          chip.append(text, drop)
          return chip
        }),
      )
    }

    // The options are keyed by position and REUSED (attributes and text in
    // place), never rebuilt: a highlight move must land on the same node
    // the page (and a test) is holding.
    const menuKey = listOpen ? JSON.stringify([offers, instance]) : ''
    if (menuKey !== this.#menuKey) {
      this.#menuKey = menuKey
      this.#menu.replaceChildren(
        ...(!listOpen
          ? []
          : offers.map((offer) => {
              const option = el('li', 'ty-tag-field__choice', { role: 'option', 'data-value': offer.id })
              option.textContent = offer.text
              return option
            })),
      )
    }
    Array.from(this.#menu.children).forEach((node, index) => {
      const option = node as HTMLElement
      if (!option.id) option.id = `${instance}-option-${index}`
      option.setAttribute('aria-selected', this.#active === index ? 'true' : 'false')
      option.toggleAttribute('data-focused', this.#active === index)
    })
    this.#menuLayer.hidden = !listOpen
  }

  /* --------------------------------------------------------- behaviour -- */

  /** Ask the host for the next list (controlled). */
  #request(next: string[]): void {
    this.emit('ty-change', { value: JSON.stringify(next) })
  }

  /** A successful commit also resets the draft and closes the popup. */
  #commit(raw: string): void {
    const take = this.#judge(raw)
    if (take === null) return
    this.#request([...this.held(), take])
    this.#draft = ''
    if (this.#input) this.#input.value = ''
    this.#open = false
    this.#active = null
    this.#sync()
  }

  #drop(value: string): void {
    if (this.#disabled()) return
    const held = this.held()
    if (!held.includes(value)) return
    this.#request(held.filter((v) => v !== value))
    this.#input?.focus()
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.target !== this.#input || this.#disabled()) return
    const input = this.#input!
    const offers = this.#offers()
    switch (event.key) {
      case 'Enter':
      case ',': {
        // The commit keys are always ours (a comma never reaches the text).
        event.preventDefault()
        const picked = this.#open && this.#active !== null ? offers[this.#active] : undefined
        this.#commit(picked ? picked.id : input.value)
        return
      }
      case 'Backspace': {
        if (input.value !== '') return
        const held = this.held()
        if (!held.length) return
        event.preventDefault()
        this.#request(held.slice(0, -1))
        return
      }
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!this.#suggestions().length || !offers.length) return
        event.preventDefault()
        const count = offers.length
        this.#active =
          event.key === 'ArrowDown'
            ? this.#active === null
              ? 0
              : (this.#active + 1) % count
            : this.#active === null || this.#active === 0
              ? count - 1
              : this.#active - 1
        this.#open = true
        this.#sync()
        const option = this.#menu?.children[this.#active]
        if (typeof (option as HTMLElement | undefined)?.scrollIntoView === 'function') (option as HTMLElement).scrollIntoView({ block: 'nearest' })
        return
      }
      case 'Escape': {
        if (!this.#open) return
        event.preventDefault()
        this.#open = false
        this.#active = null
        this.#sync()
      }
    }
  }

  #onInput = (event: Event): void => {
    if (event.target !== this.#input) return
    this.#draft = this.#input!.value
    if (this.#suggestions().length) this.#open = true
    // The first offer is highlighted while typing (RAC's combobox), so
    // Enter commits the filtered match without an arrow key first.
    this.#active = this.#offers().length ? 0 : null
    this.#sync()
  }

  #onFocus = (event: FocusEvent): void => {
    if (event.target !== this.#input || !this.#suggestions().length) return
    this.#open = true
    this.#active = this.#active ?? (this.#offers().length ? 0 : null)
    this.#sync()
  }

  /** The popup closes when focus leaves the field. */
  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (next && this.contains(next)) return
    if (!this.#open) return
    this.#open = false
    this.#active = null
    this.#sync()
  }

  #onClick = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const drop = target.closest('.ty-tag-field__drop')
    if (drop && this.contains(drop) && !(drop as HTMLButtonElement).disabled) this.#drop(drop.getAttribute('data-value') ?? '')
    // A click on the entry re-opens the suggestions: focusin alone does not
    // re-fire on an input that never lost focus.
    if (this.#input && this.#suggestions().length && target.closest('.ty-tag-field__well') && !this.#open) {
      this.#open = true
      this.#active = this.#active ?? (this.#offers().length ? 0 : null)
      this.#sync()
    }
  }

  /** Options commit on mousedown with the default prevented, so the entry never loses focus. */
  #onOptionPress = (event: Event): void => {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== 'function') return
    const option = target.closest('.ty-tag-field__choice')
    if (!option || !this.contains(option)) return
    event.preventDefault()
    this.#commit(option.getAttribute('data-value') ?? '')
  }

  protected override connected(): void {
    this.#build()
    this.#sync()
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener('input', this.#onInput)
    this.addEventListener('focusin', this.#onFocus)
    this.addEventListener('focusout', this.#onFocusOut)
    this.addEventListener('click', this.#onClick)
    this.addEventListener('mousedown', this.#onOptionPress)
  }

  protected override disconnected(): void {
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener('input', this.#onInput)
    this.removeEventListener('focusin', this.#onFocus)
    this.removeEventListener('focusout', this.#onFocusOut)
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('mousedown', this.#onOptionPress)
  }

  protected override changed(): void {
    if (!this.isConnected || !this.#root) return
    // Normalise `category-index` into the 1–8 categorical tokens (as
    // <ty-tag>). Attributes present BEFORE the upgrade never reach
    // attributeChangedCallback, so the pass also runs from `#sync`.
    this.#normaliseCategory()
    this.#sync()
  }

  #normaliseCategory(): void {
    const raw = this.getAttribute('category-index')
    if (raw === null) return
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      this.removeAttribute('category-index')
      return
    }
    const normalized = String(((Math.max(1, Math.round(n)) - 1) % 8) + 1)
    if (normalized !== raw) this.setAttribute('category-index', normalized)
  }
}
