import { render, screen } from '@testing-library/react'
import { Rocket } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { StatusPill } from './StatusPill'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('StatusPill', () => {
  it('shows the word and success-tone icon for active', () => {
    const { container } = render(<StatusPill status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    const pill = container.querySelector('.ty-status')!
    expect(pill).toHaveAttribute('data-tone', 'success')
    expect(pill.querySelector('.ty-status__icon svg')).not.toBeNull()
  })

  it('uses a custom map entry', () => {
    const { container } = render(
      <StatusPill status="launched" statusMap={{ launched: { label: 'Launched', tone: 'info', icon: <Rocket data-testid="rocket" /> } }} />,
    )
    expect(screen.getByText('Launched')).toBeInTheDocument()
    expect(screen.getByTestId('rocket')).toBeInTheDocument()
    expect(container.querySelector('.ty-status')).toHaveAttribute('data-tone', 'info')
  })

  it('falls back to a neutral pill with the key as text for unknown statuses', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<StatusPill status="archived" />)
    expect(screen.getByText('archived')).toBeInTheDocument()
    expect(container.querySelector('.ty-status')).toHaveAttribute('data-tone', 'neutral')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('announces a change once, politely, when announce is set', () => {
    const { rerender } = render(<StatusPill status="processing" announce />)
    const live = screen.getByRole('status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    rerender(<StatusPill status="success" announce />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Success')
  })

  it('creates no live regions for fifty pills without announce', () => {
    const { container } = render(
      <table>
        <tbody>
          {Array.from({ length: 50 }, (_, i) => (
            <tr key={i}>
              <td>
                <StatusPill status="pending" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>,
    )
    expect(container.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(0)
  })

  it('does not rotate the busy icon under reduced motion', () => {
    const { container } = render(<StatusPill status="processing" />)
    expect(container.querySelector('.ty-status')).toHaveAttribute('data-busy', 'true')
    const reduced = mediaBlock(cssOf('components/status-pill/StatusPill.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/animation:\s*none/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        {['pending', 'approved', 'rejected', 'active', 'inactive', 'processing', 'error', 'success'].map((s) => (
          <StatusPill key={s} status={s} />
        ))}
        <StatusPill status="active" announce size="small" />
      </p>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('StatusPill in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<StatusPill status="pending" label="معلق" />)
    expect(rtlDom.screen.getByText('معلق')).toBeInTheDocument()
    await axeRtl(container)
  })
})
