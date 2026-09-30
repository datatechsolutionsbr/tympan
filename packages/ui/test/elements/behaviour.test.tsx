// Behaviour of the custom elements and their React wrappers: accessibility,
// keyboard, form participation, theming and right-to-left.
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElements } from '../../src/elements'
import { TyButton, TyCheckbox, TyDrawer, TyInlineNotice, TyLink, TyModal, TyNativeSelect, TySeparator, TySkeleton, TySpinner, TyStatusPill, TySurface, TySwitch, TyTag, TyTextArea, TyTextField, TyThemePalette } from '../../src/elements/react'
import { THEMES, match, readStored, sections } from '../../src/elements/theme-palette/model'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'
import { setMedia } from '../media'

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
  document.documentElement.removeAttribute('data-ty-modal-open')
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

describe('<ty-link>', () => {
  it('is a native anchor with its variant attributes, named by its text', async () => {
    html('<ty-link href="/runs">Runs</ty-link>')
    const link = screen.getByRole('link', { name: 'Runs' })
    expect(link).toHaveClass('ty-link')
    expect(link).toHaveAttribute('href', '/runs')
    expect(link).toHaveAttribute('data-emphasis', 'underlined')
    await expectNoAxeViolations(document.body, ["region"])
  })

  it('opens an external link in a new context with a safe rel, an icon and a hidden hint', async () => {
    html('<ty-link href="https://example.org/report" external>Report</ty-link>')
    const link = screen.getByRole('link', { name: /Report/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link).toHaveTextContent('(opens in a new tab)')
    expect(link.querySelector('svg.ty-link__external')).toHaveClass('ty-icon', 'ty-mirror-rtl')
    await expectNoAxeViolations(document.body, ["region"])
  })

  it('infers external from an absolute URL to another origin and translates the hint', () => {
    html(`<ty-link href="https://example.org/x" new-tab-label="(abre em nova aba)">Relatório</ty-link><ty-link href="${window.location.origin}/in-app">Same origin</ty-link>`)
    const external = screen.getByRole('link', { name: /Relatório/ })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveTextContent('(abre em nova aba)')
    const internal = screen.getByRole('link', { name: 'Same origin' })
    expect(internal).not.toHaveAttribute('target')
    expect(internal.querySelector('.ty-link__hint')).toBeNull()
  })

  it('marks the current page and takes the subtle and standalone attributes', () => {
    html('<ty-link href="/overview" current emphasis="subtle" standalone>Overview</ty-link>')
    const link = screen.getByRole('link', { name: 'Overview' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveAttribute('data-emphasis', 'subtle')
    expect(link).toHaveAttribute('data-standalone', '')
  })

  it('follows attribute changes from plain HTML (href, external)', () => {
    const host = html('<ty-link href="/a">A</ty-link>').querySelector('ty-link')!
    const link = screen.getByRole('link', { name: 'A' })
    host.setAttribute('href', '/b')
    expect(link).toHaveAttribute('href', '/b')
    host.setAttribute('external', '')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveTextContent('(opens in a new tab)')
    host.removeAttribute('external')
    expect(link).not.toHaveAttribute('target')
  })

  it('React wrapper: reports the click', async () => {
    const onClick = vi.fn()
    render(<TyLink href="/runs" onClick={onClick}>Runs</TyLink>)
    await userEvent.click(screen.getByRole('link', { name: 'Runs' }))
    expect(onClick).toHaveBeenCalledTimes(1)
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

describe('<ty-checkbox>', () => {
  it('is a labelled checkbox that toggles with a click and Space, and reflects its state', async () => {
    const host = html('<ty-checkbox name="notify">Notify me<span slot="description">By email</span></ty-checkbox>').querySelector('ty-checkbox')!
    const control = screen.getByRole('checkbox', { name: 'Notify me' })
    expect(control).toHaveAccessibleDescription('By email')
    expect(control).not.toBeChecked()
    await userEvent.click(control)
    expect(control).toBeChecked()
    expect(host).toHaveAttribute('checked')
    expect(host.querySelector('.ty-checkbox__row')).toHaveAttribute('data-selected')
    control.focus()
    await userEvent.keyboard(' ')
    expect(control).not.toBeChecked()
    expect(host).not.toHaveAttribute('checked')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('shows the check while on and the minus while indeterminate, from CSS keyed on the native state', () => {
    const css = readFileSync(join(__dirname, '../../src/elements/elements.css'), 'utf8')
    expect(css).toMatch(/:has\(> input:checked\) \.ty-checkbox__check/)
    expect(css).toMatch(/:has\(> input:indeterminate\) \.ty-checkbox__minus/)
    const host = html('<ty-checkbox indeterminate>Select all</ty-checkbox>').querySelector('ty-checkbox')!
    const control = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement
    expect(control.indeterminate).toBe(true)
    expect(host.querySelector('.ty-checkbox__check')).not.toBeNull()
    expect(host.querySelector('.ty-checkbox__minus')).not.toBeNull()
  })

  it('clears the mixed state on the next toggle', async () => {
    const host = html('<ty-checkbox indeterminate>Select all</ty-checkbox>').querySelector('ty-checkbox')!
    const control = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement
    await userEvent.click(control)
    expect(control.indeterminate).toBe(false)
    expect(host).not.toHaveAttribute('indeterminate')
    expect(control).toBeChecked()
  })

  it('takes part in its form: submitted while on, restored by a reset', async () => {
    const container = html('<form><ty-checkbox name="notify" value="email">Notify me</ty-checkbox><button type="reset">Reset</button></form>')
    const form = container.querySelector('form')!
    const control = screen.getByRole('checkbox', { name: 'Notify me' })
    expect(new FormData(form).get('notify')).toBeNull()
    await userEvent.click(control)
    expect(new FormData(form).get('notify')).toBe('email')
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await act(() => new Promise((r) => setTimeout(r, 0)))
    expect(control).not.toBeChecked()
    expect(container.querySelector('ty-checkbox')).not.toHaveAttribute('checked')
  })

  it('is invalid while it has an error, which names and describes the message', async () => {
    html('<ty-checkbox required>I accept the terms<span slot="error">Required</span></ty-checkbox>')
    const control = screen.getByRole('checkbox', { name: 'I accept the terms' })
    expect(control).toHaveAttribute('aria-invalid', 'true')
    const error = document.querySelector('.ty-checkbox__error')!
    expect(control).toHaveAttribute('aria-errormessage', error.id)
    expect(error).toHaveTextContent('Required')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const host = html('<ty-checkbox>أعلمني</ty-checkbox>').querySelector('ty-checkbox')!
    const control = screen.getByRole('checkbox', { name: 'أعلمني' })
    await userEvent.click(control)
    expect(control).toBeChecked()
    expect(host).toHaveAttribute('checked')
  })

  it('React wrapper: controlled, reports the new state', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<TyCheckbox checked={false} onChange={onChange}>Dark mode</TyCheckbox>)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Dark mode' }))
    expect(onChange).toHaveBeenCalledWith({ checked: true }, expect.anything())
    rerender(<TyCheckbox checked onChange={onChange}>Dark mode</TyCheckbox>)
    expect(screen.getByRole('checkbox', { name: 'Dark mode' })).toBeChecked()
  })
})

describe('<ty-tag>', () => {
  it('is inline text with no interactive role, painted by tone and size', async () => {
    html('<ty-tag tone="accent" size="small">production</ty-tag>')
    const tag = document.querySelector('.ty-tag')!
    expect(tag.tagName).toBe('SPAN')
    expect(tag).toHaveAttribute('data-tone', 'accent')
    expect(tag).toHaveAttribute('data-size', 'small')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('removable: a named remove button the keyboard reaches, defaulting to "Remove <text>"', async () => {
    const host = html('<ty-tag removable>São Paulo</ty-tag>').querySelector('ty-tag')!
    const remove = screen.getByRole('button', { name: 'Remove São Paulo' })
    expect(remove.closest('.ty-tag')).toHaveAttribute('data-removable')
    const onRemove = vi.fn()
    host.addEventListener('click', (event) => {
      if (event.target === remove) onRemove()
    })
    await userEvent.tab()
    expect(remove).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onRemove).toHaveBeenCalledTimes(2)
    // A host's (translated) remove-label wins over the default.
    host.setAttribute('remove-label', 'Remover São Paulo')
    expect(screen.getByRole('button', { name: 'Remover São Paulo' })).toBe(remove)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('shows a categorical square for category-index, normalised into 1–8', () => {
    const host = html('<ty-tag category-index="3">Stage 3</ty-tag>').querySelector('ty-tag')!
    expect(host.querySelector('.ty-tag__swatch')).toHaveAttribute('data-category', '3')
    host.setAttribute('category-index', '11')
    expect(host.querySelector('.ty-tag__swatch')).toHaveAttribute('data-category', '3')
    host.setAttribute('category-index', '0')
    expect(host.querySelector('.ty-tag__swatch')).toHaveAttribute('data-category', '1')
    host.removeAttribute('category-index')
    expect(host.querySelector('.ty-tag__swatch')).toBeNull()
  })

  it('an icon wins over the category square; live marks a polite status region', () => {
    html('<ty-tag category-index="2" live><span slot="icon">◆</span>Deploy</ty-tag>')
    const tag = document.querySelector('.ty-tag')!
    expect(tag.querySelector('.ty-tag__icon')).not.toBeNull()
    expect(tag.querySelector('.ty-tag__swatch')).toBeNull()
    expect(tag).toHaveAttribute('role', 'status')
    expect(tag).toHaveAttribute('aria-live', 'polite')
  })

  it('React wrapper: removable reports the remove button\'s click', async () => {
    const onClick = vi.fn()
    render(<TyTag removable removeLabel="Remove Brazil" onClick={onClick}>Brazil</TyTag>)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Brazil' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-text-area>', () => {
  const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))))

  it('is a textarea named by its label and described by its hint', async () => {
    html('<ty-text-area><span slot="label">Notes</span><span slot="hint">Shown on the canvas</span></ty-text-area>')
    const area = screen.getByRole('textbox', { name: 'Notes' })
    expect(area).toHaveClass('ty-text-area__input')
    expect(area).toHaveAttribute('rows', '3')
    expect(area).toHaveAccessibleDescription('Shown on the canvas')
    const label = document.querySelector('.ty-text-area__label')!
    expect(label).toHaveAttribute('for', area.id)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('inserts a newline on Enter and takes part in its form natively', async () => {
    const container = html('<form><ty-text-area name="notes" value="old"><span slot="label">Notes</span></ty-text-area></form>')
    const form = container.querySelector('form')!
    const submitted = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submitted as unknown as EventListener)
    const area = screen.getByRole('textbox', { name: 'Notes' })
    expect(new FormData(form).get('notes')).toBe('old')
    await userEvent.click(area)
    await userEvent.keyboard('{Enter}')
    expect(submitted).not.toHaveBeenCalled()
    expect(new FormData(form).get('notes')).toBe('old\n')
  })

  it('mirrors the value attribute in without disturbing what was typed, and an uncontrolled default survives a reset', async () => {
    const container = html('<form><ty-text-area value="from host"><span slot="label">Controlled</span></ty-text-area><ty-text-area default-value="initial"><span slot="label">Free</span></ty-text-area><button type="reset">Reset</button></form>')
    const controlled = screen.getByRole('textbox', { name: 'Controlled' })
    expect(controlled).toHaveValue('from host')
    await userEvent.type(controlled, '!')
    expect(controlled).toHaveValue('from host!')
    const host = container.querySelector('ty-text-area')!
    host.setAttribute('value', 'from host!')
    expect(controlled).toHaveValue('from host!')
    host.setAttribute('value', 'replaced')
    expect(controlled).toHaveValue('replaced')
    const free = screen.getByRole('textbox', { name: 'Free' })
    expect(free).toHaveValue('initial')
    await userEvent.clear(free)
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(free).toHaveValue('initial')
  })

  it('follows attribute changes from plain HTML (invalid, resize, disabled)', () => {
    const host = html('<ty-text-area><span slot="label">Notes</span></ty-text-area>').querySelector('ty-text-area')!
    const area = screen.getByRole('textbox', { name: 'Notes' })
    host.setAttribute('invalid', '')
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(host.querySelector('.ty-text-area')).toHaveAttribute('data-invalid')
    host.removeAttribute('invalid')
    expect(area).not.toHaveAttribute('aria-invalid')
    host.setAttribute('resize', 'none')
    expect(host.querySelector('.ty-text-area')).toHaveAttribute('data-resize', 'none')
    host.setAttribute('disabled', '')
    expect(area).toBeDisabled()
    expect(host.querySelector('.ty-text-area')).toHaveAttribute('data-disabled')
  })

  it('counts characters against max-length and flags the over-limit state without cutting the input', async () => {
    html('<ty-text-area max-length="3" show-counter value=""><span slot="label">Bio</span></ty-text-area>')
    const area = screen.getByRole('textbox', { name: 'Bio' })
    const counter = document.querySelector('.ty-text-area__counter')!
    await nextFrame()
    expect(counter).toHaveTextContent('0 of 3 characters')
    await userEvent.type(area, 'abcd')
    expect(area).toHaveValue('abcd')
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(counter).toHaveTextContent('4 of 3 characters, 1 over the limit')
    expect(counter).toHaveAttribute('data-over-limit')
    await userEvent.type(area, '{backspace}')
    expect(area).not.toHaveAttribute('aria-invalid')
    expect(counter).toHaveTextContent('3 of 3 characters')
    expect(counter).not.toHaveAttribute('data-over-limit')
  })

  it('translates the counter through its templates', async () => {
    html('<ty-text-area max-length="10" show-counter counter-label="{count} de {max}" over-limit-label="{count} de {max}, {over} a mais" value="abc"><span slot="label">Bio</span></ty-text-area>')
    await nextFrame()
    expect(document.querySelector('.ty-text-area__counter')).toHaveTextContent('3 de 10')
  })

  it('grows with the content up to max-rows, then scrolls', async () => {
    const host = html('<ty-text-area rows="2" auto-grow max-rows="3" value=""><span slot="label">Log</span></ty-text-area>').querySelector('ty-text-area')!
    const area = screen.getByRole('textbox', { name: 'Log' })
    await userEvent.type(area, 'one{Enter}two{Enter}three{Enter}four')
    expect(area).toHaveAttribute('rows', '3')
    expect(host.querySelector('.ty-text-area')).toHaveAttribute('data-scrolling')
    await userEvent.clear(area)
    expect(area).toHaveAttribute('rows', '2')
    expect(host.querySelector('.ty-text-area')).not.toHaveAttribute('data-scrolling')
  })

  it('announces an error: the icon is hidden, the message describes and invalidates the area', async () => {
    html('<ty-text-area value="x"><span slot="label">Abstract</span><span slot="error">Too long</span></ty-text-area>')
    const area = screen.getByRole('textbox', { name: 'Abstract' })
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(area).toHaveAccessibleDescription('Too long')
    const icon = document.querySelector('.ty-text-area__error svg')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('React wrapper: controlled, reports every keystroke', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<TyTextArea label="Bio" value="ab" onChange={onChange} />)
    const area = screen.getByRole('textbox', { name: 'Bio' })
    expect(area).toHaveValue('ab')
    await userEvent.type(area, 'c')
    expect(onChange).toHaveBeenCalledWith({ value: 'abc' }, expect.anything())
    rerender(<TyTextArea label="Bio" value="ab" hint="Two words" onChange={onChange} />)
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveAccessibleDescription('Two words')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-text-area max-length="10" show-counter value="نص"><span slot="label">الاقتباس</span></ty-text-area>')
    const area = screen.getByRole('textbox', { name: 'الاقتباس' })
    expect(area).toHaveValue('نص')
    await nextFrame()
    expect(document.querySelector('.ty-text-area__counter')).toHaveTextContent('2 of 10 characters')
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-text-field>', () => {
  const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))))

  it('is a textbox named by its label and described by its hint', async () => {
    html('<ty-text-field placeholder="Ada Lovelace"><span slot="label">Name</span><span slot="hint">As on your badge</span></ty-text-field>')
    const field = screen.getByRole('textbox', { name: 'Name' })
    expect(field).toHaveClass('ty-text-field__input')
    expect(field).toHaveAttribute('type', 'text')
    expect(field).toHaveAttribute('placeholder', 'Ada Lovelace')
    expect(field).toHaveAccessibleDescription('As on your badge')
    const label = document.querySelector('.ty-text-field__label')!
    expect(label).toHaveAttribute('for', field.id)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('takes part in its form natively: the value submits and a reset returns to default-value', async () => {
    const container = html('<form><ty-text-field name="q" value="brazil"><span slot="label">Controlled</span></ty-text-field><ty-text-field name="free" default-value="initial"><span slot="label">Free</span></ty-text-field><button type="reset">Reset</button></form>')
    const form = container.querySelector('form')!
    expect(new FormData(form).get('q')).toBe('brazil')
    const free = screen.getByRole('textbox', { name: 'Free' })
    expect(free).toHaveValue('initial')
    await userEvent.clear(free)
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(free).toHaveValue('initial')
  })

  it('mirrors the value attribute in without disturbing what was typed', async () => {
    const container = html('<ty-text-field value="from host"><span slot="label">Controlled</span></ty-text-field>')
    const field = screen.getByRole('textbox', { name: 'Controlled' })
    expect(field).toHaveValue('from host')
    await userEvent.type(field, '!')
    expect(field).toHaveValue('from host!')
    const host = container.querySelector('ty-text-field')!
    host.setAttribute('value', 'from host!')
    expect(field).toHaveValue('from host!')
    host.setAttribute('value', 'replaced')
    expect(field).toHaveValue('replaced')
  })

  it('follows attribute changes from plain HTML (invalid, input-type, disabled, read-only)', () => {
    const host = html('<ty-text-field><span slot="label">Name</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByRole('textbox', { name: 'Name' })
    host.setAttribute('invalid', '')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(host.querySelector('.ty-text-field')).toHaveAttribute('data-invalid')
    host.removeAttribute('invalid')
    expect(field).not.toHaveAttribute('aria-invalid')
    host.setAttribute('input-type', 'email')
    expect(field).toHaveAttribute('type', 'email')
    host.setAttribute('disabled', '')
    expect(field).toBeDisabled()
    expect(host.querySelector('.ty-text-field')).toHaveAttribute('data-disabled')
    host.removeAttribute('disabled')
    host.setAttribute('read-only', '')
    expect(field).toHaveAttribute('readonly')
    expect(host.querySelector('.ty-text-field')).toHaveAttribute('data-readonly')
  })

  it('search mode: a searchbox with a magnifier; the clear action hides while empty and Escape clears with ty-clear', async () => {
    const host = html('<ty-text-field mode="search" placeholder="Search states"><span slot="label">Search</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByRole('searchbox', { name: 'Search' })
    expect(field).toHaveAttribute('type', 'search')
    const leading = host.querySelector('.ty-text-field__leading')!
    expect(leading).toHaveAttribute('aria-hidden', 'true')
    expect(leading.querySelector('svg')).not.toBeNull()
    const cleared = vi.fn()
    host.addEventListener('ty-clear', cleared)
    const clear = host.querySelector('.ty-text-field__clear')!
    await nextFrame()
    expect(clear).toHaveAttribute('hidden')
    await userEvent.type(field, 'an')
    expect(clear).not.toHaveAttribute('hidden')
    await userEvent.keyboard('{Escape}')
    expect(field).toHaveValue('')
    expect(cleared).toHaveBeenCalledTimes(1)
    expect(field).toHaveFocus()
    expect(clear).toHaveAttribute('hidden')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('clearable outside search: the clear action empties the value, fires ty-clear and returns focus', async () => {
    const host = html('<ty-text-field clearable value="draft"><span slot="label">Title</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByRole('textbox', { name: 'Title' })
    const cleared = vi.fn()
    host.addEventListener('ty-clear', cleared)
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(field).toHaveValue('')
    expect(cleared).toHaveBeenCalledTimes(1)
    expect(field).toHaveFocus()
    expect(host.querySelector('.ty-text-field__clear')).toHaveAttribute('hidden')
  })

  it('password mode: the reveal action shows and hides the text, pressed and renamed, keyed to CSS', async () => {
    const css = readFileSync(join(__dirname, '../../src/elements/elements.css'), 'utf8')
    expect(css).toMatch(/\.ty-text-field__reveal\[aria-pressed='true'\] \.ty-text-field__eye-off/)
    expect(css).toMatch(/\.ty-text-field \[hidden\]/)
    const host = html('<ty-text-field mode="password" value="s3cret"><span slot="label">Password</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByLabelText('Password')
    expect(field).toHaveAttribute('type', 'password')
    expect(field).toHaveValue('s3cret')
    const reveal = screen.getByRole('button', { name: 'Show password' })
    expect(reveal).toHaveAttribute('aria-pressed', 'false')
    expect(host.querySelector('.ty-text-field__eye')).not.toBeNull()
    expect(host.querySelector('.ty-text-field__eye-off')).not.toBeNull()
    await userEvent.click(reveal)
    expect(field).toHaveAttribute('type', 'text')
    expect(reveal).toHaveAttribute('aria-pressed', 'true')
    expect(reveal).toHaveAttribute('aria-label', 'Hide password')
    host.setAttribute('placeholder', 'unrelated')
    expect(field).toHaveAttribute('type', 'text')
    expect(reveal).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(field).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'false')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('counts characters against max-length and flags the over-limit state without cutting the input', async () => {
    html('<ty-text-field max-length="3" show-counter value=""><span slot="label">Title</span></ty-text-field>')
    const field = screen.getByRole('textbox', { name: 'Title' })
    const counter = document.querySelector('.ty-text-field__counter')!
    await nextFrame()
    expect(counter).toHaveTextContent('0 of 3 characters')
    expect(field).toHaveAttribute('aria-describedby', counter.id)
    await userEvent.type(field, 'abcd')
    expect(field).toHaveValue('abcd')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(counter).toHaveTextContent('4 of 3 characters, 1 over the limit')
    expect(counter).toHaveAttribute('data-over-limit')
    await userEvent.type(field, '{backspace}')
    expect(field).not.toHaveAttribute('aria-invalid')
    expect(counter).toHaveTextContent('3 of 3 characters')
    expect(counter).not.toHaveAttribute('data-over-limit')
  })

  it('shows a success without an error and hides it while over the limit', async () => {
    const host = html('<ty-text-field max-length="2" show-counter value="ok"><span slot="label">Code</span><span slot="success">Looks right</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByRole('textbox', { name: 'Code' })
    const success = host.querySelector('.ty-text-field__success')!
    const mark = host.querySelector('.ty-text-field__success-mark')!
    await nextFrame()
    expect(success).not.toHaveAttribute('hidden')
    expect(mark).not.toHaveAttribute('hidden')
    await userEvent.type(field, '!')
    expect(field).toHaveValue('ok!')
    expect(success).toHaveAttribute('hidden')
    expect(mark).toHaveAttribute('hidden')
    expect(field).toHaveAttribute('aria-invalid', 'true')
  })

  it('announces an error: the icon is hidden, the message describes and invalidates the field', async () => {
    html('<ty-text-field value="x"><span slot="label">Code</span><span slot="error">Too short</span></ty-text-field>')
    const field = screen.getByRole('textbox', { name: 'Code' })
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Too short')
    const icon = document.querySelector('.ty-text-field__error svg')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('React wrapper: controlled, reports every keystroke and the clear action', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const { rerender } = render(<TyTextField mode="search" label="Search" value="br" onChange={onChange} onClear={onClear} />)
    const field = screen.getByRole('searchbox', { name: 'Search' })
    expect(field).toHaveValue('br')
    await userEvent.type(field, 'a')
    expect(onChange).toHaveBeenCalledWith({ value: 'bra' }, expect.anything())
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenCalledWith({ value: '' }, expect.anything())
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(field).toHaveFocus()
    rerender(<TyTextField mode="search" label="Search" value="br" hint="States of Brazil" onChange={onChange} onClear={onClear} />)
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAccessibleDescription('States of Brazil')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const host = html('<ty-text-field mode="search" value="نص"><span slot="label">بحث</span></ty-text-field>').querySelector('ty-text-field')!
    const field = screen.getByRole('searchbox', { name: 'بحث' })
    expect(field).toHaveValue('نص')
    const cleared = vi.fn()
    host.addEventListener('ty-clear', cleared)
    await userEvent.click(field)
    await userEvent.keyboard('{Escape}')
    expect(field).toHaveValue('')
    expect(cleared).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(document.body, ['region'])
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

  it('stores only the field that was chosen, so the rest keeps following the defaults', async () => {
    const container = html('<ty-theme-palette open storage-key="partial" default-theme="astrlabe" themes="astrlabe"></ty-theme-palette>')
    await userEvent.type(screen.getByRole('combobox'), 'dark')
    await userEvent.keyboard('{Enter}')
    expect(JSON.parse(localStorage.getItem('partial')!)).toEqual({ mode: 'dark' })
    container.firstElementChild!.setAttribute('apply', '')
    container.firstElementChild!.setAttribute('default-theme', 'neutral')
    expect(document.documentElement).toHaveAttribute('data-ty-theme', 'neutral')
    expect(document.documentElement).toHaveAttribute('data-ty-mode', 'dark')
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

describe('<ty-status-pill>', () => {
  it('colours a known status from the built-in map, labelled by its content', async () => {
    html('<ty-status-pill status="active">Live</ty-status-pill>')
    const pill = document.body.querySelector('.ty-status')!
    expect(pill).toHaveAttribute('data-tone', 'success')
    expect(pill).toHaveAttribute('data-size', 'regular')
    expect(pill).toHaveAttribute('data-status', 'active')
    expect(pill).toHaveTextContent('Live')
    expect(pill).not.toHaveAttribute('role')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('derives tone, busy and the label from the map, and follows status changes', () => {
    const host = html('<ty-status-pill status="processing"></ty-status-pill>').querySelector('ty-status-pill')!
    const pill = host.querySelector('.ty-status')!
    expect(pill).toHaveAttribute('data-tone', 'info')
    expect(pill).toHaveAttribute('data-busy', '')
    expect(pill).toHaveTextContent('Processing')
    host.setAttribute('status', 'success')
    expect(pill).toHaveAttribute('data-tone', 'success')
    expect(pill).not.toHaveAttribute('data-busy')
    expect(pill).toHaveTextContent('Success')
  })

  it('lets an explicit tone and label win over the map', () => {
    html('<ty-status-pill status="active" tone="warning" label="Degraded"></ty-status-pill>')
    const pill = document.body.querySelector('.ty-status')!
    expect(pill).toHaveAttribute('data-tone', 'warning')
    expect(pill).toHaveTextContent('Degraded')
  })

  it('warns and stays neutral for an unknown status, falling back to the key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    html('<ty-status-pill status="archived"></ty-status-pill>')
    const pill = document.body.querySelector('.ty-status')!
    expect(pill).not.toHaveAttribute('data-tone')
    expect(pill).toHaveTextContent('archived')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('creates a live region only when asked (announce)', () => {
    html('<ty-status-pill status="active">Active</ty-status-pill><ty-status-pill status="error" announce>Error</ty-status-pill>')
    expect(document.body.querySelectorAll('[role="status"]')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Error')
  })

  it('React wrapper: renders the anatomy with its tone, size and icon, and the map fills in after upgrade', async () => {
    render(<TyStatusPill status="active" tone="success" size="small" icon="✓">Active</TyStatusPill>)
    const pill = document.body.querySelector('.ty-status')!
    expect(pill).toHaveAttribute('data-tone', 'success')
    expect(pill).toHaveAttribute('data-size', 'small')
    expect(pill.querySelector('.ty-status__icon')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-spinner>', () => {
  it('is an indeterminate progressbar named by its label, drawing a ring by default', async () => {
    html('<ty-spinner label="Saving"></ty-spinner>')
    const bar = screen.getByRole('progressbar', { name: 'Saving' })
    expect(bar).toHaveClass('ty-spinner')
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(bar).toHaveAttribute('data-shape', 'ring')
    expect(bar.querySelector('.ty-spinner__ring')).not.toBeNull()
    expect(bar.querySelector('.ty-spinner__dots')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('defaults to the English "Loading" name and follows attribute changes from plain HTML', () => {
    const host = html('<ty-spinner></ty-spinner>').querySelector('ty-spinner') as HTMLElement & { shape: string; tone: string; size: string }
    const bar = screen.getByRole('progressbar', { name: 'Loading' })
    expect(bar).toHaveAttribute('data-size', 'medium')
    expect(bar).toHaveAttribute('data-tone', 'inherit')
    host.shape = 'dots'
    expect(bar.querySelector('.ty-spinner__dots')).not.toBeNull()
    expect(bar.querySelectorAll('.ty-spinner__dot')).toHaveLength(3)
    expect(bar.querySelector('.ty-spinner__ring')).toBeNull()
    host.tone = 'accent'
    host.size = 'large'
    expect(bar).toHaveAttribute('data-tone', 'accent')
    expect(bar).toHaveAttribute('data-size', 'large')
  })

  it('shows the default slot as a decorative label next to the indicator', () => {
    html('<ty-spinner label="Saving">Saving</ty-spinner>')
    const bar = screen.getByRole('progressbar', { name: 'Saving' })
    const caption = bar.querySelector('.ty-spinner__label')
    expect(caption).toHaveTextContent('Saving')
    expect(caption).toHaveAttribute('aria-hidden', 'true')
  })

  it('stops animating and reveals the label under reduced motion', () => {
    html('<ty-spinner label="Saving"></ty-spinner>')
    const bar = screen.getByRole('progressbar', { name: 'Saving' })
    expect(bar).not.toHaveAttribute('data-reduced-motion')
    expect(bar.querySelector('.ty-spinner__label')).toBeNull()
    setMedia({ reducedMotion: true })
    expect(bar).toHaveAttribute('data-reduced-motion')
    expect(bar.querySelector('.ty-spinner__label')).toHaveTextContent('Saving')
    const reduced = mediaBlock(cssOf('components/spinner/Spinner.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-spinner__ring[^{]*\{[^}]*animation:\s*none/)
    expect(reduced).toMatch(/\.ty-spinner__dot[^{]*\{[^}]*animation:\s*none/)
    setMedia({ reducedMotion: false })
    expect(bar).not.toHaveAttribute('data-reduced-motion')
    expect(bar.querySelector('.ty-spinner__label')).toBeNull()
  })

  it('is symmetric: the same accessible name and no violations in right-to-left', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-spinner label="جارٍ الحفظ" shape="dots">جارٍ الحفظ</ty-spinner>')
    expect(screen.getByRole('progressbar', { name: 'جارٍ الحفظ' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('React wrapper: renders the anatomy and the visible label', async () => {
    render(
      <TySpinner label="Saving" shape="dots" tone="neutral">
        Saving
      </TySpinner>,
    )
    const bar = screen.getByRole('progressbar', { name: 'Saving' })
    expect(bar).toHaveAttribute('data-shape', 'dots')
    expect(bar).toHaveAttribute('data-tone', 'neutral')
    expect(bar.querySelector('.ty-spinner__dots')).not.toBeNull()
    expect(bar.querySelector('.ty-spinner__label')).toHaveTextContent('Saving')
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-surface>', () => {
  it('is a region named by its title, with its elevation and padding attributes', async () => {
    html('<ty-surface elevation="raised" padding="roomy"><span slot="title">Evidence</span><span slot="description">Collected</span>Body<span slot="footer">Footer</span></ty-surface>')
    const region = screen.getByRole('region', { name: 'Evidence' })
    expect(region).toHaveClass('ty-surface')
    expect(region.localName).toBe('section')
    expect(region).toHaveAttribute('data-elevation', 'raised')
    expect(region).toHaveAttribute('data-padding', 'roomy')
    expect(screen.getByRole('heading', { level: 3, name: 'Evidence' })).toHaveClass('ty-surface__title')
    expect(region.querySelector('.ty-surface__description')).toHaveTextContent('Collected')
    expect(region.querySelector('.ty-surface__body')).toHaveTextContent('Body')
    expect(region.querySelector('.ty-surface__footer')).toHaveTextContent('Footer')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('follows attribute changes from plain HTML (elevation, selected)', () => {
    const host = html('<ty-surface>Body</ty-surface>').querySelector('ty-surface') as HTMLElement & { elevation: string; selected: boolean }
    host.elevation = 'flat'
    host.selected = true
    const surface = document.body.querySelector('.ty-surface')!
    expect(surface).toHaveAttribute('data-elevation', 'flat')
    expect(surface).toHaveAttribute('data-selected', '')
    expect(surface).not.toHaveAttribute('data-pressable')
  })

  it('a pressable surface forwards presses outside nested controls to the title control', async () => {
    const onClick = vi.fn()
    const onNested = vi.fn()
    render(
      <TySurface pressable title="TAMM" onClick={onClick}>
        <p>Abu Dhabi, 2024</p>
        <button type="button" onClick={onNested}>
          Edit
        </button>
      </TySurface>,
    )
    expect(document.body.querySelector('.ty-surface')).toHaveAttribute('data-pressable', '')
    await userEvent.click(screen.getByText('Abu Dhabi, 2024'))
    expect(onClick).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onNested).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is operated from the keyboard through the title control', async () => {
    const onClick = vi.fn()
    render(<TySurface pressable title="TAMM" onClick={onClick} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'TAMM' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('a surface with href is a whole-card link whose hit area is the card', async () => {
    render(
      <TySurface href="/base/boti" title="Boti">
        <p>Argentina</p>
      </TySurface>,
    )
    const link = screen.getByRole('link', { name: 'Boti' })
    expect(link).toHaveAttribute('href', '/base/boti')
    const clicked = vi.fn((event: Event) => event.preventDefault())
    link.addEventListener('click', clicked)
    await userEvent.click(screen.getByText('Argentina'))
    expect(clicked).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('does not forward while disabled, and disables the primary control', async () => {
    const onClick = vi.fn()
    render(
      <TySurface pressable disabled title="Archived" onClick={onClick}>
        Body
      </TySurface>,
    )
    expect(document.body.querySelector('.ty-surface')).toHaveAttribute('data-disabled', '')
    expect(screen.getByRole('button', { name: 'Archived' })).toBeDisabled()
    await userEvent.click(screen.getByText('Body'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a disabled link keeps its name but drops the href', () => {
    render(<TySurface href="/runs/1" disabled title="Old run" />)
    expect(screen.queryByRole('link')).toBeNull()
    const primary = document.body.querySelector('.ty-surface__primary')!
    expect(primary).not.toHaveAttribute('href')
    expect(primary).toHaveAttribute('aria-disabled', 'true')
    expect(primary).toHaveTextContent('Old run')
  })

  it('builds the primary control from plain HTML and forwards to it', async () => {
    html('<ty-surface pressable><span slot="title">Open</span>Body</ty-surface>')
    const primary = screen.getByRole('button', { name: 'Open' })
    const clicked = vi.fn()
    primary.addEventListener('click', clicked)
    await userEvent.click(screen.getByText('Body'))
    expect(clicked).toHaveBeenCalledTimes(1)
    // The press on the primary itself is not forwarded twice.
    await userEvent.click(primary)
    expect(clicked).toHaveBeenCalledTimes(2)
  })

  it('warns when pressable without a title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    html('<ty-surface pressable>Body</ty-surface>')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('title'))
    warn.mockRestore()
  })

  it('is symmetric: the same accessible name and no violations in right-to-left', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-surface><span slot="title">الإصدار الحالي</span><span slot="description">مجمّد</span>نص</ty-surface>')
    expect(screen.getByRole('region', { name: 'الإصدار الحالي' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('React wrapper: renders the title at the chosen heading level and the slots', async () => {
    render(
      <TySurface titleLevel="h2" title="Settings" description="Account" footer={<button type="button">Save</button>}>
        Body
      </TySurface>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toBeInTheDocument()
    expect(document.body.querySelector('.ty-surface__description')).toHaveTextContent('Account')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })
})


describe('<ty-inline-notice>', () => {
  it('is a status for polite tones and an alert for assertive ones, with a hidden tone word', async () => {
    html('<ty-inline-notice>Saved.</ty-inline-notice><ty-inline-notice tone="danger">Failed.</ty-inline-notice><ty-inline-notice tone="warning">Incomplete.</ty-inline-notice><ty-inline-notice tone="success">Live.</ty-inline-notice>')
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(2)
    expect(statuses.map((s) => s.getAttribute('data-tone'))).toEqual(['info', 'success'])
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    const danger = alerts[0]!
    expect(danger).toHaveAttribute('data-tone', 'danger')
    expect(danger.querySelector('.ty-notice__message .ty-visually-hidden')).toHaveTextContent('Error:')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('urgency overrides the tone default; "none" leaves no live role', () => {
    html('<ty-inline-notice tone="success" urgency="assertive">Live.</ty-inline-notice><ty-inline-notice urgency="none">Loaded already.</ty-inline-notice>')
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'success')
    const none = screen.getByText('Loaded already.').closest('.ty-notice')!
    expect(none).not.toHaveAttribute('role')
  })

  it('renders the title at the chosen level and the tone word inside it', () => {
    html('<ty-inline-notice tone="warning" title-as="h3"><span slot="title">Two sources unavailable</span>Results may be incomplete.</ty-inline-notice>')
    const title = screen.getByRole('heading', { level: 3, name: /Two sources unavailable/ })
    expect(title.querySelector('.ty-visually-hidden')).toHaveTextContent('Warning:')
  })

  it('dismiss emits ty-dismiss and moves focus to the next logical element', async () => {
    const host = html('<ty-inline-notice dismissible>Version 12 is live.</ty-inline-notice><button type="button">Next</button>')
    const dismissed = vi.fn()
    host.querySelector('ty-inline-notice')!.addEventListener('ty-dismiss', dismissed)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(dismissed).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus())
  })

  it('translates the dismiss button through dismiss-label', () => {
    html('<ty-inline-notice dismissible dismiss-label="Dispensar aviso">Aviso.</ty-inline-notice>')
    expect(screen.getByRole('button', { name: 'Dispensar aviso' })).toBeInTheDocument()
  })

  it('React wrapper: onDismiss fires and the actions slot renders', async () => {
    const onDismiss = vi.fn()
    render(
      <TyInlineNotice tone="success" dismissible onDismiss={onDismiss} actions={<button type="button">Undo</button>}>
        Version 12 is live.
      </TyInlineNotice>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-inline-notice tone="danger" dismissible dismiss-label="إخفاء">فشل الحفظ.</ty-inline-notice>')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إخفاء' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-native-select>', () => {
  it('is a native select named by its label, with a disabled empty placeholder first', async () => {
    html('<ty-native-select name="region" placeholder="Choose a region…"><span slot="label">Region</span><option value="us">US East</option><option value="eu">EU</option></ty-native-select>')
    const select = screen.getByRole('combobox', { name: 'Region' })
    expect(select).toHaveClass('ty-native-select__control')
    const placeholder = select.querySelector('option')!
    expect(placeholder).toHaveValue('')
    expect(placeholder).toBeDisabled()
    expect(placeholder).toHaveAttribute('label', 'Choose a region…')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('is described by its hint, and an error invalidates and describes it', async () => {
    html('<ty-native-select name="region"><span slot="label">Region</span><span slot="hint">Where the workflow runs</span><option value="us">US</option></ty-native-select>')
    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveAccessibleDescription('Where the workflow runs')
    document.body.replaceChildren()
    html('<ty-native-select name="region"><span slot="label">Region</span><span slot="error">Pick a region</span><option value="us">US</option></ty-native-select>')
    const select = screen.getByRole('combobox', { name: 'Region' })
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Pick a region')
    expect(document.querySelector('.ty-native-select__error')).toHaveAttribute('role', 'alert')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('mirrors the value attribute in without disturbing an open choice, and submits natively', async () => {
    const container = html('<form><ty-native-select name="region" value="us"><span slot="label">Region</span><option value="us">US</option><option value="eu">EU</option></ty-native-select></form>')
    const select = screen.getByRole('combobox', { name: 'Region' }) as HTMLSelectElement
    expect(select).toHaveValue('us')
    await userEvent.selectOptions(select, 'eu')
    expect(select).toHaveValue('eu')
    const host = container.querySelector('ty-native-select')!
    // A stale attribute write that matches the control is a no-op; a new value wins.
    host.setAttribute('value', 'eu')
    expect(select).toHaveValue('eu')
    host.setAttribute('value', 'us')
    expect(select).toHaveValue('us')
    expect(new FormData(container.querySelector('form')!).get('region')).toBe('us')
  })

  it('follows attribute changes from plain HTML (disabled, invalid, required)', () => {
    const host = html('<ty-native-select><span slot="label">Region</span><option value="us">US</option></ty-native-select>').querySelector('ty-native-select')!
    const select = screen.getByRole('combobox', { name: 'Region' })
    host.setAttribute('disabled', '')
    expect(select).toBeDisabled()
    expect(host.querySelector('.ty-native-select')).toHaveAttribute('data-disabled')
    host.setAttribute('invalid', '')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    host.setAttribute('required', '')
    expect(select).toBeRequired()
  })

  it('React wrapper: controlled, reports the chosen value', async () => {
    const onChange = vi.fn()
    render(
      <TyNativeSelect label="Region" name="region" value="us" onChange={onChange}>
        <option value="us">US</option>
        <option value="eu">EU</option>
      </TyNativeSelect>,
    )
    const select = screen.getByRole('combobox', { name: 'Region' })
    expect(select).toHaveValue('us')
    await userEvent.selectOptions(select, 'eu')
    expect(onChange).toHaveBeenCalledWith({ value: 'eu' }, expect.anything())
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('works the same in right-to-left documents', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html('<ty-native-select name="region"><span slot="label">المنطقة</span><option value="us">الشرق</option></ty-native-select>')
    expect(screen.getByRole('combobox', { name: 'المنطقة' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })
})


describe('<ty-skeleton>', () => {
  it('renders a block per shape and width, hidden from assistive technology', async () => {
    html('<ty-skeleton></ty-skeleton><ty-skeleton shape="heading" width="short"></ty-skeleton><ty-skeleton shape="circle"></ty-skeleton><ty-skeleton shape="rect" width="medium"></ty-skeleton>')
    const roots = document.body.querySelectorAll('.ty-skeleton-root')
    expect(roots).toHaveLength(4)
    expect(roots[0]!.querySelector('.ty-skeleton-lines > .ty-skeleton')).toHaveAttribute('data-shape', 'line')
    expect(roots[1]!.querySelector('.ty-skeleton')).toHaveAttribute('data-width', 'short')
    expect(roots[2]!.querySelector('.ty-skeleton-content > .ty-skeleton')).toHaveAttribute('data-shape', 'circle')
    expect(roots[3]!.querySelector('.ty-skeleton')).toHaveAttribute('data-width', 'medium')
    for (const root of roots) {
      expect(root.querySelector('.ty-skeleton-content')).toHaveAttribute('aria-hidden', 'true')
      expect(root).not.toHaveAttribute('aria-busy')
    }
    expect(screen.queryByRole('status')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('stacks lines with varied widths, the last one short', () => {
    const host = html('<ty-skeleton lines="3"></ty-skeleton>').querySelector('ty-skeleton')!
    const blocks = host.querySelectorAll('.ty-skeleton-lines > .ty-skeleton')
    expect(blocks).toHaveLength(3)
    const widths = Array.from(blocks).map((b) => b.getAttribute('data-width'))
    expect(widths).toEqual(['long', 'full', 'short'])
    expect(new Set(widths).size).toBeGreaterThanOrEqual(2)
    host.setAttribute('lines', '2')
    expect(host.querySelectorAll('.ty-skeleton-lines > .ty-skeleton')).toHaveLength(2)
    host.setAttribute('lines', '1')
    expect(host.querySelectorAll('.ty-skeleton-lines > .ty-skeleton')).toHaveLength(1)
  })

  it('accepts a custom CSS length as width, resolved on upgrade', () => {
    const host = html('<ty-skeleton width="12rem"></ty-skeleton>').querySelector('ty-skeleton')!
    const block = host.querySelector<HTMLElement>('.ty-skeleton')!
    expect(block).toHaveAttribute('data-width', 'custom')
    expect(block.style.inlineSize).toBe('12rem')
    host.setAttribute('width', 'long')
    expect(block).toHaveAttribute('data-width', 'long')
    expect(block.style.inlineSize).toBe('')
  })

  it('composes the stats preset with count and columns', () => {
    html('<ty-skeleton preset="stats" count="3" columns="3"></ty-skeleton>')
    const grid = document.body.querySelector<HTMLElement>('.ty-skeleton-grid')!
    expect(grid).toHaveAttribute('data-preset', 'stats')
    expect(grid.style.getPropertyValue('--ty-skeleton-columns')).toBe('3')
    expect(grid.querySelectorAll('[data-part="stat"]')).toHaveLength(3)
    expect(cssOf('components/skeleton/Skeleton.css')).toMatch(/grid-template-columns:\s*repeat\(var\(--ty-skeleton-columns/)
  })

  it('composes the other presets with their defaults', () => {
    html('<ty-skeleton preset="cards"></ty-skeleton><ty-skeleton preset="section-heading"></ty-skeleton><ty-skeleton preset="filters"></ty-skeleton><ty-skeleton preset="analysis"></ty-skeleton>')
    const cards = document.body.querySelector('.ty-skeleton-grid[data-preset="cards"]')!
    expect(cards.querySelectorAll('[data-part="card"]')).toHaveLength(6)
    const heading = document.body.querySelector('.ty-skeleton-row[data-preset="section-heading"]')!
    expect(heading.querySelector('.ty-skeleton[data-shape="circle"]')).not.toBeNull()
    expect(heading.querySelectorAll('.ty-skeleton-lines > .ty-skeleton')).toHaveLength(2)
    expect(document.body.querySelectorAll('.ty-skeleton-row[data-preset="filters"] .ty-skeleton--pill')).toHaveLength(5)
    const analysis = document.body.querySelector('.ty-skeleton-tile[data-preset="analysis"]')!
    expect(analysis.querySelectorAll('[data-part="item"]')).toHaveLength(3)
    // Everything composed stays inside the hidden content.
    for (const block of document.body.querySelectorAll('.ty-skeleton')) {
      expect(block.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('announces the label once in a status and marks the region busy', async () => {
    html('<ty-skeleton label="Loading the catalogue" lines="2"></ty-skeleton>')
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveTextContent('Loading the catalogue')
    expect(statuses[0]).toHaveClass('ty-visually-hidden')
    expect(statuses[0]!.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.querySelector('.ty-skeleton-root')).toHaveAttribute('aria-busy', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('stops the pulse under reduced motion (opacity-only pulse otherwise)', () => {
    const css = cssOf('components/skeleton/Skeleton.css')
    expect(css).toMatch(/animation:\s*ty-skeleton-pulse var\(--ty-dur-pulse\)/)
    expect(css).toMatch(/@keyframes ty-skeleton-pulse\s*\{[^@]*opacity[^@]*\}/)
    expect(css).not.toMatch(/@keyframes ty-skeleton-pulse\s*\{[^@]*transform/)
    const reduced = mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-skeleton\s*\{[^}]*animation:\s*none/)
  })

  it('React wrapper: renders the anatomy, and the element composes the preset on upgrade', async () => {
    render(<TySkeleton preset="cards" count={2} columns={2} label="Loading" />)
    const grid = document.body.querySelector<HTMLElement>('.ty-skeleton-grid')!
    expect(grid).toHaveAttribute('data-preset', 'cards')
    expect(grid.style.getPropertyValue('--ty-skeleton-columns')).toBe('2')
    expect(grid.querySelectorAll('[data-part="card"]')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    expect(grid.closest('[aria-hidden="true"]')).not.toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-separator>', () => {
  it('is decorative by default: hidden from assistive technology, no role', async () => {
    html('<ty-separator></ty-separator>')
    const rule = document.body.querySelector('.ty-separator')!
    expect(screen.queryByRole('separator')).toBeNull()
    expect(rule).toHaveAttribute('aria-hidden', 'true')
    expect(rule).toHaveAttribute('data-orientation', 'horizontal')
    expect(rule).toHaveAttribute('data-emphasis', 'regular')
    expect(rule).toHaveAttribute('data-spacing', 'regular')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('exposes the non-focusable separator role when semantic, with aria-orientation', async () => {
    html('<ty-separator semantic></ty-separator><ty-separator semantic orientation="vertical"></ty-separator>')
    const [horizontal, vertical] = screen.getAllByRole('separator')
    expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal')
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
    expect(horizontal).not.toHaveAttribute('aria-hidden')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('keeps the caption readable as plain text between two decorative strokes, never carrying the role', async () => {
    html('<ty-separator semantic><span slot="caption">or</span></ty-separator>')
    expect(screen.queryByRole('separator')).toBeNull()
    const rule = document.body.querySelector('.ty-separator')!
    expect(rule).toHaveAttribute('data-captioned')
    expect(rule).not.toHaveAttribute('aria-hidden')
    const caption = rule.querySelector('.ty-separator__caption')!
    expect(caption).toHaveTextContent('or')
    expect(caption).not.toHaveAttribute('aria-hidden')
    const lines = rule.querySelectorAll('.ty-separator__line')
    expect(lines).toHaveLength(2)
    for (const line of lines) expect(line).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('follows attribute changes from plain HTML', () => {
    const host = html('<ty-separator></ty-separator>').querySelector('ty-separator')!
    const rule = host.querySelector('.ty-separator')!
    host.setAttribute('emphasis', 'soft')
    host.setAttribute('spacing', 'roomy')
    host.setAttribute('orientation', 'vertical')
    expect(rule).toHaveAttribute('data-emphasis', 'soft')
    expect(rule).toHaveAttribute('data-spacing', 'roomy')
    expect(rule).toHaveAttribute('data-orientation', 'vertical')
    host.setAttribute('semantic', '')
    expect(rule).toHaveAttribute('role', 'separator')
    expect(rule).not.toHaveAttribute('aria-hidden')
    host.removeAttribute('semantic')
    expect(rule).not.toHaveAttribute('role')
    expect(rule).toHaveAttribute('aria-hidden', 'true')
  })

  it('stays visible under forced colours, captioned or not', () => {
    const css = cssOf('components/separator/Separator.css')
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.ty-separator:not\(\.ty-separator--captioned\):not\(\[data-captioned\]\)[^{]*\{[^}]*CanvasText/)
    expect(forced).toMatch(/\.ty-separator__caption[^{]*\{[^}]*CanvasText/)
  })

  it('React wrapper: renders the rule and the captioned anatomy', async () => {
    render(<TySeparator caption="or" emphasis="soft" />)
    const rule = document.body.querySelector('.ty-separator')!
    expect(rule).toHaveAttribute('data-captioned')
    expect(rule).toHaveAttribute('data-emphasis', 'soft')
    expect(rule.querySelector('.ty-separator__caption')).toHaveTextContent('or')
    expect(rule.querySelectorAll('.ty-separator__line')).toHaveLength(2)
    await expectNoAxeViolations(document.body, ['region'])
  })
})

describe('<ty-modal>', () => {
  const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))))

  it('renders nothing in the accessibility tree while closed', () => {
    html('<ty-modal><span slot="title">Delete file?</span>This cannot be undone.</ty-modal>')
    expect(screen.queryByRole('dialog')).toBeNull()
    // The anatomy stays mounted, hidden.
    expect(document.body.querySelector('.ty-modal-dialog__backdrop')).toHaveAttribute('hidden')
  })

  it('opens from plain HTML, named by its title, with focus inside, the scroll locked and the background inert', async () => {
    const page = html('<main id="behind"><button type="button">Behind</button></main>')
    const host = html('<ty-modal open><span slot="title">Delete file?</span>This cannot be undone.<span slot="actions"><button type="button">Delete</button></span></ty-modal>').querySelector('ty-modal')!
    const dialog = screen.getByRole('dialog', { name: 'Delete file?' })
    expect(dialog).toHaveClass('ty-modal-dialog__panel')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await nextFrame()
    // The default initial focus is the first tabbable: the close button.
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    expect(document.documentElement).toHaveAttribute('data-ty-modal-open')
    expect(page).toHaveAttribute('inert')
    await expectNoAxeViolations(document.body, ['region'])
    host.remove()
    expect(document.documentElement).not.toHaveAttribute('data-ty-modal-open')
    expect(page).not.toHaveAttribute('inert')
  })

  it('Escape asks to close (ty-open-change / onOpenChange with open: false) and focus returns to the trigger', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <>
        <button type="button">Open</button>
        <TyModal isOpen={false} title="Delete file?" onOpenChange={onOpenChange} actions={<button type="button">Delete</button>}>
          This cannot be undone.
        </TyModal>
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    rerender(
      <>
        <button type="button">Open</button>
        <TyModal isOpen title="Delete file?" onOpenChange={onOpenChange} actions={<button type="button">Delete</button>}>
          This cannot be undone.
        </TyModal>
      </>,
    )
    await nextFrame()
    expect(screen.getByRole('dialog', { name: 'Delete file?' })).toBeInTheDocument()
    expect(document.activeElement).not.toBe(trigger)
    expect(trigger.closest('[inert]')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
    // Controlled: still rendered until the host flips isOpen.
    expect(screen.getByRole('dialog', { name: 'Delete file?' })).toBeInTheDocument()
    rerender(
      <>
        <button type="button">Open</button>
        <TyModal isOpen={false} title="Delete file?" onOpenChange={onOpenChange} actions={<button type="button">Delete</button>}>
          This cannot be undone.
        </TyModal>
      </>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    await nextFrame()
    expect(trigger).toHaveFocus()
    expect(trigger.closest('[inert]')).toBeNull()
    expect(document.documentElement).not.toHaveAttribute('data-ty-modal-open')
  })

  it('traps Tab: it wraps from the last control to the first and back', async () => {
    render(
      <TyModal
        isOpen
        title="Delete file?"
        actions={
          <>
            <button type="button">Cancel</button>
            <button type="button">Delete</button>
          </>
        }
      >
        This cannot be undone.
      </TyModal>,
    )
    await nextFrame()
    const close = screen.getByRole('button', { name: 'Close' })
    const last = screen.getByRole('button', { name: 'Delete' })
    expect(close).toHaveFocus()
    last.focus()
    await userEvent.keyboard('{Tab}')
    expect(close).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(last).toHaveFocus()
  })

  it('a press on the backdrop asks to close a dialog, never an alertdialog', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <TyModal isOpen title="Details" onOpenChange={onOpenChange}>
        Body
      </TyModal>,
    )
    await nextFrame()
    await userEvent.click(document.body.querySelector('.ty-modal-dialog__backdrop')!)
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
    onOpenChange.mockClear()
    rerender(
      <TyModal isOpen role="alertdialog" title="Discard changes?" onOpenChange={onOpenChange} actions={<button type="button">Discard</button>}>
        Your edits are not saved.
      </TyModal>,
    )
    await userEvent.click(document.body.querySelector('.ty-modal-dialog__backdrop')!)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument()
    // An alertdialog hides the close button unless asked for.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('busy blocks Escape, the backdrop and the close button', async () => {
    const onOpenChange = vi.fn()
    render(
      <TyModal isOpen busy title="Publishing" onOpenChange={onOpenChange}>
        Uploading the bundle.
      </TyModal>,
    )
    await nextFrame()
    const panel = screen.getByRole('dialog', { name: 'Publishing' })
    expect(panel).toHaveAttribute('data-busy')
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(document.body.querySelector('.ty-modal-dialog__backdrop')!)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(panel).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('pressing an action runs its handler; the dialog does not close by itself', async () => {
    const onOpenChange = vi.fn()
    const onDelete = vi.fn()
    render(
      <TyModal isOpen title="Delete file?" onOpenChange={onOpenChange} actions={<button type="button" onClick={onDelete}>Delete</button>}>
        This cannot be undone.
      </TyModal>,
    )
    await nextFrame()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Delete file?' })).toBeInTheDocument()
  })

  it('initial-focus="title" lands on the heading; an alertdialog lands on its first action', async () => {
    const { rerender } = render(
      <TyModal isOpen initialFocus="title" title="Keyboard shortcuts" actions={<button type="button">Done</button>}>
        Body
      </TyModal>,
    )
    await nextFrame()
    expect(screen.getByRole('heading', { name: 'Keyboard shortcuts' })).toHaveFocus()
    rerender(
      <TyModal isOpen role="alertdialog" title="Discard changes?" actions={<button type="button">Keep editing</button>}>
        Your edits are not saved.
      </TyModal>,
    )
    // Already open: the role change does not re-focus.
    expect(screen.getByRole('heading', { name: 'Discard changes?' })).toHaveFocus()
  })

  it('the close button asks to close', async () => {
    const onOpenChange = vi.fn()
    render(
      <TyModal isOpen title="Details" onOpenChange={onOpenChange}>
        Body
      </TyModal>,
    )
    await nextFrame()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
  })
})

describe('<ty-drawer>', () => {
  const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined))))

  it('renders nothing in the accessibility tree while closed', () => {
    html('<ty-drawer><span slot="title">Language</span>Pick a locale.</ty-drawer>')
    expect(screen.queryByRole('dialog')).toBeNull()
    // The anatomy stays mounted, hidden.
    expect(document.body.querySelector('.ty-drawer__backdrop')).toHaveAttribute('hidden')
  })

  it('opens from plain HTML as a dialog named by its title, focus inside, scroll locked and the background inert', async () => {
    const page = html('<main id="drawer-behind"><button type="button">Behind</button></main>')
    const host = html('<ty-drawer open><span slot="title">Language</span>Pick a locale.<span slot="actions"></span></ty-drawer>').querySelector('ty-drawer')!
    const dialog = screen.getByRole('dialog', { name: 'Language' })
    expect(dialog).toHaveClass('ty-drawer__dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Bottom placement: handle and safe-area inset.
    expect(host.querySelector('.ty-drawer__handle')).not.toBeNull()
    expect(host.querySelector('.ty-drawer__inset')).not.toBeNull()
    await nextFrame()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    expect(document.documentElement).toHaveAttribute('data-ty-drawer-open')
    expect(page).toHaveAttribute('inert')
    await expectNoAxeViolations(document.body, ['region'])
    host.remove()
    expect(document.documentElement).not.toHaveAttribute('data-ty-drawer-open')
    expect(page).not.toHaveAttribute('inert')
  })

  it('an end placement has a width step, no handle and no inset', () => {
    const host = html('<ty-drawer open placement="end" width="wide"><span slot="title">Run details</span>Timeline.</ty-drawer>').querySelector('ty-drawer')!
    expect(host.querySelector('.ty-drawer')).toHaveAttribute('data-placement', 'end')
    expect(host.querySelector('.ty-drawer')).toHaveAttribute('data-width', 'wide')
    expect(host.querySelector('.ty-drawer__handle')).toBeNull()
    expect(host.querySelector('.ty-drawer__inset')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Run details' })).toBeInTheDocument()
  })

  it('Escape asks to close and focus returns to the opener (React wrapper, controlled)', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <>
        <button type="button">Open</button>
        <TyDrawer open={false} title="Language" onOpenChange={onOpenChange}>
          Pick a locale.
        </TyDrawer>
      </>,
    )
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    rerender(
      <>
        <button type="button">Open</button>
        <TyDrawer open title="Language" onOpenChange={onOpenChange}>
          Pick a locale.
        </TyDrawer>
      </>,
    )
    await nextFrame()
    expect(screen.getByRole('dialog', { name: 'Language' })).toBeInTheDocument()
    expect(document.activeElement).not.toBe(opener)
    expect(opener.closest('[inert]')).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
    // Controlled: still rendered until the host flips open.
    expect(screen.getByRole('dialog', { name: 'Language' })).toBeInTheDocument()
    rerender(
      <>
        <button type="button">Open</button>
        <TyDrawer open={false} title="Language" onOpenChange={onOpenChange}>
          Pick a locale.
        </TyDrawer>
      </>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    await nextFrame()
    expect(opener).toHaveFocus()
    expect(opener.closest('[inert]')).toBeNull()
  })

  it('a backdrop press asks to close; dismissible="false" blocks the backdrop but not Escape', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <TyDrawer open title="Filters" onOpenChange={onOpenChange}>
        Filter rows.
      </TyDrawer>,
    )
    await nextFrame()
    await userEvent.click(document.body.querySelector('.ty-drawer__backdrop')!)
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
    onOpenChange.mockClear()
    rerender(
      <TyDrawer open dismissible="false" title="Required step" onOpenChange={onOpenChange}>
        Finish the form.
      </TyDrawer>,
    )
    await userEvent.click(document.body.querySelector('.ty-drawer__backdrop')!)
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
  })

  it('traps Tab: it wraps from the last control to the first and back', async () => {
    render(
      <TyDrawer open title="Language" onOpenChange={() => {}}>
        <button type="button">Apply</button>
      </TyDrawer>,
    )
    await nextFrame()
    const close = screen.getByRole('button', { name: 'Close' })
    const apply = screen.getByRole('button', { name: 'Apply' })
    expect(close).toHaveFocus()
    apply.focus()
    await userEvent.keyboard('{Tab}')
    expect(close).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(apply).toHaveFocus()
  })

  const drag = async (from: number, to: number) => {
    const header = document.body.querySelector('.ty-drawer__header')!
    fireEvent.pointerDown(header, { clientY: from, pointerId: 1 })
    fireEvent.pointerMove(header, { clientY: to, pointerId: 1 })
    await nextFrame()
  }

  it('a drag past the distance threshold dismisses; the panel follows the pointer and the backdrop fades', async () => {
    const onOpenChange = vi.fn()
    render(
      <TyDrawer open title="Language" onOpenChange={onOpenChange}>
        Pick a locale.
      </TyDrawer>,
    )
    await nextFrame()
    await drag(100, 250)
    const panel = document.body.querySelector<HTMLElement>('.ty-drawer')!
    expect(panel.style.transform).toBe('translateY(150px)')
    expect(panel).toHaveAttribute('data-dragging')
    const backdrop = document.body.querySelector<HTMLElement>('.ty-drawer__backdrop')!
    expect(Number(backdrop.style.opacity)).toBeLessThan(1)
    fireEvent.pointerUp(document.body.querySelector('.ty-drawer__header')!, { clientY: 250, pointerId: 1 })
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
  })

  it('a slow short drag snaps back; a cancelled drag snaps back; a press on the close button is not a drag', async () => {
    const onOpenChange = vi.fn()
    render(
      <TyDrawer open title="Language" onOpenChange={onOpenChange}>
        Pick a locale.
      </TyDrawer>,
    )
    await nextFrame()
    const header = document.body.querySelector('.ty-drawer__header')!
    const panel = document.body.querySelector<HTMLElement>('.ty-drawer')!
    // 50 px in over a second: neither distance nor velocity.
    fireEvent.pointerDown(header, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientY: 130, pointerId: 1 })
    await new Promise((resolve) => setTimeout(resolve, 110))
    fireEvent.pointerMove(header, { clientY: 150, pointerId: 1 })
    fireEvent.pointerUp(header, { clientY: 150, pointerId: 1 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(panel.style.transform).toBe('')
    expect(panel).not.toHaveAttribute('data-dragging')
    // A cancelled pointer never dismisses.
    fireEvent.pointerDown(header, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientY: 400, pointerId: 1 })
    fireEvent.pointerCancel(header, { clientY: 400, pointerId: 1 })
    expect(onOpenChange).not.toHaveBeenCalled()
    // The close button is a press, not a drag start.
    const close = screen.getByRole('button', { name: 'Close' })
    fireEvent.pointerDown(close, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientY: 400, pointerId: 1 })
    expect(panel.style.transform).toBe('')
    await userEvent.click(close)
    expect(onOpenChange).toHaveBeenCalledWith({ open: false })
  })

  it('dismissible="false" blocks the drag too', async () => {
    const onOpenChange = vi.fn()
    render(
      <TyDrawer open dismissible="false" title="Required step" onOpenChange={onOpenChange}>
        Finish the form.
      </TyDrawer>,
    )
    await nextFrame()
    const header = document.body.querySelector('.ty-drawer__header')!
    fireEvent.pointerDown(header, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(header, { clientY: 400, pointerId: 1 })
    fireEvent.pointerUp(header, { clientY: 400, pointerId: 1 })
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(document.body.querySelector<HTMLElement>('.ty-drawer')!.style.transform).toBe('')
  })

  it('applies max-height to a bottom panel on upgrade', async () => {
    const host = html('<ty-drawer open max-height="60dvh"><span slot="title">Shortcuts</span>Keys.</ty-drawer>').querySelector('ty-drawer')!
    await nextFrame()
    expect(host.querySelector<HTMLElement>('.ty-drawer')!.style.maxBlockSize).toBe('60dvh')
    host.setAttribute('placement', 'end')
    await nextFrame()
    expect(host.querySelector<HTMLElement>('.ty-drawer')!.style.maxBlockSize).toBe('')
  })
})
