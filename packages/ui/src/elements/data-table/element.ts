import { TyElement } from '../base.ts'
import { dataTableDefinition } from './definition.ts'

const SVG = 'http://www.w3.org/2000/svg'

interface ColumnDef {
  id: string
  header: string
  sortable?: boolean
  align?: 'start' | 'end'
  numeric?: boolean
}

interface RowDef {
  id: string
  cells: Record<string, string>
  href?: string
  label?: string
}

type Direction = 'ascending' | 'descending' | null

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  return node
}

/** A decorative lucide icon (ISC, THIRD_PARTY_NOTICES): strokes only. */
function icon(className: string, paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', className)
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

const SORT_ICONS: Record<'ascending' | 'descending' | 'none', string[]> = {
  ascending: ['m5 12 7-7 7 7', 'M12 19V5'],
  descending: ['M12 5v14', 'm19 12-7 7-7-7'],
  none: ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
}
const CHECK = ['M20 6 9 17l-5-5']
const MINUS = ['M5 12h14']
const INBOX = ['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z']

/** The sort cycle of a column: none → ascending → descending → none. */
function nextDirection(current: Direction, sameColumn: boolean): Direction {
  if (!sameColumn || current === null) return 'ascending'
  return current === 'ascending' ? 'descending' : null
}

/**
 * `<ty-data-table>`. Self-rendering (the theme palette's precedent): the
 * host framework renders an empty host with the data as JSON attributes and
 * the element owns the whole subtree (spec: wave-1/data-table.md):
 *
 * - **Structure** — `.ty-table-wrap` (density, sticky-first-column and
 *   column-lines states) around the scroll container and a native `<table>`
 *   named by the caption; the first cell of each row is a row header. The
 *   table is read-only (the APG Table pattern) until rows are selectable,
 *   linked or actionable — then it is a grid: rows are focusable, the arrow
 *   keys, Home and End move between them, Enter activates, Space selects.
 * - **Sorting** — a sortable header is a button carrying the direction
 *   icon; activating it cycles none → ascending → descending → none and
 *   emits `ty-sort-change`. Controlled: the host writes `sort-column` and
 *   `sort-direction` back; the element reflects them in `aria-sort`.
 * - **Selection** — `selection-mode="multiple"` adds a native-checkbox
 *   column and a select-all header checkbox (indeterminate while some rows
 *   are selected). Changes are emitted as `ty-selection-change` with the
 *   new keys as JSON; the host writes `selected-keys` back. Selected rows
 *   carry `data-selected` (and `aria-selected` in grid mode).
 * - **States** — while `loading`, skeleton rows replace the data, the table
 *   is `aria-busy` and a visually-hidden status announces `loadingLabel`;
 *   with no rows, one cell spanning every column holds the empty state.
 * - **Row activation** — a row with `href` renders one link (named by the
 *   row's `label`) and forwards presses and Enter to it; a row without
 *   `href` emits `ty-row-action` instead.
 *
 * Every attribute change re-renders the owned subtree (focus returns to
 * the control that had it, matched by its `data-focus-key`).
 */
export class TyDataTableElement extends TyElement {
  static override definition = dataTableDefinition

  protected override connected(): void {
    this.addEventListener('click', this.#onClick)
    this.addEventListener('change', this.#onChange)
    this.addEventListener('keydown', this.#onKeydown)
    this.#render()
  }

  protected override disconnected(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('change', this.#onChange)
    this.removeEventListener('keydown', this.#onKeydown)
  }

  protected override changed(): void {
    if (this.isConnected) this.#render()
  }

  // --- data -----------------------------------------------------------------

  #columns(): ColumnDef[] {
    const parsed = this.#json<ColumnDef[]>('columns')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) => c && typeof c.id === 'string')
  }

  #rows(): RowDef[] {
    const parsed = this.#json<RowDef[]>('rows')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((r) => r && typeof r.id === 'string')
  }

  #selected(): Set<string> {
    const parsed = this.#json<string[]>('selected-keys')
    return new Set(Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [])
  }

  #json<T>(attribute: string): T | undefined {
    const raw = this.getAttribute(attribute)
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as T
    } catch {
      console.warn(`ty-data-table: ${attribute} is not valid JSON.`)
      return undefined
    }
  }

  #direction(column: string): Direction {
    if (this.getAttribute('sort-column') !== column) return null
    const dir = this.getAttribute('sort-direction')
    return dir === 'ascending' || dir === 'descending' ? dir : null
  }

  /** Selectable, linked or actionable rows make the table a grid. */
  #interactive(selectable: boolean, rows: RowDef[]): boolean {
    return selectable || this.hasAttribute('actionable') || rows.some((r) => r.href)
  }

  #rowLabel(row: RowDef, columns: ColumnDef[]): string {
    return row.label ?? row.cells[columns[0]?.id ?? ''] ?? row.id
  }

  // --- rendering -------------------------------------------------------------

  #render(): void {
    const active = document.activeElement
    const focusKey = active instanceof HTMLElement && this.contains(active) ? active.dataset.focusKey : undefined

    const p = this.props
    const columns = this.#columns()
    const rows = this.#rows()
    const selected = this.#selected()
    const selectable = String(p.selectionMode) === 'multiple'
    const loading = Boolean(p.loading)
    const interactive = this.#interactive(selectable, rows)
    const colSpan = columns.length + (selectable ? 1 : 0)

    const wrap = el('div', 'ty-table-wrap', { 'data-density': String(p.density) })
    if (this.getAttribute('sticky-first-column') !== 'false') wrap.setAttribute('data-sticky-first', '')
    if (p.showColumnLines) wrap.setAttribute('data-column-lines', '')
    if (selectable) wrap.setAttribute('data-selectable', '')

    const caption = String(p.caption ?? '')
    const captionId = `${this.instanceId}-caption`
    if (p.captionVisible) {
      const captionNode = el('div', 'ty-table__caption', { id: captionId })
      captionNode.textContent = caption
      wrap.append(captionNode)
    }
    if (loading) {
      const status = el('span', 'ty-visually-hidden', { role: 'status' })
      status.textContent = String(p.loadingLabel)
      wrap.append(status)
    }

    const scroll = el('div', 'ty-table-scroll')
    const maxBlockSize = String(p.maxBlockSize ?? '')
    if (maxBlockSize) scroll.style.maxBlockSize = maxBlockSize
    const table = el('table', 'ty-table')
    if (interactive) table.setAttribute('role', 'grid')
    if (p.captionVisible) table.setAttribute('aria-labelledby', captionId)
    else {
      const hidden = el('caption', 'ty-visually-hidden')
      hidden.textContent = caption
      table.append(hidden)
    }
    if (loading) table.setAttribute('aria-busy', 'true')

    table.append(this.#head(columns, selectable, rows, selected, loading))
    table.append(this.#body(columns, rows, selected, selectable, loading, interactive, colSpan))
    scroll.append(table)
    wrap.append(scroll)
    this.replaceChildren(wrap)

    if (focusKey) this.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)?.focus()
  }

  #head(columns: ColumnDef[], selectable: boolean, rows: RowDef[], selected: Set<string>, loading: boolean): HTMLElement {
    const head = el('thead', 'ty-table__head')
    const row = el('tr', 'ty-table__row ty-table__row--head')
    if (selectable) {
      const th = el('th', 'ty-table__column ty-table__column--select', { scope: 'col' })
      const all = rows.length > 0 && rows.every((r) => selected.has(r.id))
      const some = !all && rows.some((r) => selected.has(r.id))
      const box = this.#checkbox(String(this.props.selectAllLabel), all, some, loading || rows.length === 0)
      box.input.setAttribute('data-select-all', '')
      box.input.dataset.focusKey = 'select:all'
      th.append(box.shell)
      row.append(th)
    }
    for (const col of columns) {
      const dir = this.#direction(col.id)
      const th = el('th', 'ty-table__column', {
        scope: 'col',
        'data-align': col.numeric || col.align === 'end' ? 'end' : 'start',
      })
      if (col.sortable) {
        th.setAttribute('aria-sort', dir ?? 'none')
        const button = el('button', 'ty-table__sort', { type: 'button', 'data-column': col.id })
        button.dataset.focusKey = `sort:${col.id}`
        const text = el('span')
        text.textContent = col.header
        button.append(text, icon('ty-table__sort-icon', SORT_ICONS[dir ?? 'none']))
        th.append(button)
      } else {
        th.textContent = col.header
      }
      row.append(th)
    }
    head.append(row)
    return head
  }

  #body(columns: ColumnDef[], rows: RowDef[], selected: Set<string>, selectable: boolean, loading: boolean, interactive: boolean, colSpan: number): HTMLElement {
    const body = el('tbody', 'ty-table__body')
    if (loading) {
      const count = Math.max(0, Math.floor(Number(this.props.loadingRowCount ?? 10)))
      for (let i = 0; i < count; i++) {
        const row = el('tr', 'ty-table__row', { 'data-loading': 'true', 'aria-hidden': 'true' })
        if (selectable) {
          const cell = el('td', 'ty-table__cell ty-table__cell--select')
          cell.append(el('span', 'ty-table__checkbox-box', { 'aria-hidden': 'true' }))
          row.append(cell)
        }
        for (const col of columns) {
          const cell = el('td', 'ty-table__cell')
          cell.append(el('span', 'ty-skeleton', { 'data-shape': 'line', 'data-width': col.numeric ? 'short' : 'long' }))
          row.append(cell)
        }
        body.append(row)
      }
      return body
    }
    if (rows.length === 0) {
      const row = el('tr', 'ty-table__row ty-table__row--empty')
      const cell = el('td', 'ty-table__cell ty-table__cell--empty', { colspan: String(colSpan) })
      const empty = el('div', 'ty-empty', { 'data-framing': 'inline' })
      empty.append(icon('ty-empty__icon', INBOX))
      const title = el('h4', 'ty-empty__title')
      title.textContent = String(this.props.emptyLabel)
      empty.append(title)
      const description = String(this.props.emptyDescription ?? '')
      if (description) {
        const text = el('p', 'ty-empty__description')
        text.textContent = description
        empty.append(text)
      }
      cell.append(empty)
      row.append(cell)
      body.append(row)
      return body
    }
    for (const data of rows) {
      const row = el('tr', 'ty-table__row', { 'data-row-id': data.id })
      if (selected.has(data.id)) row.setAttribute('data-selected', '')
      if (data.href || this.hasAttribute('actionable')) row.setAttribute('data-actionable', '')
      if (interactive) {
        row.setAttribute('tabindex', '0')
        row.dataset.focusKey = `row:${data.id}`
        if (selectable) row.setAttribute('aria-selected', String(selected.has(data.id)))
      }
      if (selectable) {
        const cell = el('td', 'ty-table__cell ty-table__cell--select')
        const label = String(this.props.selectRowLabel).replace('{label}', this.#rowLabel(data, columns))
        const box = this.#checkbox(label, selected.has(data.id), false, false)
        box.input.setAttribute('data-row-id', data.id)
        box.input.dataset.focusKey = `select:${data.id}`
        cell.append(box.shell)
        row.append(cell)
      }
      columns.forEach((col, index) => {
        const align = col.numeric || col.align === 'end' ? 'end' : 'start'
        const value = data.cells[col.id] ?? ''
        const cell = el(index === 0 ? 'th' : 'td', index === 0 ? 'ty-table__cell ty-table__cell--row-header' : 'ty-table__cell', { 'data-align': align })
        if (index === 0) cell.setAttribute('scope', 'row')
        if (col.numeric) cell.setAttribute('data-numeric', '')
        const clamp = el('span', 'ty-table__clamp', { title: value })
        clamp.textContent = value
        if (index === 0 && data.href) {
          const link = el('a', 'ty-table__row-link', { href: data.href, 'aria-label': this.#rowLabel(data, columns) })
          link.append(clamp)
          cell.append(link)
        } else {
          cell.append(clamp)
        }
        row.append(cell)
      })
      body.append(row)
    }
    return body
  }

  /** A native checkbox in the `.ty-table__checkbox` shell; the stylesheet hides the input and draws the box from its state. */
  #checkbox(label: string, checked: boolean, indeterminate: boolean, disabled: boolean): { shell: HTMLElement; input: HTMLInputElement } {
    const shell = el('label', 'ty-table__checkbox')
    const input = el('input', 'ty-table__checkbox-input', { type: 'checkbox', 'aria-label': label })
    input.checked = checked
    input.indeterminate = indeterminate
    input.disabled = disabled
    const box = el('span', 'ty-table__checkbox-box', { 'aria-hidden': 'true' })
    box.append(icon('ty-table__check', CHECK), icon('ty-table__minus', MINUS))
    shell.append(input, box)
    return { shell, input }
  }

  // --- behaviour -------------------------------------------------------------

  #requestSort(column: string): void {
    const direction = nextDirection(this.#direction(column), this.getAttribute('sort-column') === column)
    this.emit('ty-sort-change', { column, direction })
  }

  #toggleRow(id: string): void {
    const selected = this.#selected()
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    this.emit('ty-selection-change', { keys: JSON.stringify([...selected]) })
  }

  #toggleAll(): void {
    const rows = this.#rows()
    const selected = this.#selected()
    const all = rows.length > 0 && rows.every((r) => selected.has(r.id))
    this.emit('ty-selection-change', { keys: JSON.stringify(all ? [] : rows.map((r) => r.id)) })
  }

  /** Row activation: a row link is clicked (the host navigates); a row without href asks for an action. */
  #activate(id: string): void {
    const row = this.#rows().find((r) => r.id === id)
    if (row?.href) {
      this.querySelector<HTMLAnchorElement>(`tr[data-row-id="${CSS.escape(id)}"] .ty-table__row-link`)?.click()
      return
    }
    if (this.hasAttribute('actionable')) this.emit('ty-row-action', { id })
  }

  #dataRow(target: Element): HTMLElement | null {
    const row = target.closest('tr.ty-table__row[data-row-id]')
    return row instanceof HTMLElement && this.contains(row) ? row : null
  }

  #onClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const sort = target.closest('button.ty-table__sort')
    if (sort instanceof HTMLElement && this.contains(sort)) {
      const column = sort.getAttribute('data-column')
      if (column) this.#requestSort(column)
      return
    }
    // Native controls (a row link, a checkbox, its label) handle themselves.
    if (target.closest('a, button, input, label')) return
    const row = this.#dataRow(target)
    if (!row) return
    const id = row.getAttribute('data-row-id')!
    if (String(this.props.selectionMode) === 'multiple') this.#toggleRow(id)
    else this.#activate(id)
  }

  #onChange = (event: Event): void => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || !input.classList.contains('ty-table__checkbox-input')) return
    if (input.hasAttribute('data-select-all')) this.#toggleAll()
    else {
      const id = input.getAttribute('data-row-id')
      if (id) this.#toggleRow(id)
    }
  }

  #onKeydown = (event: KeyboardEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const row = this.#dataRow(target)
    if (!row) return
    const rows = Array.from(this.querySelectorAll<HTMLElement>('tr.ty-table__row[data-row-id]'))
    const index = rows.indexOf(row)
    const move = (to: number) => {
      event.preventDefault()
      rows[Math.min(Math.max(to, 0), rows.length - 1)]?.focus()
    }
    switch (event.key) {
      case 'ArrowDown':
        return move(index + 1)
      case 'ArrowUp':
        return move(index - 1)
      case 'Home':
        return move(0)
      case 'End':
        return move(rows.length - 1)
      // Enter and Space on the row itself; nested controls keep their native keys.
      case 'Enter':
        if (target !== row) return
        event.preventDefault()
        this.#activate(row.getAttribute('data-row-id')!)
        return
      case ' ':
        if (target !== row || String(this.props.selectionMode) !== 'multiple') return
        event.preventDefault()
        this.#toggleRow(row.getAttribute('data-row-id')!)
        return
    }
  }
}
