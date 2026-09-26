import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { NavigationFlyout, type FlyoutDestination, type NavigationFlyoutProps } from './NavigationFlyout'

const names = ['Overview', 'Sources', 'Instruments', 'Verification', 'Base', 'Atlas', 'Analyses', 'Editions']
const destinations: FlyoutDestination[] = names.map((label, i) => ({
  id: label.toLowerCase(),
  label,
  subtitle: i === 5 ? 'Map of sources' : undefined,
  href: i === 0 ? '/' : `/${label.toLowerCase()}`,
  icon: <BookOpen />,
}))

function Harness(over: Partial<NavigationFlyoutProps>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <NavigationFlyout open={open} onOpenChange={setOpen} destinations={destinations} currentPath="/sources/12" {...over} />
    </>
  )
}

const quick = () => ({ theme: 'light' as const, onThemeChange: vi.fn(), onProfile: vi.fn(), onSignOut: vi.fn(), onNotifications: vi.fn(), unseenCount: 4 })

describe('NavigationFlyout', () => {
  it('filters by label or subtitle and announces the count', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.keyboard('sou')
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Sources', 'AtlasMap of sources'])
    expect(screen.getByRole('status')).toHaveTextContent('2 destinations')
  })

  it('shows the no-results line', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.keyboard('zzz')
    expect(screen.getByText('No destination matches this search.')).toBeInTheDocument()
  })

  it('marks the destination containing the current path', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('link', { name: 'Sources' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('runs a destination onPress without navigating', async () => {
    const onPress = vi.fn()
    const onNavigate = vi.fn()
    render(<Harness destinations={[{ ...destinations[1]!, onPress }]} onNavigate={onNavigate} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('link', { name: 'Sources' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('closes and then signs out', async () => {
    const qa = quick()
    render(<Harness quickActions={qa} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(qa.onSignOut).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('switches the theme and stays open', async () => {
    const qa = quick()
    render(<Harness quickActions={qa} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Dark theme' }))
    expect(qa.onThemeChange).toHaveBeenCalledWith('dark')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the opener', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(opener)
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('has no axe violations when open', async () => {
    render(<Harness quickActions={quick()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await expectNoAxeViolations(document.body)
  })
})
