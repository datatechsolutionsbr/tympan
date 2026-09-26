# Provenance

Author: Natalia Mesquita. Per part: the source it implements and the decisions
taken where the source left room. "Contrato" is `brasil-real/editor/CONTRATO.md`;
"estudos" are the author's style studies in `diagramacao/estilos/`.

| Part | Source | Decisions |
|---|---|---|
| `LivroPrint`, `Dupla`, `Pagina` | Contrato §2, §4; estudos (page grid: top 17 mm, bottom 15 mm, inner 18 mm, outer 14 mm) | Six-column type area (panels span `largura` columns, as in the content JSON); CSS injected inline so SSR pages carry it; `@page` 170 × 240 mm with zero margin (pages draw their own); chapter opens on a left page with `break-before: left` |
| Paper textures | estudos (`grao`, `fibra`, `kraft`, `pauta`, `mm`/`cm` patterns) | Inline SVG per page, fixed `seed`s, ink colour and intensity from the resolved style (so P&B turns them grey) |
| `Painel` and panel letters | estudos | Frame from `estrutura.painel`; hand-drawn frames are a rough.js path in a stretched 100 × 100 box with non-scaling stroke (SSR-safe, no measurement); heading level 2 by default so pages go h1 → panels without skipping |
| `MarcaProva` | Contrato §2; estudos; `marca-lakebrasil.md` ("estado de prova = palavra + borda + ícone") | Word always printed; six shapes; each state also has its own line (solid, double, wavy, thin, dashed, dotted) and icon so it reads in black and white |
| `GraficoMetodo` | Contrato §2 (regra dura), content schema (`barras`, `serie`, `contagem`, `esquema`), estudos | Geometry is pure (`geometria.ts`) and in mm; renderers draw each mark at the origin of a group translated to its data position; one annotation = editorial leader, several = numbered notes; highlighted rows take the highlight colour, the others fall back to ink and context; tile legends and "1 ícone = n" keys printed; a data table is always present |
| Renderers | estudos (rough.js in `mao`/`caderno`, woodcut filters in `cordel`, half-tone and grain in `riso`, cotas in `prancheta`, `aq-*` filters in `aquarela`, dot grids in `deardata`, pictograms in `isotype`) | rough.js used only through `rough.generator()`; `pontos` keeps k units per column so dot bars are as long as the data; `isotype` picks a round unit so icons are ≥ 2.4 mm wide and cuts the last one to the fraction |
| `LogoLakebrasil`, `SeloLakebrasil` | `diagramacao/logo/*.svg`, `marca-lakebrasil.md`; author's decision of 2026-09-26 (colour by default) | Artwork extracted once into `logo-dados.ts`; mono in P&B and in one-ink styles (`PrintStyle.logo = 'mono'`); dark paper or the cover switches to the dark-background version |
| `LogoDatatech` | `diagramacao/logo/datatech-*.svg` (via `scripts/gerar-marcas.mjs`), author's decision | Colour by default; `tinta`, `duotom`, `estilo` recolour the mono master (badge, DATA, TECH, SOLUTIONS) and refuse lakebrasil colours (ΔE2000 < 10 falls back to the style's ink) |
| Content renderer (`conteudo.tsx`) | content schema and chapters | Registry of accepted props per component so ignored content is detected (`propsDesconhecidas`) |
| Cover graphic (`Capa.cortes`) | content (`cortes`, `legendaGrafismo`) | Log scale (the 17 cuts span 10 188 to 156 216), stated in the caption |
| `Mapa` | content (`exemplo`, "mapa esquemático em ladrilhos") | UF tile grid, deterministic example classes from a seeded hash, classes as fill patterns (reads in P&B), "Dados de exemplo" tag |
| Gallery and screenshots | Contrato; estudo 7 (jornal) for the content | Numbers only from Q46 of `roteiro/viabilidade-dados.md`; chart type per preset follows each study, with a switch to force one |
