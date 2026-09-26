import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { CommandPalette, type CommandGroup, type CommandPaletteProps } from './CommandPalette'

function groups(spy: (id: string) => void = () => {}): CommandGroup[] {
  return [
    {
      id: 'screens',
      heading: 'Screens',
      scopeId: 'screens',
      items: [
        { id: 'shared', label: 'Shared outputs', onSelect: () => spy('shared') },
        { id: 'sources', label: 'Sources', hint: '/sources', onSelect: () => spy('sources') },
        { id: 'atlas', label: 'Atlas', onSelect: () => spy('atlas') },
      ],
    },
    {
      id: 'records',
      heading: 'Records',
      scopeId: 'records',
      items: [
        {
          id: 'tamm',
          label: 'TAMM AI Assistant',
          description: 'United Arab Emirates',
          onSelect: () => spy('tamm'),
          actions: [
            { id: 'copy', label: 'Copy link', onSelect: () => spy('copy') },
            { id: 'prov', label: 'Open provenance', onSelect: () => spy('prov') },
          ],
        },
      ],
    },
  ]
}

function Harness(over: Partial<CommandPaletteProps> & { spy?: (id: string) => void }) {
  const [open, setOpen] = useState(true)
  const { spy, ...rest } = over
  return (
    <>
      <button onClick={() => setOpen(true)}>Search</button>
      <CommandPalette open={open} onClose={() => setOpen(false)} groups={groups(spy)} {...rest} />
    </>
  )
}

const options = () => screen.queryAllByRole('option').map((o) => o.textContent)

describe('CommandPalette', () => {
  it('renders nothing closed and every item with headings when open', () => {
    const { rerender } = render(<CommandPalette open={false} onClose={() => {}} groups={groups()} />)
    expect(screen.queryByRole('combobox')).toBeNull()
    rerender(<CommandPalette open onClose={() => {}} groups={groups()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(screen.getByRole('group', { name: 'Screens' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Records' })).toBeInTheDocument()
  })

  it('keeps only in-order matches and marks label characters', async () => {
    render(<Harness />)
    await userEvent.keyboard('src')
    const labels = options()
    expect(labels.some((l) => l?.includes('Sources'))).toBe(true)
    expect(labels.some((l) => l?.includes('Atlas'))).toBe(false)
    const sources = screen.getAllByRole('option').find((o) => o.textContent?.includes('Sources'))!
    expect(Array.from(sources.querySelectorAll('mark')).map((m) => m.textContent).join('')).toBe('Src')
    expect(screen.getByRole('status')).toHaveTextContent(/result/)
  })

  it('ranks a contiguous prefix first', async () => {
    render(<Harness />)
    await userEvent.keyboard('sou')
    const screensGroup = screen.getByRole('group', { name: 'Screens' })
    expect(within(screensGroup).getAllByRole('option')[0]).toHaveTextContent('Sources')
  })

  it('wraps the highlight from the last row to the first', async () => {
    render(<Harness />)
    const input = screen.getByRole('combobox')
    await userEvent.keyboard('{End}')
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option').at(-1)!.id)
    await userEvent.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0]!.id)
  })

  it('runs the first secondary action with Right Arrow then Enter, not the primary', async () => {
    const spy = vi.fn()
    render(<Harness spy={spy} />)
    await userEvent.keyboard('tamm')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('group', { name: 'Actions for TAMM AI Assistant' })).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(spy).toHaveBeenCalledWith('copy')
    expect(spy).not.toHaveBeenCalledWith('tamm')
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
  })

  it('clears an active scope with Escape and stays open', async () => {
    render(<Harness scopes={[{ id: 'screens', label: 'Screens' }, { id: 'records', label: 'Records' }]} />)
    await userEvent.keyboard('{Tab}')
    expect(screen.getByRole('button', { name: 'Remove scope Screens' })).toBeInTheDocument()
    expect(options()).toHaveLength(3)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Remove scope Screens' })).toBeNull()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    await userEvent.keyboard('rec{Tab}')
    expect(screen.getByRole('button', { name: 'Remove scope Records' })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('')
    await userEvent.keyboard('{Backspace}')
    expect(screen.queryByRole('button', { name: /Remove scope/ })).toBeNull()
  })

  it('offers the fallback with the query and runs it on Enter', async () => {
    const create = vi.fn()
    render(<Harness fallbackActions={[{ id: 'new', label: "Create '{query}'", onSelect: create }]} />)
    await userEvent.keyboard('xyz')
    expect(screen.getByRole('option', { name: "Create 'xyz'" })).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('shows a loading status and no results while loading', () => {
    render(<CommandPalette open onClose={() => {}} groups={groups()} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading results')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('reopens with an empty query and closes on Escape back to the opener', async () => {
    render(<Harness />)
    await userEvent.keyboard('atl')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('orders recent choices by count then recency', async () => {
    window.localStorage.removeItem('fk-palette-test')
    const spy = vi.fn()
    render(<Harness spy={spy} recent={{ storageKey: 'fk-palette-test' }} />)
    const choose = async (text: string) => {
      await userEvent.click(screen.getByRole('button', { name: 'Search' }))
      await userEvent.keyboard(text)
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
    }
    await userEvent.keyboard('{Escape}')
    await choose('atlas')
    await choose('atlas')
    await choose('shared')
    await choose('atlas')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    const recent = within(screen.getByRole('group', { name: 'Recent' })).getAllByRole('option')
    expect(recent.map((o) => o.textContent)).toEqual(['Atlas', 'Shared outputs'])
  })

  it('has no axe violations', async () => {
    render(<Harness scopes={[{ id: 'screens', label: 'Screens' }]} />)
    await expectNoAxeViolations(document.body)
  })
})
