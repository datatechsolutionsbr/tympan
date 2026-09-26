import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { DataTable, type DataTableColumn, type DataTableRow, type SortDirection } from './DataTable'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const columns: DataTableColumn[] = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'country', header: 'Country' },
  { id: 'date', header: 'Date', sortable: true, numeric: true },
]
const rows: DataTableRow[] = [
  { id: 'r1', cells: { name: 'TAMM', country: 'UAE', date: '2024' } },
  { id: 'r2', cells: { name: 'Boti', country: 'Argentina', date: '2019' } },
  { id: 'r3', cells: { name: 'Bürokratt', country: 'Estonia', date: '2020' } },
]

describe('DataTable', () => {
  it('is a table named by the caption with three column headers', () => {
    render(<DataTable caption="Cases" columns={columns} rows={rows} />)
    const table = screen.getByRole('table', { name: 'Cases' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getAllByRole('rowheader')).toHaveLength(3)
  })

  it('cycles sort through ascending, descending and none', async () => {
    const onSortChange = vi.fn()
    function Host() {
      const [sort, setSort] = useState<{ column?: string; direction: SortDirection }>({ direction: null })
      return (
        <DataTable
          caption="Cases"
          columns={columns}
          rows={rows}
          sortColumn={sort.column}
          sortDirection={sort.direction}
          onSortChange={(column, direction) => {
            onSortChange(column, direction)
            setSort({ column, direction })
          }}
        />
      )
    }
    render(<Host />)
    const button = screen.getByRole('button', { name: /Name/ })
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.click(button)
    expect(onSortChange.mock.calls).toEqual([
      ['name', 'ascending'],
      ['name', 'descending'],
      ['name', null],
    ])
  })

  it('cycles sort in the interactive (grid) mode as well', async () => {
    const onSortChange = vi.fn()
    function Host() {
      const [sort, setSort] = useState<{ column?: string; direction: SortDirection }>({ direction: null })
      return (
        <DataTable
          caption="Cases"
          columns={columns}
          rows={rows}
          selectionMode="multiple"
          sortColumn={sort.column}
          sortDirection={sort.direction}
          onSortChange={(column, direction) => {
            onSortChange(column, direction)
            setSort({ column, direction })
          }}
        />
      )
    }
    render(<Host />)
    const header = screen.getByRole('columnheader', { name: /Name/ })
    await userEvent.click(header)
    await userEvent.click(header)
    await userEvent.click(header)
    expect(onSortChange.mock.calls.map((c) => c[1])).toEqual(['ascending', 'descending', null])
  })

  it.each([false, true])('exposes aria-sort only on the sorted column (interactive %s)', (interactive) => {
    render(
      <DataTable
        caption="Cases"
        columns={columns}
        rows={rows}
        sortColumn="date"
        sortDirection="descending"
        selectionMode={interactive ? 'multiple' : 'none'}
      />,
    )
    const headers = screen.getAllByRole('columnheader')
    const date = headers.find((h) => h.textContent?.includes('Date'))!
    expect(date).toHaveAttribute('aria-sort', 'descending')
    for (const h of headers) {
      if (h === date) continue
      const v = h.getAttribute('aria-sort')
      expect(v === null || v === 'none').toBe(true)
    }
  })

  it('renders skeleton rows while loading, aria-busy, with no data rows', () => {
    const { container } = render(
      <DataTable caption="Cases" columns={columns} rows={rows} loading loadingRowCount={4} density="compact" />,
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('[data-loading="true"]')).toHaveLength(4)
    expect(screen.queryByText('TAMM')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading the list')
    expect(container.querySelector('.ty-table-wrap')).toHaveAttribute('data-density', 'compact')
  })

  it('loading in grid mode is aria-busy too', () => {
    render(<DataTable caption="Cases" columns={columns} rows={rows} loading selectionMode="multiple" />)
    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true')
  })

  it.each([false, true])('shows the empty state in one cell spanning all columns (interactive %s)', (interactive) => {
    render(
      <DataTable caption="Cases" columns={columns} rows={[]} selectionMode={interactive ? 'multiple' : 'none'} emptyState={<p>No cases yet</p>} />,
    )
    const cell = screen.getByText('No cases yet').closest('td')!
    expect(Number(cell.getAttribute('colspan') ?? cell.getAttribute('aria-colspan'))).toBe(interactive ? 4 : 3)
  })

  it('selects all from the header checkbox; deselecting one makes it indeterminate', async () => {
    function Host() {
      const [keys, setKeys] = useState(new Set<string>())
      return <DataTable caption="Cases" columns={columns} rows={rows} selectionMode="multiple" selectedKeys={keys} onSelectionChange={setKeys} />
    }
    render(<Host />)
    await userEvent.click(screen.getAllByRole('checkbox')[0]!)
    for (const cb of screen.getAllByRole('checkbox').slice(1)) expect(cb).toBeChecked()
    await userEvent.click(screen.getAllByRole('checkbox')[1]!)
    const header = screen.getAllByRole('checkbox')[0] as HTMLInputElement
    expect(header.indeterminate).toBe(true)
  })

  it('navigates to a row href on Enter', async () => {
    const navigate = vi.fn()
    renderWithProvider(
      <DataTable
        caption="Cases"
        columns={columns}
        rows={rows.map((r) => ({ ...r, href: `/cases/${r.id}`, label: String(r.cells.name) }))}
      />,
      { navigate },
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^\/cases\/r\d$/), undefined)
  })

  it('calls onRowAction when a row without href is activated', async () => {
    const onRowAction = vi.fn()
    render(<DataTable caption="Cases" columns={columns} rows={rows} onRowAction={onRowAction} />)
    await userEvent.click(screen.getByText('Boti'))
    expect(onRowAction).toHaveBeenCalledWith('r2')
  })

  it('declares density row heights: compact 36 px, standard 44 px, comfortable 52 px', () => {
    const css = cssOf('components/data-table/DataTable.css')
    expect(css).toMatch(/--ty-table-row-compact:\s*36px/)
    expect(css).toMatch(/--ty-table-row-standard:\s*44px/)
    expect(css).toMatch(/--ty-table-row-comfortable:\s*52px/)
    expect(css).toMatch(/\[data-density='compact'\]\s*\{[^}]*--ty-table-row:\s*var\(--ty-table-row-compact\)/)
    expect(css).toMatch(/\[data-density='comfortable'\]\s*\{[^}]*--ty-table-row:\s*var\(--ty-table-row-comfortable\)/)
    expect(css).toMatch(/\.ty-table__cell\s*\{[^}]*block-size:\s*var\(--ty-table-row\)/)
  })

  it('keeps the first column visible while scrolling horizontally', () => {
    const { container } = render(<DataTable caption="Cases" columns={columns} rows={rows} />)
    expect(container.querySelector('.ty-table-wrap')).toHaveAttribute('data-sticky-first', 'true')
    expect(cssOf('components/data-table/DataTable.css')).toMatch(
      /\[data-sticky-first\] \.ty-table__row > :first-child\s*\{[^}]*position:\s*sticky[^}]*inset-inline-start:\s*0/,
    )
  })

  it('keeps boundaries visible in forced colours and stops motion when reduced', () => {
    const css = cssOf('components/data-table/DataTable.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('has no axe violations in static and interactive modes', async () => {
    const { container } = render(
      <>
        <DataTable caption="Static" columns={columns} rows={rows} sortColumn="name" sortDirection="ascending" />
        <DataTable caption="Selectable" columns={columns} rows={rows} selectionMode="multiple" />
        <DataTable caption="Empty" columns={columns} rows={[]} />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('DataTable in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<DataTable caption="الحالات" columns={[{ id: 'name', header: 'الحالة' }, { id: 'stage', header: 'المرحلة', numeric: true }]} rows={[{ id: 'a', cells: { name: 'تم', stage: '4' }, label: 'تم' }]} />)
    expect(rtlDom.screen.getByRole('table', { name: 'الحالات' })).toBeInTheDocument()
    expect(container.querySelector('[data-align="end"]')).not.toBeNull()
    await axeRtl(container)
  })
})
