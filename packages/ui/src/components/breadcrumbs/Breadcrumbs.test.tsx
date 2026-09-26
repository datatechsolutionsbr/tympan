import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { renderWithProvider } from '../../../test/render'
import { Breadcrumbs } from './Breadcrumbs'

const three = [
  { label: 'Organisation', href: '/org' },
  { label: 'Project', href: '/org/project' },
  { label: 'Sources', href: '/org/project/sources' },
]

describe('Breadcrumbs', () => {
  it('renders a named navigation with two links and the current page', () => {
    renderWithProvider(<Breadcrumbs items={three} />, { navigate: vi.fn() })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(nav).getAllByRole('link')).toHaveLength(2)
    const current = within(nav).getByText('Sources')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.closest('a')).toBeNull()
    expect(nav.querySelector('ol')).not.toBeNull()
    nav.querySelectorAll('.fk-breadcrumbs__separator').forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'))
  })

  it('shows only a back link below 640 px in auto mode', () => {
    setViewportWidth(500)
    renderWithProvider(<Breadcrumbs items={three} />, { navigate: vi.fn() })
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Back to Project')
    expect(links[0]).toHaveAttribute('href', '/org/project')
  })

  it('points the compact back link to rootHref when there is one item', () => {
    renderWithProvider(<Breadcrumbs mode="compact" items={[{ label: 'Projects', href: '/projects' }]} rootHref="/" rootLabel="Home" />, {
      navigate: vi.fn(),
    })
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('collapses middle items into an overflow menu', async () => {
    const navigate = vi.fn()
    const five = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C', href: '/c' },
      { label: 'D', href: '/d' },
      { label: 'E', href: '/e' },
    ]
    renderWithProvider(<Breadcrumbs items={five} maxVisible={3} />, { navigate })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(nav).getByRole('link', { name: 'A' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'D' })).toBeInTheDocument()
    expect(within(nav).getByText('E')).toHaveAttribute('aria-current', 'page')
    expect(within(nav).queryByRole('link', { name: 'B' })).not.toBeInTheDocument()
    await userEvent.click(within(nav).getByRole('button', { name: 'Show hidden levels' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'C' }))
    expect(navigate).toHaveBeenCalledWith('/c', undefined)
  })

  it('navigates through the router adapter', async () => {
    const navigate = vi.fn()
    renderWithProvider(<Breadcrumbs items={three} />, { navigate })
    await userEvent.click(screen.getByRole('link', { name: 'Project' }))
    expect(navigate).toHaveBeenCalledWith('/org/project', undefined)
  })

  it('renders a compact bar with title and actions', () => {
    renderWithProvider(<Breadcrumbs mode="compact" items={three} actions={<button type="button">Share</button>} />, { navigate: vi.fn() })
    expect(screen.getByText('Sources')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('keeps full labels for truncation, 44 px touch targets and system colours', () => {
    renderWithProvider(<Breadcrumbs items={three} />, { navigate: vi.fn() })
    expect(screen.getByText('Project')).toHaveAttribute('title', 'Project')
    const css = cssOf('components/breadcrumbs/Breadcrumbs.css')
    expect(mediaBlock(css, /\(max-width:\s*1023\.98px\)/)).toMatch(/var\(--fk-control-target\)/)
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/LinkText/)
    expect(forced).toMatch(/CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = renderWithProvider(<Breadcrumbs items={three} />, { navigate: vi.fn() })
    await expectNoAxeViolations(container)
  })
})
