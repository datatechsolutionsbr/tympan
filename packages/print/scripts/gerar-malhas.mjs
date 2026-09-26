// Builds the map meshes of src/mapa/dados/ from the IBGE 2022 municipal mesh
// (Malha Municipal 2022, BR_Municipios_2022.shp, SIRGAS 2000 lon/lat).
//
//   node scripts/gerar-malhas.mjs [path/to/BR_Municipios_2022.shp]
//
// Default source: ~/datatech/municipios-br/data/malhas/raw/BR_Municipios_2022.shp
// (download: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/
// 15774-malhas.html, "Brasil > Municípios", 2022). Runs mapshaper (MPL-2.0)
// through npx; nothing of mapshaper ships with the package.
//
// Steps:
//   1. drop the two water bodies the mesh carries as pseudo-municipalities
//      (4300001 Lagoa Mirim, 4300002 Lagoa dos Patos): 5,572 → 5,570;
//   2. simplify preserving topology (Visvalingam, 2 km interval, keep-shapes so
//      no municipality vanishes; shared borders stay shared);
//   3. municipios.topo.json: properties { code: 7-digit IBGE code, name };
//   4. ufs.topo.json: the SAME simplified arcs dissolved by federative unit
//      (properties { code: 'SP', ibge: '35', name }), so UF borders are
//      exactly the municipal ones.
// Coordinates stay geographic (lon/lat); the component projects them.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync, mkdtempSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = join(fileURLToPath(import.meta.url), '..', '..')
const origem = process.argv[2] ?? join(homedir(), 'datatech/municipios-br/data/malhas/raw/BR_Municipios_2022.shp')
if (!existsSync(origem)) throw new Error(`malha IBGE não encontrada: ${origem}`)
const destino = join(pkg, 'src', 'mapa', 'dados')
const tmp = mkdtempSync(join(tmpdir(), 'ty-malhas-'))

const NOMES_UF = {
  11: ['RO', 'Rondônia'], 12: ['AC', 'Acre'], 13: ['AM', 'Amazonas'], 14: ['RR', 'Roraima'], 15: ['PA', 'Pará'],
  16: ['AP', 'Amapá'], 17: ['TO', 'Tocantins'], 21: ['MA', 'Maranhão'], 22: ['PI', 'Piauí'], 23: ['CE', 'Ceará'],
  24: ['RN', 'Rio Grande do Norte'], 25: ['PB', 'Paraíba'], 26: ['PE', 'Pernambuco'], 27: ['AL', 'Alagoas'],
  28: ['SE', 'Sergipe'], 29: ['BA', 'Bahia'], 31: ['MG', 'Minas Gerais'], 32: ['ES', 'Espírito Santo'],
  33: ['RJ', 'Rio de Janeiro'], 35: ['SP', 'São Paulo'], 41: ['PR', 'Paraná'], 42: ['SC', 'Santa Catarina'],
  43: ['RS', 'Rio Grande do Sul'], 50: ['MS', 'Mato Grosso do Sul'], 51: ['MT', 'Mato Grosso'], 52: ['GO', 'Goiás'],
  53: ['DF', 'Distrito Federal'],
}

const mapshaper = (...args) => execFileSync('npx', ['-y', 'mapshaper@0.7.68', ...args], { stdio: 'inherit' })

const mun = join(destino, 'municipios.topo.json')
mapshaper(
  origem, 'encoding=utf8',
  '-filter', 'CD_MUN != "4300001" && CD_MUN != "4300002"',
  '-simplify', 'interval=2000', 'keep-shapes',
  '-each', 'code=CD_MUN, name=NM_MUN',
  '-filter-fields', 'code,name',
  '-rename-layers', 'municipios',
  '-o', mun, 'format=topojson', 'quantization=20000',
)

const ufsTmp = join(tmp, 'ufs.topo.json')
mapshaper(
  mun,
  '-each', 'uf=code.slice(0,2)',
  '-dissolve', 'uf',
  '-rename-layers', 'ufs',
  '-o', ufsTmp, 'format=topojson', 'quantization=20000',
)
const ufs = JSON.parse(readFileSync(ufsTmp, 'utf8'))
for (const g of ufs.objects.ufs.geometries) {
  const [code, name] = NOMES_UF[g.properties.uf]
  g.properties = { code, ibge: g.properties.uf, name }
}
writeFileSync(join(destino, 'ufs.topo.json'), JSON.stringify(ufs))

// Stable key order and no trailing noise, so regenerating is a no-op diff.
const m = JSON.parse(readFileSync(mun, 'utf8'))
if (m.objects.municipios.geometries.length !== 5570) throw new Error('esperados 5.570 municípios')
writeFileSync(mun, JSON.stringify(m))
for (const f of ['municipios.topo.json', 'ufs.topo.json']) console.log(`src/mapa/dados/${f}: ${(statSync(join(destino, f)).size / 1024).toFixed(0)} KB`)
