import { fuzzyHit, markPieces } from '../../internal/overlays-nav/fuzzy.ts'
import { orderChoices, readChoices, recordChoice, type ChoiceStat } from '../../internal/overlays-nav/recent.ts'
import { TyElement } from '../base.ts'
import { commandPaletteDefinition } from './definition.ts'

const SVG = 'http://www.w3.org/2000/svg'

/** A secondary or fallback action, as the `groups` / `fallback-actions` JSON carries it. */
export interface CommandActionData {
  id: string
  label: string
  icon?: string
  /** SVG path data (24×24, subpaths separated by " | "); wins over `icon`. */
  iconPath?: string
  shortcut?: string
}

/** One command row, as the `groups` JSON carries it. */
export interface CommandItemData {
  id: string
  label: string
  description?: string
  /** A text glyph. */
  icon?: string
  /** SVG path data (24×24, subpaths separated by " | "); wins over `icon`. */
  iconPath?: string
  /** Matched but not shown. */
  keywords?: string[]
  hint?: string
  shortcut?: string
  scopeId?: string
  actions?: CommandActionData[]
}

/** A group of commands, as the `groups` JSON carries it. */
export interface CommandGroupData {
  id: string
  heading: string
  scopeId?: string
  items: CommandItemData[]
}

/** A scope, as the `scopes` JSON carries it. */
export interface CommandScopeData {
  id: string
  label: string
  icon?: string
}

type RowKind = 'item' | 'action' | 'fallback'

interface Row {
  /** DOM-safe option key, unique in the list. */
  key: string
  kind: RowKind
  /** `ty-select` detail: the chosen item or action id. */
  id: string
  /** `ty-select` detail: the parent item of an action (empty otherwise). */
  itemId: string
  label: string
  description?: string
  icon?: string
  iconPath?: string
  hint?: string
  shortcut?: string
  /** Matched label indices to mark. */
  marks: number[]
  item?: CommandItemData
}

interface Section {
  key: string
  heading: string
  rows: Row[]
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** A decorative 24px icon (lucide strokes). */
function svgIcon(className: string | undefined, paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  if (className) svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

function searchIcon(): SVGSVGElement {
  const svg = svgIcon('ty-palette__search-icon', ['m20 20-3.5-3.5'])
  const circle = document.createElementNS(SVG, 'circle')
  circle.setAttribute('cx', '11')
  circle.setAttribute('cy', '11')
  circle.setAttribute('r', '7')
  svg.prepend(circle)
  return svg
}

/** Tolerant JSON list parse: anything broken reads as empty. */
function parseList<T>(raw: unknown): T[] {
  if (typeof raw !== 'string' || !raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

/** Replaces every `{token}` in a label template. */
const tpl = (template: unknown, token: string, value: string): string => String(template ?? '').split(token).join(value)

/** Option ids are DOM-safe (`recent-` / group / action prefixes plus the host's ids). */
const safe = (key: string) => key.replace(/[^a-zA-Z0-9_-]/g, '-')

/** Best score of an item over its label, description, keywords and group heading (the React model's rule). */
function scoreItem(query: string, item: CommandItemData, heading: string, locale?: string): { score: number; marks: number[] } | null {
  const label = fuzzyHit(query, item.label, locale)
  let best = label ? label.score : -Infinity
  for (const other of [item.description, ...(item.keywords ?? []), heading]) {
    if (!other) continue
    const hit = fuzzyHit(query, other, locale)
    if (hit && hit.score - 1 > best) best = hit.score - 1
  }
  if (best === -Infinity) return null
  return { score: best, marks: label?.at ?? [] }
}

function appendMarked(target: HTMLElement, text: string, marks: number[]): void {
  if (!marks.length) {
    target.textContent = text
    return
  }
  for (const piece of markPieces(text, marks)) {
    if (piece.marked) {
      const mark = el('mark', 'ty-palette__mark')
      mark.textContent = piece.text
      target.append(mark)
    } else target.append(piece.text)
  }
}

/**
 * `<ty-command-palette>`. While `open`, a native `<dialog>` (top layer: no
 * ancestor can clip it, the rest of the page is inert, Escape cancels) holds
 * the palette: a combobox field over a listbox of grouped commands,
 * navigated with the arrow keys, Home, End, Enter and Escape, following the
 * React CommandPalette and the spec (wave-2/command-palette.md):
 *
 * - **Matching** — the query's characters must appear in order in the label,
 *   description, keywords or group heading (the shared subsequence scorer);
 *   contiguous runs, word starts and early positions rank higher, and only
 *   label matches are marked (`mark`).
 * - **Keyboard** — Down/Up move the highlight and wrap, Home/End jump, Enter
 *   runs the highlighted row and closes. Right Arrow (inline end) or the row
 *   chevron opens the item's actions sub-list, Left Arrow returns. Tab on an
 *   empty query activates the first scope; with a typed prefix matching a
 *   scope label, Tab activates it and clears the query; Backspace on an
 *   empty query removes the scope. Escape steps back: the sub-list, then the
 *   scope, then the dialog.
 * - **Scopes** — the active scope shows as a removable chip before the text
 *   and a pressed button in the scope column; activating the active scope
 *   again clears it.
 * - **Recents** — with `recent-key`, chosen item ids are counted in browser
 *   storage (tolerant of it failing) and shown first on an empty query,
 *   most chosen then most recent.
 * - **Fallback** — a query that matches nothing offers the `fallback-actions`
 *   with `{query}` replaced.
 *
 * Rows carry ids, never callbacks: a choice is `ty-select` (`id`, `kind`,
 * `itemId`), the scope is `ty-scope-change`, and closing is `ty-close` — the
 * element closes itself too (removing `open`), so a controlled host follows
 * the attribute. Query, highlight and sub-list reset on each open.
 */
export class TyCommandPaletteElement extends TyElement {
  static override definition = commandPaletteDefinition

  #dialog: HTMLDialogElement | null = null
  #input: HTMLInputElement | null = null
  #field: HTMLElement | null = null
  #main: HTMLElement | null = null
  #scopesBox: HTMLElement | null = null
  #results: HTMLElement | null = null
  #list: HTMLElement | null = null
  #status: HTMLElement | null = null
  #query = ''
  #cursor = 0
  #sub: CommandItemData | null = null
  #recent: ChoiceStat[] = []
  #rows: Row[] = []

  /** The active scope: the attribute is the state, so host writes and user changes agree. */
  get #scope(): string | null {
    return this.getAttribute('active-scope')
  }

  protected override connected(): void {
    this.#reconcile()
  }

  protected override disconnected(): void {
    this.#close(false)
  }

  protected override changed(): void {
    if (this.isConnected) this.#reconcile()
  }

  #reconcile(): void {
    if (this.props.open && !this.#dialog) this.#open()
    else if (!this.props.open && this.#dialog) this.#close(false)
    else if (this.#dialog) this.#refresh()
  }

  #groups(): CommandGroupData[] {
    return parseList<CommandGroupData>(this.props.groups)
  }

  #scopes(): CommandScopeData[] {
    return parseList<CommandScopeData>(this.props.scopes)
  }

  #open(): void {
    const p = this.props
    const id = this.instanceId
    const name = String(p.label)
    const dialog = el('dialog', 'ty-palette', { 'aria-label': name })
    const body = el('div', 'ty-palette__dialog')
    const field = el('div', 'ty-palette__field')
    const input = el('input', 'ty-palette__input', {
      role: 'combobox',
      'aria-label': name,
      'aria-autocomplete': 'list',
      'aria-expanded': 'false',
      'aria-controls': `${id}-list`,
      placeholder: String(p.placeholder),
      autocomplete: 'off',
      spellcheck: 'false',
      type: 'text',
    })
    field.append(searchIcon(), input)
    const main = el('div', 'ty-palette__main')
    const results = el('div', 'ty-palette__results')
    const list = el('div', 'ty-palette__list', { id: `${id}-list`, role: 'listbox', 'aria-label': name })
    results.append(list)
    main.append(results)
    const footer = el('div', 'ty-palette__footer', { 'aria-hidden': 'true' })
    for (const [keys, hint] of [
      ['↑↓', p.hintNavigate],
      ['↵', p.hintSelect],
      ['→', p.hintActions],
      ['←', p.hintBack],
      ['esc', p.hintClose],
    ] as const) {
      const span = el('span')
      const kbd = el('kbd', 'ty-palette__kbd')
      kbd.textContent = keys
      span.append(kbd, ` ${String(hint)}`)
      footer.append(span)
    }
    const status = el('span', 'ty-visually-hidden', { role: 'status' })
    body.append(field, main, footer, status)
    dialog.append(body)

    input.addEventListener('input', () => {
      this.#query = input.value
      this.#cursor = 0
      this.#sub = null
      this.#renderRows()
    })
    input.addEventListener('keydown', this.#onKey)
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      this.#close(true)
    })
    // A press on the dialog box itself (outside the palette's content) is a press outside.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) this.#close(true)
    })

    this.#dialog = dialog
    this.#input = input
    this.#field = field
    this.#main = main
    this.#scopesBox = null
    this.#results = results
    this.#list = list
    this.#status = status
    this.#query = ''
    this.#cursor = 0
    this.#sub = null
    const key = p.recentKey ? String(p.recentKey) : ''
    this.#recent = key ? readChoices(key) : []
    this.replaceChildren(dialog)
    this.#refresh()
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    input.focus()
  }

  #close(announce: boolean): void {
    const dialog = this.#dialog
    if (!dialog) return
    this.#dialog = null
    this.#input = null
    this.#field = null
    this.#main = null
    this.#scopesBox = null
    this.#results = null
    this.#list = null
    this.#status = null
    this.#sub = null
    if (dialog.open && typeof dialog.close === 'function') dialog.close()
    dialog.remove()
    if (this.hasAttribute('open')) this.removeAttribute('open')
    if (announce) this.emit('ty-close')
  }

  /** Re-render the regions the attributes drive (chip, scopes, rows, labels). */
  #refresh(): void {
    const p = this.props
    const name = String(p.label)
    this.#dialog?.setAttribute('aria-label', name)
    this.#input?.setAttribute('aria-label', name)
    this.#input?.setAttribute('placeholder', String(p.placeholder))
    this.#list?.setAttribute('aria-label', name)
    this.#renderChip()
    this.#renderScopes()
    this.#renderRows()
  }

  /** The active scope as a removable chip before the text. */
  #renderChip(): void {
    const field = this.#field
    const input = this.#input
    if (!field || !input) return
    field.querySelector('.ty-palette__chip')?.remove()
    const scope = this.#scope
    if (!scope) return
    const label = this.#scopes().find((s) => s.id === scope)?.label
    if (!label) return
    const chip = el('button', 'ty-palette__chip', { type: 'button', 'aria-label': tpl(this.props.removeScopeLabel, '{scope}', label) })
    chip.append(label, svgIcon(undefined, ['M18 6 6 18', 'm6 6 12 12']))
    chip.addEventListener('click', () => {
      this.#setScope(null)
      this.#input?.focus()
    })
    field.insertBefore(chip, input)
  }

  #renderScopes(): void {
    const main = this.#main
    if (!main) return
    const scopes = this.#scopes()
    let box = this.#scopesBox
    if (!scopes.length) {
      if (box) {
        box.remove()
        this.#scopesBox = null
      }
      return
    }
    if (!box) {
      box = el('div', 'ty-palette__scopes', { role: 'group' })
      main.prepend(box)
      this.#scopesBox = box
    }
    box.setAttribute('aria-label', String(this.props.scopesLabel))
    box.replaceChildren(
      ...scopes.map((s) => {
        const button = el('button', 'ty-palette__scope', { type: 'button', 'aria-pressed': String(this.#scope === s.id), tabindex: '-1' })
        if (s.icon) {
          const icon = el('span', undefined, { 'aria-hidden': 'true' })
          icon.textContent = s.icon
          button.append(icon)
        }
        button.append(s.label)
        button.addEventListener('click', () => this.#pickScope(s.id))
        return button
      }),
    )
  }

  /** Reflect the scope to the attribute and report it; the attribute change re-renders. */
  #setScope(id: string | null): void {
    if (id) this.setAttribute('active-scope', id)
    else this.removeAttribute('active-scope')
    this.emit('ty-scope-change', { scope: id ?? '' })
  }

  /** A scope button toggles: activating the active scope again clears it. */
  #pickScope(id: string): void {
    this.#activateScope(this.#scope === id ? null : id)
  }

  /** Activate (or clear) a scope and reset the search, focus back on the field. */
  #activateScope(id: string | null): void {
    this.#setScope(id)
    this.#query = ''
    this.#sub = null
    this.#cursor = 0
    if (this.#input) this.#input.value = ''
    this.#renderRows()
    this.#input?.focus()
  }

  /** The sections to show: the sub-list, the empty-query view or the filtered view. */
  #sections(): Section[] {
    const p = this.props
    const groups = this.#groups()
    const scope = this.#scope
    const locale = document.documentElement.lang || undefined
    const inScope = (group: CommandGroupData, item: CommandItemData) => scope === null || (item.scopeId ?? group.scopeId ?? group.id) === scope
    const itemRow = (item: CommandItemData, prefix: string, marks: number[] = []): Row => ({
      key: `${prefix}${item.id}`,
      kind: 'item',
      id: item.id,
      itemId: '',
      label: item.label,
      description: item.description,
      icon: item.icon,
      iconPath: item.iconPath,
      hint: item.hint,
      shortcut: item.shortcut,
      marks,
      item,
    })
    if (this.#sub) {
      const sub = this.#sub
      return [
        {
          key: 'sub',
          heading: tpl(p.actionsForLabel, '{label}', sub.label),
          rows: (sub.actions ?? []).map((a) => ({ key: `action-${a.id}`, kind: 'action' as const, id: a.id, itemId: sub.id, label: a.label, icon: a.icon, iconPath: a.iconPath, shortcut: a.shortcut, marks: [] })),
        },
      ]
    }
    const q = this.#query.trim()
    const sections: Section[] = []
    if (!q) {
      const byId = new Map<string, CommandItemData>()
      for (const g of groups) for (const it of g.items) if (inScope(g, it)) byId.set(it.id, it)
      const recentRows = orderChoices(this.#recent)
        .map((r) => byId.get(r.id))
        .filter((it): it is CommandItemData => !!it)
        .slice(0, Number(p.recentVisible ?? 5))
        .map((it) => itemRow(it, 'recent-'))
      if (recentRows.length) sections.push({ key: 'recent', heading: String(p.recentLabel), rows: recentRows })
      for (const g of groups) {
        const rows = g.items.filter((it) => inScope(g, it)).map((it) => itemRow(it, `${g.id}-`))
        if (rows.length) sections.push({ key: g.id, heading: g.heading, rows })
      }
      return sections
    }
    // The ranking is global: every group's scored items compete on score,
    // and consecutive same-group items share one headed section (the React
    // model's rule — a strong match from a later group outranks a weak one
    // from the first).
    const scored = groups
      .flatMap((g) =>
        g.items
          .filter((it) => inScope(g, it))
          .map((it) => ({ it, g, hit: scoreItem(q, it, g.heading, locale) })),
      )
      .filter((x): x is { it: CommandItemData; g: CommandGroupData; hit: { score: number; marks: number[] } } => x.hit !== null)
      .sort((a, b) => b.hit.score - a.hit.score)
    for (const x of scored) {
      const last = sections[sections.length - 1]
      if (last && last.key === x.g.id) last.rows.push(itemRow(x.it, `${x.g.id}-`, x.hit.marks))
      else sections.push({ key: x.g.id, heading: x.g.heading, rows: [itemRow(x.it, `${x.g.id}-`, x.hit.marks)] })
    }
    if (!sections.length) {
      const fallback = parseList<CommandActionData>(p.fallbackActions)
      if (fallback.length) {
        sections.push({
          key: 'fallback',
          heading: String(p.fallbackLabel),
          rows: fallback.map((a) => ({ key: `fallback-${a.id}`, kind: 'fallback' as const, id: a.id, itemId: '', label: a.label.split('{query}').join(q), icon: a.icon, iconPath: a.iconPath, shortcut: a.shortcut, marks: [] })),
        })
      }
    }
    return sections
  }

  #renderRows(): void {
    const list = this.#list
    const input = this.#input
    const results = this.#results
    if (!list || !input || !results) return
    const p = this.props
    const id = this.instanceId
    const loading = Boolean(p.loading)
    const sections = loading ? [] : this.#sections()
    this.#rows = sections.flatMap((s) => s.rows)
    if (this.#cursor >= this.#rows.length) this.#cursor = Math.max(0, this.#rows.length - 1)
    const current = this.#rows.length ? this.#rows[this.#cursor] : undefined

    const loadingEl = results.querySelector('.ty-palette__loading')
    if (loading && !loadingEl) {
      const block = el('div', 'ty-palette__loading', { 'aria-hidden': 'true' })
      for (let i = 0; i < 3; i++) block.append(el('span', 'ty-skeleton', { 'data-shape': 'line' }))
      results.prepend(block)
    } else if (!loading && loadingEl) loadingEl.remove()

    list.replaceChildren(
      ...sections.map((section) => {
        const group = el('div', 'ty-palette__group', { role: 'group', 'aria-labelledby': `${id}-${section.key}` })
        const heading = el('div', 'ty-palette__heading', { id: `${id}-${section.key}`, role: 'presentation' })
        heading.textContent = section.heading
        group.append(heading)
        for (const row of section.rows) {
          const on = row === current
          const option = el('div', 'ty-palette__option', {
            id: `${id}-${safe(row.key)}`,
            role: 'option',
            'aria-selected': String(on),
            'data-kind': row.kind,
          })
          if (on) option.setAttribute('data-highlighted', '')
          if (row.iconPath) {
            const icon = el('span', 'ty-palette__icon', { 'aria-hidden': 'true' })
            icon.append(svgIcon('ty-icon', row.iconPath.split(' | ')))
            option.append(icon)
          } else if (row.icon) {
            const icon = el('span', 'ty-palette__icon', { 'aria-hidden': 'true' })
            icon.textContent = row.icon
            option.append(icon)
          }
          const text = el('span', 'ty-palette__text')
          const label = el('span', 'ty-palette__label')
          appendMarked(label, row.label, row.marks)
          text.append(label)
          if (row.description) {
            const description = el('span', 'ty-palette__description')
            description.textContent = row.description
            text.append(description)
          }
          option.append(text)
          if (row.hint) {
            const hint = el('span', 'ty-palette__hint')
            hint.textContent = row.hint
            option.append(hint)
          }
          if (row.shortcut) {
            const kbd = el('kbd', 'ty-palette__kbd')
            kbd.textContent = row.shortcut
            option.append(kbd)
          }
          if (row.item?.actions?.length && !this.#sub) {
            const chevron = el('span', 'ty-palette__chevron', { 'aria-hidden': 'true' })
            chevron.append(svgIcon('ty-mirror-rtl', ['m9 18 6-6-6-6']))
            chevron.addEventListener('click', (event) => {
              event.stopPropagation()
              if (row.item) {
                this.#sub = row.item
                this.#cursor = 0
                this.#renderRows()
              }
            })
            option.append(chevron)
          }
          option.addEventListener('pointermove', () => {
            const index = this.#rows.indexOf(row)
            if (index !== -1 && index !== this.#cursor) {
              this.#cursor = index
              this.#renderRows()
            }
          })
          option.addEventListener('mousedown', (event) => event.preventDefault())
          option.addEventListener('click', () => this.#run(row))
          group.append(option)
        }
        return group
      }),
    )

    input.setAttribute('aria-expanded', String(this.#rows.length > 0))
    if (current) input.setAttribute('aria-activedescendant', `${id}-${safe(current.key)}`)
    else input.removeAttribute('aria-activedescendant')

    const emptyEl = results.querySelector<HTMLElement>('.ty-palette__empty')
    if (!loading && !this.#rows.length) {
      const message = this.#query.trim() ? tpl(p.noResultsLabel, '{query}', this.#query.trim()) : String(p.emptyLabel)
      if (emptyEl) emptyEl.textContent = message
      else {
        const paragraph = el('p', 'ty-palette__empty')
        paragraph.textContent = message
        results.append(paragraph)
      }
    } else emptyEl?.remove()

    if (this.#status) {
      const q = this.#query.trim()
      this.#status.textContent = loading
        ? String(p.loadingLabel)
        : q
          ? this.#rows.length
            ? tpl(p.resultsLabel, '{count}', String(this.#rows.length))
            : tpl(p.noResultsLabel, '{query}', q)
          : ''
    }
    if (current) document.getElementById(`${id}-${safe(current.key)}`)?.scrollIntoView?.({ block: 'nearest' })
  }

  #run(row: Row): void {
    const key = this.props.recentKey ? String(this.props.recentKey) : ''
    if (row.kind === 'item' && key) recordChoice(key, row.id, Number(this.props.recentKeep ?? 12))
    this.emit('ty-select', { id: row.id, kind: row.kind, itemId: row.itemId })
    this.#close(true)
  }

  #onKey = (event: KeyboardEvent): void => {
    const count = this.#rows.length
    const empty = this.#query.length === 0
    const scopes = this.#scopes()
    const scope = this.#scope
    const step = (to: number) => {
      event.preventDefault()
      if (count) {
        this.#cursor = (to + count) % count
        this.#renderRows()
      }
    }
    // Inline-axis keys follow the reading direction: "into" the sub-list is the inline end.
    const mirrored: Record<string, string> = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' }
    const rtl = this.closest('[dir]')?.getAttribute('dir') === 'rtl'
    switch (rtl ? (mirrored[event.key] ?? event.key) : event.key) {
      case 'ArrowDown':
        return step(this.#cursor + 1)
      case 'ArrowUp':
        return step(this.#cursor - 1)
      case 'Home':
        return step(0)
      case 'End':
        return step(count - 1)
      case 'Enter': {
        event.preventDefault()
        const row = this.#rows[this.#cursor]
        if (row) this.#run(row)
        return
      }
      case 'ArrowRight': {
        const current = this.#rows[this.#cursor]
        if (!this.#sub && current?.item?.actions?.length) {
          event.preventDefault()
          this.#sub = current.item
          this.#cursor = 0
          this.#renderRows()
        } else if (empty && !scope && scopes[0]) {
          event.preventDefault()
          this.#pickScope(scopes[0].id)
        }
        return
      }
      case 'ArrowLeft':
        if (this.#sub) {
          event.preventDefault()
          this.#sub = null
          this.#cursor = 0
          this.#renderRows()
        }
        return
      case 'Tab': {
        if (!scopes.length || event.shiftKey) return
        const typed = this.#query.trim().toLocaleLowerCase()
        const target = empty ? (scope ? undefined : scopes[0]) : scopes.find((s) => s.label.toLocaleLowerCase().startsWith(typed))
        if (target) {
          event.preventDefault()
          this.#activateScope(target.id)
        }
        return
      }
      case 'Backspace':
        if (empty && scope) {
          event.preventDefault()
          this.#setScope(null)
        }
        return
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        if (this.#sub) {
          this.#sub = null
          this.#cursor = 0
          this.#renderRows()
        } else if (scope) this.#setScope(null)
        else this.#close(true)
        return
    }
  }
}
