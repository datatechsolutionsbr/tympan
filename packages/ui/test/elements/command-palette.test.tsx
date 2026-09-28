// Behaviour of <ty-command-palette> (spec: wave-2/command-palette.md,
// acceptance tests): matching and marking, ranking, keyboard navigation,
// the actions sub-list, scopes, fallback actions, loading, reopening and
// the recent store.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { commandPaletteDefinition } from '../../src/elements/command-palette/definition'
import { TyCommandPaletteElement } from '../../src/elements/command-palette/element'
import { expectNoAxeViolations } from '../axe'

defineTympanElement(TyCommandPaletteElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('dir')
  localStorage.clear()
})

const groups = [
  {
    id: 'records',
    heading: 'Records',
    items: [
      { id: 'sources', label: 'Sources', hint: '/sources' },
      { id: 'shared', label: 'Shared records catalog' },
      {
        id: 'billing',
        label: 'Billing',
        actions: [
          { id: 'refund', label: 'Issue refund' },
          { id: 'invoice', label: 'Download invoice' },
        ],
      },
    ],
  },
  { id: 'screens', heading: 'Screens', items: [{ id: 'settings', label: 'Settings' }] },
]

/** Mounts the element from plain HTML, with data passed as JSON attributes. */
const mount = (attrs: Record<string, string> = {}, content = groups) => {
  const host = html('<ty-command-palette></ty-command-palette>').querySelector('ty-command-palette')!
  host.setAttribute('groups', JSON.stringify(content))
  for (const [name, value] of Object.entries(attrs)) host.setAttribute(name, value)
  return host
}

const open = (host: Element) => {
  host.setAttribute('open', '')
  return screen.getByRole('combobox', { name: 'Search and commands' })
}

const labels = (options = screen.getAllByRole('option')) => options.map((o) => o.querySelector('.ty-palette__label')!.textContent)

const activeLabel = () => {
  const field = screen.getByRole('combobox', { name: 'Search and commands' })
  return document.getElementById(field.getAttribute('aria-activedescendant')!)!.querySelector('.ty-palette__label')!.textContent
}

describe('<ty-command-palette>', () => {
  it('is registered from its definition', () => {
    expect(commandPaletteDefinition.tag).toBe('ty-command-palette')
    expect(commandPaletteDefinition.name).toBe('TyCommandPalette')
    expect(commandPaletteDefinition.kind).toBe('self-rendering')
    expect(customElements.get('ty-command-palette')).toBe(TyCommandPaletteElement)
  })

  it('renders nothing while closed; open, a combobox over every item under its group heading', async () => {
    const host = mount()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(host.children).toHaveLength(0)
    const field = open(host)
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: 'Search and commands' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Records' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Screens' })).toBeInTheDocument()
    expect(labels()).toEqual(['Sources', 'Shared records catalog', 'Billing', 'Settings'])
    expect(field).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]!.id)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('filters to the labels holding the query characters in order, marking the matched ones', async () => {
    const field = open(mount())
    await userEvent.type(field, 'src')
    expect(labels()).toEqual(['Sources', 'Shared records catalog'])
    const marks = screen.getAllByRole('option')[0]!.querySelectorAll('mark.ty-palette__mark')
    expect(Array.from(marks).map((m) => m.textContent)).toEqual(['S', 'rc'])
    expect(screen.getByRole('status')).toHaveTextContent('2 results')
  })

  it('ranks a contiguous prefix above a scattered match', async () => {
    const field = open(
      mount({}, [
        {
          id: 'g',
          heading: 'G',
          items: [
            { id: 'scattered', label: 'Shared records' },
            { id: 'prefix', label: 'Src' },
          ],
        },
      ]),
    )
    await userEvent.type(field, 'src')
    expect(labels()).toEqual(['Src', 'Shared records'])
  })

  it('moves the highlight with the arrow keys, Home and End, wrapping at the ends', async () => {
    open(mount())
    expect(activeLabel()).toBe('Sources')
    await userEvent.keyboard('{End}')
    expect(activeLabel()).toBe('Settings')
    await userEvent.keyboard('{ArrowDown}')
    expect(activeLabel()).toBe('Sources')
    await userEvent.keyboard('{ArrowUp}')
    expect(activeLabel()).toBe('Settings')
    await userEvent.keyboard('{Home}')
    expect(activeLabel()).toBe('Sources')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(activeLabel()).toBe('Billing')
  })

  it('Right Arrow opens the actions sub-list and Enter runs the first action, not the primary, closing the dialog', async () => {
    const host = mount()
    const selected: unknown[] = []
    const onClose = vi.fn()
    host.addEventListener('ty-select', (e) => selected.push((e as CustomEvent).detail))
    host.addEventListener('ty-close', onClose)
    const field = open(host)
    await userEvent.type(field, 'billing')
    expect(labels()).toEqual(['Billing'])
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('group', { name: 'Actions for Billing' })).toBeInTheDocument()
    expect(labels()).toEqual(['Issue refund', 'Download invoice'])
    await userEvent.keyboard('{Enter}')
    expect(selected).toEqual([{ id: 'refund', kind: 'action', itemId: 'billing' }])
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(host).not.toHaveAttribute('open')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('Escape steps back: it closes the sub-list before anything else', async () => {
    const host = mount()
    const field = open(host)
    await userEvent.type(field, 'billing')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('group', { name: 'Actions for Billing' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Actions for Billing' })).toBeNull()
    expect(labels()).toEqual(['Billing'])
    expect(screen.getByRole('combobox')).toBe(field)
  })

  it('Escape on an empty query clears the scope and the dialog stays open; the next Escape closes', async () => {
    const scopes = [
      { id: 'records', label: 'Records' },
      { id: 'screens', label: 'Screens' },
    ]
    const host = mount({ scopes: JSON.stringify(scopes), 'active-scope': 'records' })
    const scopeChanges: unknown[] = []
    const onClose = vi.fn()
    host.addEventListener('ty-scope-change', (e) => scopeChanges.push((e as CustomEvent).detail))
    host.addEventListener('ty-close', onClose)
    open(host)
    expect(screen.getByRole('button', { name: 'Remove scope Records' })).toBeInTheDocument()
    expect(labels()).toEqual(['Sources', 'Shared records catalog', 'Billing'])
    await userEvent.keyboard('{Escape}')
    expect(scopeChanges).toEqual([{ scope: '' }])
    expect(host).not.toHaveAttribute('active-scope')
    expect(screen.queryByRole('button', { name: 'Remove scope Records' })).toBeNull()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(labels()).toEqual(['Sources', 'Shared records catalog', 'Billing', 'Settings'])
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('a scope button toggles the scope, clearing the query', async () => {
    const scopes = [
      { id: 'records', label: 'Records' },
      { id: 'screens', label: 'Screens' },
    ]
    const host = mount({ scopes: JSON.stringify(scopes) })
    const field = open(host)
    await userEvent.click(screen.getByRole('button', { name: 'Screens' }))
    expect(host).toHaveAttribute('active-scope', 'screens')
    expect(labels()).toEqual(['Settings'])
    expect(field).toHaveFocus()
    expect(field).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: 'Screens' }))
    expect(host).not.toHaveAttribute('active-scope')
    expect(labels()).toHaveLength(4)
  })

  it('offers fallback actions when nothing matches, {query} replaced, and Enter runs one', async () => {
    const host = mount({ 'fallback-actions': JSON.stringify([{ id: 'create', label: "Create '{query}'" }]) })
    const selected: unknown[] = []
    host.addEventListener('ty-select', (e) => selected.push((e as CustomEvent).detail))
    const field = open(host)
    await userEvent.type(field, 'xyz')
    expect(screen.getByRole('group', { name: 'Other actions' })).toBeInTheDocument()
    expect(labels()).toEqual(["Create 'xyz'"])
    await userEvent.keyboard('{Enter}')
    expect(selected).toEqual([{ id: 'create', kind: 'fallback', itemId: '' }])
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('announces "no results" when nothing matches and there is no fallback', async () => {
    const field = open(mount())
    await userEvent.type(field, 'xyz')
    expect(screen.queryByRole('option')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Nothing matches “xyz”.')
    expect(document.querySelector('.ty-palette__empty')).toHaveTextContent('Nothing matches “xyz”.')
  })

  it('while loading, a status announces the loading label and no results render', async () => {
    const host = mount({ loading: '' })
    open(host)
    expect(screen.getByRole('status')).toHaveTextContent('Loading results')
    expect(screen.queryByRole('option')).toBeNull()
    expect(document.querySelectorAll('.ty-palette__loading .ty-skeleton')).toHaveLength(3)
    expect(document.querySelector('.ty-palette__loading')).toHaveAttribute('aria-hidden', 'true')
    host.removeAttribute('loading')
    expect(labels()).toHaveLength(4)
    expect(document.querySelector('.ty-palette__loading')).toBeNull()
  })

  it('resets the query, the highlight and the sub-list on each open', async () => {
    const host = mount()
    const field = open(host)
    await userEvent.type(field, 'billing')
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard('{Escape}{Escape}')
    expect(screen.queryByRole('combobox')).toBeNull()
    const again = open(host)
    expect(again).toHaveValue('')
    expect(labels()).toEqual(['Sources', 'Shared records catalog', 'Billing', 'Settings'])
    expect(activeLabel()).toBe('Sources')
  })

  it('the recent store shows the most chosen first on an empty query', async () => {
    const content = [
      {
        id: 'g',
        heading: 'G',
        items: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ],
      },
    ]
    const host = mount({ 'recent-key': 'palette-recents' }, content)
    // The recents section and the full list both carry a chosen item, so
    // the clickers take the first match.
    for (let i = 0; i < 3; i++) {
      open(host)
      await userEvent.click(screen.getAllByRole('option', { name: 'Alpha' })[0]!)
    }
    open(host)
    await userEvent.click(screen.getAllByRole('option', { name: 'Beta' })[0]!)
    open(host)
    const recent = screen.getByRole('group', { name: 'Recent' })
    expect(labels(Array.from(recent.querySelectorAll('[role="option"]')))).toEqual(['Alpha', 'Beta'])
    // The full list follows the recents.
    expect(screen.getByRole('group', { name: 'G' })).toBeInTheDocument()
  })

  it('follows attribute changes from plain HTML while open', async () => {
    const host = mount()
    open(host)
    expect(labels()).toHaveLength(4)
    host.setAttribute('groups', JSON.stringify([{ id: 'x', heading: 'X', items: [{ id: 'y', label: 'Yttrium' }] }]))
    expect(labels()).toEqual(['Yttrium'])
    host.setAttribute('label', 'Comandos')
    expect(screen.getByRole('combobox', { name: 'Comandos' })).toBeInTheDocument()
  })

  it('mirrors the inline-axis keys in right-to-left: ArrowLeft opens the sub-list', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const field = open(mount())
    await userEvent.type(field, 'billing')
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('group', { name: 'Actions for Billing' })).toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.queryByRole('group', { name: 'Actions for Billing' })).toBeNull()
  })
})
