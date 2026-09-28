# Tympan Dioxus (Native) — Migration Tracker

Este documento rastreia a migração dos componentes de UI do `generated/` (bindings gerados a partir das definitions TS) para ports nativos Dioxus em `crates/tympan-dioxus/src/elements/`.

## Regras da migração (validadas na Onda 1)

- **Paridade SSR obrigatória**: todo port nativo renderiza exatamente a mesma árvore (tags, atributos, texto) das fixtures em `crates/tympan-dioxus/tests/fixtures/`, as mesmas contra as quais os bindings gerados e os elementos TS são testados. Uma anatomia, três renderers. Testes em `crates/tympan-dioxus/tests/parity/native/<elemento>.rs`.
- **Comportamento em Rust, sem `elements.js`**: o que o custom element fazia em JS vira signals + effects Dioxus; código que toca o DOM (web-sys) fica em um `mod wasm` cfg-gated com gêmeo no-op para non-wasm (exemplar: `src/elements/checkbox.rs`).
- **Anatomia nativa de plataforma primeiro**: os elementos de formulário do Tympan usam `<input>`/`<label>` reais — nesses, o comportamento é da plataforma e o componente só espelha estado. As primitivas headless do `third_party/dioxus-components` entram por **composição** onde a anatomia casa (overlays, tabs, toast — Ondas 2/3), não por cópia.
- **Gates**: `cargo test` · `cargo check --target wasm32-unknown-unknown` · `cargo clippy --all-targets -- -D warnings` (host) — todos verdes.

## 🌊 Onda 1: Fundação & Átomos — ✅ COMPLETA (28/09/2026)

12 componentes nativos, 73 testes de paridade SSR verdes (229 no total com os 156 gerados):

- [x] `Button` (busy guard em Rust; 8 testes)
- [x] `Checkbox` (indeterminate via propriedade, form reset; 6 testes) — exemplar do padrão
- [x] `Switch` (Enter toggles, read-only, form reset; 5 testes)
- [x] `Text Field` (valor controlado sem perturbar o caret, clear, reveal de senha, contador UTF-16; 9 testes)
- [x] `Text Area` (autogrow medido, contador, default-value para reset nativo; 7 testes)
- [x] `Heading` (estático; 6 testes)
- [x] `Section Heading` (estático; 5 testes)
- [x] `Surface` (press forwarding com guardas de seleção/aninhamento; 7 testes)
- [x] `Spinner` (prefers-reduced-motion via matchMedia; 5 testes)
- [x] `Skeleton` (linhas empilhadas/presets compostos em rsx, sem upgrade script; 5 testes)
- [x] `Tag` (category-index normalizado, label default do botão remover; 5 testes)
- [x] `Status Pill` (mapa de status, label fallback, warn de status desconhecido; 5 testes)

## 🌊 Onda 2: Navegação e Feedback — ✅ COMPLETA (28/09/2026)

10 componentes nativos, 39 testes de paridade SSR verdes (268 no total: 156 gerados + 112 nativos, 22 elementos portados). Todos portados **sem dependência de `dioxus-primitives`** — composição declarativa em `rsx!` + efeitos DOM cfg-gated bastou; a composição com upstream fica para os overlays (Onda 3), onde portal/focus-trap justificam.

- [x] `Link` (hint de nova aba preenchido pós-mount; 5 testes)
- [x] `Skip Link` (href derivado, foco + scroll + replaceState sem entrada no histórico; 2 testes)
- [x] `Breadcrumbs` (parser JSON próprio, colapso com `<details>` nativo, modo auto via matchMedia, `ty-navigate` vira callback; 3 testes)
- [x] `Tabs` (roving tabindex, setas/Home/End com RTL, wiring de painéis via MutationObserver; 3 testes)
- [x] `Segmented Control` (APG radio group, composição pós-mount p/ paridade, haptic tick; 5 testes)
- [x] `Progress Bar` (clamp, aria-valuetext, fill inline-size, data-complete; 5 testes)
- [x] `Inline Notice` (dismiss move foco para o próximo elemento focalizável; 6 testes)
- [x] `Toast` (fila com timers e pausa hover/foco/visibilidade, swipe-to-dismiss, F6, API imperativa via contexto `use_toast()`; 2 testes — elemento sem fixtures por design)
- [x] `Notification Center` (badge unseen com flash, ledger de histórico, modal com scroll-lock/inert/focus-trap; 3 testes)
- [x] `Separator` (estático; 5 testes)

## 🌊 Onda 3: Sobreposições — próxima

- [ ] `Popover` (substitui os `flyout` e `info_popover` do Astrlabe)
- [ ] `Modal` / `Drawer` (dialog + focus-trap)
- [ ] `Action Menu` / `Context Menu` (dropdown_menu / context_menu)
- [ ] `Theme Palette` / `Command Palette`

## 🌊 Onda 4: Dados e Canvas (O Fim do Jogo)

- [ ] `Data Table` / `Native Select` / `Wheel Picker` / `Avatar` / `Currency Field` / `Tag Field` / `Markdown View` / `Empty State` / `Page Header` / `Field`
- [ ] **`Tympan-Flow` (Canvas)**: o objetivo final. Substituir o `astrlabe-canvas-geom` e unificar a interface de nós e edges diretamente no WASM.

---

## O que falta vir do Astrlabe para cá?

Para que a crate `tympan-dioxus` seja a ÚNICA fonte da verdade de UI, os seguintes componentes locais que hoje "moram" no código do `astrlabe-web` precisam ser portados para cá e expostos como primitivas:
1. `flyout.rs` e `info_popover.rs` → viram `TyPopover` e `TyTooltip`.
2. `segmented_control.rs` → vira `TySegmentedControl`.
3. `data_table.rs` → vira a tabela genérica e acessível do Tympan.
4. **O Canvas/Editor de Grafos:** Toda a lógica de UI de nós (nodes) e linhas que o Astrlabe usa (hoje local em `astrlabe-canvas-geom`) deve descer para a crate `tympan-flow` nativa em Rust. O Astrlabe passa apenas a importar `<TyFlowEditor />`.

## Contribuição upstream (DioxusLabs/components)

Primitivas construídas aqui que não existem no catálogo upstream (ex: `Wheel Picker`, `Data Table`, `Command Palette`) serão submetidas como PR ao [DioxusLabs/components](https://github.com/DioxusLabs/components) — o clone em `third_party/dioxus-components` existe para isso. Os ports nativos Wave 1 também são candidatos a exemplos upstream de "styled wrapper sobre primitiva headless".
