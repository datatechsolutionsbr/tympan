// Behaviour of <ty-segmented-control>: radio-group semantics, keyboard,
// selection events, disabled and icon-only (spec: wave-1/segmented-control.md,
// acceptance tests). The element is registered directly — the barrel and the
// generated wrappers are wired up by the central integration step.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TySegmentedControlElement } from '../../src/elements/segmented-control/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TySegmentedControlElement)

const PERIODS = '["Day","Week","Month"]'

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

const segments = () => Array.from(document.body.querySelectorAll('.ty-segmented-control__segment'))
const segment = (label: string) => screen.getByRole('radio', { name: label })

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('dir')
})

describe('<ty-segmented-control>', () => {
  it('is a radio group named by its label; the selected segment is checked and alone in the tab order', async () => {
    html(`<ty-segmented-control label="Period" value="Week" options='${PERIODS}'></ty-segmented-control>`)
    const group = screen.getByRole('radiogroup', { name: 'Period' })
    expect(group).toHaveClass('ty-segmented-control')
    expect(group).toHaveAttribute('data-size', 'regular')
    const [day, week, month] = segments()
    expect(week).toHaveAttribute('aria-checked', 'true')
    expect(week).toHaveAttribute('data-selected')
    expect(day).toHaveAttribute('aria-checked', 'false')
    expect(month).toHaveAttribute('aria-checked', 'false')
    expect(week).toHaveAttribute('tabindex', '0')
    expect(day).toHaveAttribute('tabindex', '-1')
    expect(month).toHaveAttribute('tabindex', '-1')
    // No live region: the checked state conveys the change.
    expect(screen.queryByRole('status')).toBeNull()
    await userEvent.tab()
    expect(week).toHaveFocus()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('ArrowRight selects the next segment, emits ty-change and moves the focus', async () => {
    const host = html(`<ty-segmented-control label="Period" value="Week" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    const changes: unknown[] = []
    host.addEventListener('ty-change', (event) => changes.push((event as CustomEvent).detail))
    segment('Week').focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(changes).toEqual([{ value: 'Month' }])
    // Controlled: the selection follows the host's value attribute.
    expect(segment('Week')).toHaveAttribute('aria-checked', 'true')
    host.setAttribute('value', 'Month')
    expect(segment('Month')).toHaveAttribute('aria-checked', 'true')
    expect(segment('Month')).toHaveAttribute('data-selected')
    expect(segment('Month')).toHaveFocus()
  })

  it('wraps around: ArrowRight on the last segment selects the first, ArrowLeft the other way', async () => {
    const host = html(`<ty-segmented-control label="Period" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    const changes: unknown[] = []
    host.addEventListener('ty-change', (event) => changes.push((event as CustomEvent).detail))
    // Uncontrolled without default-value: the first option is selected.
    expect(segment('Day')).toHaveAttribute('aria-checked', 'true')
    segment('Day').focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(segment('Month')).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(segment('Day')).toHaveAttribute('aria-checked', 'true')
    expect(changes).toEqual([{ value: 'Month' }, { value: 'Day' }])
    // The uncontrolled element mirrors the selection into the value attribute.
    expect(host).toHaveAttribute('value', 'Day')
  })

  it('ArrowUp/ArrowDown move like Left/Right; Home and End jump to the ends', async () => {
    html(`<ty-segmented-control label="Period" options='${PERIODS}'></ty-segmented-control>`)
    segment('Day').focus()
    await userEvent.keyboard('{End}')
    expect(segment('Month')).toHaveAttribute('aria-checked', 'true')
    expect(segment('Month')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(segment('Week')).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(segment('Month')).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{Home}')
    expect(segment('Day')).toHaveAttribute('aria-checked', 'true')
    expect(segment('Day')).toHaveFocus()
  })

  it('a press on the selected segment does nothing (no ty-change)', async () => {
    const host = html(`<ty-segmented-control label="Period" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    const onChange = vi.fn()
    host.addEventListener('ty-change', onChange)
    await userEvent.click(segment('Day'))
    expect(onChange).not.toHaveBeenCalled()
    expect(segment('Day')).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(segment('Week'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect((onChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: 'Week' })
  })

  it('honours default-value when uncontrolled', () => {
    const host = html(`<ty-segmented-control label="Period" default-value="Week" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    expect(segment('Week')).toHaveAttribute('aria-checked', 'true')
    expect(segment('Week')).toHaveAttribute('tabindex', '0')
    expect(host).not.toHaveAttribute('value')
  })

  it('disabled: nothing selects, no ty-change, and the group is exposed as disabled', async () => {
    const host = html(`<ty-segmented-control label="Period" disabled value="Week" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    const onChange = vi.fn()
    host.addEventListener('ty-change', onChange)
    const group = screen.getByRole('radiogroup', { name: 'Period' })
    expect(group).toHaveAttribute('aria-disabled', 'true')
    expect(group).toHaveAttribute('data-disabled')
    for (const option of segments()) expect(option).toBeDisabled()
    await userEvent.click(segment('Month'))
    segment('Week').focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).not.toHaveBeenCalled()
    expect(segment('Week')).toHaveAttribute('aria-checked', 'true')
    expect(host).toHaveAttribute('value', 'Week')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('icon-only: every segment keeps its label as the accessible name', async () => {
    html(`<ty-segmented-control label="Layout" icon-only value="grid" options='[{"value":"list","label":"List","icon":"M8 6h13M8 12h13M3 6h.01"},{"value":"grid","label":"Grid","icon":"M3 3h7v7H3z"}]'></ty-segmented-control>`)
    const group = screen.getByRole('radiogroup', { name: 'Layout' })
    expect(group).toHaveAttribute('data-icon-only')
    const list = segment('List')
    expect(list).toHaveAttribute('aria-label', 'List')
    expect(list.querySelector('span')).toHaveClass('ty-visually-hidden')
    const icon = list.querySelector('svg.ty-icon')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.querySelector('path')).toHaveAttribute('d', 'M8 6h13M8 12h13M3 6h.01')
    expect(segment('Grid')).toHaveAttribute('aria-checked', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('full-width stretches the segments and titles the truncated labels', () => {
    html(`<ty-segmented-control label="Mode" full-width options='["Preview","Code"]'></ty-segmented-control>`)
    const group = screen.getByRole('radiogroup', { name: 'Mode' })
    expect(group).toHaveAttribute('data-full-width')
    expect(segment('Preview')).toHaveAttribute('title', 'Preview')
    expect(segment('Preview').querySelector('span')).toHaveClass('ty-segmented-control__label')
  })

  it('follows attribute changes from plain HTML (options, size, disabled)', () => {
    const host = html(`<ty-segmented-control label="Period" options='${PERIODS}'></ty-segmented-control>`).firstElementChild!
    expect(segments()).toHaveLength(3)
    host.setAttribute('options', '["Day","Week"]')
    expect(segments()).toHaveLength(2)
    host.setAttribute('size', 'compact')
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toHaveAttribute('data-size', 'compact')
    host.setAttribute('disabled', '')
    for (const option of segments()) expect(option).toBeDisabled()
    host.removeAttribute('disabled')
    expect(segment('Day')).toHaveAttribute('tabindex', '0')
  })

  it('warns and renders no segment for invalid options JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    html('<ty-segmented-control label="Period" options="not json"></ty-segmented-control>')
    expect(segments()).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('options'))
    warn.mockRestore()
  })

  it('moves with the reading direction: ArrowLeft goes forward in right-to-left', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html(`<ty-segmented-control label="الفترة" options='["يوم","أسبوع","شهر"]'></ty-segmented-control>`)
    segment('يوم').focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(segment('أسبوع')).toHaveAttribute('aria-checked', 'true')
    expect(segment('أسبوع')).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(segment('يوم')).toHaveAttribute('aria-checked', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('CSS: every segment keeps a 44 px hit area, with native hover/focus/disabled fallbacks and reduced-motion and forced-colour rules', () => {
    const css = cssOf('components/segmented-control/SegmentedControl.css')
    expect(css).toMatch(/\.ty-segmented-control__segment::before[^{]*\{[^}]*max\(100%, var\(--ty-control-target\)\)/)
    expect(css).toMatch(/\.ty-segmented-control__segment:hover:not\(\[data-selected\], \[data-disabled\], :disabled\)/)
    expect(css).toMatch(/\.ty-segmented-control__segment:focus-visible/)
    expect(css).toMatch(/\.ty-segmented-control__segment:disabled/)
    const reduced = mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-segmented-control__segment[^{]*\{[^}]*transition:\s*none/)
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.ty-segmented-control__segment\[data-selected\][^{]*\{[^}]*Highlight/)
  })
})
