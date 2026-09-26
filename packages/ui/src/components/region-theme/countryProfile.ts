// CountryProfileData format, validation and a registry (spec:
// wave-4/country-profile-data.md). Currency symbol, position, separators and
// precision are never stored: they come from Intl for the profile's locale.
import type { SourceCitation } from './format'

export interface CountryProfile {
  code: string
  names: { en: string; local: string }
  languages: Array<{ tag: string; name: string; official: boolean }>
  locale: { default: string; dateStyle?: 'full' | 'long' | 'medium' | 'short' }
  currency: { code: string }
  address: {
    /** Ordered lines of field keys. */
    template: string[][]
    required: string[]
    postalCodePattern?: string
  }
  tax?: { consumptionTaxName?: string; businessIdName?: string; personalIdName?: string }
  map: { geometryKey: string; subdivisionProperty: string; projection: 'mercator' | 'equal-area-composite' }
  /** Country code of the matching RegionThemeData entry, when there is one. */
  regionTheme?: string
  sources: SourceCitation[]
  version: string
}

/** Emoji flag from the two regional-indicator letters of the code (computed, never stored). */
export function flagEmoji(code: string): string {
  const up = code.toUpperCase()
  if (!/^[A-Z]{2}$/.test(up)) return ''
  return String.fromCodePoint(...[...up].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

function isLocale(tag: string): boolean {
  try {
    return Intl.getCanonicalLocales(tag).length === 1
  } catch {
    return false
  }
}

function isCurrency(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false
  const listed = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('currency')
  if (listed) return listed.includes(code)
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: code })
    return true
  } catch {
    return false
  }
}

/** Throws naming the field on the first problem. */
export function validateCountryProfile(p: CountryProfile): void {
  const at = typeof p?.code === 'string' ? p.code : '??'
  const fail = (field: string, detail: string): never => {
    throw new Error(`CountryProfileData ${at}: ${field} ${detail}`)
  }
  if (!/^[A-Z]{2}$/.test(p.code ?? '')) fail('code', 'must be an ISO 3166-1 alpha-2 code')
  if (!p.names?.en?.trim() || !p.names?.local?.trim()) fail('names', 'need en and local')
  if (!Array.isArray(p.languages) || !p.languages.length) fail('languages', 'must list at least one language')
  for (const l of p.languages) if (!isLocale(l.tag)) fail('languages[].tag', `"${l.tag}" is not a BCP 47 tag`)
  if (!isLocale(p.locale?.default ?? '')) fail('locale.default', 'must be a BCP 47 tag')
  if (!isCurrency(p.currency?.code ?? '')) fail('currency.code', 'must be an ISO 4217 code')
  if (!Array.isArray(p.address?.template) || !p.address.template.length) fail('address.template', 'must have at least one line')
  const keys = new Set(p.address.template.flat())
  for (const r of p.address.required ?? []) if (!keys.has(r)) fail('address.required', `"${r}" is not in the template`)
  if (p.address.postalCodePattern !== undefined) {
    try {
      new RegExp(p.address.postalCodePattern)
    } catch {
      fail('address.postalCodePattern', 'is not a valid pattern')
    }
  }
  if (!p.map?.geometryKey || !p.map.subdivisionProperty) fail('map', 'needs geometryKey and subdivisionProperty')
  if (!Array.isArray(p.sources) || !p.sources.length) fail('sources', 'must cite at least one source')
  const cited = new Set(p.sources.map((s) => s.field))
  const groups = ['code', 'names', 'languages', 'locale', 'currency', 'address', 'map']
  if (p.tax) groups.push('tax')
  for (const g of groups) if (!cited.has(g)) fail('sources', `has no citation for "${g}"`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.version ?? '')) fail('version', 'must be an ISO date')
}

const profiles = new Map<string, CountryProfile>()

/** Validates and stores a profile (replaces an earlier one with the same code). */
export function registerCountryProfile(profile: CountryProfile): void {
  validateCountryProfile(profile)
  profiles.set(profile.code, profile)
}
export const getCountryProfile = (code: string) => profiles.get(code.trim().toUpperCase())
export const listCountryProfiles = () => [...profiles.values()]
export const unregisterCountryProfile = (code: string) => void profiles.delete(code.trim().toUpperCase())

/** Money in the profile's default locale and currency, formatted by the platform. */
export function formatProfileMoney(value: number, profile: CountryProfile): string {
  return new Intl.NumberFormat(profile.locale.default, { style: 'currency', currency: profile.currency.code }).format(value)
}

/** Address lines following the profile template; empty fields leave no doubled separators. */
export function formatProfileAddress(fields: Record<string, string | undefined | null>, profile: CountryProfile, separator = ', '): string[] {
  return profile.address.template
    .map((line) =>
      line
        .map((k) => (fields[k] ?? '').trim())
        .filter(Boolean)
        .join(separator),
    )
    .filter(Boolean)
}
