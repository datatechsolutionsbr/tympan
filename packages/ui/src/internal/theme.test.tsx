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
    expect(html).toHaveAttribute('data-ty-theme', 'tympan')
    expect(html).toHaveAttribute('data-ty-mode', 'system')
    expect(html).toHaveAttribute('data-ty-density', 'default')
    await userEvent.click(screen.getByText('dark'))
    await userEvent.click(screen.getByText('compact'))
    await userEvent.click(screen.getByText('neutral'))
    expect(html).toHaveAttribute('data-ty-mode', 'dark')
    expect(html).toHaveAttribute('data-ty-density', 'compact')
    expect(html).toHaveAttribute('data-ty-theme', 'neutral')
  })

  it('resolves system mode through prefers-color-scheme', () => {
    render(
      <ThemeProvider target="scope">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByLabelText('state')).toHaveTextContent('tympan|system|light|default')
    setMedia({ dark: true })
    expect(screen.getByLabelText('state')).toHaveTextContent('tympan|system|dark|default')
  })

  it('scopes attributes to a wrapper in scope mode and supports controlled values', async () => {
    const onModeChange = vi.fn()
    const { container } = render(
      <ThemeProvider target="scope" theme="high-contrast" mode="light" onModeChange={onModeChange}>
        <Probe />
      </ThemeProvider>,
    )
    const scope = container.firstElementChild!
    expect(scope).toHaveAttribute('data-ty-theme', 'high-contrast')
    await userEvent.click(screen.getByText('dark'))
    expect(onModeChange).toHaveBeenCalledWith('dark')
    expect(scope).toHaveAttribute('data-ty-mode', 'light')
  })

  it('persists to storage when a key is given, and the init script restores it', async () => {
    window.localStorage.removeItem('ty-test')
    const { unmount } = render(
      <ThemeProvider storageKey="ty-test" target="scope">
        <Probe />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByText('dark'))
    expect(JSON.parse(window.localStorage.getItem('ty-test')!)).toMatchObject({ mode: 'dark' })
    unmount()
    document.documentElement.removeAttribute('data-ty-mode')
    act(() => {
      new Function(themeInitScript('ty-test'))()
    })
    expect(document.documentElement).toHaveAttribute('data-ty-mode', 'dark')
  })

  it('adds the font stylesheet of the current theme from the fonts map, and removes it for themes without one', async () => {
    const fonts = { neutral: 'https://fonts.example/neutral.css', 'print-x': 'https://fonts.example/x.css' }
    const { unmount } = render(
      <ThemeProvider defaultTheme="print-x" fonts={fonts}>
        <Probe />
      </ThemeProvider>,
    )
    const link = () => document.head.querySelector('link[data-ty-theme-fonts]')
    expect(link()).toHaveAttribute('href', 'https://fonts.example/x.css')
    await userEvent.click(screen.getByText('neutral'))
    expect(link()).toHaveAttribute('href', 'https://fonts.example/neutral.css')
    expect(document.head.querySelectorAll('link[data-ty-theme-fonts]')).toHaveLength(1)
    unmount()
    render(
      <ThemeProvider defaultTheme="tympan" fonts={fonts}>
        <Probe />
      </ThemeProvider>,
    )
    expect(link()).toBeNull()
  })

  it('renders the font link inside the wrapper in scope mode', () => {
    const { container } = render(
      <ThemeProvider target="scope" theme="print-x" fonts={{ 'print-x': 'https://fonts.example/x.css' }}>
        <Probe />
      </ThemeProvider>,
    )
    expect(container.querySelector('link[data-ty-theme-fonts]')).toHaveAttribute('href', 'https://fonts.example/x.css')
  })

  it('init script can add the stored theme font link before first paint', () => {
    window.localStorage.setItem('ty-fonts', JSON.stringify({ theme: 'print-x' }))
    document.head.querySelectorAll('link[data-ty-theme-fonts]').forEach((l) => l.remove())
    new Function(themeInitScript('ty-fonts', {}, { fonts: { 'print-x': 'https://fonts.example/x.css?a=<b>' } }))()
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'print-x')
    expect(document.head.querySelector('link[data-ty-theme-fonts]')).toHaveAttribute('href', 'https://fonts.example/x.css?a=<b>')
    expect(themeInitScript('k', {}, { fonts: { a: '</script>' } })).not.toContain('</script>')
    window.localStorage.removeItem('ty-fonts')
  })

  it('throws a descriptive error outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
    spy.mockRestore()
  })
})
