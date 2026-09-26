import { fireEvent, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { createMarkRegistry, MarkRegistryProvider, ProviderMark, resolveProvider, ThirdPartyMarkSlot } from './ThirdPartyMarkSlot'

describe('ThirdPartyMarkSlot and ProviderMark', () => {
  it('with an empty registry shows the neutral glyph and the provider name, requesting no mark', () => {
    const { container } = render(<ProviderMark modelId="anthropic.claude-sonnet" />)
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(container.querySelector('[data-fallback]')).not.toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('resolves a regional routing prefix to the same provider as the bare identifier', () => {
    expect(resolveProvider('eu.anthropic.claude-haiku').key).toBe(resolveProvider('anthropic.claude-haiku').key)
    expect(resolveProvider('us.meta.llama3').key).toBe('meta')
    expect(resolveProvider('gpt-4o').key).toBe('openai')
  })

  it('maps an unknown identifier to other, with the localised word and no real mark', () => {
    expect(resolveProvider('acme-foundation-7b').key).toBe('other')
    const registry = createMarkRegistry([{ key: 'anthropic', source: { kind: 'asset', url: '/a.svg' }, owner: 'A', licence: 'host licence' }])
    const { container } = render(
      <MarkRegistryProvider registry={registry}>
        <ProviderMark modelId="acme-foundation-7b" />
      </MarkRegistryProvider>,
    )
    expect(screen.getByText('Other provider')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('falls back to the glyph when a registered asset fails to load', () => {
    const registry = createMarkRegistry([{ key: 'pg', source: { kind: 'asset', url: '/pg.svg' }, owner: 'Owner', licence: 'CC0' }])
    const { container } = render(
      <MarkRegistryProvider registry={registry}>
        <ThirdPartyMarkSlot markKey="pg" name="Database X" category="datasource" />
      </MarkRegistryProvider>,
    )
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('alt', '')
    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-fallback]')).not.toBeNull()
  })

  it('throws for an entry without a licence note and for duplicate keys', () => {
    expect(() => createMarkRegistry([{ key: 'x', source: { kind: 'asset', url: '/x' }, owner: 'X', licence: '' }])).toThrow(/licence/)
    const e = { key: 'x', source: { kind: 'asset' as const, url: '/x' }, owner: 'X', licence: 'CC0' }
    expect(() => createMarkRegistry([e, e])).toThrow(/twice/)
  })

  it('renders icon-set sources through the host adapter, monochrome unless brand colours are opted in', () => {
    const registry = createMarkRegistry([{ key: 'k', source: { kind: 'icon-set', setName: 'set', slug: 'k' }, owner: 'K', licence: 'CC0', brandColour: '#123456' }])
    let seen: string | undefined = 'unset'
    render(
      <MarkRegistryProvider registry={registry} iconSetAdapter={(s, o) => ((seen = o.brandColour), <svg data-testid={`set-${s.slug}`} />)}>
        <ThirdPartyMarkSlot markKey="k" name="K product" />
      </MarkRegistryProvider>,
    )
    expect(screen.getByTestId('set-k')).toBeInTheDocument()
    expect(seen).toBeUndefined()
  })

  it('keeps the mark hidden and the name as accessible text when showName is false', () => {
    const { container } = render(<ThirdPartyMarkSlot markKey="none" name="Service Y" showName={false} />)
    expect(container.querySelector('.fk-mark__art')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Service Y')).toHaveClass('fk-visually-hidden')
  })

  it('ships no third-party mark data in the library sources', () => {
    const dir = join(__dirname)
    for (const f of readdirSync(dir).filter((n) => !n.endsWith('.test.tsx'))) {
      const text = readFileSync(join(dir, f), 'utf8')
      expect(text).not.toMatch(/<path[^>]*d="/)
      expect(text).not.toMatch(/data:image/)
    }
  })

  it('drops to system colours under forced colours', () => {
    expect(mediaBlock(cssOf('components/third-party-mark-slot/ThirdPartyMarkSlot.css'), /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <ProviderMark modelId="google.gemini-pro" size="bubble" />
            <ThirdPartyMarkSlot markKey="db" name="Database" category="datasource" />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
