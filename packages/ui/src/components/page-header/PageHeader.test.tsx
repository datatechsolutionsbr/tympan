import { I18nProvider } from 'react-aria-components'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarDays, FileText } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { renderWithProvider } from '../../../test/render'
import { ThemeScope } from '../../internal/ThemeScope'
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
    expect(container.querySelector('.ty-page-header')).toHaveAttribute('data-scale', 'section')
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
    const text = container.querySelector('.ty-page-header__text')!
    const order = [...text.children].map((c) => c.className.split(' ')[0])
    expect(order).toEqual(['ty-page-header__eyebrow', 'ty-page-header__title', 'ty-page-header__summary', 'ty-page-header__meta'])
    expect(screen.getByText('94 records')).toBeInTheDocument()
    expect(container.querySelector('.ty-page-header__meta svg')).toHaveAttribute('aria-hidden', 'true')
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
    expect(container.querySelector('.ty-page-header')).toHaveAttribute('data-layout', 'stacked')
    const summary = screen.getByText('Where the evidence comes from.')
    const action = screen.getByRole('button', { name: 'New session' })
    expect(summary.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const narrow = mediaBlock(cssOf('components/page-header/PageHeader.css'), /\(max-width:\s*639\.98px\)/)
    expect(narrow).toMatch(/\.ty-page-header__actions\s*\{[^}]*flex-basis:\s*100%/)
    expect(narrow).toMatch(/min-block-size:\s*var\(--ty-control-target\)/)
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
  describe('editorial variant', () => {
    const trail = [
      { label: 'EACH/USP', href: '/org' },
      { label: 'Census', href: '/org/census' },
      { label: 'Overview' },
    ]

    it('puts a mono trail before the h1, with the last level current and not a link', () => {
      const { container } = renderWithProvider(<PageHeader variant="editorial" title="Overview" trail={trail} />, { navigate: vi.fn() })
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
      const heading = screen.getByRole('heading', { level: 1, name: 'Overview' })
      expect(nav.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(within(nav).getAllByRole('link')).toHaveLength(2)
      expect(within(nav).getByText('Overview')).toHaveAttribute('aria-current', 'page')
      expect(container.querySelector('.ty-page-header')).toHaveAttribute('data-divider')
      expect(cssOf('components/page-header/PageHeader.css')).toMatch(/\.ty-page-header__trail-list\s*\{[^}]*font-family:\s*var\(--ty-font-mono\)/)
    })

    it('renders the lead after the title, limited to 68ch', () => {
      render(<PageHeader variant="editorial" title="Overview" lead="Where the research stands and what is left to prove." />)
      const lead = screen.getByText('Where the research stands and what is left to prove.')
      expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(cssOf('components/page-header/PageHeader.css')).toMatch(/\.ty-page-header__lead\s*\{[^}]*max-inline-size:\s*68ch/)
    })

    it('puts actions after the title and can drop the divider', () => {
      const { container } = render(<PageHeader variant="editorial" title="Overview" divider={false} actions={<Button variant="primary">Verify 12</Button>} />)
      const action = screen.getByRole('button', { name: 'Verify 12' })
      expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(container.querySelector('.ty-page-header')).not.toHaveAttribute('data-divider')
    })

    it('has no axe violations, light and dark', async () => {
      const { container } = renderWithProvider(
        <>
          {(['light', 'dark'] as const).map((scheme) => (
            <ThemeScope key={scheme} scheme={scheme}>
              <PageHeader variant="editorial" headingLevel={scheme === 'light' ? 1 : 2} title="Overview" trail={trail} lead="Lead." actions={<Button>Export</Button>} />
            </ThemeScope>
          ))}
        </>,
        { navigate: vi.fn() },
      )
      await expectNoAxeViolations(container, ['landmark-unique'])
    })
  })
})

describe('PageHeader in right-to-left', () => {
  it('keeps trail order and passes axe under dir="rtl"', async () => {
    const { container } = renderWithProvider(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <PageHeader variant="editorial" title="نظرة عامة" trail={[{ label: 'EACH/USP', href: '/o' }, { label: 'نظرة عامة' }]} lead="سجل عالمي." />
        </div>
      </I18nProvider>,
      { navigate: vi.fn() },
    )
    expect(screen.getByRole('heading', { level: 1, name: 'نظرة عامة' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})
