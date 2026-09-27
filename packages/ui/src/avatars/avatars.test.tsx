import { createAvatar, type Style } from '@dicebear/core'
import * as glass from '@dicebear/glass'
import * as icons from '@dicebear/icons'
import * as identicon from '@dicebear/identicon'
import * as initials from '@dicebear/initials'
import * as lorelei from '@dicebear/lorelei'
import * as loreleiNeutral from '@dicebear/lorelei-neutral'
import * as notionists from '@dicebear/notionists'
import * as notionistsNeutral from '@dicebear/notionists-neutral'
import * as openPeeps from '@dicebear/open-peeps'
import * as pixelArt from '@dicebear/pixel-art'
import * as pixelArtNeutral from '@dicebear/pixel-art-neutral'
import * as rings from '@dicebear/rings'
import * as shapes from '@dicebear/shapes'
import * as thumbs from '@dicebear/thumbs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { renderRtl } from '../../test/rtl'
import {
  ALLOWED_AVATAR_LICENSES,
  ALLOWED_AVATAR_STYLES,
  AVATAR_SLOTS,
  AvatarStyleError,
  EXCLUDED_AVATAR_STYLES,
  GeneratedAvatar,
  avatarPalette,
  avatarSvg,
  type AvatarStyle,
} from './index'

const MODULES: Record<string, AvatarStyle> = {
  '@dicebear/glass': glass,
  '@dicebear/icons': icons,
  '@dicebear/identicon': identicon,
  '@dicebear/initials': initials,
  '@dicebear/lorelei': lorelei,
  '@dicebear/lorelei-neutral': loreleiNeutral,
  '@dicebear/notionists': notionists,
  '@dicebear/notionists-neutral': notionistsNeutral,
  '@dicebear/open-peeps': openPeeps,
  '@dicebear/pixel-art': pixelArt,
  '@dicebear/pixel-art-neutral': pixelArtNeutral,
  '@dicebear/rings': rings,
  '@dicebear/shapes': shapes,
  '@dicebear/thumbs': thumbs,
}

const SEEDS = Array.from({ length: 24 }, (_, i) => `sample-person-${i}`)

describe('avatarSvg', () => {
  it('is deterministic: same seed, same SVG; another seed, another SVG', () => {
    for (const style of Object.values(MODULES)) {
      const a = avatarSvg({ seed: 'Iris Calder', style })
      expect(avatarSvg({ seed: 'Iris Calder', style })).toBe(a)
      expect(avatarSvg({ seed: 'Tomas Reyna', style })).not.toBe(a)
    }
  })

  it('draws every allowed style and replaces every colour it hands to DiceBear', () => {
    for (const [pkg, style] of Object.entries(MODULES)) {
      for (const seed of SEEDS) {
        // The sentinels never occur in the artwork itself...
        expect(createAvatar(style as unknown as Style<object>, { seed }).toString(), pkg).not.toMatch(/fe01[abc][123]/i)
        // ...and none survives in the output.
        const svg = avatarSvg({ seed, style })
        expect(svg, pkg).not.toMatch(/fe01[abc][123]/i)
        expect(svg.startsWith('<svg '), pkg).toBe(true)
      }
    }
  })

  it('takes its colours from the theme in scope through CSS custom properties', () => {
    const person = avatarSvg({ seed: 'Iris Calder', style: shapes })
    expect(person).toMatch(/fill="var\(--ty-avatar-soft-[123], color-mix\(in oklch, var\(--ty-(brand|ink)\)/)
    expect(person).toContain('var(--ty-brand')
    const agent = avatarSvg({ seed: 'summary-agent', style: shapes, kind: 'agent' })
    expect(agent).toMatch(/var\(--ty-(actor-agent|ink|neutral-[678]00)/)
    expect(agent).not.toContain('--ty-brand')
  })

  it('resolves the palette per theme and mode for fixed-colour output', () => {
    const tympanLight = avatarPalette('tympan', 'light')
    const tympanDark = avatarPalette('tympan', 'dark')
    const printLight = avatarPalette('print-cartao-postal', 'light')
    for (const slot of AVATAR_SLOTS) expect(tympanLight[slot]).toMatch(/^#[0-9a-f]{6}$/)
    expect(tympanLight['soft-1']).not.toBe(tympanDark['soft-1'])
    expect(tympanLight['ink-1']).not.toBe(printLight['ink-1'])
    expect(tympanLight['soft-1']).not.toBe(printLight['soft-1'])
    expect(avatarPalette('tympan', 'light', 'agent')['ink-1']).not.toBe(tympanLight['ink-1'])

    const svg = avatarSvg({ seed: 'Iris Calder', style: identicon, theme: tympanLight })
    expect(svg).not.toContain('var(')
    expect(svg.toLowerCase()).toMatch(new RegExp(`${tympanLight['ink-1']}|${tympanLight['ink-2']}|${tympanLight['ink-3']}`))
  })

  it('keeps figure art in the artist colours and only paints the background', () => {
    const svg = avatarSvg({ seed: 'Iris Calder', style: lorelei })
    expect((svg.match(/var\(--ty-avatar-/g) ?? []).length).toBe(1)
  })

  it('scopes internal ids and sets the size and accessible name when asked', () => {
    const svg = avatarSvg({ seed: 'Iris Calder', style: glass, size: 48, idPrefix: 'demo', title: 'Iris Calder' })
    expect(svg).toMatch(/^<svg role="img" aria-label="Iris Calder" /)
    expect(svg).toContain('width="48"')
    expect(svg).toContain('id="demo-viewboxMask"')
    expect(svg).not.toMatch(/id="viewboxMask"/)
    expect(avatarSvg({ seed: 'x', style: glass })).toMatch(/^<svg aria-hidden="true" focusable="false" /)
  })

  it('rejects a style whose artwork licence is not CC0 or MIT', () => {
    const ccBy: AvatarStyle = { meta: { title: 'Adventurer', license: { name: 'CC BY 4.0' } }, create: () => ({}) }
    const custom: AvatarStyle = { meta: { title: 'Avataaars', license: { name: 'Free for personal and commercial use' } }, create: () => ({}) }
    const unlisted: AvatarStyle = { meta: { title: 'Home Made', license: { name: 'MIT' } }, create: () => ({}) }
    expect(() => avatarSvg({ seed: 'x', style: ccBy })).toThrow(AvatarStyleError)
    expect(() => avatarSvg({ seed: 'x', style: custom })).toThrow(/only CC0 1.0 and MIT/)
    expect(() => avatarSvg({ seed: 'x', style: unlisted })).toThrow(/not on the Tympan allow-list/)
  })

  it('never draws a face or initials for an agent', () => {
    expect(() => avatarSvg({ seed: 'x', style: lorelei, kind: 'agent' })).toThrow(/agents take an abstract style/)
    expect(() => avatarSvg({ seed: 'x', style: initials, kind: 'agent' })).toThrow(/initials/)
    expect(() => avatarSvg({ seed: 'x', style: rings, kind: 'agent' })).not.toThrow()
  })
})

describe('licence allow-list', () => {
  // Vitest runs in packages/ui.
  const root = new URL(`file://${process.cwd()}/`)
  const fs = () => import('node:fs')

  it('matches the artwork licence each installed package declares', async () => {
    const { readFileSync } = await fs()
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    expect(Object.keys(MODULES).sort()).toEqual(ALLOWED_AVATAR_STYLES.map((s) => s.package).sort())
    for (const entry of ALLOWED_AVATAR_STYLES) {
      // The packages export only lib/index.js; LICENSE sits one level above it.
      const license = readFileSync(new URL('../LICENSE', `file://${require.resolve(entry.package, { paths: [process.cwd()] })}`), 'utf8')
      const design = /# Design[\s\S]*?License:\s*([^(\n]+?)\s*\(/.exec(license)?.[1]
      // A package without a design section is MIT as a whole (Initials, Bootstrap Icons).
      const declared = design ?? (/^MIT License/.test(license.trim()) ? 'MIT' : 'unknown')
      expect((ALLOWED_AVATAR_LICENSES as readonly string[]).includes(declared), `${entry.package}: ${declared}`).toBe(true)
      expect(MODULES[entry.package]!.meta?.license?.name, entry.package).toBe(entry.designLicense)
      expect(MODULES[entry.package]!.meta?.title, entry.package).toBe(entry.title)
    }
  })

  it('fails when source, gallery or package.json names a style outside the allow-list', async () => {
    const { readdirSync, readFileSync, statSync } = await fs()
    const allowed = new Set(['@dicebear/core', ...ALLOWED_AVATAR_STYLES.map((s) => s.package)])
    const found: string[] = []
    const walk = (dir: URL) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist' || name === 'art') continue
        const file = new URL(name, dir)
        if (statSync(file).isDirectory()) walk(new URL(`${name}/`, dir))
        else if (/\.(tsx?|mjs|json)$/.test(name)) {
          const text = readFileSync(file, 'utf8')
          for (const m of text.matchAll(/(?:from\s+|import\s*\(\s*)['"](@dicebear\/[\w-]+)/g)) found.push(`${name}: ${m[1]}`)
        }
      }
    }
    walk(new URL('src/', root))
    walk(new URL('gallery/', root))
    const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as Record<string, Record<string, string> | undefined>
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      for (const name of Object.keys(pkg[field] ?? {})) if (name.startsWith('@dicebear/')) found.push(`package.json ${field}: ${name}`)
    }
    const outside = found.filter((f) => !allowed.has(f.split(': ')[1]!))
    expect(outside).toEqual([])
    expect(found.length).toBeGreaterThan(0)
    // Every excluded package is really outside the list.
    for (const e of EXCLUDED_AVATAR_STYLES) expect(allowed.has(e.package)).toBe(false)
  })
})

describe('GeneratedAvatar', () => {
  it('draws the artwork inline and names the frame', () => {
    const { container } = render(<GeneratedAvatar seed="Iris Calder" avatarStyle={notionists} name="Iris Calder" fallbackText="IC" />)
    const frame = screen.getByRole('img', { name: 'Iris Calder' })
    expect(frame).toHaveAttribute('data-artwork')
    const svg = container.querySelector('.ty-avatar__artwork svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByText('IC')).toBeNull()
  })

  it('draws the same artwork for the same seed', () => {
    const { container } = render(
      <>
        <GeneratedAvatar seed="Iris Calder" avatarStyle={rings} decorative />
        <GeneratedAvatar seed="Iris Calder" avatarStyle={rings} decorative />
      </>,
    )
    const [a, b] = [...container.querySelectorAll('.ty-avatar__artwork')].map((n) => n.innerHTML.replace(/ty-av[^"#)]*-/g, 'ID-'))
    expect(a).toBe(b)
  })

  it('keeps people and agents apart: frame, palette and style', () => {
    const { container } = render(
      <>
        <GeneratedAvatar seed="Iris Calder" avatarStyle={shapes} name="Iris Calder" />
        <GeneratedAvatar seed="summary-agent" avatarStyle={shapes} name="Summary agent" actorKind="agent" />
      </>,
    )
    const [person, agent] = [...container.querySelectorAll('.ty-avatar')]
    expect(person).toHaveAttribute('data-kind', 'person')
    expect(agent).toHaveAttribute('data-kind', 'agent')
    expect(person!.innerHTML).toContain('--ty-brand')
    expect(agent!.innerHTML).not.toContain('--ty-brand')
  })

  it('falls back to initials (person) or the bot icon (agent) when the style is refused', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ccBy: AvatarStyle = { meta: { title: 'Adventurer', license: { name: 'CC BY 4.0' } }, create: () => ({}) }
    const { container } = render(
      <>
        <GeneratedAvatar seed="Iris Calder" avatarStyle={ccBy} name="Iris Calder" fallbackText="IC" />
        <GeneratedAvatar seed="summary-agent" avatarStyle={lorelei} name="Summary agent" actorKind="agent" />
      </>,
    )
    expect(screen.getByText('IC')).toBeInTheDocument()
    expect(container.querySelectorAll('.ty-avatar__artwork')).toHaveLength(0)
    expect(container.querySelector('[data-kind="agent"] .ty-avatar__icon')).not.toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('prefers a loaded image over the artwork', () => {
    render(<GeneratedAvatar seed="Iris Calder" avatarStyle={shapes} src="/photo.png" name="Iris Calder" />)
    expect(screen.getByRole('img', { name: 'Iris Calder' }).tagName).toBe('IMG')
  })

  it('uses fixed colours when given a palette', () => {
    const palette = avatarPalette('neutral', 'dark')
    const { container } = render(<GeneratedAvatar seed="Iris Calder" avatarStyle={identicon} palette={palette} decorative />)
    expect(container.innerHTML).not.toContain('var(--ty-avatar')
  })

  it('is hidden when decorative and has no axe violations', async () => {
    const { container } = render(
      <div>
        <GeneratedAvatar seed="Iris Calder" avatarStyle={lorelei} decorative />
        <GeneratedAvatar seed="Tomas Reyna" avatarStyle={glass} name="Tomas Reyna" size="large" />
        <GeneratedAvatar seed="summary-agent" avatarStyle={identicon} name="Summary agent" actorKind="agent" onPress={() => {}} />
      </div>,
    )
    expect(container.querySelector('.ty-avatar')).toHaveAttribute('aria-hidden', 'true')
    await expectNoAxeViolations(container)
  })
})

describe('GeneratedAvatar in right-to-left (ar)', () => {
  it('renders the same artwork (avatars do not mirror) and passes axe', async () => {
    const { container } = renderRtl(
      <>
        <GeneratedAvatar seed="Iris Calder" avatarStyle={pixelArt} name="نور الهدى" fallbackText="نه" />
        <GeneratedAvatar seed="summary-agent" avatarStyle={rings} name="وكيل الملخص" actorKind="agent" />
      </>,
    )
    expect(screen.getByRole('img', { name: 'نور الهدى' })).toHaveAttribute('data-artwork')
    const ltr = render(<GeneratedAvatar seed="Iris Calder" avatarStyle={pixelArt} decorative />)
    const strip = (html: string) => html.replace(/ty-av[^"#)]*-/g, 'ID-')
    expect(strip(container.querySelector('.ty-avatar__artwork')!.innerHTML)).toBe(strip(ltr.container.querySelector('.ty-avatar__artwork')!.innerHTML))
    await expectNoAxeViolations(container)
  })
})
