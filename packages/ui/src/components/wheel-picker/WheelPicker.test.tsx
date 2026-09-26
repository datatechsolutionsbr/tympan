import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setMedia } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { WheelPicker, WheelPickerGroup } from './WheelPicker'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('WheelPicker', () => {
  const scrollTo = vi.fn()
  beforeEach(() => {
    scrollTo.mockReset()
    Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, writable: true, value: scrollTo })
  })
  afterEach(() => {
    delete (Element.prototype as { scrollTo?: unknown }).scrollTo
  })

  it('reports a clicked row', async () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Letter" options={['a', 'b', 'c']} value="a" onChange={onChange} />)
    await userEvent.click(screen.getByRole('option', { name: 'c' }))
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('reports the value of object options, not the label', async () => {
    const onChange = vi.fn()
    render(
      <WheelPicker
        label="Month"
        options={[
          { value: '01', label: 'January' },
          { value: '02', label: 'February' },
        ]}
        value="01"
        onChange={onChange}
      />,
    )
    await userEvent.click(screen.getByRole('option', { name: 'February' }))
    expect(onChange).toHaveBeenCalledWith('02')
  })

  it('moves one row with ArrowDown', async () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Letter" options={['a', 'b', 'c']} value="a" onChange={onChange} />)
    await userEvent.tab()
    expect(screen.getByRole('option', { name: 'a' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('moves by the visible rows with PageDown', async () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Number" options={['1', '2', '3', '4', '5', '6', '7', '8']} value="1" onChange={onChange} visibleRows={3} />)
    await userEvent.tab()
    await userEvent.keyboard('{PageDown}')
    expect(onChange).toHaveBeenCalledWith('4')
  })

  it('tolerates a value outside the list without reporting', () => {
    const onChange = vi.fn()
    render(<WheelPicker label="Letter" options={['a', 'b']} value="zzz" onChange={onChange} />)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.getAllByRole('option').some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('calls only the changed column in a group', async () => {
    const day = vi.fn()
    const month = vi.fn()
    render(
      <WheelPickerGroup
        label="Date"
        columns={[
          { label: 'Day', options: ['1', '2'], value: '1', onChange: day },
          { label: 'Month', options: ['Jan', 'Feb'], value: 'Jan', onChange: month, share: 2 },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Date' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: 'Feb' }))
    expect(month).toHaveBeenCalledWith('Feb')
    expect(day).not.toHaveBeenCalled()
  })

  it('centres the initial value on mount, once its row exists (React 18 and 19)', async () => {
    // Clamp like a browser: a list cannot scroll past the rows it holds, so a
    // scroll issued before React Aria commits the option rows would land on 0.
    scrollTo.mockImplementation(function (this: HTMLElement, options: ScrollToOptions) {
      const rowsInDom = this.querySelectorAll('[role="option"]').length
      this.scrollTop = Math.min(options.top ?? 0, Math.max(0, rowsInDom - 1) * 44)
    })
    render(<WheelPicker label="Letter" options={['a', 'b', 'c', 'd', 'e']} value="d" onChange={() => {}} />)
    await waitFor(() => expect(scrollTo).toHaveBeenCalled())
    expect(screen.getByRole('listbox', { name: 'Letter' }).scrollTop).toBe(3 * 44)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: 3 * 44, behavior: 'instant' })
  })

  it('animates programmatic moves, and jumps under reduced motion', async () => {
    const { rerender } = render(<WheelPicker label="Letter" options={['a', 'b', 'c']} value="a" onChange={() => {}} />)
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0, behavior: 'instant' })))
    rerender(<WheelPicker label="Letter" options={['a', 'b', 'c']} value="c" onChange={() => {}} />)
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    setMedia({ reducedMotion: true })
    rerender(<WheelPicker label="Letter" options={['a', 'b', 'c']} value="b" onChange={() => {}} />)
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'instant' }))
    const reduced = mediaBlock(cssOf('components/wheel-picker/WheelPicker.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/transform:\s*none/)
  })

  it('keeps 44 px rows and a system-highlight band in forced colours', () => {
    const css = cssOf('components/wheel-picker/WheelPicker.css')
    expect(css).toMatch(/--fk-wheel-row:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/surface-raised-solid/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <WheelPicker label={`Hour ${scheme}`} options={['08', '09', '10']} value="09" onChange={() => {}} />
            <WheelPickerGroup
              label={`Date ${scheme}`}
              columns={[
                { label: `Day ${scheme}`, options: ['1', '2'], value: '1', onChange: () => {} },
                { label: `Year ${scheme}`, options: ['2025', '2026'], value: '2026', onChange: () => {} },
              ]}
            />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('WheelPicker in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<WheelPicker label="الساعة" options={['٠٨', '٠٩', '١٠']} value="٠٩" onChange={() => {}} />)
    expect(rtlDom.screen.getByRole('listbox', { name: 'الساعة' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
