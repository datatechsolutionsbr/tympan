# @datatechsolutions/tympan-print

Static React components for data books (React 18.3 or 19): spreads of two
170 × 240 mm pages, lettered dashboard panels, the method chart, proof-state
marks, the number trace, the source line with the lakebrasil seal, the
lakebrasil and Datatech marks, cover, part opening, reading guide, timeline and
the real map of Brazil (IBGE 2024 municipal mesh, Albers), plus page ornaments (`Ornamento`) for the styles that have them. Every component renders on the server
(`renderToStaticMarkup`) with no `window` or `document`, and the output is
deterministic, so the same content gives the same PDF and EPUB bytes. Styles
come from the book-style presets of `@datatechsolutions/tympan-tokens`
(`printPresets`); CSS lives in `@layer tympan-print`, classes use `ty-print-*`,
custom properties `--ty-print-*`, and layout uses logical properties.
Tympan is an Astrlabe-family component published by Datatech. Licence:
FSL-1.1-ALv2; see `LICENSE`.

```sh
npm run build -w @datatechsolutions/tympan-print         # dist/index.js, index.d.ts, styles.css
npm run typecheck -w @datatechsolutions/tympan-print
npm test -w @datatechsolutions/tympan-print              # vitest + Testing Library + axe-core
npm run gallery -w @datatechsolutions/tympan-print       # http://localhost:3330 (example method spread, every preset, P&B)
npm run gallery:shots -w @datatechsolutions/tympan-print # gallery/shots/<preset>.png via headless Chrome
```

`BRASIL_REAL_CONTEUDO=/abs/path/to/conteudo npm test -w @datatechsolutions/tympan-print`
also renders every panel of a real book's content folder in every preset and
fails on any prop the components would ignore.

## Installing

`react` and `react-dom` are peer dependencies (18.3 or 19): the package never brings its own copy.

- **Recommended for a local build** (before a release is published): pack and install the tarballs,
  `npm pack -w @datatechsolutions/tympan-tokens -w @datatechsolutions/tympan-print` in this repo, then
  `npm i ../tympan/datatechsolutions-tympan-tokens-*.tgz ../tympan/datatechsolutions-tympan-print-*.tgz`.
- `file:` works only with `--install-links` (or `install-links=true` in the consumer's `.npmrc`): a plain
  `file:` dependency is a symlink, and Node resolves `react` from the link's real path, which is this
  workspace's React 19; a React 18 app then fails with "Objects are not valid as a React child". Bundlers
  that follow symlinks need `resolve.dedupe: ['react', 'react-dom']` for the same reason.
- `node tools/consumer-react18.mjs` checks both paths against a React 18 project.

## Use

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { LivroPrint, Dupla, Pagina, Painel, GraficoMetodo, Veredito, Fonte } from '@datatechsolutions/tympan-print'

const html = renderToStaticMarkup(
  <LivroPrint estilo="jornal" pb={false} tokens={{ cor: { destaque: '#8a1c7c' } }}>
    <Dupla numero="22-23" parte="Parte I · Ar e cidade" capitulo="A zona de baixa emissão" abreCapitulo>
      <Pagina lado="par">
        <Painel letra="d" titulo="O gráfico do método">
          <GraficoMetodo spec={spec} alt="Inverno 2022: 127 dias acima do limite fora da zona, 54 dentro." />
        </Painel>
        <Fonte texto="Rede de monitoramento de Vila Aurora (dados fictícios)" rodape />
      </Pagina>
      <Pagina lado="impar">…</Pagina>
    </Dupla>
  </LivroPrint>,
)
```

`LivroPrint` injects the component CSS (`PRINT_CSS`), the preset's custom
properties and `@page { size: 170mm 240mm }`, and links the preset's Google
Fonts; turn either off with `incluirCss={false}` (then import
`@datatechsolutions/tympan-print/styles.css`) or `carregarFontes={false}`. In
print, each page breaks after itself and a spread with `abreCapitulo` starts
on a left (even) page.

Content JSON (`livro.json` + `capitulos/<id>.json`, one `{ tipo, props }`
node per panel) renders with `NoConteudo`, `PaginaConteudo`,
`CapituloConteudo` or `LivroConteudo`; `propsDesconhecidas(no)` lists props a
component would not read. `ref` in content (Rastro) maps to `referencia`.

## Components

| Component | What it prints |
|---|---|
| `LivroPrint` | root: style, tokens, P&B, CSS, fonts |
| `Dupla`, `Pagina` | spread and page (running head, folio, paper texture, six-column type area; `variante` normal, capa, prancha) |
| `Painel` | lettered panel; frame follows the style (rule, box, hand-drawn box, drafting board, card, flat band) |
| `Texto`, `Margem`, `Anotacao` | text (eyebrow, title, paragraphs, lists, code, quotation, rule of thumb), margin note, editorial note |
| `Promessa`, `Numeros`, `TabelaDados` | the law's promise, the numbers strip, the data table |
| `GraficoMetodo` | method chart: `halteres`, `barras`, `serie`, `contagem` (Isotype), `esquema`; renderers `limpo`, `mao` (rough.js, fixed seed), `isotype`, `gravura`, `prancheta`, `aquarela` (SVG filters), `riso`, `pontos` |
| `Veredito`, `Testes`, `MarcaProva`, `NaoDaParaAfirmar`, `QuandoODadoChegar` | verdict, tests, proof-state mark (word always printed; shape `pilula`, `carimbo`, `circulo`, `sublinhado`, `barra`, `etiqueta`) |
| `Rastro`, `Fonte`, `SeloLakebrasil` | number trace; source line with the "Dados lakebrasil · lake AAAA-MM-DD" seal |
| `LogoLakebrasil`, `LogoDatatech` | the official marks (outlined text); colour by default, mono in P&B and one-ink styles |
| `Capa`, `AberturaParte`, `ComoLer`, `LinhaDoTempo`, `Mapa` | cover, part opening, reading guide, timeline of laws, choropleth map of Brazil by UF or municipality (IBGE 2024 mesh, Albers equal-area conic; breaks or quantiles; highlights by code or "Nome/UF"; `recorte` by region or UFs; `multiplos` for small multiples with one legend; `altura` caps the height; flat colour, P&B hatches or dot screens by renderer, a 'sem dado' texture) |
| `DesenhoPublicado`, `NaSuaCidade`, `ManchetaIlustrativa`, `ProximoCapitulo`, `Ficha` | pre-registered design, "in your city" card, illustrative headline, next chapter, term list |

Positions and lengths in charts come from the data through linear scales in
millimetres; renderers draw each mark at the origin of a group the chart
places, so a hand-drawn style can tremble a contour but cannot move a point
or stretch a bar (tested numerically in every renderer). Every figure has an
accessible name that states the finding and a data table.

## Language

`PrintBook lang` (default `pt-BR`) sets the texts the components write by themselves (proof-state words,
"Fonte:", trace labels, accessible names of pages and spreads, map and table captions, the CSS "Você sabia?")
and the number format of tables, numbers strips, chart labels and axes (`Intl.NumberFormat`). Two
dictionaries ship, `TEXTOS_PT` and `TEXTOS_EN` (`lang="en"`); override any key with the theme's `textos` or
`PrintBook textos={{ fonte: 'Sources:' }}`. Component and prop names stay Portuguese (the content contract).
The trace (`Trace`/Rastro) is neutral by default: no hash line unless `sha256` is given, and no mark or
lake seal unless the theme sets `rastro: { assinatura: 'selo' | 'lakebrasil', seloLake: true }` (or the
props `assinatura`/`seloLake`). Books that relied on the old signed default set it in their theme.

## Book themes

A publisher or collection defines its own theme: inherit a preset (or another theme), override any token, add
publisher extras, register it by id and pass the id to `PrintBook`.

```ts
import { registerPrintTheme } from '@datatechsolutions/tympan-tokens'

registerPrintTheme({
  id: 'minha-editora', base: 'semanario',
  fontes: { titulo: '"Source Serif 4", serif', numero: '"Source Serif 4", serif', rotulo: '"IBM Plex Sans", sans-serif' },
  cor: { destaque: '#1f4e79', contexto: '#b8b8b8', divergente: ['#2166ac', '#e66101'], categorica: ['#0072b2', '#e69f00'] },
  pb: { destaque: '#222222' },
  texto: { nomesProprios: 'preservar', numerosTabela: 'tabular' },
  marcas: { editora: { src: 'logo.svg', alt: 'Minha Editora' }, selo: { src: 'selo.svg', alt: 'Coleção X' } },
  pagina: { largura: 160, altura: 230, sangria: 3, marcasCorte: true },
  folio: { folio: 'centro', cabeco: 'externo', prefixoFolio: '' },
  fontesLocais: [{ familia: 'Source Serif 4', src: 'fonts/SourceSerif4-Semibold.woff2', peso: 600 }],
})
// <PrintBook estilo="minha-editora" fontes="locais" impressao> … </PrintBook>
```

- **Custom cover plate**: `<Cover>{art}</Cover>` replaces the cover layout with your own drawing, edge to
  edge, and into the bleed when the book prints with `impressao` (crop marks still drawn).
- **Marks**: `Cover logo` (true = `marcas.editora`, or a mark/element; 22 mm front, 26 mm back, 14 mm tall
  at most) and a running-foot mark on the inner side (`Page marca`, or the theme's `folio.marca: 'editora'`;
  height from the molde's `marcaRodape`, default 3.5 mm). `Mark` renders any of them (P&B: `srcPb` or grey).
- **Cascade**: `{ id: 'volume-3', base: 'minha-editora', cor: { destaque: '#226633' } }`.
- **From JSON**: `registerPrintTheme(json)` takes the same object as JSON (colours as hex or DTCG colour
  objects), or a **DTCG tree** whose groups mirror the fields (`cor.destaque.$value`, `fontes.titulo.$value`
  as a font array, `cor.categorica.1`…) with the id and base in
  `$extensions["dev.tympan.print"] = { name, extends }`. The brand's identity stays in the brand's repo:
  `registerPrintTheme(JSON.parse(readFileSync('lakebrasil-brand/editorial/tympan/lakebrasil-editorial.tokens.json')))`
  (that file is the test fixture and the gallery demo).
- **Data palette** (read by maps and charts, never fixed colours): `destaque` (series of interest, full ink),
  `contexto` (the rest, grey), `divergente` (low × high), `categorica` (up to 8, no implied order; default
  Okabe–Ito). Number font (`fontes.numero`) is separate from text (`corpo`) and labels (`rotulo`).
- **Mixing styles in one PDF**: each `PrintBook` scopes its tokens by a hash of its resolved style, so
  sibling books (openings in one theme, unit pages in another) coexist in one HTML. Several books in the
  *same* style rendered separately: give each an `escopo`.
- **Print for the press**: `impressao` (or `{ sangria, marcasCorte }`) puts each page on a sheet of trim +
  bleed (+ 6 mm slug with crop marks); `@page` grows to match. Print-on-demand services that want *no*
  bleed take the default output (PDF = trim size); offset printers and services that ask for bleed take
  `impressao` (default 3 mm). Page ornaments are drawn in the theme trim.
- **Fonts offline**: `fontes="locais"` emits `@font-face` for the OFL woff2 files bundled in
  `@datatechsolutions/tympan-tokens/fonts` (every family the presets name, incl. Source Serif 4, IBM Plex
  Sans/Mono, Fira Sans Condensed; versions, licences and sha256 in `fonts/manifest.json`), found at
  `baseFontes` (default `fonts/`: copy or link that folder beside the HTML, or pass a `file://` URL), and
  links nothing. A theme's `fontesLocais` win for their family. Files load only when used (unicode-range).
- **Long runs**: `estrutura.economiaTinta` drops page ornaments and tinted panel fills and turns the
  'bolso' panel into a rule (bauhaus for thousands of unit pages, PLANO §9 items 3–4).
- **Typesetting**: `hyphens: auto` by the book's `lang`, widows/orphans 2, titles kept with what follows,
  table heads repeat and rows never split.

## Components for one page per territorial unit

| Component | What it prints |
|---|---|
| molde `unidade-territorial` | head (title 3 cols + `bandeira` 1 + locator `a` 2), `b` numbers, `c` main table (grows), `d` + `e`, `f`, `fonte` — same areas on both pages |
| `PrintFlag` | flag/coat-of-arms box; without `src`, a dashed "sem bandeira no acervo" frame (nothing invented) |
| `PrintLocatorMap` | the unit in `destaque` among its topological neighbours (`aneis`) in `contexto`, cut to their bbox, no labels on the mesh; `chamada` adds a leader line to the margin with the text outside the SVG; only those geometries are embedded (~10–30 KB) |
| `PrintMap escala="categorica"` | `categorias` by code (≤ 8), qualitative palette; in P&B eight hatches that differ in kind |
| `PrintSymbolMap` | proportional circles (area ∝ value) over the recorte outline, largest first, reference legend |
| `Parliament` | hemicycle, one dot per seat, parties in order, optional `maioria` line; legend with seat counts |
| colours by key | `PrintMap escala="categorica" cores={{ PT: '#c4122d' }}`, `Parliament cores`, single-series `barras` (`spec.cores`, key = `categoria` or the label) or the theme's `cor.categorias`: two visible categories closer than ΔE2000 10 get an extra hatch (a ring in the parliament); text over a colour is black or white for AA; very light colours get a thin outline; P&B prints a grey tone, a hatch of its own kind and the label |
| `vizinhanca(code, aneis)` | neighbour codes from the mesh topology |

| molde `unidade-territorial-painel` | head row + one growing area `painel` for a `PanelGrid` + `fonte` |
| `PanelGrid` | dense grid (8 columns by default) of blocks of any span, packed in order |
| `ThemeBlock` | themed block: rule and tag in the theme's colour (`cor.temas.<id>` → `--ty-print-tema-<id>`; ink in P&B), title, tiles, or the reason it has none (`vazio`) |
| `IndicatorTile` | label, value in the number font (book locale), unit/prefix, optional `Sparkline`, `PercentileBar`, year; `[sem dado]` when null |
| `PercentileBar` | bar filled to the national percentile in the block colour (never good/bad colours, no arrows), "acima de X% dos municípios" or, with `polaridade="menos"`, "maior que em X%…", and the rank with ties ("1º–3º de 15 em RR") |
| `Sparkline` | a series in real millimetres (never stretched), last point marked |
| `PrintLocatorMap inset capital escala` | small Brazil with the UF, the UF capital (`CAPITAIS`) when in the window and not the unit, a round graphic scale |

Fill mode: `estrutura.preencher` (on in `dashboard`) or `Page preencher` packs panels into rows of six columns
and widens the last panel of each row to the row's end. Copyfitting (`ajustarPaginas`) grows sparse fill
pages up to 1.5× (templated pages: the molde's `maximo`, default 1.3) and shrinks overfull ones down to 0.84.
PrintBook embeds the copyfitting script automatically when the style fills pages (`ajustar={false}` to opt
out, `ajustar` to force it on any style); it runs once fonts are ready and then sets
`<html data-ty-print-ajuste="pronto">`; a PDF renderer should wait for that attribute before printing.

The municipal mesh is IBGE Malha Municipal 2024 (5,571 municipalities). Gallery:
`npm run gallery` → "livros: unidade territorial"; `node scripts/gallery-shots.mjs --grafico books --only lakebrasil-editorial --pb`.
