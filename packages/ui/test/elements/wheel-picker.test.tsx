// Behaviour of <ty-wheel-picker> (spec: wave-2/wheel-picker.md): selection by
// tap, scroll settle and keyboard, the multi-column group, reduced motion and
// the accessibility tree. Self-contained: registers only its own element.
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { wheelPickerDefinition } from '../../src/elements/wheel-picker/definition'
import { TyWheelPickerElement } from '../../src/elements/wheel-picker/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'
import { setMedia } from '../media'

defineTympanElement(TyWheelPickerElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

interface Change {
  value: string
  column: number
}

/** Records every `ty-change` detail of the element in `container`. */
const watch = (container: HTMLElement): Change[] => {
  const changes: Change[] = []
  container.querySelector('ty-wheel-picker')!.addEventListener('ty-change', (event) => changes.push((event as CustomEvent<Change>).detail))
  return changes
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<ty-wheel-picker>', () => {
  it('is self-rendering data, with no anatomy or examples for the parity renderers', () => {
    expect(wheelPickerDefinition.kind).toBe('self-rendering')
    expect((wheelPickerDefinition as { anatomy?: unknown }).anatomy).toBeUndefined()
    expect(wheelPickerDefinition.examples).toEqual([])
  })

  it('renders a labelled listbox of options with the value selected, axe-clean', async () => {
    html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a"></ty-wheel-picker>')
    const listbox = screen.getByRole('listbox', { name: 'Letter' })
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected')
    expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-selected', 'false')
    expect(listbox).toHaveAttribute('tabindex', '0')
    expect(listbox).toHaveAttribute('aria-activedescendant')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('reports a tapped row (acceptance: "c" clicked, onChange receives "c")', async () => {
    const container = html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a"></ty-wheel-picker>')
    const changes = watch(container)
    await userEvent.click(screen.getByRole('option', { name: 'c' }))
    expect(changes).toEqual([{ value: 'c', column: 0 }])
    expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('aria-selected', 'true')
  })

  it('reports the value of object options, not the label (acceptance)', async () => {
    const container = html(
      '<ty-wheel-picker label="Month" options=\'[{"value":"01","label":"January"},{"value":"02","label":"February"}]\' value="01"></ty-wheel-picker>',
    )
    const changes = watch(container)
    await userEvent.click(screen.getByRole('option', { name: 'February' }))
    expect(changes).toEqual([{ value: '02', column: 0 }])
  })

  it('moves one row with ArrowDown (acceptance: value "a", ArrowDown reports "b")', async () => {
    const container = html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a"></ty-wheel-picker>')
    const changes = watch(container)
    screen.getByRole('listbox', { name: 'Letter' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(changes).toEqual([{ value: 'b', column: 0 }])
    expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(changes).toEqual([{ value: 'b', column: 0 }, { value: 'a', column: 0 }])
  })

  it('moves by the visible rows with PageDown, and to the ends with Home and End', async () => {
    const container = html(
      '<ty-wheel-picker label="Number" options=\'["1","2","3","4","5","6","7","8"]\' value="1" visible-rows="3"></ty-wheel-picker>',
    )
    const changes = watch(container)
    screen.getByRole('listbox', { name: 'Number' }).focus()
    await userEvent.keyboard('{PageDown}')
    expect(changes).toEqual([{ value: '4', column: 0 }])
    await userEvent.keyboard('{End}')
    expect(changes.at(-1)).toEqual({ value: '8', column: 0 })
    await userEvent.keyboard('{Home}')
    expect(changes.at(-1)).toEqual({ value: '1', column: 0 })
  })

  it('jumps to the next matching label on a printable character', async () => {
    const container = html('<ty-wheel-picker label="Fruit" options=\'["apple","banana","cherry"]\' value="apple"></ty-wheel-picker>')
    const changes = watch(container)
    screen.getByRole('listbox', { name: 'Fruit' }).focus()
    await userEvent.keyboard('c')
    expect(changes).toEqual([{ value: 'cherry', column: 0 }])
  })

  it('tolerates a value outside the list: renders, selects nothing, reports nothing (acceptance)', () => {
    const container = html('<ty-wheel-picker label="Letter" options=\'["a","b"]\' value="zzz"></ty-wheel-picker>')
    const changes = watch(container)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.getAllByRole('option').some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false)
    expect(changes).toEqual([])
  })

  it('reports only the changed column of a multi-column group (acceptance)', async () => {
    const container = html(
      '<ty-wheel-picker label="Date" columns=\'[{"label":"Day","options":["1","2"],"value":"1"},{"label":"Month","options":["Jan","Feb"],"value":"Jan","share":2}]\'></ty-wheel-picker>',
    )
    const changes = watch(container)
    expect(screen.getByRole('group', { name: 'Date' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Day' })).toBeInTheDocument()
    const month = screen.getByRole('listbox', { name: 'Month' })
    expect(month.closest('.ty-wheel')).toHaveStyle({ '--ty-wheel-share': '2' })
    expect(month.closest('.ty-wheel')!.querySelector('.ty-wheel__caption')).toHaveTextContent('Month')
    await userEvent.click(screen.getByRole('option', { name: 'Feb' }))
    // One event, from the second column; the Day column reports nothing.
    expect(changes).toEqual([{ value: 'Feb', column: 1 }])
    expect(screen.getByRole('option', { name: '1' })).toHaveAttribute('aria-selected', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('settles a scroll on the nearest row and reports it once', () => {
    vi.useFakeTimers()
    try {
      const container = html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a"></ty-wheel-picker>')
      const changes = watch(container)
      const listbox = screen.getByRole('listbox', { name: 'Letter' })
      // The first placement's programmatic glide suppresses settle reports.
      vi.advanceTimersByTime(500)
      // jsdom rows are 0 px tall, so the element falls back to 44 px rows.
      listbox.scrollTop = 2 * 44
      fireEvent.scroll(listbox)
      listbox.scrollTop = 2 * 44 + 4
      fireEvent.scroll(listbox)
      vi.advanceTimersByTime(200)
      expect(changes).toEqual([{ value: 'c', column: 0 }])
      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-distance', '0')
      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-distance', '2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('animates programmatic moves, and jumps under reduced motion (acceptance)', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, writable: true, value: scrollTo })
    try {
      const container = html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a"></ty-wheel-picker>')
      // The first placement always jumps.
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
      const host = container.querySelector('ty-wheel-picker') as HTMLElement
      host.setAttribute('value', 'c')
      expect(scrollTo).toHaveBeenLastCalledWith({ top: 2 * 44, behavior: 'smooth' })
      setMedia({ reducedMotion: true })
      host.setAttribute('value', 'b')
      expect(scrollTo).toHaveBeenLastCalledWith({ top: 44, behavior: 'instant' })
    } finally {
      delete (Element.prototype as { scrollTo?: unknown }).scrollTo
    }
  })

  it('keeps a tap and the keys from selecting while disabled', async () => {
    const container = html('<ty-wheel-picker label="Letter" options=\'["a","b","c"]\' value="a" disabled></ty-wheel-picker>')
    const changes = watch(container)
    const listbox = screen.getByRole('listbox', { name: 'Letter' })
    expect(listbox.closest('.ty-wheel')).toHaveAttribute('data-disabled')
    await userEvent.click(screen.getByRole('option', { name: 'c' }))
    listbox.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(changes).toEqual([])
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true')
  })

  it('follows option-list changes from the host', () => {
    const container = html('<ty-wheel-picker label="Letter" options=\'["a","b"]\' value="a"></ty-wheel-picker>')
    const host = container.querySelector('ty-wheel-picker') as HTMLElement
    host.setAttribute('options', '["x","y","z"]')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'x' })).toBeInTheDocument()
  })

  it('keeps 44 px rows, a system-highlight band and the media variants in the stylesheet', () => {
    const css = cssOf('components/wheel-picker/WheelPicker.css')
    expect(css).toMatch(/--ty-wheel-row:\s*var\(--ty-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/surface-raised-solid/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transform:\s*none/)
    // The custom element's drag state lifts the snap.
    expect(css).toMatch(/\.ty-wheel\[data-dragging\]\s+\.ty-wheel__list/)
  })
})
