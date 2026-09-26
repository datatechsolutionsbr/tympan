import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { StateSwitch } from './StateSwitch'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

describe('StateSwitch', () => {
  it('is an unchecked switch named by label with "Inactive" emphasised', () => {
    render(<StateSwitch checked={false} onCheckedChange={() => {}} label="Agent status" />)
    const sw = screen.getByRole('switch', { name: 'Agent status' })
    expect(sw).not.toBeChecked()
    expect(screen.getByText('Inactive')).toHaveAttribute('data-current')
    expect(screen.getByText('Active')).not.toHaveAttribute('data-current')
    expect(sw).toHaveAccessibleDescription('Inactive')
  })

  it('activating the switch reports true', async () => {
    const onChange = vi.fn()
    render(<StateSwitch checked={false} onCheckedChange={onChange} label="Agent status" />)
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('clicking the "Active" text toggles', async () => {
    const onChange = vi.fn()
    render(<StateSwitch checked={false} onCheckedChange={onChange} label="Agent status" />)
    await userEvent.click(screen.getByText('Active'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('Space toggles from the keyboard', async () => {
    const onChange = vi.fn()
    render(<StateSwitch checked onCheckedChange={onChange} label="Agent status" />)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('does not trigger an enclosing clickable row', async () => {
    const onRow = vi.fn()
    const onChange = vi.fn()
    render(
      <table>
        <tbody>
          <tr onClick={onRow}>
            <td>
              <StateSwitch checked={false} onCheckedChange={onChange} label="Agent status" />
            </td>
          </tr>
        </tbody>
      </table>,
    )
    await userEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalled()
    expect(onRow).not.toHaveBeenCalled()
  })

  it('pending: disabled and busy', async () => {
    const onChange = vi.fn()
    render(<StateSwitch checked={false} onCheckedChange={onChange} label="Agent status" pending />)
    const sw = screen.getByRole('switch')
    expect(sw).toBeDisabled()
    expect(sw).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(sw)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reduced motion stops the thumb; forced colours use system colours', () => {
    const css = cssOf('components/state-switch/StateSwitch.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/ButtonText/)
    expect(css).toMatch(/max\(100%,\s*var\(--ty-control-target\)\)/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <StateSwitch checked onCheckedChange={() => {}} label={`Status ${scheme}`} />
            <StateSwitch checked={false} pending onCheckedChange={() => {}} label={`Pending ${scheme}`} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('StateSwitch in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<StateSwitch label="حالة الوكيل" checked={false} onCheckedChange={() => {}} />)
    expect(rtlDom.screen.getByRole('switch', { name: 'حالة الوكيل' })).toBeInTheDocument()
    expect(cssOf('components/state-switch/StateSwitch.css')).toMatch(/:dir\(rtl\)\s*\{[^}]*translate:\s*calc\(-1/)
    await axeRtl(container)
  })
})
