# Clean-room record

Date: 2026-09-26. Author: Natalia Mesquita. Branch: `feat/print`, worktree
`~/datatech/tympan-print-wt`.

## Why

The Brasil Real book is laid out with Tympan components in interchangeable
book styles, exported to PDF and EPUB from the same content. This package is
new code; it replaces no earlier implementation and forks nothing.

## Who read what

| Role | Who | Read | Did not read |
|---|---|---|---|
| Implementer | Claude (agent session `01YBJ31J4nmp4xCSmBbwQSh6`), acting for Natalia Mesquita | the inputs below | the fork or any commercial template; any other component library's source |

## Allowed inputs (the only sources used)

1. `brasil-real/editor/CONTRATO.md` (the component contract with the book editor).
2. The author's visual studies of the book styles:
   `brasil-real/volumes/v0-guia/diagramacao/estilos/` (HTML, PNG and the Python
   generator) and `diagramacao/marca-lakebrasil.md`, `diagramacao/logo/*.svg`.
3. The book's content schema and chapters, `brasil-real/conteudo/`.
4. This repository: `packages/tokens`, `packages/ui` and `packages/flow` (conventions,
   build and test setup), `tools/guardrails`.
5. Public documentation: rough.js README and type definitions (MIT), React
   `renderToStaticMarkup`, SVG 1.1 filter effects, CSS Paged Media (`@page`,
   `break-before: left`), WAI-ARIA and axe-core rule descriptions.
6. Published design traditions, as ideas only (no artwork copied): Edward Tufte,
   Josef Müller-Brockmann, Brazilian concrete design, The Economist, Nigel
   Holmes, Herbert Bayer, the Financial Times, W. E. B. Du Bois, Dear Data,
   Isotype, cordel woodcut, risograph and blueprint conventions.
