// Behaviour of the custom elements and their React wrappers: accessibility,
// keyboard, form participation, theming and right-to-left.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElements } from '../../src/elements'
import { TyButton, TySwitch, TyThemePalette } from '../../src/elements/react'
import { THEMES, match, readStored, sections } from '../../src/elements/theme-palette/model'
import { expectNoAxeViolations } from '../axe'

defineTympanElements()

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('data-ty-theme')
  document.documentElement.removeAttribute('data-ty-mode')
  document.documentElement.removeAttribute('data-ty-density')
  document.documentElement.removeAttribute('dir')
  localStorage.clear()
})

describe('<ty-button>', () => {
  it('is a native button with its variant attributes, named by its label', async () => {
    html('<ty-button variant="primary">Save</ty-button>')
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveClass('ty-button')
    expect(button).toHaveAttribute('data-variant', 'primary')
    await expectNoAxeViolations(document.body, ["region"])
  })

  it('follows attribute changes from plain HTML (variant, busy)', () => {
    const host = html('<ty-button>Save</ty-button>').querySelector('ty-button') as HTMLElement & { variant: string; busy: boolean }
    host.variant = 'danger'
    host.busy = true
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('data-variant', 'danger')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('.ty-button__busy')).not.toBeNull()
    host.busy = false
    expect(button.querySelector('.ty-button__busy')).toBeNull()
  })

  it('submits its form natively with its name and value, and not while busy', async () => {
    const container = html('<form><ty-button type="submit" name="intent" value="publish">Publish</ty-button></form>')
    const form = container.querySelector('form')!
    const submitted = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
      return new FormData(form, event.submitter).get('intent')
    })
    form.addEventListener("submit", submitted as unknown as EventListener)
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(submitted).toHaveBeenCalledTimes(1)
    expect(submitted.mock.results[0]!.value).toBe('publish')
    ;(form.querySelector('ty-button') as HTMLElement).setAttribute('busy', '')
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(submitted).toHaveBeenCalledTimes(1)
  })

  it('is operated with the keyboard (Tab, Enter, Space)', async () => {
    const onClick = vi.fn()
    render(<TyButton onClick={onClick}>Run</TyButton>)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Run' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('React wrapper: an icon-only button is named by accessibleLabel and does not click while busy', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<TyButton iconOnly accessibleLabel="Close" onClick={onClick} icon="×" />)
    const button = screen.getByRole('button', { name: 'Close' })
    expect(button).toHaveAttribute('title', 'Close')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<TyButton iconOnly accessibleLabel="Close" onClick={onClick} icon="×" busy />)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(document.body, ["region"])
  })
})

describe('<ty-switch>', () => {
  it('is a labelled switch that toggles with a click, Space and Enter, and reflects its state', async () => {
    const host = html('<ty-switch name="autosave">Autosave<span slot="description">Every change</span></ty-switch>').querySelector('ty-switch')!
    const control = screen.getByRole('switch', { name: 'Autosave' })
    expect(control).toHaveAccessibleDescription('Every change')
    expect(control).not.toBeChecked()
    await userEvent.click(control)
    expect(control).toBeChecked()
    expect(host).toHaveAttribute('checked')
    expect(host.querySelector('.ty-switch')).toHaveAttribute('data-selected')
    control.focus()
    await userEvent.keyboard('{Enter}')
    expect(control).not.toBeChecked()
    expect(host.querySelector('.ty-switch')).not.toHaveAttribute('data-selected')
    await expectNoAxeViolations(document.body, ["region"])
  })

  it('takes part in its form: submitted while on, restored by a reset', async () => {
    const container = html('<form><ty-switch name="autosave" value="yes">Autosave</ty-switch><button type="reset">Reset</button></form>')
    const form = container.querySelector('form')!
    const control = screen.getByRole('switch', { name: 'Autosave' })
    expect(new FormData(form).get('autosave')).toBeNull()
    await userEvent.click(control)
    expect(new FormData(form).get('autosave')).toBe('yes')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await act(() => new Promise((r) => setTimeout(r, 0)))
    expect(control).not.toBeChecked()
    expect(container.querySelector('ty-switch')).not.toHaveAttribute('checked')
  })

  it('cannot be changed while read-only or disabled', async () => {
    html('<ty-switch read-only checked>Managed</ty-switch><ty-switch disabled>Off</ty-switch>')
    const managed = screen.getByRole('switch', { name: 'Managed' })
    await userEvent.click(managed)
    managed.focus()
    await userEvent.keyboard('{Enter}')
    expect(managed).toBeChecked()
    expect(managed).toHaveAttribute('aria-readonly', 'true')
    expect(screen.getByRole('switch', { name: 'Off' })).toBeDisabled()
  })

  it('React wrapper: controlled, reports the new state', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<TySwitch checked={false} onChange={onChange}>Dark mode</TySwitch>)
    await userEvent.click(screen.getByRole('switch', { name: 'Dark mode' }))
    expect(onChange).toHaveBeenCalledWith({ checked: true }, expect.anything())
    rerender(<TySwitch checked onChange={onChange}>Dark mode</TySwitch>)
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked()
  })

  it('mirrors in right-to-left text: the selected thumb travels towards the inline start', () => {
    const css = readFileSync(join(__dirname, '../../src/components/switch/Switch.css'), 'utf8')
    expect(css).toMatch(/\[data-selected\] \.ty-switch__thumb:dir\(rtl\)/)
    const native = readFileSync(join(__dirname, '../../src/native-states.css'), 'utf8')
    expect(native).toMatch(/input:checked\) \.ty-switch__thumb:dir\(rtl\)/)
  })
})

describe('<ty-theme-palette>', () => {
  beforeEach(() => localStorage.clear())

  it('applies the stored choice, else the defaults, when told to', () => {
    localStorage.setItem('app-theme', JSON.stringify({ theme: 'neutral', mode: 'dark' }))
    html('<ty-theme-palette apply storage-key="app-theme" default-theme="astrlabe"></ty-theme-palette>')
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'neutral')
    expect(document.documentElement).toHaveAttribute('data-ty-mode', 'dark')
    expect(document.documentElement).toHaveAttribute('data-ty-density', 'default')
    localStorage.clear()
    const second = html('<ty-theme-palette apply storage-key="other" default-theme="astrlabe"></ty-theme-palette>').firstElementChild!
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'astrlabe')
    // A new organization default applies while nothing is stored.
    second.setAttribute('default-theme', 'high-contrast')
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'high-contrast')
  })

  it('is a labelled combobox over a listbox, driven by the keyboard, that applies and stores the choice', async () => {
    const changes: unknown[] = []
    const container = html('<ty-theme-palette storage-key="app-theme" print-stylesheet="/tympan/print-themes.css"></ty-theme-palette>')
    const palette = container.firstElementChild!
    palette.addEventListener('ty-theme-change', (e) => changes.push((e as CustomEvent).detail))
    palette.setAttribute('open', '')
    const field = screen.getByRole('combobox', { name: 'Appearance' })
    expect(field).toHaveFocus()
    expect(screen.getByRole('listbox', { name: 'Appearance' })).toBeInTheDocument()
    await userEvent.type(field, 'bauh')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(field).toHaveAttribute('aria-activedescendant', options[0]!.id)
    await userEvent.keyboard('{Enter}')
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'print-bauhaus')
    expect(document.getElementById('ty-print-themes')).toHaveAttribute('href', '/tympan/print-themes.css')
    expect(readStored(localStorage, 'app-theme').theme).toBe('print-bauhaus')
    expect(changes).toEqual([{ theme: 'print-bauhaus', mode: 'system', density: 'default' }])
    expect(palette).not.toHaveAttribute('open')
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('moves with the arrow keys, Home and End, and closes on Escape', async () => {
    const onClose = vi.fn()
    const container = html('<ty-theme-palette open themes="astrlabe,tympan"></ty-theme-palette>')
    const palette = container.firstElementChild!
    palette.addEventListener('ty-close', onClose)
    const field = screen.getByRole('combobox')
    const active = () => document.getElementById(field.getAttribute('aria-activedescendant')!)!.textContent
    expect(active()).toContain('Tympan')
    await userEvent.keyboard('{ArrowDown}')
    expect(active()).toContain('Astrlabe')
    await userEvent.keyboard('{End}')
    expect(active()).toContain('Comfortable')
    await userEvent.keyboard('{Home}')
    expect(active()).toContain('Tympan')
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('has no accessibility violations while open', async () => {
    html('<ty-theme-palette open themes="astrlabe"></ty-theme-palette>')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('translates through attributes (group, mode and theme names)', () => {
    const labels = JSON.stringify({ astrlabe: 'Astrolábio' })
    html(`<ty-theme-palette open label="Aparência" group-mode="Modo" mode-dark="Escuro" theme-labels='${labels}'></ty-theme-palette>`)
    expect(screen.getByRole('combobox', { name: 'Aparência' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Modo' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Escuro/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Astrolábio/ })).toBeInTheDocument()
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-theme-palette open themes="astrlabe,tympan"></ty-theme-palette>')
    const field = screen.getByRole('combobox')
    await userEvent.keyboard('{ArrowDown}')
    expect(document.getElementById(field.getAttribute('aria-activedescendant')!)!.textContent).toContain('Astrlabe')
  })

  it('React wrapper: reports the choice and the close', async () => {
    const onThemeChange = vi.fn()
    const onClose = vi.fn()
    render(<TyThemePalette open storageKey="react-theme" themes="neutral" onThemeChange={onThemeChange} onClose={onClose} />)
    await userEvent.click(screen.getByRole('option', { name: /Neutral/ }))
    expect(onThemeChange).toHaveBeenCalledWith({ theme: 'neutral', mode: 'system', density: 'default' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('model: every theme is offered, filtering is accent and case blind', () => {
    expect(THEMES).toHaveLength(44)
    expect(match('Gráficos de exposição', 'grafi')).toEqual([0, 1, 2, 3, 4])
    const found = sections('', { theme: 'astrlabe', mode: 'system', density: 'default' }, {
      groups: { preset: 'T', print: 'P', mode: 'M', density: 'D' },
      modes: { system: 'S', light: 'L', dark: 'K' },
      densities: { compact: 'C', default: 'D', comfortable: 'F' },
      themes: {},
    })
    expect(found.map((s) => s.rows.length)).toEqual([5, 39, 3, 3])
    expect(found[0]!.rows.find((r) => r.value === 'astrlabe')!.current).toBe(true)
  })
})
