import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TympanProvider } from '../internal/provider'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf } from '../../test/css'
import { renderRtl } from '../../test/rtl'
import { FLAG_CODES, Flag, flagName, isFlagCode, loadFlagSvg, normalizeFlagCode } from './index'

const loaded = (el: Element) => waitFor(() => expect(el).toHaveAttribute('data-loaded'))

describe('flag codes', () => {
  it('covers countries, UK and Spanish subdivisions and organisations in both aspects', async () => {
    expect(FLAG_CODES.length).toBeGreaterThanOrEqual(250)
    for (const code of ['br', 'jp', 'gb-sct', 'gb-wls', 'es-ct', 'eu', 'un', 'asean', 'xx']) expect(isFlagCode(code), code).toBe(true)
    const [wide, square] = await Promise.all([loadFlagSvg('gb-sct', '4x3'), loadFlagSvg('gb-sct', '1x1')])
    expect(wide).toMatch(/viewBox="0 0 640 480"/)
    expect(square).toMatch(/viewBox="0 0 512 512"/)
    expect(await loadFlagSvg('zz-unknown')).toBeNull()
  })

  it('keeps internal ids apart between aspects', async () => {
    const [wide, square] = await Promise.all([loadFlagSvg('us', '4x3'), loadFlagSvg('us', '1x1')])
    expect(wide).toContain('id="ty-flag-4x3-us-a"')
    expect(square).toContain('id="ty-flag-1x1-us-a"')
    expect(wide).not.toContain('id="flag-icons-us"')
  })

  it('normalises codes', () => {
    expect(normalizeFlagCode(' GB_SCT ')).toBe('gb-sct')
  })
})

describe('flagName', () => {
  it('names countries in the reader locale (Intl.DisplayNames)', () => {
    expect(flagName('BR', 'en')).toBe('Brazil')
    expect(flagName('br', 'pt-BR')).toBe('Brasil')
    expect(flagName('de', 'ja')).toBe('ドイツ')
    expect(flagName('eu', 'es')).toBe('Unión Europea')
    expect(flagName('sh-ta', 'en')).toBe('Tristan da Cunha')
  })

  it('names subdivisions and organisations CLDR does not know', () => {
    expect(flagName('gb-sct', 'en')).toBe('Scotland')
    expect(flagName('gb-sct', 'pt-BR')).toBe('Escócia')
    expect(flagName('es-ct', 'es')).toBe('Cataluña')
    expect(flagName('es-ct', 'ja')).toBe('Catalonia')
  })

  it('falls back to the code', () => {
    expect(flagName('qq', 'en')).toBe('QQ')
    expect(flagName('xx-yy', 'en')).toBe('XX-YY')
  })
})

describe('Flag', () => {
  it('is an image named after the region in the active locale', async () => {
    render(
      <TympanProvider locale="pt-BR">
        <Flag code="JP" />
      </TympanProvider>,
    )
    const flag = screen.getByRole('img', { name: 'Japão' })
    await loaded(flag)
    const img = flag.querySelector('img')!
    expect(img).toHaveAttribute('alt', '')
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
  })

  it('names the flag in English, Japanese and Arabic', () => {
    for (const [locale, name] of [
      ['en', 'Germany'],
      ['ja', 'ドイツ'],
      ['ar', 'ألمانيا'],
    ] as const) {
      const { unmount } = render(
        <TympanProvider locale={locale}>
          <Flag code="de" />
        </TympanProvider>,
      )
      expect(screen.getByRole('img', { name })).toBeInTheDocument()
      unmount()
    }
  })

  it('takes a label, and hides itself when decorative', () => {
    const { container } = render(
      <>
        <Flag code="br" label="Brazil (host)" />
        <Flag code="br" decorative />
      </>,
    )
    expect(screen.getByRole('img', { name: 'Brazil (host)' })).toBeInTheDocument()
    expect(container.querySelectorAll('.ty-flag')[1]).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('draws square art for 1x1 and circle, and the unknown flag for an unknown code', async () => {
    const { container } = render(
      <>
        <Flag code="ca" aspect="1x1" />
        <Flag code="ca" aspect="circle" size="small" />
        <Flag code="qq" />
      </>,
    )
    const [square, circle, unknown] = [...container.querySelectorAll('.ty-flag')]
    await Promise.all([loaded(square!), loaded(circle!), loaded(unknown!)])
    expect(decodeURIComponent(square!.querySelector('img')!.src)).toContain('viewBox="0 0 512 512"')
    expect(circle).toHaveAttribute('data-aspect', 'circle')
    expect(unknown).toHaveAttribute('aria-label', 'QQ')
    expect(decodeURIComponent(unknown!.querySelector('img')!.src)).toContain('data-flag="xx"')
    const css = cssOf('flags/Flag.css')
    expect(css).toMatch(/\[data-aspect='circle'\]\s*\{\s*border-radius:\s*50%/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Flag code="br" />
        <Flag code="gb-sct" aspect="1x1" />
        <Flag code="eu" aspect="circle" />
        <span>
          <Flag code="jp" decorative /> Japan
        </span>
      </div>,
    )
    await Promise.all([...container.querySelectorAll('.ty-flag')].map(loaded))
    await expectNoAxeViolations(container)
  })
})

describe('Flag in right-to-left (ar)', () => {
  it('names the region in Arabic, does not mirror and passes axe', async () => {
    const { container } = renderRtl(<Flag code="sa" />)
    const flag = screen.getByRole('img', { name: 'المملكة العربية السعودية' })
    await loaded(flag)
    expect(flag.className).not.toMatch(/mirror/)
    expect(cssOf('flags/Flag.css')).not.toMatch(/scaleX\(-1\)/)
    await expectNoAxeViolations(container)
  })
})
