import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FakhirProvider } from '@fakhir/design-system'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { convertFilterValue, DataSourceNodeForm, parseListValue, type DataSourceNodeFormProps } from './DataSourceNodeForm'

const sources = [
  { id: 'census', name: 'Census edition', dialect: 'PostgreSQL' },
  { id: 'sheets', name: 'Coding sheets', dialect: 'SQLite' },
]
const columns = [
  { name: 'record_id', type: 'text' },
  { name: 'uf', type: 'text' },
  { name: 'stage', type: 'integer' },
]

function setup(extra: Partial<DataSourceNodeFormProps> = {}) {
  const props: DataSourceNodeFormProps = {
    open: true,
    value: { sourceId: 'census', dialect: 'PostgreSQL', table: 'records', columns: ['uf'], filters: [{ column: 'uf', operator: 'eq', value: 'SP' }], outputVariable: 'rows', limit: 100 },
    sources,
    loadTables: vi.fn(() => Promise.resolve(['records', 'assertions'])),
    loadColumns: vi.fn(() => Promise.resolve(columns)),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...extra,
  }
  const view = render(<DataSourceNodeForm {...props} />)
  return { props, ...view }
}

describe('DataSourceNodeForm', () => {
  it('clears table, columns and filters and shows Table when another connection is picked', async () => {
    const { props } = setup()
    await userEvent.click(screen.getByRole('tab', { name: 'Connection' }))
    await userEvent.click(screen.getByRole('radio', { name: /Coding sheets/ }))
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(props.loadTables).toHaveBeenLastCalledWith('sheets'))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await userEvent.click(screen.getByRole('tab', { name: 'Filters' }))
    expect(screen.queryByRole('group', { name: 'Filter 1' })).toBeNull()
  })

  it('selects all columns and then offers clear all', async () => {
    setup()
    await screen.findByRole('checkbox', { name: /record_id/ })
    await userEvent.click(screen.getByRole('button', { name: 'Select all' }))
    for (const c of columns) expect(screen.getByRole('checkbox', { name: new RegExp(c.name) })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument()
    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument()
  })

  it('wraps a single value when switching to member of list, keeps the first when switching away', () => {
    expect(convertFilterValue('SP', 'in')).toEqual(['SP'])
    expect(convertFilterValue(['SP', 'RJ'], 'eq')).toBe('SP')
  })

  it('stores member-of-list text as a trimmed list', async () => {
    expect(parseListValue('SP, RJ ,')).toEqual(['SP', 'RJ'])
    const { props } = setup()
    await screen.findByRole('checkbox', { name: /uf/ })
    await userEvent.click(screen.getByRole('tab', { name: 'Filters' }))
    const row = screen.getByRole('group', { name: 'Filter 1' })
    await userEvent.selectOptions(within(row).getByRole('combobox', { name: 'Operator' }), 'in')
    const field = within(row).getByRole('textbox', { name: 'Value' })
    await userEvent.clear(field)
    await userEvent.type(field, 'SP, RJ ,')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ filters: [{ column: 'uf', operator: 'in', value: ['SP', 'RJ'] }] }))
  })

  it('disables save without a selected column', async () => {
    setup({ value: { sourceId: 'census', table: 'records', columns: [] } })
    await screen.findByRole('checkbox', { name: /uf/ })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('converts a legacy variable map into equals filters and drops the legacy key on save', async () => {
    const { props } = setup({ value: { sourceId: 'census', table: 'records', columns: ['uf'], filterMap: { state: 'uf' } } })
    await screen.findByRole('checkbox', { name: /uf/ })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const saved = (props.onSave as ReturnType<typeof vi.fn>).mock.calls[0]![0]
    expect(saved.filters).toEqual([{ column: 'uf', operator: 'eq', value: '{{state}}' }])
    expect(saved).not.toHaveProperty('filterMap')
  })

  it('in read-only mode has no footer and inputs cannot change', async () => {
    setup({ readOnly: true })
    await screen.findByRole('checkbox', { name: /uf/ })
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(screen.getByRole('checkbox', { name: /stage/ })).toBeDisabled()
    await expectNoAxeViolations(document.body)
  })

  it('works in Arabic (RTL) and names sections in Portuguese', async () => {
    const { rerender } = render(
      <FakhirProvider locale="ar">
        <div dir="rtl">
          <DataSourceNodeForm open value={{}} sources={sources} loadTables={() => Promise.resolve([])} loadColumns={() => Promise.resolve([])} onSave={() => {}} onCancel={() => {}} />
        </div>
      </FakhirProvider>,
    )
    await userEvent.click(screen.getByRole('radio', { name: /Census edition/ }))
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveAttribute('aria-selected', 'true')
    rerender(
      <FakhirProvider locale="pt-BR">
        <DataSourceNodeForm open value={{}} sources={sources} loadTables={() => Promise.resolve([])} loadColumns={() => Promise.resolve([])} onSave={() => {}} onCancel={() => {}} />
      </FakhirProvider>,
    )
    expect(screen.getByRole('tab', { name: 'Conexão' })).toBeInTheDocument()
  })

  it('marks selection with a check, keeps 44 px rows and visible borders in forced colours', () => {
    const css = cssOf('forms/NewForms.css')
    expect(css).toMatch(/\.fk-ds-form__option\s*\{[^}]*min-block-size: 44px/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(css).not.toMatch(/(margin|padding)-(left|right)|[^-]left:|[^-]right:/)
  })
})
