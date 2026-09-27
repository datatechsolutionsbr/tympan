import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../internal/theme'
import { fuzzyScore, ThemePaletteTrigger, themePaletteGroups } from './ThemePalette'

const theme = () => document.documentElement.getAttribute('data-ty-theme')

function setup() {
  localStorage.clear()
  return render(
    <ThemeProvider storageKey="ty-test-palette">
      <ThemePaletteTrigger recentKey="ty-test-palette-recent" />
    </ThemeProvider>,
  )
}

describe('ThemePalette', () => {
  it('fuzzy score prefers prefixes and word starts, and rejects out-of-order letters', () => {
    expect(fuzzyScore('Editorial de jornal', 'edit')).toBeGreaterThan(fuzzyScore('Editorial de jornal', 'jorn'))
    expect(fuzzyScore('Editorial de jornal', 'jorn')).toBeGreaterThan(fuzzyScore('Editorial de jornal', 'edjr'))
    expect(fuzzyScore('Editorial de jornal', 'edjr')).toBeGreaterThan(0)
    expect(fuzzyScore('Editorial de jornal', 'zz')).toBe(0)
    expect(fuzzyScore('Suíço', 'suico')).toBeGreaterThan(0)
  })

  it('lists every built-in preset and every book style', () => {
    const groups = themePaletteGroups({ interface: 'Interface', print: 'Print' })
    expect(groups[0]!.themes.map((t) => t.id)).toContain('tympan')
    expect(groups[1]!.themes).toHaveLength(39)
  })

  it('the trigger names the current theme and opens a combobox with a listbox', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Theme: Tympan' }))
    const input = screen.getByRole('combobox', { name: 'Choose a theme' })
    expect(input).toHaveFocus()
    expect(within(screen.getByRole('listbox')).getAllByRole('option').length).toBeGreaterThan(40)
  })

  it('arrow keys preview themes, Escape restores the original theme', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Theme:/ }))
    const before = theme()
    await userEvent.keyboard('{ArrowDown}')
    expect(theme()).not.toBe(before)
    await userEvent.keyboard('{Escape}')
    expect(theme()).toBe(before)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('typing filters, Enter applies, and the choice is announced and remembered as recent', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Theme:/ }))
    await userEvent.keyboard('high contrast')
    await userEvent.keyboard('{Enter}')
    expect(theme()).toBe('high-contrast')
    expect(screen.getByRole('status')).toHaveTextContent('Theme applied: High contrast')
    await userEvent.click(screen.getByRole('button', { name: 'Theme: High contrast' }))
    expect(screen.getByRole('group', { name: 'Recent' })).toBeInTheDocument()
  })
})
