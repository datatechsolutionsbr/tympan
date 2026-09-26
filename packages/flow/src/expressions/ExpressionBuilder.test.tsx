import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { ExpressionCatalogProvider } from './catalogContext'
import { exampleExpressionCatalog } from './exampleCatalog'
import { ExpressionBuilder, type ExpressionBuilderProps } from './ExpressionBuilder'
import type { ExpressionNode } from './model'

function Harness({ initial, onChange, ...rest }: Partial<ExpressionBuilderProps> & { initial?: ExpressionNode; onChange?: (n: ExpressionNode) => void }) {
  const [value, setValue] = useState<ExpressionNode | undefined>(initial)
  return (
    <ExpressionCatalogProvider catalog={exampleExpressionCatalog}>
      <ExpressionBuilder
        {...rest}
        value={value}
        onChange={(n) => {
          setValue(n)
          onChange?.(n)
        }}
      />
    </ExpressionCatalogProvider>
  )
}

async function choose(label: RegExp, option: RegExp) {
  await userEvent.click(screen.getAllByRole('button', { name: label })[0]!)
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }))
}

describe('ExpressionBuilder', () => {
  it('seeds the picked operation with its starter operands', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await choose(/Operation$/, /^sum$/)
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'sum', list: { value: null } })
  })

  it("picks family B's first operation when the family changes", async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ operation: 'count', list: { value: null } }} onChange={onChange} />)
    await choose(/Family$/, /^Text$/)
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'concat', parts: [] })
  })

  it('turns an operand into a reference to the first available reference', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ operation: 'count', list: { value: null } }} references={['census.cases', 'inputs']} onChange={onChange} />)
    const slot = screen.getByRole('group', { name: 'list, level 2' })
    await userEvent.click(within(slot).getByRole('radio', { name: 'Reference' }))
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'count', list: { ref: 'census.cases' } })
    expect(within(slot).getByRole('button', { name: 'census.cases' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers only boolean-yielding operations in predicate mode', async () => {
    render(<Harness mode="predicate" />)
    await userEvent.click(screen.getByRole('button', { name: /Family$/ }))
    const families = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
    expect(families).toEqual(['Logic', 'Pattern matching'])
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: /Operation$/ }))
    const ops = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
    expect(ops).toEqual(['compare', 'and', 'or', 'not', 'is_empty', 'in'])
  })

  it('removes a list item and moves focus to the next item', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ operation: 'union', lists: [{ value: 1 }, { value: 2 }] }} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove item 1' }))
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'union', lists: [{ value: 2 }] })
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(document.activeElement).toHaveAttribute('type', 'radio')
    await userEvent.click(screen.getByRole('button', { name: 'Remove item 1' }))
    expect(screen.getByRole('button', { name: 'Add item' })).toHaveFocus()
  })

  it('shows a caution and a raw slot at the depth limit', () => {
    render(<Harness initial={{ operation: 'not', condition: { operation: 'not', condition: { value: true } } }} maxDepth={1} />)
    expect(screen.getByText(/Deepest nesting level reached/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Structured value' })).toHaveValue(JSON.stringify({ operation: 'not', condition: { value: true } }, null, 2))
  })

  it('warns about an operation the catalog does not list and keeps its operands editable', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ operation: 'legacy_round', digits: 2 }} onChange={onChange} />)
    expect(screen.getByText(/does not list the operation legacy_round/)).toBeInTheDocument()
    const digits = screen.getByRole('textbox', { name: 'digits' })
    await userEvent.clear(digits)
    await userEvent.type(digits, '3')
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'legacy_round', digits: 3 })
  })

  it("offers accumulator, item and index as chips inside a fold's body", async () => {
    render(<Harness initial={{ operation: 'fold', list: { ref: 'cases' }, initial: { value: 0 }, body: { ref: 'accumulator' } }} references={['cases']} />)
    const body = screen.getByRole('group', { name: 'body, level 2' })
    const chips = within(within(body).getByRole('group', { name: 'Available references' })).getAllByRole('button').map((b) => b.textContent)
    expect(chips).toEqual(['accumulator', 'item', 'index', 'cases'])
    expect(within(body).getByText(/accumulator, item, index refer to the element/)).toBeInTheDocument()
  })

  it('shows the arithmetic kinds as first-class verbs', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await choose(/Family$/, /^Arithmetic$/)
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'arithmetic', op: 'add', left: { value: null }, right: { value: null } })
    await choose(/Operation$/, /^subtract$/)
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'arithmetic', op: 'subtract', left: { value: null }, right: { value: null } })
  })

  it('reads a literal as structured data when it parses', async () => {
    const onChange = vi.fn()
    render(<Harness initial={{ operation: 'identity', value: { value: '' } }} onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox', { name: /^Value/ }), '42')
    expect(onChange).toHaveBeenLastCalledWith({ operation: 'identity', value: { value: 42 } })
  })

  it('says it is loading when no catalog is available', () => {
    render(
      <ExpressionCatalogProvider loading>
        <ExpressionBuilder value={undefined} onChange={() => {}} />
      </ExpressionCatalogProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading operations')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Harness initial={{ operation: 'compare', op: 'eq', left: { ref: 'x' }, right: { value: 3 } }} references={['x']} />)
    await expectNoAxeViolations(container)
  })

  it('uses built-in pt-BR strings and renders right to left in Arabic', () => {
    const { unmount } = render(
      <TympanProvider locale="pt-BR">
        <Harness initial={{ operation: 'union', lists: [{ value: 1 }] }} />
      </TympanProvider>,
    )
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar item' })).toBeInTheDocument()
    unmount()
    render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <Harness initial={{ operation: 'count', list: { ref: 'cases' } }} references={['cases']} />
        </div>
      </TympanProvider>,
    )
    expect(screen.getByText('cases', { selector: 'code' })).toHaveAttribute('dir', 'ltr')
  })

  it('indents with logical properties, keeps 44 px targets and shows depth without colour', () => {
    const css = cssOf('expressions/expressions.css')
    expect(css).toMatch(/\.ty-expr__nested\s*\{[^}]*padding-inline-start/)
    expect(css).toMatch(/\.ty-expr__nested\s*\{[^}]*border-inline-start/)
    expect(css).not.toMatch(/(margin|padding|border)-(left|right)\b/)
    expect(css).toMatch(/\.ty-expr__chip\s*\{[^}]*min-block-size:\s*44px/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })
})
