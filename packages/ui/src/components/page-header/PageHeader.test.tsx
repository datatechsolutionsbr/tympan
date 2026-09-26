import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarDays, FileText } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { renderWithProvider } from '../../../test/render'
import { Button } from '../button/Button'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders one h1 with the title', () => {
    render(<PageHeader title="Sources" />)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Sources')
  })

  it('uses the requested level with the section scale', () => {
    const { container } = render(<PageHeader title="Members" headingLevel={2} scale="section" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Members' })).toBeInTheDocument()
    expect(container.querySelector('.fk-page-header')).toHaveAttribute('data-scale', 'section')
  })

  it('renders eyebrow, title, summary and meta in that order', () => {
    const { container } = render(
      <PageHeader
        eyebrow="Census"
        title="Overview"
        summary="Where the research stands."
        meta={[
          { icon: CalendarDays, text: '20 Sep 2026' },
          { icon: FileText, text: '94 records' },
        ]}
      />,
    )
    const text = container.querySelector('.fk-page-header__text')!
    const order = [...text.children].map((c) => c.className.split(' ')[0])
    expect(order).toEqual(['fk-page-header__eyebrow', 'fk-page-header__title', 'fk-page-header__summary', 'fk-page-header__meta'])
    expect(screen.getByText('94 records')).toBeInTheDocument()
    expect(container.querySelector('.fk-page-header__meta svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('places the breadcrumb navigation before the title in DOM order', () => {
    renderWithProvider(
      <PageHeader
        title="Sources"
        breadcrumbs={[
          { label: 'EACH/USP', href: '/org' },
          { label: 'Census', href: '/org/census' },
          { label: 'Sources', href: '/org/census/sources' },
        ]}
      />,
      { navigate: vi.fn() },
    )
    const nav = screen.getByRole('navigation')
    const heading = screen.getByRole('heading', { level: 1 })
    expect(nav.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders an editable title named by its label', async () => {
    const onChange = vi.fn()
    function Host() {
      const [value, setValue] = useState('Draft')
      return (
        <PageHeader
          title="Draft"
          editableTitle={{
            value,
            onChange: (v) => {
              setValue(v)
              onChange(v)
            },
            placeholder: 'Untitled analysis',
            label: 'Analysis name',
          }}
        />
      )
    }
    render(<Host />)
    const input = screen.getByRole('textbox', { name: 'Analysis name' })
    await userEvent.type(input, 's')
    expect(onChange).toHaveBeenLastCalledWith('Drafts')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('puts actions after the title in tab order and below the summary on narrow screens', async () => {
    setViewportWidth(375)
    const { container } = render(
      <PageHeader title="Sources" summary="Where the evidence comes from." actions={<Button variant="primary">New session</Button>} />,
    )
    expect(container.querySelector('.fk-page-header')).toHaveAttribute('data-layout', 'stacked')
    const summary = screen.getByText('Where the evidence comes from.')
    const action = screen.getByRole('button', { name: 'New session' })
    expect(summary.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const narrow = mediaBlock(cssOf('components/page-header/PageHeader.css'), /\(max-width:\s*639\.98px\)/)
    expect(narrow).toMatch(/\.fk-page-header__actions\s*\{[^}]*flex-basis:\s*100%/)
    expect(narrow).toMatch(/min-block-size:\s*var\(--fk-control-target\)/)
  })

  it('has no axe violations', async () => {
    const { container } = renderWithProvider(
      <main>
        <PageHeader
          eyebrow="Census"
          title="Catalogue"
          summary="94 records in the frozen edition."
          breadcrumbs={[
            { label: 'Census', href: '/c' },
            { label: 'Catalogue', href: '/c/cat' },
          ]}
          meta={[{ text: 'edition 2026-09-20' }]}
          actions={<Button>Export CSV</Button>}
        />
      </main>,
      { navigate: vi.fn() },
    )
    await expectNoAxeViolations(container)
  })
})
