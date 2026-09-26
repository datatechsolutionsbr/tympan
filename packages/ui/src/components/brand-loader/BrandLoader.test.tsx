import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { createLoaderPresets, LoaderPresetProvider, type LoaderPreset } from '../loader-presets/LoaderPresets'
import { BrandLoader } from './BrandLoader'

const archive: LoaderPreset = { id: 'archive', name: 'Archive', mark: <span data-testid="archive-mark">A</span>, tone: 'categorical-3' }

describe('BrandLoader', () => {
  it('puts the label in a status element', () => {
    render(<BrandLoader label="Opening the census" />)
    expect(screen.getByRole('status')).toHaveTextContent('Opening the census')
  })

  it('uses the localised loading word without a label', () => {
    render(<BrandLoader />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })

  it('stops the pulse under reduced motion', () => {
    expect(mediaBlock(cssOf('components/brand-loader/BrandLoader.css'), /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('inline layout does not cover the viewport', () => {
    const { container } = render(<BrandLoader layout="inline" />)
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'inline')
    const css = cssOf('components/brand-loader/BrandLoader.css')
    expect(css).toMatch(/\[data-layout='fullscreen'\]\s*\{[^}]*position:\s*fixed/)
    expect(css).not.toMatch(/\[data-layout='inline'\]\s*\{[^}]*position:\s*fixed/)
  })

  it('without a provider shows the Tympan mark and the accent tone', () => {
    const { container } = render(<BrandLoader />)
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'accent')
    expect(container.querySelector('.ty-brand-mark')).not.toBeNull()
  })

  it('uses a registered preset, and explicit properties win', () => {
    const registry = createLoaderPresets([archive])
    const { container, rerender } = render(
      <LoaderPresetProvider registry={registry}>
        <BrandLoader preset="archive" />
      </LoaderPresetProvider>,
    )
    expect(screen.getByTestId('archive-mark')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'categorical-3')
    expect(container.textContent).toContain('Archive')
    rerender(
      <LoaderPresetProvider registry={registry}>
        <BrandLoader preset="archive" name="Library" />
      </LoaderPresetProvider>,
    )
    expect(container.textContent).toContain('Library')
    expect(container.textContent).not.toContain('Archive')
  })

  it('falls back to default for an unknown preset with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <LoaderPresetProvider registry={createLoaderPresets([archive])}>
        <BrandLoader preset="missing" />
      </LoaderPresetProvider>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'accent')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <BrandLoader layout="inline" label={`Loading ${s}`} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
