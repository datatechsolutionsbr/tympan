import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { LocalePicker, type LocaleEntry } from './LocalePicker'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const locales: LocaleEntry[] = [
  { code: 'pt-BR', nativeName: 'Português', shortCode: 'PT' },
  { code: 'en', nativeName: 'English', shortCode: 'EN' },
]

describe('LocalePicker', () => {
  it('lists the locales with the current one selected', async () => {
    render(<LocalePicker locales={locales} value="pt-BR" onChange={() => {}} />)
    const trigger = screen.getByRole('button', { name: 'Language: Português' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(trigger)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(screen.getByRole('option', { name: /Português/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('reports a new locale and closes with focus back on the trigger', async () => {
    const onChange = vi.fn()
    render(<LocalePicker locales={locales} value="pt-BR" onChange={onChange} />)
    const trigger = screen.getByRole('button', { name: /Language/ })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('option', { name: /English/ }))
    expect(onChange).toHaveBeenCalledWith('en')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('marks each name with its own language', async () => {
    render(<LocalePicker locales={locales} value="pt-BR" onChange={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Language/ }))
    expect(screen.getByText('English')).toHaveAttribute('lang', 'en')
    expect(screen.getByText('Português')).toHaveAttribute('lang', 'pt-BR')
  })

  it('shows the list without a trigger when opened by the host', () => {
    render(<LocalePicker locales={locales} value="en" onChange={() => {}} showTrigger={false} open onOpenChange={() => {}} presentation="dialog" />)
    expect(screen.queryByRole('button', { name: /Language:/ })).toBeNull()
    expect(screen.getByRole('listbox', { name: 'Available languages' })).toBeInTheDocument()
    expect(screen.getByText(/Current language: English \(EN\)/)).toBeInTheDocument()
  })

  it('closes on Escape without reporting', async () => {
    const onChange = vi.fn()
    render(<LocalePicker locales={locales} value="pt-BR" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Language/ }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects with the keyboard', async () => {
    const onChange = vi.fn()
    render(<LocalePicker locales={locales} value="pt-BR" onChange={onChange} presentation="drawer" />)
    await userEvent.click(screen.getByRole('button', { name: /Language/ }))
    await waitFor(() => expect(screen.getByRole('option', { name: /Português/ })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('en')
  })

  it('uses system highlight for the selected option', () => {
    const css = cssOf('components/locale-picker/LocalePicker.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/min-block-size:\s*var\(--ty-control-target\)/)
  })

  it('has no axe violations, light and dark, open', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <LocalePicker locales={locales} value="pt-BR" onChange={() => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
    await userEvent.click(screen.getAllByRole('button', { name: /Language/ })[0]!)
    await expectNoAxeViolations(document.body)
  })
})

describe('LocalePicker in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<LocalePicker locales={[{ code: 'ar', nativeName: 'العربية' }, { code: 'he', nativeName: 'עברית' }]} value="ar" onChange={() => {}} />)
    expect(rtlDom.screen.getByRole('button')).toBeInTheDocument()
    await axeRtl(container)
  })
})
