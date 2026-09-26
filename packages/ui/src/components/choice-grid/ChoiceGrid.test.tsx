import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Coins } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ChoiceGrid } from './ChoiceGrid'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import * as rtlDom from '@testing-library/react'
import { renderRtl } from '../../../test/rtl'

const currencies = [
  { value: 'BRL', symbol: '🇧🇷', label: 'Brazilian real' },
  { value: 'USD', symbol: '🇺🇸', label: 'US dollar' },
  { value: 'EUR', symbol: '🇪🇺', label: 'Euro' },
]

describe('ChoiceGrid', () => {
  it('is a radio group named by the title with BRL checked', () => {
    render(<ChoiceGrid title="Currency" icon={Coins} options={currencies} value="BRL" onChange={() => {}} />)
    const group = screen.getByRole('radiogroup', { name: 'Currency' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Brazilian real' })).toBeChecked()
  })

  it('ArrowRight from BRL chooses USD', async () => {
    const onChange = vi.fn()
    render(<ChoiceGrid title="Currency" options={currencies} value="BRL" onChange={onChange} />)
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Brazilian real' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('USD')
  })

  it('busy: clicks do nothing and the group reports busy', async () => {
    const onChange = vi.fn()
    render(<ChoiceGrid title="Currency" options={currencies} value="BRL" onChange={onChange} busy />)
    await userEvent.click(screen.getByText('Euro'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-busy', 'true')
  })

  it('stacked arrangement puts the symbol before (above) the label', () => {
    const { container } = render(<ChoiceGrid title="Currency" options={currencies} value="BRL" onChange={() => {}} arrangement="stacked" />)
    expect(container.querySelector('.fk-choice-grid')).toHaveAttribute('data-arrangement', 'stacked')
    const label = screen.getByText('Euro')
    const symbol = label.parentElement!.querySelector('.fk-choice-grid__symbol')!
    expect(symbol.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(cssOf('components/choice-grid/ChoiceGrid.css')).toMatch(/\[data-arrangement='stacked'\] \.fk-choice-grid__cell\s*\{[^}]*flex-direction:\s*column/)
  })

  it('does not announce emoji flags', () => {
    render(<ChoiceGrid title="Currency" options={currencies} value="BRL" onChange={() => {}} />)
    expect(screen.getByText('🇧🇷')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('radio', { name: 'Brazilian real' })).toBeInTheDocument()
  })

  it('collapses to two columns under 640 and keeps forced-colour selection', () => {
    const css = cssOf('components/choice-grid/ChoiceGrid.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/min\(2,/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ChoiceGrid title={`Currency ${scheme}`} icon={Coins} options={currencies} value="USD" onChange={() => {}} columns={3} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ChoiceGrid in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ChoiceGrid title="العملة" value="EGP" onChange={() => {}} options={[{ value: 'EGP', label: 'جنيه' }, { value: 'SAR', label: 'ريال' }]} />)
    expect(rtlDom.screen.getByRole('radio', { name: /جنيه/ })).toBeChecked()
    await axeRtl(container)
  })
})
