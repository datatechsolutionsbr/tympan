// Behaviour of <ty-data-table> (spec: wave-1/data-table.md): sorting,
// selection, loading and empty states, row activation, grid keyboard and
// the density/sticky-column CSS contracts. The element is self-rendering,
// so the tests drive it as plain HTML, wiring the controlled attributes
// (sort-column, sort-direction, selected-keys) the way a host would.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyDataTableElement } from '../../src/elements/data-table/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf } from '../css'

defineTympanElement(TyDataTableElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('dir')
})

const COLUMNS = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'country', header: 'Country' },
  { id: 'date', header: 'Date', sortable: true, numeric: true },
]
const ROWS = [
  { id: 'r1', cells: { name: 'TAMM', country: 'UAE', date: '2024' } },
  { id: 'r2', cells: { name: 'Boti', country: 'Argentina', date: '2019' } },
  { id: 'r3', cells: { name: 'Bürokratt', country: 'Estonia', date: '2020' } },
]

const table = (attrs = '', rows: unknown[] = ROWS, columns = COLUMNS) =>
  html(`<ty-data-table caption="Cases" columns='${JSON.stringify(columns)}' rows='${JSON.stringify(rows)}' ${attrs}></ty-data-table>`).querySelector('ty-data-table')!

/** The host side of the controlled contract: writes sort and selection back. */
const control = (host: Element) => {
  const sorts: Array<[string, string | null]> = []
  host.addEventListener('ty-sort-change', (event) => {
    const { column, direction } = (event as CustomEvent).detail
    sorts.push([column, direction])
    host.setAttribute('sort-column', column)
    if (direction) host.setAttribute('sort-direction', direction)
    else host.removeAttribute('sort-direction')
  })
  host.addEventListener('ty-selection-change', (event) => {
    host.setAttribute('selected-keys', (event as CustomEvent).detail.keys)
  })
  return sorts
}

describe('<ty-data-table>', () => {
  it('is a table named by the caption with a column header per column and a row header per row', async () => {
    table()
    const grid = screen.getByRole('table', { name: 'Cases' })
    expect(grid).toHaveClass('ty-table')
    expect(grid.querySelectorAll('th[scope="col"]')).toHaveLength(3)
    expect(grid.querySelectorAll('th[scope="row"]')).toHaveLength(3)
    // The caption is visually hidden but names the table.
    expect(grid.querySelector('caption')).toHaveClass('ty-visually-hidden')
    expect(grid.querySelector('caption')).toHaveTextContent('Cases')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('shows the caption visibly when asked and names the table with it', () => {
    const host = table('caption-visible')
    const caption = host.querySelector('.ty-table__caption')!
    expect(caption).toHaveTextContent('Cases')
    expect(screen.getByRole('table', { name: 'Cases' })).toHaveAttribute('aria-labelledby', caption.id)
  })

  it('cycles a sortable column through ascending, descending and none (controlled)', async () => {
    const host = table()
    const sorts = control(host)
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: 'Name' }))
    expect(sorts).toEqual([
      ['name', 'ascending'],
      ['name', 'descending'],
      ['name', null],
    ])
    // The controlled attributes drive aria-sort after each cycle step.
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none')
  })

  it('exposes aria-sort only on the sorted column', async () => {
    table('sort-column="date" sort-direction="descending"')
    const headers = screen.getAllByRole('columnheader')
    const date = headers.find((h) => h.textContent?.includes('Date'))!
    expect(date).toHaveAttribute('aria-sort', 'descending')
    for (const header of headers) {
      if (header === date) continue
      const value = header.getAttribute('aria-sort')
      expect(value === null || value === 'none').toBe(true)
    }
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('while loading renders skeleton rows at the density, marks the table busy and shows no data rows', async () => {
    const host = table('loading loading-row-count="4" density="compact"')
    const grid = screen.getByRole('table', { name: 'Cases' })
    expect(grid).toHaveAttribute('aria-busy', 'true')
    expect(host.querySelectorAll('[data-loading="true"]')).toHaveLength(4)
    expect(host.querySelectorAll('.ty-skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByText('TAMM')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading the list')
    expect(host.querySelector('.ty-table-wrap')).toHaveAttribute('data-density', 'compact')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('with no rows and not loading shows the empty state in a single cell spanning all columns', async () => {
    const host = table('', [])
    const cell = host.querySelector('.ty-table__cell--empty')!
    expect(cell).toHaveAttribute('colspan', '3')
    expect(cell.querySelectorAll(':scope > *')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 4, name: 'No rows to show' })).toBeInTheDocument()
    // The selection column widens the span.
    document.body.replaceChildren()
    const selectable = table('selection-mode="multiple"', [])
    expect(selectable.querySelector('.ty-table__cell--empty')).toHaveAttribute('colspan', '4')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('multiple selection: the header checkbox selects all, then one deselected row makes it indeterminate (controlled)', async () => {
    const host = table('selection-mode="multiple"')
    control(host)
    expect(screen.getByRole('grid', { name: 'Cases' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }))
    expect(host).toHaveAttribute('selected-keys', '["r1","r2","r3"]')
    for (const box of screen.getAllByRole('checkbox')) expect(box).toBeChecked()
    for (const row of host.querySelectorAll('tr[data-row-id]')) expect(row).toHaveAttribute('data-selected')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select TAMM' }))
    expect(host).toHaveAttribute('selected-keys', '["r2","r3"]')
    const header = screen.getByRole('checkbox', { name: 'Select all rows' }) as HTMLInputElement
    expect(header.indeterminate).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'Select TAMM' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Boti' })).toBeChecked()
    expect(host.querySelector('tr[data-row-id="r2"]')).toHaveAttribute('aria-selected', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('draws the checkbox from the native input state, so the mark is right even before the host re-renders', () => {
    const css = cssOf('components/data-table/DataTable.css')
    expect(css).toMatch(/\.ty-table__checkbox > input\[type='checkbox'\]:checked \+ \.ty-table__checkbox-box/)
    expect(css).toMatch(/\.ty-table__checkbox > input\[type='checkbox'\]:indeterminate \+ \.ty-table__checkbox-box/)
    expect(css).toMatch(/input:checked \+ \.ty-table__checkbox-box > \.ty-table__check\s*\{[^}]*display:\s*block/)
    expect(css).toMatch(/input:indeterminate \+ \.ty-table__checkbox-box > \.ty-table__minus\s*\{[^}]*display:\s*block/)
  })

  it('a row with href navigates when Enter is pressed on the focused row; one named link per row', async () => {
    const rows = [{ id: 'r1', cells: { name: 'TAMM', country: 'UAE', date: '2024' }, href: '/cases/r1', label: 'Open TAMM' }, ...ROWS.slice(1)]
    const host = table('', rows)
    const link = host.querySelector('.ty-table__row-link')!
    expect(link).toHaveAttribute('href', '/cases/r1')
    expect(link).toHaveAttribute('aria-label', 'Open TAMM')
    expect(host.querySelectorAll('tr[data-row-id="r1"] a')).toHaveLength(1)
    const navigated = vi.fn((event: Event) => event.preventDefault())
    link.addEventListener('click', navigated)
    const row = host.querySelector<HTMLElement>('tr[data-row-id="r1"]')!
    row.focus()
    await userEvent.keyboard('{Enter}')
    expect(navigated).toHaveBeenCalledTimes(1)
    // A press anywhere on the row reaches the link too.
    await userEvent.click(screen.getByText('UAE'))
    expect(navigated).toHaveBeenCalledTimes(2)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('an actionable row without href emits ty-row-action on Enter and on a press', async () => {
    const host = table('actionable')
    const actions: string[] = []
    host.addEventListener('ty-row-action', (event) => actions.push((event as CustomEvent).detail.id))
    const row = host.querySelector<HTMLElement>('tr[data-row-id="r2"]')!
    expect(row).toHaveAttribute('data-actionable')
    row.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(screen.getByText('Argentina'))
    expect(actions).toEqual(['r2', 'r2'])
  })

  it('grid keyboard: the arrow keys, Home and End move between rows; Space selects the focused row', async () => {
    const host = table('selection-mode="multiple"')
    control(host)
    const row = (id: string) => host.querySelector<HTMLElement>(`tr[data-row-id="${id}"]`)!
    row('r1').focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(row('r2')).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(row('r3')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(row('r1')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(row('r1')).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(host).toHaveAttribute('selected-keys', '["r1"]')
  })

  it('renders the density on the wrapper and the stylesheet sizes compact at 36 px and comfortable at 52 px', () => {
    const host = table('density="compact"')
    expect(host.querySelector('.ty-table-wrap')).toHaveAttribute('data-density', 'compact')
    document.body.replaceChildren()
    const comfortable = table('density="comfortable"')
    expect(comfortable.querySelector('.ty-table-wrap')).toHaveAttribute('data-density', 'comfortable')
    const css = cssOf('components/data-table/DataTable.css')
    expect(css).toMatch(/--ty-table-row-compact:\s*36px/)
    expect(css).toMatch(/--ty-table-row-comfortable:\s*52px/)
    expect(css).toMatch(/\.ty-table-wrap\[data-density='compact'\]\s*\{[^}]*--ty-table-row:\s*var\(--ty-table-row-compact\)/)
    expect(css).toMatch(/\.ty-table-wrap\[data-density='comfortable'\]\s*\{[^}]*--ty-table-row:\s*var\(--ty-table-row-comfortable\)/)
    expect(css).toMatch(/\.ty-table__cell\s*\{[^}]*block-size:\s*var\(--ty-table-row\)/)
  })

  it('keeps the first column visible while scrolling horizontally, unless told not to', () => {
    const host = table()
    expect(host.querySelector('.ty-table-wrap')).toHaveAttribute('data-sticky-first')
    document.body.replaceChildren()
    const loose = table('sticky-first-column="false"')
    expect(loose.querySelector('.ty-table-wrap')).not.toHaveAttribute('data-sticky-first')
    const css = cssOf('components/data-table/DataTable.css')
    expect(css).toMatch(/\.ty-table-wrap\[data-sticky-first\] \.ty-table__row > :first-child\s*\{[^}]*position:\s*sticky/)
    expect(css).toMatch(/\.ty-table-scroll\s*\{[^}]*overflow:\s*auto/)
  })

  it('aligns numeric columns to the end with tabular figures', () => {
    const host = table()
    expect(host.querySelector('th[scope="col"][data-align="end"]')).toHaveTextContent('Date')
    const numeric = host.querySelectorAll('.ty-table__cell[data-numeric]')
    expect(numeric).toHaveLength(3)
    for (const cell of numeric) expect(cell).toHaveAttribute('data-align', 'end')
  })

  it('clamps cell content to two lines with the full value on hover', () => {
    const host = table()
    const clamp = host.querySelector('.ty-table__clamp')!
    expect(clamp).toHaveAttribute('title', 'TAMM')
    expect(clamp).toHaveTextContent('TAMM')
    const css = cssOf('components/data-table/DataTable.css')
    expect(css).toMatch(/\.ty-table__clamp\s*\{[^}]*-webkit-line-clamp:\s*2/)
  })

  it('follows attribute changes from plain HTML (rows, density, column lines)', () => {
    const host = table()
    expect(screen.getByText('TAMM')).toBeInTheDocument()
    host.setAttribute('rows', JSON.stringify([{ id: 'r9', cells: { name: 'Aadhar', country: 'India', date: '2009' } }]))
    expect(screen.queryByText('TAMM')).toBeNull()
    expect(screen.getByText('Aadhar')).toBeInTheDocument()
    host.setAttribute('density', 'comfortable')
    expect(host.querySelector('.ty-table-wrap')).toHaveAttribute('data-density', 'comfortable')
    host.setAttribute('show-column-lines', '')
    expect(host.querySelector('.ty-table-wrap')).toHaveAttribute('data-column-lines')
    host.setAttribute('loading', '')
    expect(screen.queryByText('Aadhar')).toBeNull()
    host.removeAttribute('loading')
    expect(screen.getByText('Aadhar')).toBeInTheDocument()
  })

  it('translates the status, the empty state and the selection labels through attributes', () => {
    const host = table('selection-mode="multiple" loading loading-label="Cargando la lista" select-all-label="Seleccionar todas las filas" select-row-label="Seleccionar {label}"')
    expect(screen.getByRole('status')).toHaveTextContent('Cargando la lista')
    expect(screen.getByRole('checkbox', { name: 'Seleccionar todas las filas' })).toBeInTheDocument()
    document.body.replaceChildren()
    expect(host.isConnected).toBe(false)
    table('empty-label="Nenhuma linha para mostrar"', [])
    expect(screen.getByRole('heading', { name: 'Nenhuma linha para mostrar' })).toBeInTheDocument()
  })

  it('warns and renders empty when the data attributes are not valid JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const host = html('<ty-data-table caption="Cases" columns="not json" rows="[broken"></ty-data-table>').querySelector('ty-data-table')!
    expect(warn).toHaveBeenCalledTimes(2)
    expect(host.querySelector('.ty-table__cell--empty')).toBeInTheDocument()
    warn.mockRestore()
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    table('', [{ id: 'r1', cells: { name: 'الهوية', country: 'الإمارات', date: '2024' } }])
    expect(screen.getByRole('table', { name: 'Cases' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'الهوية' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })
})
