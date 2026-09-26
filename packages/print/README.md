# @datatechsolutions/tympan-print

Static React components for data books (React 18.3 or 19): spreads of two
170 × 240 mm pages, lettered dashboard panels, the method chart, proof-state
marks, the number trace, the source line with the lakebrasil seal, the
lakebrasil and Datatech marks, cover, part opening, reading guide, timeline and
schematic map. Every component renders on the server
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
npm run gallery -w @datatechsolutions/tympan-print       # http://localhost:3330 (FPM method spread, every preset, P&B)
npm run gallery:shots -w @datatechsolutions/tympan-print # gallery/shots/<preset>.png via headless Chrome
```

`BRASIL_REAL_CONTEUDO=/abs/path/brasil-real/conteudo npm test -w @datatechsolutions/tympan-print`
also renders every panel of the book's real content in every preset and
fails on any prop the components would ignore.

## Use

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { LivroPrint, Dupla, Pagina, Painel, GraficoMetodo, Veredito, Fonte } from '@datatechsolutions/tympan-print'

const html = renderToStaticMarkup(
  <LivroPrint estilo="jornal" pb={false} tokens={{ cor: { destaque: '#8a1c7c' } }}>
    <Dupla numero="22-23" parte="Parte I · Dinheiro e regra" capitulo="As faixas do FPM" abreCapitulo>
      <Pagina lado="par">
        <Painel letra="d" titulo="O gráfico do método">
          <GraficoMetodo spec={spec} alt="Censo 2022: 132 acima, 36 abaixo do corte." />
        </Painel>
        <Fonte texto="IBGE, Censo 2022" versaoLake="2026-09-25" rodape />
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
| `Capa`, `AberturaParte`, `ComoLer`, `LinhaDoTempo`, `Mapa` | cover, part opening, reading guide, timeline of laws, schematic tile map |
| `DesenhoPublicado`, `NaSuaCidade`, `ManchetaIlustrativa`, `ProximoCapitulo`, `Ficha` | pre-registered design, "in your city" card, illustrative headline, next chapter, term list |

Positions and lengths in charts come from the data through linear scales in
millimetres; renderers draw each mark at the origin of a group the chart
places, so a hand-drawn style can tremble a contour but cannot move a point
or stretch a bar (tested numerically in every renderer). Every figure has an
accessible name that states the finding and a data table.
