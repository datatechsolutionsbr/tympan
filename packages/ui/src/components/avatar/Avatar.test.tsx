import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('shows an image whose alternative text is the name', () => {
    render(<Avatar src="/a.png" name="Natália Mesquita" />)
    expect(screen.getByRole('img', { name: 'Natália Mesquita' }).tagName).toBe('IMG')
  })

  it('shows the fallback when the image fails', () => {
    render(<Avatar src="/broken.png" name="Natália Mesquita" fallbackText="NM" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('NM')).toBeInTheDocument()
  })

  it('announces the name, not the initials', () => {
    render(<Avatar fallbackText="NM" name="Natália Mesquita" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAccessibleName('Natália Mesquita')
    expect(screen.getByText('NM')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws an agent as a rounded square with a bot icon and no initials', () => {
    const { container } = render(<Avatar actorKind="agent" name="stage-counter" fallbackText="SC" />)
    const frame = container.querySelector('.fk-avatar')!
    expect(frame).toHaveAttribute('data-kind', 'agent')
    expect(frame.querySelector('svg')).not.toBeNull()
    expect(screen.queryByText('SC')).toBeNull()
    const css = cssOf('components/avatar/Avatar.css')
    expect(css).toMatch(/\[data-kind='agent'\]\s*\{[^}]*border-radius:\s*var\(--fk-radius-agent\)[^}]*dashed/)
  })

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<Avatar decorative fallbackText="NM" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('fires onPress on Enter', async () => {
    const onPress = vi.fn()
    render(<Avatar name="Natália" fallbackText="N" onPress={onPress} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Open profile of Natália' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('keeps a 44 x 44 hit area when xsmall and pressable', () => {
    render(<Avatar size="xsmall" name="N" onPress={() => {}} />)
    expect(screen.getByRole('button')).toHaveClass('fk-avatar-control')
    expect(cssOf('components/avatar/Avatar.css')).toMatch(/\.fk-avatar-control::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--fk-control-target\)\)[^}]*block-size:\s*max\(100%,\s*var\(--fk-control-target\)\)/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Avatar name="Ana" fallbackText="A" />
        <Avatar name="Bot" actorKind="agent" />
        <Avatar decorative fallbackText="C" tint="neutral" />
        <Avatar name="Dora" onPress={() => {}} />
      </div>,
    )
    await expectNoAxeViolations(container)
  })
})
