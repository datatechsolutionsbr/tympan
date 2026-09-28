// Behaviour of <ty-tag-field> (spec: wave-2/tag-field.md): the commit gate,
// the controlled value, the combobox keyboard model and the shared-CSS
// contract. Self-contained: registers only this element.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { tagFieldDefinition } from '../../src/elements/tag-field/definition'
import { TyTagFieldElement } from '../../src/elements/tag-field/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyTagFieldElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
})

type TagFieldHost = HTMLElement & { validate?: (raw: string) => string | null }

/** The controlled host: records every `ty-change` list and writes it back. */
const control = (host: Element) => {
  const changes: string[][] = []
  host.addEventListener('ty-change', (event) => {
    const next = JSON.parse((event as CustomEvent).detail.value) as string[]
    changes.push(next)
    host.setAttribute('value', JSON.stringify(next))
  })
  return changes
}

const tagField = (markup: string): TagFieldHost => html(markup).querySelector('ty-tag-field') as TagFieldHost

describe('<ty-tag-field>', () => {
  it('commits a typed value on Enter and asks the host for the next list', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Tags"></ty-tag-field>')
    const changes = control(host)
    await userEvent.type(screen.getByRole('textbox', { name: 'Tags' }), 'alpha{Enter}')
    expect(changes).toEqual([['alpha']])
    // The host wrote it back: the pill and an empty entry again.
    expect(screen.getByRole('list', { name: 'Tags: chosen values' })).toHaveTextContent('alpha')
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('commits on comma and never lets the comma reach the text', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Tags"></ty-tag-field>')
    const changes = control(host)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await userEvent.type(input, 'beta,gamma')
    expect(changes).toEqual([['beta']])
    expect(input).toHaveValue('gamma')
  })

  it('refuses a duplicate ignoring case and surrounding space', async () => {
    const host = tagField('<ty-tag-field value=\'["Alpha"]\' label="Tags"></ty-tag-field>')
    const changes = control(host)
    await userEvent.type(screen.getByRole('textbox', { name: 'Tags' }), ' alpha {Enter}')
    expect(changes).toEqual([])
  })

  it('runs the host\'s validate: normalises or rejects', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Tags"></ty-tag-field>')
    host.validate = (raw) => (raw.includes(' ') ? null : raw.toLowerCase())
    const changes = control(host)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await userEvent.type(input, 'bad value{Enter}')
    expect(changes).toEqual([])
    // A refused entry keeps its text for correction (the React TagField's
    // behaviour), so the next probe starts from a cleared entry.
    await userEvent.clear(input)
    await userEvent.type(input, 'HELLO{Enter}')
    expect(changes).toEqual([['hello']])
  })

  it('disables the entry at max and re-enables it after a removal', async () => {
    const host = tagField('<ty-tag-field value=\'["one","two"]\' max="2" label="Tags"></ty-tag-field>')
    const changes = control(host)
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Remove two' }))
    expect(changes).toEqual([['one']])
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeEnabled()
  })

  it('Backspace on an empty entry removes the last pill', async () => {
    const host = tagField('<ty-tag-field value=\'["one","two"]\' label="Tags"></ty-tag-field>')
    const changes = control(host)
    const input = screen.getByRole('textbox', { name: 'Tags' })
    await userEvent.click(input)
    await userEvent.keyboard('{Backspace}')
    expect(changes).toEqual([['one']])
    // A non-empty draft keeps Backspace for editing.
    await userEvent.type(input, 'x{Backspace}')
    expect(changes).toEqual([['one']])
  })

  it('returns focus to the entry when a pill is removed', async () => {
    const host = tagField('<ty-tag-field value=\'["one","two"]\' label="Tags"></ty-tag-field>')
    control(host)
    await userEvent.click(screen.getByRole('button', { name: 'Remove one' }))
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveFocus()
  })

  it('with suggestions-only, rejects values outside the list and accepts listed ones', async () => {
    const host = tagField(
      '<ty-tag-field value="[]" label="Servers" suggestions=\'["prod-server","dev-server"]\' allow-free-text="false"></ty-tag-field>',
    )
    const changes = control(host)
    const input = screen.getByRole('combobox', { name: 'Servers' })
    await userEvent.type(input, 'zzz{Enter}')
    expect(changes).toEqual([])
    await userEvent.clear(input)
    await userEvent.type(input, 'prod-server{Enter}')
    expect(changes).toEqual([['prod-server']])
  })

  it('ArrowUp with no highlight highlights the last option; Enter commits it', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Pick" suggestions=\'["alpha","beta","gamma"]\'></ty-tag-field>')
    const changes = control(host)
    const input = screen.getByRole('combobox', { name: 'Pick' })
    await userEvent.click(input)
    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['alpha', 'beta', 'gamma'])
    await userEvent.keyboard('{ArrowUp}')
    expect(options[2]).toHaveAttribute('data-focused')
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id)
    await userEvent.keyboard('{Enter}')
    expect(changes).toEqual([['gamma']])
  })

  it('ArrowDown wraps around and the list excludes values already chosen', async () => {
    const host = tagField('<ty-tag-field value=\'["beta"]\' label="Pick" suggestions=\'["alpha","beta"]\'></ty-tag-field>')
    control(host)
    const input = screen.getByRole('combobox', { name: 'Pick' })
    await userEvent.click(input)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['alpha'])
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    const option = screen.getByRole('option', { name: 'alpha' })
    expect(option).toHaveAttribute('data-focused')
    expect(input).toHaveAttribute('aria-activedescendant', option.id)
  })

  it('Escape closes the popup without committing', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Pick" suggestions=\'["alpha","beta"]\'></ty-tag-field>')
    const changes = control(host)
    const input = screen.getByRole('combobox', { name: 'Pick' })
    await userEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('listbox', { hidden: true })).not.toBeVisible()
    expect(changes).toEqual([])
  })

  it('closes the popup when focus leaves the field, keeping a pointer choice', async () => {
    const host = tagField('<ty-tag-field value="[]" label="Pick" suggestions=\'["alpha","beta"]\'></ty-tag-field>')
    const changes = control(host)
    const input = screen.getByRole('combobox', { name: 'Pick' })
    await userEvent.click(input)
    // A pointer choice commits without the entry ever losing focus first.
    await userEvent.pointer({ keys: '[MouseLeft]', target: screen.getByRole('option', { name: 'beta' }) })
    expect(changes).toEqual([['beta']])
    expect(input).toHaveFocus()
    // Tabbing out closes an open popup.
    await userEvent.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    await userEvent.tab()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('matches the draft against value and display text, and paints the labels', async () => {
    const host = tagField(
      '<ty-tag-field value="[]" label="Servers" suggestions=\'["srv_1","srv_2"]\' suggestion-labels=\'{"srv_1":"Production Server"}\'></ty-tag-field>',
    )
    control(host)
    const input = screen.getByRole('combobox', { name: 'Servers' })
    await userEvent.type(input, 'production')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Production Server'])
    await userEvent.keyboard('{Enter}')
    // The pill carries the display text, the remove control names it.
    expect(screen.getByRole('button', { name: 'Remove Production Server' })).toBeInTheDocument()
  })

  it('links helper text as the entry\'s description and error text as invalid', async () => {
    tagField('<ty-tag-field value="[]" label="Tags" helper-text="Comma separates" error-text="Too many"></ty-tag-field>')
    const input = screen.getByRole('textbox', { name: 'Tags' })
    expect(input).toHaveAccessibleDescription('Comma separates Too many')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(document.querySelector('.ty-tag-field')).toHaveAttribute('data-invalid')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('names the entry with accessible-label when there is no visible label', async () => {
    tagField('<ty-tag-field value="[]" accessible-label="Allowed values"></ty-tag-field>')
    expect(screen.getByRole('textbox', { name: 'Allowed values' })).toBeInTheDocument()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('disables the entry and every remove control', async () => {
    const host = tagField('<ty-tag-field value=\'["locked"]\' label="Tags" disabled></ty-tag-field>')
    const changes = control(host)
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove locked' })).toBeDisabled()
    expect(changes).toEqual([])
  })

  it('translates the remove controls and the list names through its labels', async () => {
    tagField(
      '<ty-tag-field value=\'["spar"]\' label="Marker" remove-label="Fjern {value}" chosen-label="{field}: valgte verdier"></ty-tag-field>',
    )
    expect(screen.getByRole('button', { name: 'Fjern spar' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Marker: valgte verdier' })).toBeInTheDocument()
  })

  it('takes the accent tone and a normalised categorical tint', () => {
    const accent = tagField('<ty-tag-field value=\'["a"]\' label="T" tone="accent"></ty-tag-field>')
    expect(accent.querySelector('.ty-tag-field')).toHaveAttribute('data-tone', 'accent')
    const category = tagField('<ty-tag-field value=\'["a"]\' label="C" category-index="9"></ty-tag-field>')
    expect(category).toHaveAttribute('category-index', '1')
    const root = category.querySelector('.ty-tag-field') as HTMLElement
    expect(root).toHaveAttribute('data-tone', 'category')
    expect(root.style.getPropertyValue('--ty-tag-field-tint')).toBe('var(--ty-categorical-1)')
  })

  it('follows attribute changes from the host (value, error, disabled)', () => {
    const host = tagField('<ty-tag-field value="[]" label="Tags"></ty-tag-field>')
    host.setAttribute('value', '["hosted"]')
    expect(screen.getByRole('button', { name: 'Remove hosted' })).toBeInTheDocument()
    host.setAttribute('error-text', 'Nope')
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveAccessibleDescription('Nope')
    host.setAttribute('disabled', '')
    expect(screen.getByRole('textbox', { name: 'Tags' })).toBeDisabled()
  })

  it('uses the suggestion list\'s accessible name and the test hook', async () => {
    tagField('<ty-tag-field value="[]" label="Pick" suggestions=\'["a"]\' suggestions-label="Forslag" test-id="servers"></ty-tag-field>')
    await userEvent.click(screen.getByRole('combobox', { name: 'Pick' }))
    expect(screen.getByRole('listbox', { name: 'Forslag' })).toBeVisible()
    expect(document.querySelector('[data-testid="servers"]')).toHaveClass('ty-tag-field')
  })

  it('React-free usage is accessible with an open popup', async () => {
    tagField('<ty-tag-field value=\'["alpha"]\' label="Pick" suggestions=\'["beta","gamma"]\'></ty-tag-field>')
    await userEvent.click(screen.getByRole('combobox', { name: 'Pick' }))
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('exposes the definition the generator reads', () => {
    expect(tagFieldDefinition.tag).toBe('ty-tag-field')
    expect(tagFieldDefinition.name).toBe('TyTagField')
    expect(tagFieldDefinition.kind).toBe('self-rendering')
    expect(tagFieldDefinition.events.map((e) => [e.type, e.reactProp, e.rustProp])).toEqual([['ty-change', 'onChange', 'on_change']])
  })
})

describe('TagField.css contract for <ty-tag-field>', () => {
  const css = cssOf('components/tag-field/TagField.css')

  it('consumes the categorical tint on the category tone', () => {
    expect(css).toContain("[data-tone='category']")
    expect(css).toContain('--ty-tf-mark: var(--ty-tag-field-tint, var(--ty-ink-3))')
  })

  it('anchors the element\'s suggestion layer under the well', () => {
    expect(css).toContain('ty-tag-field .ty-tag-field__frame')
    expect(css).toContain('ty-tag-field .ty-tag-field__menu-layer')
    expect(css).toContain('position: absolute')
  })

  it('keeps the popup instant under reduced motion and opaque under reduced transparency', () => {
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toContain('.ty-tag-field__menu-layer[data-entering]')
    expect(mediaBlock(css, /\(prefers-reduced-transparency: reduce\)/)).toContain('--ty-tf-layer-blur: none')
  })

  it('outlines pills and uses the system highlight under forced colours', () => {
    const forced = mediaBlock(css, /\(forced-colors: active\)/)
    expect(forced).toContain('--ty-tf-chip-edge: CanvasText')
    expect(forced).toContain('background: Highlight')
  })
})
