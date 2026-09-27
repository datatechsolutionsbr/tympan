// Accessible names of flags. Countries and territories come from
// Intl.DisplayNames in the reader's locale; the few flags CLDR has no region
// for (UK nations, Spanish communities, regional organisations) carry their
// own names in English, Portuguese and Spanish, and English elsewhere.

/** flag-icons codes that CLDR knows under another region code. */
const REGION_ALIAS: Record<string, string> = { 'sh-ac': 'AC', 'sh-hl': 'SH', 'sh-ta': 'TA', xx: 'ZZ' }

type Names = { en: string; pt?: string; es?: string }
const OWN_NAMES: Record<string, Names> = {
  'gb-eng': { en: 'England', pt: 'Inglaterra', es: 'Inglaterra' },
  'gb-nir': { en: 'Northern Ireland', pt: 'Irlanda do Norte', es: 'Irlanda del Norte' },
  'gb-sct': { en: 'Scotland', pt: 'Escócia', es: 'Escocia' },
  'gb-wls': { en: 'Wales', pt: 'País de Gales', es: 'Gales' },
  'es-ct': { en: 'Catalonia', pt: 'Catalunha', es: 'Cataluña' },
  'es-ga': { en: 'Galicia', pt: 'Galiza', es: 'Galicia' },
  'es-pv': { en: 'Basque Country', pt: 'País Basco', es: 'País Vasco' },
  arab: { en: 'Arab League', pt: 'Liga Árabe', es: 'Liga Árabe' },
  asean: { en: 'ASEAN' },
  cefta: { en: 'CEFTA' },
  eac: { en: 'East African Community', pt: 'Comunidade da África Oriental', es: 'Comunidad de África Oriental' },
  pc: { en: 'Pacific Community', pt: 'Comunidade do Pacífico', es: 'Comunidad del Pacífico' },
}

/** Lower-case, hyphenated flag key: `BR` → `br`, `GB_SCT` → `gb-sct`. */
export function normalizeFlagCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-')
}

const displayNames = new Map<string, Intl.DisplayNames | null>()
function regionNames(locale: string): Intl.DisplayNames | null {
  if (!displayNames.has(locale)) {
    let names: Intl.DisplayNames | null = null
    try {
      names = new Intl.DisplayNames([locale, 'en'], { type: 'region', fallback: 'none' })
    } catch {
      names = null
    }
    displayNames.set(locale, names)
  }
  return displayNames.get(locale)!
}

/**
 * The name of the country, territory or region a flag stands for, in
 * `locale`; the code in upper case when no name is known.
 */
export function flagName(code: string, locale = 'en'): string {
  const key = normalizeFlagCode(code)
  const own = OWN_NAMES[key]
  if (own) {
    const lang = locale.toLowerCase().split('-')[0] as 'pt' | 'es'
    return own[lang] ?? own.en
  }
  const region = REGION_ALIAS[key] ?? (/^[a-z]{2}$/.test(key) ? key.toUpperCase() : null)
  if (region) {
    try {
      const name = regionNames(locale)?.of(region)
      if (name && name !== region) return name
    } catch {
      /* not a valid region subtag */
    }
  }
  return key.toUpperCase()
}
