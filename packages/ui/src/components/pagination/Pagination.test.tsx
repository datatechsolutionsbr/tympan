import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { Pagination, pageSlots, type PaginationProps } from './Pagination'

import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const base: PaginationProps = { page: 1, pageCount: 10, totalItems: 480, pageSize: 50, onPageChange: () => {} }

function pageNumbers() {
  const list = screen.getByRole('list')
  return Array.from(list.querySelectorAll('li')).map((li) => (li.getAttribute('aria-hidden') ? 'gap' : li.textContent))
}

describe('Pagination', () => {
  it('disables Previous on page 1 and marks it current', () => {
    render(<Pagination {...base} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(pageNumbers()).toEqual(['1', '2', 'gap', '10'])
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows 1, gap, 4, 5, 6, gap, 10 on page 5', () => {
    render(<Pagination {...base} page={5} />)
    expect(pageNumbers()).toEqual(['1', 'gap', '4', '5', '6', 'gap', '10'])
    expect(pageSlots(5, 10, 1)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
  })

  it('disables Next on the last page', () => {
    render(<Pagination {...base} page={3} pageCount={3} totalItems={150} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('requests the activated page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination {...base} page={2} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('requests a page size', async () => {
    const onPageSizeChange = vi.fn()
    render(<Pagination {...base} pageSizeOptions={[25, 50, 100]} pageSize={25} onPageSizeChange={onPageSizeChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Items per page' }), '50')
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('disables every page button while busy', () => {
    render(<Pagination {...base} page={4} busy />)
    const nav = screen.getByRole('navigation', { name: 'Pagination' })
    expect(nav).toHaveAttribute('aria-busy', 'true')
    for (const b of within(nav).getAllByRole('button')) expect(b).toBeDisabled()
  })

  it('renders nothing for one page and no size options', () => {
    const { container } = render(<Pagination {...base} pageCount={1} totalItems={10} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the compact indicator below 640 px', () => {
    setViewportWidth(500)
    render(<Pagination {...base} page={2} />)
    expect(screen.getByText('Page 2 of 10')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument()
  })

  it('exposes the range summary as a polite status', () => {
    render(<Pagination {...base} page={2} />)
    expect(screen.getByRole('status')).toHaveTextContent('51 to 100 of 480')
  })

  it('moves focus to the other arrow when the focused one becomes disabled', async () => {
    const { rerender } = render(<Pagination {...base} page={2} />)
    screen.getByRole('button', { name: 'Previous' }).focus()
    rerender(<Pagination {...base} page={1} />)
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
  })

  it('keeps 44 px hit areas and a forced-colours current page', () => {
    const css = cssOf('components/pagination/Pagination.css')
    expect(css).toMatch(/\.ty-pagination__button::before\s*\{[^}]*max\(100%,\s*var\(--ty-control-target\)\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/border-color:\s*CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(<Pagination {...base} page={5} pageSizeOptions={[25, 50]} />)
    await expectNoAxeViolations(container)
  })
})

describe('Pagination in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Pagination page={2} pageCount={5} totalItems={120} pageSize={25} onPageChange={() => {}} />, { locale: 'ar-EG' })
    // Page numbers use the locale's digits; the previous/next chevrons mirror.
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent('٢')
    const arrows = container.querySelectorAll('[data-arrow] svg')
    for (const a of arrows) expect(a).toHaveClass('ty-mirror-rtl')
    await axeRtl(container)
  })
})
