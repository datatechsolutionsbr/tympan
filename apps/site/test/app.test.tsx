import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, TympanProvider } from '@datatechsolutions/tympan'
import { App } from '../src/App'
import fonte from '../src/i18n/mensagens/pt-BR.json'
import { I18nProvider } from '../src/i18n/I18n'

function montar(hash: string) {
  history.replaceState(null, '', hash)
  return render(
    <I18nProvider inicial="pt-BR" catalogoInicial={fonte}>
      <TympanProvider locale="pt-BR">
        <ThemeProvider storageKey="ty-site-teste">
          <App />
        </ThemeProvider>
      </TympanProvider>
    </I18nProvider>,
  )
}

describe('site app', () => {
  it('opens Livro from the hash, writes the locale into it, and keeps mode changes in path segments', async () => {
    montar('#/livro/suico')
    expect(await screen.findByRole('heading', { level: 1, name: 'Estilo Suíço' }, { timeout: 10000 })).toBeInTheDocument()
    expect(location.hash).toBe('#/pt-BR/livro/suico')
    await userEvent.click(screen.getByRole('radio', { name: 'Comparar' }))
    await waitFor(() => expect(location.hash).toBe('#/pt-BR/livro/suico/estudo/cor/comparar'))
    expect(location.hash).not.toContain('?')
  })

  it('changes the style with the arrow keys and the list', async () => {
    montar('#/pt-BR/livro/jornal')
    await screen.findByRole('heading', { level: 1, name: 'Editorial de jornal' }, { timeout: 10000 })
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    await waitFor(() => expect(location.hash).toBe('#/pt-BR/livro/prancheta'))
    await userEvent.click(screen.getByRole('button', { name: /^Cordel/ }))
    await waitFor(() => expect(location.hash).toBe('#/pt-BR/livro/cordel'))
  })

  it('never shows the style reference credits', async () => {
    montar('#/pt-BR/livro/graficos-1900')
    await screen.findByRole('heading', { level: 1 }, { timeout: 10000 })
    expect(document.body.textContent).not.toMatch(/inspirado em/i)
  })
})
