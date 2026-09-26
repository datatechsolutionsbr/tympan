import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { setMedia } from '../../test/media'
import { ThemeProvider, themeInitScript, useTheme } from './theme'

function Probe() {
  const t = useTheme()
  return (
    <div>
      <output aria-label="state">{`${t.theme}|${t.mode}|${t.resolvedMode}|${t.density}`}</output>
      <button onClick={() => t.setMode('dark')}>dark</button>
      <button onClick={() => t.setDensity('compact')}>compact</button>
      <button onClick={() => t.setTheme('neutral')}>neutral</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('writes theme, mode and density attributes on <html> by default', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    const html = document.documentElement
    expect(html).toHaveAttribute('data-fk-theme', 'fakhir')
    expect(html).toHaveAttribute('data-fk-mode', 'system')
    expect(html).toHaveAttribute('data-fk-density', 'default')
    await userEvent.click(screen.getByText('dark'))
    await userEvent.click(screen.getByText('compact'))
    await userEvent.click(screen.getByText('neutral'))
    expect(html).toHaveAttribute('data-fk-mode', 'dark')
    expect(html).toHaveAttribute('data-fk-density', 'compact')
    expect(html).toHaveAttribute('data-fk-theme', 'neutral')
  })

  it('resolves system mode through prefers-color-scheme', () => {
    render(
      <ThemeProvider target="scope">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByLabelText('state')).toHaveTextContent('fakhir|system|light|default')
    setMedia({ dark: true })
    expect(screen.getByLabelText('state')).toHaveTextContent('fakhir|system|dark|default')
  })

  it('scopes attributes to a wrapper in scope mode and supports controlled values', async () => {
    const onModeChange = vi.fn()
    const { container } = render(
      <ThemeProvider target="scope" theme="high-contrast" mode="light" onModeChange={onModeChange}>
        <Probe />
      </ThemeProvider>,
    )
    const scope = container.firstElementChild!
    expect(scope).toHaveAttribute('data-fk-theme', 'high-contrast')
    await userEvent.click(screen.getByText('dark'))
    expect(onModeChange).toHaveBeenCalledWith('dark')
    expect(scope).toHaveAttribute('data-fk-mode', 'light')
  })

  it('persists to storage when a key is given, and the init script restores it', async () => {
    window.localStorage.removeItem('fk-test')
    const { unmount } = render(
      <ThemeProvider storageKey="fk-test" target="scope">
        <Probe />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByText('dark'))
    expect(JSON.parse(window.localStorage.getItem('fk-test')!)).toMatchObject({ mode: 'dark' })
    unmount()
    document.documentElement.removeAttribute('data-fk-mode')
    act(() => {
      new Function(themeInitScript('fk-test'))()
    })
    expect(document.documentElement).toHaveAttribute('data-fk-mode', 'dark')
  })

  it('throws a descriptive error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
    spy.mockRestore()
  })
})
