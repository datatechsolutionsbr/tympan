// Brazil (BR): first-level subdivisions, the 26 states and the Federal
// District, and the five IBGE macro-regions. Regenerated from public sources
// on 2026-09-26 (see `sources`); nothing here comes from any earlier library.
//
// Not shipped, on purpose: identity colours (the state flag laws give colour
// names, not hex values, so any hex would be an invention), label points and
// the map view (to be computed from public-domain boundaries with
// `deriveGeometry()`; see ../geometry.ts). The registry works without them.
import { registerRegionTheme } from '../registry'
import type { RegionThemeEntry } from '../format'

const RETRIEVED = '2026-09-26'

export const brazilRegionTheme: RegionThemeEntry = {
  country: 'BR',
  subdivisionKind: 'state',
  // ISO 3166-2:BR order (alphabetical by name).
  subdivisions: [
    { code: 'AC', name: { local: 'Acre' } },
    { code: 'AL', name: { local: 'Alagoas' } },
    { code: 'AP', name: { local: 'Amapá' } },
    { code: 'AM', name: { local: 'Amazonas' } },
    { code: 'BA', name: { local: 'Bahia' } },
    { code: 'CE', name: { local: 'Ceará' } },
    { code: 'DF', name: { local: 'Distrito Federal', en: 'Federal District' } },
    { code: 'ES', name: { local: 'Espírito Santo' } },
    { code: 'GO', name: { local: 'Goiás' } },
    { code: 'MA', name: { local: 'Maranhão' } },
    { code: 'MT', name: { local: 'Mato Grosso' } },
    { code: 'MS', name: { local: 'Mato Grosso do Sul' } },
    { code: 'MG', name: { local: 'Minas Gerais' } },
    { code: 'PA', name: { local: 'Pará' } },
    { code: 'PB', name: { local: 'Paraíba' } },
    { code: 'PR', name: { local: 'Paraná' } },
    { code: 'PE', name: { local: 'Pernambuco' } },
    { code: 'PI', name: { local: 'Piauí' } },
    { code: 'RJ', name: { local: 'Rio de Janeiro' } },
    { code: 'RN', name: { local: 'Rio Grande do Norte' } },
    { code: 'RS', name: { local: 'Rio Grande do Sul' } },
    { code: 'RO', name: { local: 'Rondônia' } },
    { code: 'RR', name: { local: 'Roraima' } },
    { code: 'SC', name: { local: 'Santa Catarina' } },
    { code: 'SP', name: { local: 'São Paulo' } },
    { code: 'SE', name: { local: 'Sergipe' } },
    { code: 'TO', name: { local: 'Tocantins' } },
  ],
  macroRegions: [
    { id: 'north', labelKey: 'region.br.north', codes: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'] },
    { id: 'northeast', labelKey: 'region.br.northeast', codes: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
    { id: 'central-west', labelKey: 'region.br.centralWest', codes: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'southeast', labelKey: 'region.br.southeast', codes: ['ES', 'MG', 'RJ', 'SP'] },
    { id: 'south', labelKey: 'region.br.south', codes: ['PR', 'RS', 'SC'] },
  ],
  sources: [
    {
      field: 'codes',
      citation: 'ISO 3166-2:BR, subdivision codes of Brazil (ISO 3166 Maintenance Agency); consulted through the public ISO 3166-2:BR listing',
      url: 'https://www.iso.org/obp/ui/#iso:code:3166:BR',
      retrievedOn: RETRIEVED,
    },
    {
      field: 'names',
      citation: 'IBGE, Divisão Territorial Brasileira (official names of the federative units), matching the ISO 3166-2:BR names',
      url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/23701-divisao-territorial-brasileira.html',
      retrievedOn: RETRIEVED,
    },
    {
      field: 'macroRegions',
      citation: 'IBGE, Divisões Regionais do Brasil: the five Grandes Regiões (Norte, Nordeste, Centro-Oeste, Sudeste, Sul); membership cross-checked on the public summary at https://en.wikipedia.org/wiki/Regions_of_Brazil',
      url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/divisao-regional/15778-divisoes-regionais-do-brasil.html',
      retrievedOn: RETRIEVED,
    },
  ],
  version: RETRIEVED,
}

/** Registers Brazil in the default registry (never on import). */
export function register(): void {
  registerRegionTheme(brazilRegionTheme)
}
