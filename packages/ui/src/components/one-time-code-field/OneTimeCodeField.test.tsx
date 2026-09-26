import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { OneTimeCodeField, type OneTimeCodeFieldProps } from './OneTimeCodeField'
import rtlUser from '@testing-library/user-event'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function Harness(props: Partial<OneTimeCodeFieldProps> & { initial?: string }) {
  const [value, setValue] = useState(props.initial ?? '')
  return (
    <OneTimeCodeField
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v)
        props.onChange?.(v)
      }}
    />
  )
}

const box = (n: number, total = 6) => screen.getByRole('textbox', { name: `Character ${n} of ${total}` })

describe('OneTimeCodeField', () => {
  it('renders a named group with six named boxes', () => {
    render(<Harness />)
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
    expect(box(6)).toBeInTheDocument()
  })

  it('ignores letters in digits mode', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(box(1))
    await userEvent.keyboard('a')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts letters in alphanumeric mode and moves on', async () => {
    const onChange = vi.fn()
    render(<Harness characters="alphanumeric" onChange={onChange} />)
    await userEvent.click(box(1))
    await userEvent.keyboard('a')
    expect(onChange).toHaveBeenLastCalledWith('a')
    expect(box(2)).toHaveFocus()
  })

  it('fires onComplete when the sixth digit is typed', async () => {
    const onComplete = vi.fn()
    render(<Harness initial="12345" onComplete={onComplete} />)
    await userEvent.click(box(6))
    await userEvent.keyboard('6')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('Backspace in an empty third box clears the second and focuses it', async () => {
    const onChange = vi.fn()
    render(<Harness initial="12" onChange={onChange} />)
    await userEvent.click(box(3))
    await userEvent.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith('1')
    expect(box(2)).toHaveFocus()
    expect(box(2)).toHaveValue('')
  })

  it('arrow keys move between boxes and stop at the ends', async () => {
    render(<Harness />)
    await userEvent.click(box(1))
    await userEvent.keyboard('{ArrowLeft}')
    expect(box(1)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(box(3)).toHaveFocus()
  })

  it('pasting "12-34 56" fills the code and completes', async () => {
    const onComplete = vi.fn()
    const onChange = vi.fn()
    render(<Harness onComplete={onComplete} onChange={onChange} />)
    await userEvent.click(box(1))
    await userEvent.paste('12-34 56')
    expect(onChange).toHaveBeenLastCalledWith('123456')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('pasting "12" moves focus to the third box without completing', async () => {
    const onComplete = vi.fn()
    render(<Harness onComplete={onComplete} />)
    await userEvent.click(box(4))
    await userEvent.paste('12')
    expect(box(3)).toHaveFocus()
    expect(box(1)).toHaveValue('1')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('a paste with no usable characters changes nothing', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(box(1))
    await userEvent.paste('ab-')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is described by the error only when there is one, and announces it', () => {
    const { rerender } = render(<OneTimeCodeField value="" onChange={() => {}} />)
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby')
    rerender(<OneTimeCodeField value="" onChange={() => {}} errorText="The code expired." />)
    expect(screen.getByRole('group')).toHaveAccessibleDescription('The code expired.')
    expect(screen.getByRole('alert')).toHaveTextContent('The code expired.')
  })

  it('offers one-time-code autofill on the first box and keeps 44 px boxes', () => {
    render(<Harness />)
    expect(box(1)).toHaveAttribute('autocomplete', 'one-time-code')
    const css = cssOf('components/one-time-code-field/OneTimeCodeField.css')
    expect(css).toMatch(/min-inline-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Mark/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <OneTimeCodeField label={`Code ${scheme}`} value="12" onChange={() => {}} />
            <OneTimeCodeField label={`Invalid ${scheme}`} value="123456" onChange={() => {}} errorText="Wrong code." />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('OneTimeCodeField in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<OneTimeCodeField value="12" onChange={() => {}} label="رمز التحقق" />)
    const boxes = container.querySelectorAll('input')
    boxes[0]!.focus()
    // In right-to-left, Left Arrow goes to the next box.
    await rtlUser.keyboard('{ArrowLeft}')
    expect(boxes[1]).toHaveFocus()
    await axeRtl(container)
  })
})
