# Tympan Dioxus: Estratégia de Migração e Arquitetura

## 1. A Visão Arquitetural
Com a decisão estratégica de que o **Quilate será 100% headless (interação via MCP para Modelos de IA)**, a manutenção de um ecossistema React pesado para UI tornou-se obsoleta na Datatech. 
O foco absoluto da interface visual da empresa passou a ser o **Astrlabe** (plataforma de workflows e agentes), cuja stack foi definida como **100% Rust (Backend em Axum + Frontend em Dioxus/WASM)**.

Para suportar isso, o **Tympan** deixa de ser um projeto React que "exporta" bindings para o Rust, e passa a ser um **Design System nativo em Dioxus**.

## 2. O Problema do Retrabalho
Na iteração anterior, os componentes Dioxus estavam sendo escritos absolutamente do zero (incluindo lógicas ultra-complexas de acessibilidade, *light-dismiss*, portais e navegação por teclado). Isso recriava o que a comunidade já havia resolvido.

**A Solução:** Utilizar o repositório open-source **DioxusLabs** (`dioxus-components`) como fundação comportamental. Copiamos o código deles, mantemos a acessibilidade e apenas injetamos o nosso sistema de design e tokens (`--ty-*`).

## 3. A Estratégia: Side-by-Side Parity (Migração por Paridade)
Não vamos apagar a base TypeScript legada imediatamente. Vamos usá-la como nosso *Gold Standard* para garantir que não haja regressão visual ou de acessibilidade.

O fluxo de trabalho para os desenvolvedores e agentes de IA será:
1. **O Padrão Ouro:** Rodar a galeria React legada (`packages/ui/gallery`).
2. **A Nova Referência:** Rodar o novo app de apresentação `crates/tympan-gallery` (construído nativamente em Dioxus).
3. **Migração (Onda a Onda):** 
   - Copiar o componente alvo da pasta `third_party/dioxus-components/primitives/src/`.
   - Colá-lo em `crates/tympan-dioxus/src/elements/`.
   - Substituir as classes genéricas pelas variáveis `--ty-*` do Tympan.
4. **Validação:** Comparar as duas galerias visualmente e testar pelo teclado.
5. **Limpeza:** Deletar o respectivo componente antigo da pasta `generated/*.rs`.

## 4. O Roadmap de Componentes (As Ondas)

**🌊 Onda 1: A Fundação**
- *Componentes:* Button, Checkbox, Switch, Text Field, Heading, Surface, Spinner, Tag.

**🌊 Onda 2: Navegação e Feedback**
- *Componentes:* Link, Breadcrumbs, Tabs, Segmented Control, Progress Bar, Toast, Inline Notice.

**🌊 Onda 3: Sobreposições (DioxusLabs Heavylifting)**
- *Componentes:* Popover, Modal, Drawer, Action Menu, Context Menu.
- *Impacto no Astrlabe:* Aqui o Astrlabe apaga seus componentes locais `flyout.rs` e `info_popover.rs` e passa a usar os nativos do Tympan.

**🌊 Onda 4: Dados e Canvas (O Chefe Final)**
- *Componentes:* Data Table, Avatar, Wheel Picker.
- *Impacto no Astrlabe:* O editor de grafos `astrlabe-canvas-geom` é refatorado e movido para `tympan-flow`, processando nós diretamente no WASM.

## 5. Contribuição Open-Source (Upstream)
Primitivas que construirmos na pasta `elements/` usando o padrão nativo Headless, mas que **não existirem** no DioxusLabs (ex: `Wheel Picker`, `Data Table`, `Command Palette`), serão submetidas de volta ao [DioxusLabs/dioxus-components](https://github.com/DioxusLabs/dioxus-components) através de *Pull Requests*, marcando a Datatech como um membro ativo na construção do ecossistema de UI do Rust.

## 6. O Futuro do TypeScript no Tympan
- Os tokens (`tympan-tokens`) continuam gerando o CSS oficial.
- O gerador de componentes (`tools/elements/generate.mjs`) é descontinuado e apagado.
- O React só é acionado se a versão legado do Quilate ou o Pitch Deck precisarem pontualmente de manutenção, mas a evolução central da empresa roda em `crates/`.
