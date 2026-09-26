// Brazil (BR) country profile. Regenerated from public sources on 2026-09-26.
// Currency presentation is not stored (derived from pt-BR through Intl).
import { registerCountryProfile, type CountryProfile } from '../countryProfile'

const RETRIEVED = '2026-09-26'

export const brazilProfile: CountryProfile = {
  code: 'BR',
  names: { en: 'Brazil', local: 'Brasil' },
  languages: [{ tag: 'pt-BR', name: 'português', official: true }],
  locale: { default: 'pt-BR' },
  currency: { code: 'BRL' },
  address: {
    // Logradouro, número e complemento / bairro / cidade e UF / CEP.
    template: [['street', 'number', 'complement'], ['district'], ['city', 'state'], ['postalCode']],
    required: ['street', 'city', 'state', 'postalCode'],
    postalCodePattern: '^\\d{5}-?\\d{3}$',
  },
  tax: { businessIdName: 'CNPJ', personalIdName: 'CPF' },
  map: { geometryKey: 'br-admin1', subdivisionProperty: 'code', projection: 'mercator' },
  regionTheme: 'BR',
  sources: [
    { field: 'code', citation: 'ISO 3166-1, country code BR', url: 'https://www.iso.org/obp/ui/#iso:code:3166:BR', retrievedOn: RETRIEVED },
    { field: 'names', citation: 'Unicode CLDR territory names (en: Brazil; pt: Brasil)', url: 'https://cldr.unicode.org/', retrievedOn: RETRIEVED },
    { field: 'languages', citation: 'Unicode CLDR territory information (official language of BR: Portuguese); Constituição Federal de 1988, art. 13', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', retrievedOn: RETRIEVED },
    { field: 'locale', citation: 'Unicode CLDR locale pt-BR', url: 'https://cldr.unicode.org/', retrievedOn: RETRIEVED },
    { field: 'currency', citation: 'ISO 4217, currency code BRL (Brazilian real)', url: 'https://www.iso.org/iso-4217-currency-codes.html', retrievedOn: RETRIEVED },
    { field: 'address', citation: 'Correios, guidance on addressing (logradouro, número, complemento, bairro, cidade, UF, CEP of eight digits)', url: 'https://www.correios.com.br/', retrievedOn: RETRIEVED },
    { field: 'tax', citation: 'Receita Federal do Brasil: CNPJ (legal entities) and CPF (individuals)', url: 'https://www.gov.br/receitafederal/', retrievedOn: RETRIEVED },
    { field: 'map', citation: 'Host geometry from Natural Earth admin-1 boundaries (public domain); the library ships none', url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/', retrievedOn: RETRIEVED },
  ],
  version: RETRIEVED,
}

/**
 * Registers Brazil. Defaults to this module's profile registry; hosts wiring
 * the Formatters country registry pass its `registerCountry` instead.
 */
export function register(target: (profile: CountryProfile) => void = registerCountryProfile): void {
  target(brazilProfile)
}
