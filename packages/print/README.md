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
  `impressao` (default 3 mm). Page ornaments are drawn for 170 × 240 mm and scale to other trims.
- **Fonts offline**: `fontes="locais"` emits `@font-face` from `fontesLocais` (woff2 path or data: URI)
  and links nothing; families without a file fall back to their stack. No font files ship with tympan.
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
| `vizinhanca(code, aneis)` | neighbour codes from the mesh topology |

The municipal mesh is IBGE Malha Municipal 2024 (5,571 municipalities). Gallery:
`npm run gallery` → "livros: unidade territorial"; `node scripts/gallery-shots.mjs --grafico books --only lakebrasil-editorial --pb`.
