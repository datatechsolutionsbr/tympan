// Behaviour of <ty-avatar> (spec: wave-1/avatar.md): picture and fallback,
// person and agent, decorative, and the pressable link-or-button control.
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TyAvatarElement } from '../../src/elements/avatar/element'
import { expectNoAxeViolations } from '../axe'
import { cssOf, mediaBlock } from '../css'

defineTympanElement(TyAvatarElement)

const html = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.replaceChildren()
  document.documentElement.removeAttribute('dir')
})

describe('<ty-avatar>', () => {
  it('shows an image whose alternative text is the name', async () => {
    html('<ty-avatar src="/a.png" name="Natália Mesquita" fallback-text="NM"></ty-avatar>')
    const image = screen.getByRole('img', { name: 'Natália Mesquita' })
    expect(image.tagName).toBe('IMG')
    expect(image).toHaveClass('ty-avatar__image')
    const frame = document.body.querySelector('.ty-avatar')!
    expect(frame).toHaveAttribute('data-image', '')
    expect(frame).not.toHaveAttribute('role')
    expect(frame.querySelector('.ty-avatar__fallback')).toHaveAttribute('hidden')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('shows the fallback when the image fails, announced by the name', () => {
    html('<ty-avatar src="/broken.png" name="Natália Mesquita" fallback-text="NM"></ty-avatar>')
    const image = document.body.querySelector('.ty-avatar__image')!
    fireEvent.error(image)
    expect(image).toHaveAttribute('hidden')
    const frame = screen.getByRole('img', { name: 'Natália Mesquita' })
    expect(frame).toHaveClass('ty-avatar')
    expect(frame).not.toHaveAttribute('data-image')
    expect(frame.querySelector('.ty-avatar__fallback')).not.toHaveAttribute('hidden')
    expect(screen.getByText('NM')).toBeInTheDocument()
  })

  it('recovers when a new src is set after a failure', () => {
    const host = html('<ty-avatar src="/broken.png" name="Natália Mesquita" fallback-text="NM"></ty-avatar>').querySelector('ty-avatar')!
    fireEvent.error(document.body.querySelector('.ty-avatar__image')!)
    host.setAttribute('src', '/fixed.png')
    const image = document.body.querySelector('.ty-avatar__image')!
    expect(image).not.toHaveAttribute('hidden')
    expect(image).toHaveAttribute('src', '/fixed.png')
    const frame = document.body.querySelector('.ty-avatar')!
    expect(frame).toHaveAttribute('data-image', '')
    expect(frame).not.toHaveAttribute('role')
    expect(frame.querySelector('.ty-avatar__fallback')).toHaveAttribute('hidden')
  })

  it('announces the name, not the initials', async () => {
    html('<ty-avatar fallback-text="NM" name="Natália Mesquita"></ty-avatar>')
    const frame = screen.getByRole('img')
    expect(frame).toHaveClass('ty-avatar')
    expect(frame).toHaveAccessibleName('Natália Mesquita')
    expect(screen.getByText('NM')).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('keeps the fallback text to two grapheme clusters', () => {
    html('<ty-avatar fallback-text="Nu\u0301r" name="Núria"></ty-avatar>')
    expect(document.body.querySelector('.ty-avatar__initials')!.textContent).toBe('Nu\u0301')
  })

  it('draws an agent as a rounded square with a bot icon and never initials', async () => {
    html('<ty-avatar actor-kind="agent" name="stage-counter" fallback-text="SC"></ty-avatar>')
    const frame = screen.getByRole('img', { name: 'stage-counter' })
    expect(frame).toHaveAttribute('data-kind', 'agent')
    expect(frame.querySelector('svg.ty-avatar__icon')).not.toBeNull()
    expect(frame.querySelector('.ty-avatar__initials')).toBeNull()
    expect(screen.queryByText('SC')).toBeNull()
    const css = cssOf('components/avatar/Avatar.css')
    expect(css).toMatch(/\[data-kind='agent'\]\s*\{[^}]*border-radius:\s*var\(--ty-radius-agent\)[^}]*dashed/)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('falls back to a user icon with neither picture nor text', () => {
    html('<ty-avatar name="Anon"></ty-avatar>')
    const frame = screen.getByRole('img', { name: 'Anon' })
    expect(frame.querySelector('svg.ty-avatar__icon')).not.toBeNull()
    expect(frame.querySelector('.ty-avatar__initials')).toBeNull()
  })

  it('is hidden from assistive tech when decorative', async () => {
    html('<ty-avatar decorative fallback-text="NM"></ty-avatar>')
    expect(document.body.querySelector('.ty-avatar')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('warns when neither name nor decorative is given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    html('<ty-avatar fallback-text="NM"></ty-avatar>')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('name'))
    warn.mockRestore()
  })

  it('pressable: a button named by the action label, fired with Enter', async () => {
    const onPress = vi.fn()
    const host = html('<ty-avatar pressable name="Natália" fallback-text="N"></ty-avatar>').querySelector('ty-avatar')!
    host.addEventListener('click', onPress)
    const button = screen.getByRole('button', { name: 'Open profile of Natália' })
    expect(button).toHaveClass('ty-avatar-control')
    // The frame inside is decorative: the control carries the name.
    expect(button.querySelector('.ty-avatar')).toHaveAttribute('aria-hidden', 'true')
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('with href it is a link named by the action label', async () => {
    html('<ty-avatar href="/users/natalia" name="Natália Mesquita" fallback-text="NM"></ty-avatar>')
    const link = screen.getByRole('link', { name: 'Open profile of Natália Mesquita' })
    expect(link).toHaveClass('ty-avatar-control')
    expect(link).toHaveAttribute('href', '/users/natalia')
    await expectNoAxeViolations(document.body, ['region'])
  })

  it('translates the action label through action-label', () => {
    html('<ty-avatar pressable name="Natália" fallback-text="N" action-label="Abrir perfil de {name}"></ty-avatar>')
    expect(screen.getByRole('button', { name: 'Abrir perfil de Natália' })).toBeInTheDocument()
  })

  it('keeps a 44 x 44 hit area at every size when pressable', () => {
    html('<ty-avatar pressable size="xsmall" name="N" fallback-text="N"></ty-avatar>')
    const control = screen.getByRole('button', { name: 'Open profile of N' })
    expect(control).toHaveClass('ty-avatar-control')
    expect(control).toHaveAttribute('data-size', 'xsmall')
    expect(cssOf('components/avatar/Avatar.css')).toMatch(
      /\.ty-avatar-control::before\s*\{[^}]*inline-size:\s*max\(100%,\s*var\(--ty-control-target\)\)[^}]*block-size:\s*max\(100%,\s*var\(--ty-control-target\)\)/,
    )
  })

  it('styles native interaction states and forced colours', () => {
    const css = cssOf('components/avatar/Avatar.css')
    expect(css).toMatch(/\.ty-avatar-control:hover \.ty-avatar/)
    expect(css).toMatch(/\.ty-avatar-control:focus-visible/)
    expect(css).toMatch(/\.ty-avatar-control:active \.ty-avatar/)
    const forced = mediaBlock(css, /\(forced-colors:\s*active\)/)
    expect(forced).toContain('CanvasText')
  })

  it('follows attribute changes (tint, kind, src)', () => {
    const host = html('<ty-avatar name="Natália Mesquita" fallback-text="NM"></ty-avatar>').querySelector('ty-avatar') as HTMLElement & {
      actorKind: string
      tint: string
      src: string | null
    }
    const frame = () => document.body.querySelector('.ty-avatar')!
    expect(frame()).toHaveAttribute('data-kind', 'person')
    expect(frame()).toHaveAttribute('data-tint', 'accent')
    host.tint = 'neutral'
    host.actorKind = 'agent'
    expect(frame()).toHaveAttribute('data-tint', 'neutral')
    expect(frame()).toHaveAttribute('data-kind', 'agent')
    expect(frame().querySelector('.ty-avatar__initials')).toBeNull()
    host.src = '/late.png'
    const image = frame().querySelector('.ty-avatar__image')!
    expect(image).toHaveAttribute('src', '/late.png')
    expect(image).toHaveAttribute('alt', 'Natália Mesquita')
    expect(frame()).toHaveAttribute('data-image', '')
    host.src = null
    expect(frame().querySelector('.ty-avatar__image')).toBeNull()
    expect(screen.getByRole('img', { name: 'Natália Mesquita' })).toHaveClass('ty-avatar')
  })

  it('has no axe violations across its shapes, in either direction', async () => {
    document.documentElement.setAttribute('dir', 'rtl')
    html(`
      <ty-avatar name="نور الهدى" fallback-text="نه"></ty-avatar>
      <ty-avatar name="Bot" actor-kind="agent"></ty-avatar>
      <ty-avatar decorative fallback-text="C" tint="neutral"></ty-avatar>
      <ty-avatar pressable name="Dora" fallback-text="D"></ty-avatar>
      <ty-avatar href="/users/eloi" name="Eloi" src="/e.png"></ty-avatar>
    `)
    expect(document.body.querySelector('.ty-avatar__initials')).toHaveTextContent('نه')
    await expectNoAxeViolations(document.body, ['region'])
  })
})
