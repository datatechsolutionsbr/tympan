import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { brazilProfile, register as registerBrazilProfile } from './data/br-profile'
import { brazilRegionTheme } from './data/br'
import {
  contrastRatio,
  createRegionThemeRegistry,
  deriveGeometry,
  flagEmoji,
  formatProfileAddress,
  formatProfileMoney,
  getCountryProfile,
  RegionThemeProvider,
  useRegionThemeRegistry,
  validateCountryProfile,
  validateRegionThemeEntry,
  type RegionThemeEntry,
} from './index'

// Fixture regenerated from the public ISO 3166-2:BR list (26 states and the Federal District).
const ISO_3166_2_BR = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')

const fixture = (patch: Partial<RegionThemeEntry> = {}): RegionThemeEntry => ({
  country: 'ZZ',
  subdivisionKind: 'region',
  subdivisions: [
    { code: 'A', name: { local: 'Alpha' }, identity: { primary: '#0f3d5c', secondary: '#f2c230' } },
    { code: 'B', name: { local: 'Beta' } },
  ],
  flagUrlTemplate: '/flags/zz/{code}.svg',
  sources: [
    { field: 'codes', citation: 'test', url: 'https://example.org', retrievedOn: '2026-09-26' },
    { field: 'names', citation: 'test', url: 'https://example.org', retrievedOn: '2026-09-26' },
    { field: 'identity', citation: 'test', url: 'https://example.org', retrievedOn: '2026-09-26' },
  ],
  version: '2026-09-26',
  ...patch,
})

describe('RegionThemeRegistry', () => {
  it('returns São Paulo once Brazil is registered, case-insensitively', () => {
    const r = createRegionThemeRegistry()
    r.register(brazilRegionTheme)
    expect(r.getSubdivision('br', 'sp')).toEqual({ code: 'SP', name: { local: 'São Paulo' }, kind: 'state' })
    expect(r.isKnownSubdivision('BR', 'df')).toBe(true)
    expect(r.listSubdivisions('br')).toHaveLength(27)
    expect(r.getMacroRegions('br')?.find((g) => g.id === 'southeast')?.codes).toEqual(['ES', 'MG', 'RJ', 'SP'])
  })

  it('answers nothing, without throwing, for an unregistered country', () => {
    const r = createRegionThemeRegistry()
    expect(r.getSubdivision('xx', 'a')).toBeUndefined()
    expect(r.listSubdivisions('xx')).toBeUndefined()
    expect(r.isKnownSubdivision('xx', 'a')).toBe(false)
    expect(r.getIdentityColours('xx', 'a')).toBeUndefined()
    expect(r.getIdentityTone('xx', 'a')).toBeUndefined()
    expect(r.getLabelPoint('xx', 'a')).toBeUndefined()
    expect(r.getCountryView('xx')).toBeUndefined()
    expect(r.getMacroRegions('xx')).toBeUndefined()
    expect(r.getFlagUrl('xx', 'a')).toBeUndefined()
  })

  it('rejects a colour that is not six-digit hex, naming the field and code, and stores nothing', () => {
    const r = createRegionThemeRegistry()
    const bad = fixture({ subdivisions: [{ code: 'A', name: { local: 'Alpha' }, identity: { primary: 'teal', secondary: '#ffffff' } }] })
    expect(() => r.register(bad)).toThrow(/identity\.primary.*subdivision A/)
    expect(r.countries()).toEqual([])
  })

  it('computes a light text colour on a dark primary, reaching 4.5:1', () => {
    const r = createRegionThemeRegistry()
    r.register(fixture())
    const c = r.getIdentityColours('zz', 'a')!
    expect(c.onPrimary).toBe('light')
    expect(contrastRatio(c.primary, '#fcfdfd')).toBeGreaterThanOrEqual(4.5)
    expect(r.getIdentityTone('zz', 'a')).toMatch(/^categorical-[1-8]$/)
    expect(r.getIdentityColours('zz', 'b')).toBeUndefined()
  })

  it('keeps isolated registries apart and replaces a re-registered country', () => {
    const a = createRegionThemeRegistry()
    const b = createRegionThemeRegistry()
    a.register(fixture())
    expect(b.countries()).toEqual([])
    a.register(fixture({ subdivisions: [{ code: 'C', name: { local: 'Gamma' } }], sources: fixture().sources.slice(0, 2) }))
    expect(a.listSubdivisions('zz')).toHaveLength(1)
    a.unregister('zz')
    expect(a.countries()).toEqual([])
  })

  it('resolves flag URLs only for known codes', () => {
    const r = createRegionThemeRegistry()
    r.register(fixture())
    expect(r.getFlagUrl('zz', 'a')).toBe('/flags/zz/A.svg')
    expect(r.getFlagUrl('zz', 'q')).toBeUndefined()
  })

  it('gives components an isolated registry through the provider', () => {
    const r = createRegionThemeRegistry()
    r.register(brazilRegionTheme)
    function Name() {
      return <p>{useRegionThemeRegistry().getSubdivision('BR', 'PA')?.name.local}</p>
    }
    render(
      <RegionThemeProvider registry={r}>
        <Name />
      </RegionThemeProvider>,
    )
    expect(screen.getByText('Pará')).toBeInTheDocument()
  })
})

describe('RegionThemeData: Brazil', () => {
  it('passes the format validation', () => {
    expect(() => validateRegionThemeEntry(brazilRegionTheme)).not.toThrow()
  })

  it('has exactly the ISO 3166-2:BR codes, and every macro-region member is one of them once', () => {
    expect(new Set(brazilRegionTheme.subdivisions.map((s) => s.code))).toEqual(new Set(ISO_3166_2_BR))
    const members = brazilRegionTheme.macroRegions!.flatMap((g) => g.codes)
    expect(members.sort()).toEqual([...ISO_3166_2_BR].sort())
  })

  it('cites a source for every field group it ships and invents no identity colours or coordinates', () => {
    const cited = new Set(brazilRegionTheme.sources.map((s) => s.field))
    for (const f of ['codes', 'names', 'macroRegions']) expect(cited.has(f)).toBe(true)
    expect(brazilRegionTheme.subdivisions.every((s) => !s.identity && !s.labelPoint)).toBe(true)
  })

  it('derives label points inside the polygons and the view from host boundaries', () => {
    const square = (code: string, x: number): { type: 'Feature'; properties: { code: string }; geometry: { type: 'Polygon'; coordinates: number[][][] } } => ({
      type: 'Feature',
      properties: { code: `BR-${code}` },
      geometry: { type: 'Polygon', coordinates: [[[x, -20], [x, -18], [x + 2, -18], [x + 2, -20], [x, -20]]] },
    })
    const derived = deriveGeometry(
      brazilRegionTheme,
      { type: 'FeatureCollection', features: [square('SP', -50), square('RJ', -44)] },
      { source: { citation: 'test boundaries', url: 'https://example.org', retrievedOn: '2026-09-26' } },
    )
    const sp = derived.subdivisions.find((s) => s.code === 'SP')!.labelPoint!
    expect(sp[0]).toBeGreaterThan(-50)
    expect(sp[0]).toBeLessThan(-48)
    expect(derived.view?.centre[0]).toBeCloseTo(-46, 0)
    expect(() => validateRegionThemeEntry(derived)).not.toThrow()
    expect(brazilRegionTheme.subdivisions.find((s) => s.code === 'SP')!.labelPoint).toBeUndefined()
  })

  it('keeps country data out of the registry barrel (one module per country)', () => {
    const barrel = readFileSync(join(__dirname, 'index.ts'), 'utf8')
    expect(barrel).not.toMatch(/from\s+['"]\.\/data\//)
  })
})

describe('CountryProfileData: Brazil', () => {
  it('validates and registers', () => {
    expect(() => validateCountryProfile(brazilProfile)).not.toThrow()
    registerBrazilProfile()
    expect(getCountryProfile('br')?.names.local).toBe('Brasil')
    expect(flagEmoji('BR')).toBe('🇧🇷')
  })

  it('formats money exactly as the platform does for pt-BR and BRL', () => {
    expect(formatProfileMoney(1234.5, brazilProfile)).toBe(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(1234.5))
    expect(JSON.stringify(brazilProfile)).not.toMatch(/R\$/)
  })

  it('formats an address along the template without doubled separators', () => {
    const lines = formatProfileAddress(
      { street: 'Rua Arlindo Béttio', number: '1000', complement: '', district: 'Ermelino Matarazzo', city: 'São Paulo', state: 'SP', postalCode: '03828-000' },
      brazilProfile,
    )
    expect(lines).toEqual(['Rua Arlindo Béttio, 1000', 'Ermelino Matarazzo', 'São Paulo, SP', '03828-000'])
    expect(lines.join('\n')).not.toMatch(/, ,/)
  })

  it('rejects an invalid currency and a required field missing from the template', () => {
    expect(() => validateCountryProfile({ ...brazilProfile, currency: { code: 'XXQ' } })).toThrow(/currency/)
    expect(() => validateCountryProfile({ ...brazilProfile, address: { ...brazilProfile.address, required: ['planet'] } })).toThrow(/address\.required/)
  })

  it('cites every field group', () => {
    const cited = new Set(brazilProfile.sources.map((s) => s.field))
    for (const f of ['code', 'names', 'languages', 'locale', 'currency', 'address', 'map', 'tax']) expect(cited.has(f)).toBe(true)
  })

  it('renders subdivision names accessibly (axe)', async () => {
    const { container } = render(
      <ul aria-label="States">
        {brazilRegionTheme.subdivisions.map((s) => (
          <li key={s.code}>{s.name.local}</li>
        ))}
      </ul>,
    )
    await expectNoAxeViolations(container)
  })
})
