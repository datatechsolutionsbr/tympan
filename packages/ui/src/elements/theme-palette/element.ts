import { TyElement } from '../base.ts'
import { themePaletteDefinition } from './definition.ts'
import { choose, DENSITIES, MODES, readStored, resolve, sections, THEMES, writeStored, type Appearance, type Density, type Mode, type Row, type RowLabels } from './model.ts'

const PRINT_LINK_ID = 'ty-print-themes'
const FONT_LINK_ID = 'ty-theme-fonts'
const SVG = 'http://www.w3.org/2000/svg'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

function searchIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'ty-palette__search-icon')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('aria-hidden', 'true')
  const circle = document.createElementNS(SVG, 'circle')
  circle.setAttribute('cx', '11')
  circle.setAttribute('cy', '11')
  circle.setAttribute('r', '7')
  const line = document.createElementNS(SVG, 'path')
  line.setAttribute('d', 'm20 20-3.5-3.5')
  svg.append(circle, line)
  return svg
}

/**
 * `<ty-theme-palette>`. While `open`, a native `<dialog>` (top layer: no
 * ancestor can clip it, the rest of the page is inert, Escape cancels) holds
 * the palette: a combobox field over a listbox of themes, modes and
 * densities, navigated with the arrow keys, Home, End, Enter and Escape.
 * Choosing applies and stores the appearance and closes.
 */
export class TyThemePaletteElement extends TyElement {
  static override definition = themePaletteDefinition

  #dialog: HTMLDialogElement | null = null
  #input: HTMLInputElement | null = null
  #list: HTMLElement | null = null
  #status: HTMLElement | null = null
  #empty: HTMLElement | null = null
  #query = ''
  #cursor = 0
  #rows: Row[] = []
  #appliedDefaults = ''

  /** The appearance in use: the stored choice over the defaults. */
  get appearance(): Appearance {
    const p = this.props
    return resolve(readStored(storage(), String(p.storageKey)), {
      theme: String(p.defaultTheme),
      mode: String(p.defaultMode) as Mode,
      density: String(p.defaultDensity) as Density,
    })
  }

  /**
   * Store `choice` over what is stored (fields left out keep following
   * the defaults, so an organization default still reaches a person who
   * only picked a mode), apply the result and announce it.
   */
  select(choice: Partial<Appearance>): void {
    const key = String(this.props.storageKey)
    const stored = { ...readStored(storage(), key), ...choice }
    writeStored(storage(), key, stored)
    const appearance = this.appearance
    this.#applyToDocument(appearance)
    this.emit('ty-theme-change', { ...appearance })
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
    const p = this.props
    if (p.apply) {
      const defaults = `${p.defaultTheme}|${p.defaultMode}|${p.defaultDensity}|${p.storageKey}`
      if (defaults !== this.#appliedDefaults) {
        this.#appliedDefaults = defaults
        this.#applyToDocument(this.appearance)
      }
    }
    if (p.open && !this.#dialog) this.#open()
    else if (!p.open && this.#dialog) this.#close(false)
    else if (this.#dialog) this.#renderRows()
  }

  #applyToDocument(appearance: Appearance): void {
    const root = document.documentElement
    root.setAttribute('data-ty-theme', appearance.theme)
    root.setAttribute('data-ty-mode', appearance.mode)
    root.setAttribute('data-ty-density', appearance.density)
    const entry = THEMES.find((t) => t.name === appearance.theme)
    const href = this.getAttribute('print-stylesheet')
    this.#link(PRINT_LINK_ID, entry?.kind === 'print' && href ? href : null)
    this.#link(FONT_LINK_ID, this.hasAttribute('load-fonts') ? (entry?.fontsUrl ?? null) : null)
  }

  #link(id: string, href: string | null): void {
    const existing = document.getElementById(id) as HTMLLinkElement | null
    if (!href) {
      existing?.remove()
      return
    }
    if (existing) {
      if (existing.getAttribute('href') !== href) existing.setAttribute('href', href)
      return
    }
    const link = el('link', undefined, { id, rel: 'stylesheet', href })
    document.head.append(link)
  }

  #labels(): RowLabels {
    const p = this.props
    let themes: Record<string, string> = {}
    try {
      themes = JSON.parse(String(p.themeLabels ?? '{}')) as Record<string, string>
    } catch {
      themes = {}
    }
    return {
      groups: { preset: String(p.groupPresets), print: String(p.groupPrint), mode: String(p.groupMode), density: String(p.groupDensity) },
      modes: { system: String(p.modeSystem), light: String(p.modeLight), dark: String(p.modeDark) },
      densities: { compact: String(p.densityCompact), default: String(p.densityDefault), comfortable: String(p.densityComfortable) },
      themes,
    }
  }

  #offered(): ReadonlySet<string> | undefined {
    const list = String(this.props.themes ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return list.length ? new Set(list) : undefined
  }

  #open(): void {
    const p = this.props
    const id = this.instanceId
    const dialog = el('dialog', 'ty-palette', { 'aria-label': String(p.label), 'data-ty-palette': '' })
    const body = el('div', 'ty-palette__dialog')
    const field = el('div', 'ty-palette__field')
    const input = el('input', 'ty-palette__input', {
      role: 'combobox',
      'aria-label': String(p.label),
      'aria-autocomplete': 'list',
      'aria-controls': `${id}-list`,
      placeholder: String(p.placeholder),
      autocomplete: 'off',
      spellcheck: 'false',
      type: 'text',
    })
    field.append(searchIcon(), input)
    const main = el('div', 'ty-palette__main')
    const results = el('div', 'ty-palette__results')
    const list = el('div', 'ty-palette__list', { id: `${id}-list`, role: 'listbox', 'aria-label': String(p.label) })
    const empty = el('p', 'ty-palette__empty')
    empty.hidden = true
    results.append(list, empty)
    main.append(results)
    const footer = el('div', 'ty-palette__footer', { 'aria-hidden': 'true' })
    for (const [keys, hint] of [
      ['↑↓', p.hintNavigate],
      ['↵', p.hintSelect],
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
      this.#renderRows()
    })
    input.addEventListener('keydown', (event) => this.#onKey(event))
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
    this.#list = list
    this.#empty = empty
    this.#status = status
    this.#query = ''
    this.#cursor = 0
    this.replaceChildren(dialog)
    this.#renderRows()
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    input.focus()
  }

  #close(announce: boolean): void {
    const dialog = this.#dialog
    if (!dialog) return
    this.#dialog = null
    this.#input = null
    this.#list = null
    if (dialog.open && typeof dialog.close === 'function') dialog.close()
    dialog.remove()
    if (this.hasAttribute('open')) this.removeAttribute('open')
    if (announce) this.emit('ty-close')
  }

  #onKey(event: KeyboardEvent): void {
    const count = this.#rows.length
    const step = (to: number) => {
      event.preventDefault()
      if (count) {
        this.#cursor = (to + count) % count
        this.#renderRows()
      }
    }
    switch (event.key) {
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
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        if (this.#query) {
          this.#query = ''
          if (this.#input) this.#input.value = ''
          this.#cursor = 0
          this.#renderRows()
        } else this.#close(true)
        return
    }
  }

  #run(row: Row): void {
    this.select(choose(row))
    this.#close(true)
  }

  #renderRows(): void {
    const list = this.#list
    const input = this.#input
    if (!list || !input) return
    const p = this.props
    const id = this.instanceId
    const current = this.appearance
    const found = sections(this.#query, current, this.#labels(), this.#offered())
    this.#rows = found.flatMap((s) => s.rows)
    if (this.#cursor >= this.#rows.length) this.#cursor = Math.max(0, this.#rows.length - 1)
    const active = this.#rows[this.#cursor]

    list.replaceChildren(
      ...found.map((section) => {
        const group = el('div', 'ty-palette__group', { role: 'group', 'aria-labelledby': `${id}-${section.group}` })
        const heading = el('div', 'ty-palette__heading', { id: `${id}-${section.group}`, role: 'presentation' })
        heading.textContent = section.heading
        group.append(heading)
        for (const row of section.rows) {
          const on = row === active
          const option = el('div', 'ty-palette__option', {
            id: `${id}-${row.key.replace(':', '-')}`,
            role: 'option',
            'aria-selected': String(on),
            'data-kind': row.group,
          })
          if (on) option.setAttribute('data-highlighted', '')
          if (row.current) option.setAttribute('data-current', '')
          const icon = el('span', 'ty-palette__icon', { 'aria-hidden': 'true' })
          const swatch = el('span', 'ty-palette__swatch')
          if (row.group === 'preset' || row.group === 'print') swatch.setAttribute('data-ty-theme', row.value)
          if (row.group === 'mode' && row.value !== 'system') swatch.setAttribute('data-ty-mode', row.value)
          if (row.group === 'density') swatch.setAttribute('data-density-swatch', row.value)
          icon.append(swatch)
          const text = el('span', 'ty-palette__text')
          const label = el('span', 'ty-palette__label')
          appendMarked(label, row.label, row.marks)
          text.append(label)
          option.append(icon, text)
          if (row.current) {
            const hint = el('span', 'ty-palette__hint')
            hint.textContent = String(p.currentLabel)
            option.append(hint)
          } else if (row.hint && row.hint !== row.label) {
            const hint = el('span', 'ty-palette__hint')
            hint.textContent = row.hint
            option.append(hint)
          }
          option.addEventListener('pointermove', () => {
            const index = this.#rows.indexOf(row)
            if (index !== this.#cursor) {
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
    if (active) input.setAttribute('aria-activedescendant', `${id}-${active.key.replace(':', '-')}`)
    else input.removeAttribute('aria-activedescendant')
    if (this.#empty) {
      this.#empty.hidden = this.#rows.length > 0
      this.#empty.textContent = String(p.emptyLabel)
    }
    if (this.#status) this.#status.textContent = this.#query.trim() ? String(p.resultsLabel).replace('{count}', String(this.#rows.length)) : ''
    if (active) document.getElementById(`${id}-${active.key.replace(':', '-')}`)?.scrollIntoView?.({ block: 'nearest' })
  }
}

function appendMarked(target: HTMLElement, text: string, marks: number[]): void {
  if (!marks.length) {
    target.textContent = text
    return
  }
  const first = marks[0]!
  const last = marks[marks.length - 1]! + 1
  if (first > 0) target.append(text.slice(0, first))
  const mark = el('mark', 'ty-palette__mark')
  mark.textContent = text.slice(first, last)
  target.append(mark)
  if (last < text.length) target.append(text.slice(last))
}

export { MODES, DENSITIES }
