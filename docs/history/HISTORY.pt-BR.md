# História do Tympan

O Tympan é o design system da Datatech: tokens, componentes React acessíveis
com um canvas de fluxo e proveniência, e componentes de impressão para livros
de dados. O repositório tem poucas horas de histórico no git, porque foi
extraído em 26 de setembro de 2026. A linhagem é bem mais longa. Começa em
janeiro de 2026, dentro de um produto anterior da Datatech, e passa por vários
repositórios, nomes de pacote e duas linguagens. O código do Tympan é novo; o
que atravessou essas eras foram ideias, decisões de produto e uma linguagem
visual.

Este documento conta essa linhagem. As datas vêm do histórico git dos
repositórios anteriores (ou de cópias de segurança deles), dos registros deste
repositório e das datas de arquivo onde não há git. Quando uma data é
aproximada, o texto diz isso.

English version: [HISTORY.en.md](HISTORY.en.md). Linha do tempo para máquinas:
[timeline.json](timeline.json).

## O nome

Um astrolábio tem quatro partes principais. A **mater** é o corpo, a base que
recebe tudo. A **rete** é a grade vazada das estrelas, que gira por cima. A
**alidade** é a régua de mira nas costas. E o **tímpano** (em inglês,
*tympan*) é a placa gravada que se encaixa na mater. Cada placa serve para uma
latitude. O instrumento é sempre o mesmo; para usá-lo em outra cidade, troca-se
a placa.

A Datatech foi dando esses nomes às peças da sua suíte. O Astrlabe é o motor de
execução de workflows. O repositório privado principal da empresa se chama
mater. Alidade foi o nome escolhido em 26 de setembro para uma biblioteca de
modelos de linguagem, abandonada na mesma noite. O Tympan ficou com a placa: os
mesmos componentes, um tema para cada produto e cada livro. A rete ainda não
virou nome de nada. O Windsock, serviço de identidade da suíte, não vem do
astrolábio e hoje está guardado sem uso.

## Era 1 · Um visual de iPhone num produto anterior (janeiro a fevereiro de 2026)

A linhagem visual do Tympan começa num aplicativo de análise de preços de
combustível da Datatech. O repositório desse produto começa em 26 de janeiro
de 2026.

Em 15 de fevereiro o app ganhou um "design system iOS" para os fluxos de
cadastro, e as mensagens de erro viraram notificações no estilo Dynamic Island.
Na mesma semana vieram centenas de testes de componentes.

Em 28 de fevereiro os componentes reutilizáveis saíram do app para um pacote,
`@datatechsolutions/ui`. No mesmo dia o vidro desenhado à mão em cada tela
virou uma classe só (`liquid-surface`), as cores hexadecimais do iOS fixas
nas telas viraram tokens e o pacote ganhou repositório próprio, na versão 1.0.3.

## Era 2 · Liquid glass: `@datatechsolutions/ui` (março a julho de 2026)

Em março o pacote cresceu rápido. Em 2 de março saiu a versão 2.6.0, com
publicação no npm por OIDC a partir do CI, um README com o catálogo de
componentes e os primeiros temas. No mesmo dia nasceu o monorepo da plataforma
(a mater), com o pacote de UI como submódulo. O escopo npm `@datatechsolutions`,
que hoje publica o Tympan, já era usado aqui.

Em 3 e 4 de março chegou o canvas de workflows: primeiro num pacote separado,
depois como módulo do próprio `@datatechsolutions/ui`. É o ancestral mais
distante do canvas de fluxo do Tympan.

A linguagem visual era o que a equipe chamava de *liquid glass*: superfícies
translúcidas com desfoque, um fundo com orbes de cor (o `Ambient`), botões com
gradiente, feedback háptico e componentes pensados primeiro para o toque. O
estilo vinha em classes utilitárias do Tailwind v4 mais uma folha
`liquid-glass.css` própria.

Em 29 de março, na versão 2.11.31, entrou um módulo `brand` com os logotipos e
um mapa `APP_THEMES`: um tema por produto da Datatech, centralizado no pacote.
A ideia de "um tema para cada produto" do Tympan já estava ali. No mesmo dia,
um produto anterior que já usava o nome Fakhir passou a tirar seus temas desse
módulo.

Em 10 de maio o monorepo deixou de usar submódulos, e o pacote de UI passou a
morar em `packages/ui`. Em 22 de maio ganhou Storybook, uma trava de lint
contra `<button>` cru e testes de comportamento no lugar de testes que
conferiam strings de classe (de 74 para zero). O changelog da versão 3.16.0, de
26 de maio, registra quatro rodadas de consolidação: a família de chips caiu de
sete componentes para dois, a de seletores de cinco para dois, e os botões crus
de 232 para 117. O README contava 162 componentes e temas regionais para 30
países.

Em 11 de julho um portão de acessibilidade no Storybook encontrou e corrigiu 36
violações reais. O pacote chegou à versão 4.0.0.

## Era 3 · O Astrlabe aberto e a UI em Rust (agosto a setembro de 2026)

No fim de agosto o motor Astrlabe ganhou uma cópia própria. Em 30 de agosto a
UI desse motor foi separada num pacote, `@datatech/astrlabe-ui`, em fases:
primitivas, avatares, o sistema de i18n com 15 locales e os hooks do canvas. Esse pacote é o elo direto entre o liquid glass e o Fakhir.

Em 12 de setembro saiu a primeira versão pública do núcleo do Astrlabe. A
biblioteca de componentes TypeScript medida nesse dia tinha 102.672 linhas, das
quais 13.928 eram os catálogos dos 15 locales. No mesmo dia começou a migração
da UI para Rust: Dioxus 0.7 compilado para WebAssembly, com a geometria do
canvas numa crate sem navegador. Em 13 de setembro a UI TypeScript foi apagada.
A UI em Rust manteve o vidro e o Tailwind v4, agora varrendo arquivos `.rs`.

Em 20 e 21 de setembro um estudo visual reproduzível, com auditoria de
navegação por teclado, mediu os defeitos dessa UI. Ele alimentou as escolhas de
estilo dos dias seguintes.

## Era 4 · Fakhir herda o vidro (25 de setembro de 2026)

O Fakhir é a plataforma de pesquisa da Datatech. O monorepo dele foi criado em
25 de setembro, com um nome provisório trocado por Fakhir no mesmo dia. No
primeiro dia o `@datatech/astrlabe-ui` entrou inteiro em `packages/ui`, com
histórico, na versão 0.1.0. O canvas saiu dele como pacote próprio
(`packages/workflow`), e a animação trocou `framer-motion` por `motion`.

Na madrugada de 26 de setembro um documento de direção de design comparou a
plataforma nova com uma versão anterior, em Next.js, que carregava o mesmo
`liquid-glass.css`. A conclusão: a falta de harmonia não vinha dos tokens, e
sim da composição. As telas não usavam os componentes do pacote e redesenhavam
botão, campo e cartão à mão. O documento definiu a direção que o Tympan segue
até hoje: uma bancada de trabalho calma e editorial, com a evidência em
primeiro lugar, títulos em serifa, acento teal e controles de 40 px (44 px no
toque).

A mesma auditoria achou um conflito de nomes entre um token de raio da folha de
vidro e uma classe do Tailwind, que fazia todo canto "xl" sair com 20 px em vez
de 12 px. A decisão de sair das classes utilitárias veio poucas horas depois.

## Era 5 · Reescrito do zero (26 de setembro, 01h às 11h)

A decisão foi reescrever a biblioteca inteira, sem Tailwind, com vocabulário e
estrutura próprios. Nenhum arquivo das eras anteriores entrou no Tympan. O
processo teve dois papéis separados:

- quem escreve especificações lê a biblioteca antiga e descreve só
  comportamento: propósito, partes, propriedades, estados, teclado, ARIA e
  testes de aceitação em Dado/Quando/Então. Nada de código, classes ou valores
  visuais;
- quem implementa escreve a biblioteca nova só a partir dessas especificações,
  do documento de direção de design e da documentação pública do React Aria,
  das práticas de autoria WAI-ARIA e do WCAG 2.2.

As especificações saíram em quatro ondas, num total de 222 arquivos. A onda 1
(36) cobre o núcleo que depende só dos tokens. A onda 2 (89) cobre o resto da
biblioteca geral. A onda 3 (63) cobre o canvas, a inspeção de execuções e o
assistente. A onda 4 (34) é o porte completo: tudo o que antes estava marcado
"descartar se não precisar", mais nove especificações novas para a casca de
pesquisa, desenhadas a partir dos storyboards aprovados.

A ordem do dia 26:

- **01h11**: especificações das ondas 1 a 3; às 01h30, a onda 4.
- **01h39**: pacote de tokens no formato W3C DTCG, com um gerador de temas em
  OKLCH e build pelo Style Dictionary. No mesmo minuto entraram as travas
  `check:no-tailwind` e `check:provenance`.
- **01h42 a 01h54**: os 36 componentes da onda 1, a galeria com personalizador
  de temas e os registros de sala limpa. Ao fim da onda 1: 424 testes nos
  componentes e 24 nos tokens.
- **02h18**: começa o canvas de fluxo, já com rótulos por locale, um
  subconjunto de ICU e canvas da direita para a esquerda às 02h30.
- **03h22**: as ondas 2 e 4 entram em nove grupos, a casca de pesquisa (trilho
  lateral, dock flutuante, cabeçalho editorial, painel de evidência), a trava
  `check:logical-css` (nada de left/right físico no CSS) e tipografia por
  escrita com fontes Noto.
- **03h25 a 03h38**: uma passada de idiomas em todos os grupos: catálogo em
  espanhol, plurais do CLDR, dígitos do locale, glifos espelhados, iniciais
  seguras para grafemas e um teste da direita para a esquerda por componente. A
  galeria ganhou troca de idioma e direção em oito locales (pt-BR, en, es, ar,
  he, ja, hi, ru) e pseudolocalização.
- **03h46**: isolamento bidirecional do texto de conteúdo (`dir="auto"`).
- **03h50 a 04h25**: rodadas de reescrita pedidas pela auditoria de
  similaridade.
- **04h56 a 05h50**: editor de DAG, visualizador de proveniência W3C PROV em
  faixas, execuções e assistente, alinhados aos storyboards. O canvas entra na
  linha principal às 05h50.
- **05h56**: tokens de componente do canvas (`--fk-flow-*`) como aliases DTCG
  dos papéis do tema.
- **11h40**: com a plataforma rodando nos pacotes novos, os pacotes antigos de
  UI e de workflow foram apagados do Fakhir.

A auditoria de similaridade rodou de fora da sala limpa. Ela comparou cada
arquivo novo por impressões digitais de tokens (winnowing, k = 12) e por
formato da árvore sintática. A meta era "nenhuma semelhança": contenção abaixo
de 0,03 e Jaccard estrutural abaixo de 0,20 por arquivo. Onde um arquivo
passava do limite, ele era reestruturado de novo a partir da especificação, sem
mudar a API nem os testes. Houve pelo menos três rodadas; o registro da
terceira é das 04h04. Cada componente tem uma linha no `PROVENANCE.md` do seu
pacote, com a especificação, as fontes e as decisões tomadas.

Ao fim das ondas 2 e 4 os componentes tinham 1.625 testes em 199 arquivos, e o
canvas mais 508 testes em 36 arquivos. Todo componente passa por uma checagem
do axe-core. O que o jsdom não sabe medir (área de toque, movimento reduzido,
cores forçadas) é conferido nas folhas de estilo.

### Os tokens

O gerador parte de sementes de cor (marca, neutro, perigo, alerta, sucesso,
informação) e calcula em OKLCH rampas de 11 passos, papéis em pares (fundo e
texto sobre ele), estados de prova, cores de ator (pessoa, agente, sistema) e
oito cores de gráfico. Cada tema sai em claro, escuro e alto contraste. O build
escreve um relatório com a razão WCAG e o Lc do APCA de cada par declarado, e
os testes falham se algum par de texto ficar abaixo de 4,5:1 ou algum par de
interface abaixo de 3:1.

O estilo dos componentes é CSS puro: propriedades customizadas, camadas
`@layer`, classes com prefixo e só propriedades lógicas, para que a direção da
direita para a esquerda espelhe a biblioteca inteira. As preferências do
sistema (esquema de cor, contraste, transparência e movimento reduzidos, cores
forçadas) são tratadas nos tokens e em cada folha de componente.

## Era 6 · Tympan, da Datatech (26 de setembro, 14h às 16h)

Às 14h59 os pacotes ganharam nomes finais dentro do Fakhir: o design system
virou `@fakhir/ui` e o canvas, `@fakhir/flow`. Minutos depois eles foram
extraídos para um repositório próprio, com o histórico só dos pacotes novos.
Por isso o git do Tympan começa nas especificações da 01h11.

- **15h00**: workspace npm na raiz.
- **15h01**: licença FSL-1.1-ALv2, decidida naquele dia para toda a suíte:
  código com fonte disponível que vira Apache 2.0 depois de dois anos.
- **15h02**: CI com instalação, travas, build, checagem de tipos e testes em
  Node 24.
- **15h25**: o nome Tympan, publicado pela Datatech. O prefixo `fk-` virou
  `ty-`, os pacotes foram para o escopo `@datatechsolutions` e o tema do Fakhir
  virou uma placa entre outras (o preset `fakhir`).
- **15h41**: o Fakhir passa a consumir o Tympan como submódulo.

No mesmo dia todo o código da empresa foi concentrado na organização
`datatechsolutionsbr` do GitHub, onde o repositório `tympan` foi criado. Os
repositórios antigos da biblioteca (o `ui` de fevereiro e o `astrlabe-ui` de
agosto, entre outros) foram apagados com cópia de segurança. A trava contra
Tailwind foi generalizada para `check:no-utility-css`.

Às 18h58 ficou pronta uma branch que publica os pacotes como privados no npm,
por publicação confiável via OIDC a partir de tags. Às 19h12 o Fakhir, numa
branch, passou a instalar o Tympan pelo npm em vez do submódulo. A primeira
publicação de cada pacote é manual e ainda não foi confirmada.

## Era 7 · Impressão (26 de setembro, 18h às 22h)

O pacote de impressão nasceu para os livros de dados de uma coleção editorial
da Datatech. Os livros são diagramados com componentes Tympan em estilos de
livro intercambiáveis e exportados para PDF e EPUB a partir do mesmo conteúdo.
A base foram estudos visuais próprios, uma página dupla por estilo.

- **18h11**: 18 estilos de livro entram nos tokens como presets de impressão.
  Cada um define fontes (Google Fonts, licença OFL), papel, tinta, cores de
  dado, cores de estado de prova, textura, traço, renderizador de gráfico,
  forma da marca de prova e estrutura de página.
- **18h32**: as cores de dado ficam a uma distância CIEDE2000 de pelo menos 10
  das cores das marcas, para que um dado nunca pareça logotipo.
- **19h03**: o pacote `@datatechsolutions/tympan-print`: páginas duplas de
  170 × 240 mm, painéis com letra, o gráfico do método com oito renderizadores
  (do limpo ao desenhado à mão, aquarela, risografia e pontos), marcas de estado
  de prova em seis formas, o rastro do número e a linha de fonte. Tudo renderiza
  no servidor sem `window`, e a saída é determinística: o mesmo conteúdo gera os
  mesmos bytes de PDF e EPUB.
- **19h36**: mais 21 estilos, 39 no total, com ornamentos de página, colunas,
  faixas de cabeço e tratamentos de título.
- **por volta das 20h**: uma auditoria estilo por estilo comparou cada estudo com o que o
  pacote gerava. Só 13 estavam fiéis. O que faltava era o que faz cada estilo
  ser ele: a forma própria do gráfico, as anotações dentro dele, os fundos de
  painel.
- **20h09 a 20h53**: mapa coroplético real com projeção cônica de Albers,
  gráficos de correlação, a forma de gráfico e as chamadas de cada estilo e,
  por fim, moldes: modelos explícitos de página dupla.

Às 21h12 cada estilo de livro virou também um tema de tela. O gerador ganhou
papéis de fonte (título, texto, mono) e três tipos de elevação (suave, plana,
deslocada), e os temas `print-<estilo>` passaram a ser opcionais no
`ThemeProvider`, que carrega a folha de fontes junto. Com isso o relatório de
contraste passou a cobrir 156 conjuntos de impressão (39 estilos em claro,
escuro e alto contraste de cada modo) além dos 14 de interface: mais de 12 mil
pares, todos no AA.

Às 21h34 os estilos foram renomeados para ids e rótulos neutros e descritivos,
para que nenhum id ou rótulo use nome de pessoa, de instituição ou marca. Dezoito
ids mudaram. Os antigos continuam aceitos como aliases, com um aviso em
desenvolvimento, e saem na próxima versão maior. Às 21h37 os aliases foram
publicados numa entrada leve dos tokens e o `ThemeProvider` passou a
traduzi-los.

## Era 8 · Menos pacotes, mais produto (26 de setembro, 21h em diante)

- **21h29**: a galeria de componentes virou um site de documentação: barra
  lateral por categoria, um cartão por componente com prévia e código, claro e
  escuro, larguras de telefone e tablet, "nesta página" e navegação
  anterior/próximo. Às 22h17 a barra de ferramentas coube numa linha, com
  popovers de tema, modo, idioma e exibição.
- **21h54**: o canvas de fluxo entrou no pacote de componentes como o subpath
  `@datatechsolutions/tympan/flow`, com o `@dagrejs/dagre` como dependência
  opcional. Ficaram três pacotes: tokens, componentes e impressão. Uma branch
  das 22h08 leva também os tokens para dentro do pacote de componentes, como
  `/tokens`, o que deixaria só dois: `@datatechsolutions/tympan` e
  `@datatechsolutions/tympan-print`.
- **22h33 a 22h44**: avatares gerados (`/avatars`) e bandeiras de países e
  regiões (`/flags`), com registros de licença, e o `Avatar` passou a desenhar
  arte no lugar das iniciais.

### O lado Rust

A UI do Astrlabe continua em Rust e Dioxus, mas está saindo do Tailwind para o
Tympan. Às 21h50 o Tympan ganhou um preset `astrlabe` e, às 21h56, um contrato
HTML documentado para quem renderiza sem React (Rust, templates de servidor,
web components). No Astrlabe, uma branch das 21h57 traz o CSS do Tympan para a
UI web, e outra das 22h05 guarda no banco o tema padrão de cada organização,
como toda a configuração do Astrlabe.

O plano seguinte são duas crates no repositório do Tympan: `tympan-tokens`, com
todos os temas como enum tipado, modo, densidade e as folhas de estilo
compiladas dentro, e `tympan-dioxus`, com um `ThemeProvider` e componentes
Dioxus que geram exatamente as mesmas classes e atributos ARIA dos componentes
React, para que uma só folha de estilo sirva aos dois. A branch já existe; as
crates ainda não.

### O site

Às 22h15 começou o site do Tympan. A página inicial desenha um tímpano de
astrolábio calculado para 23°32′ S, com horizonte, almucântaras e linhas de
azimute; a mesma geometria desenha a marca do Tympan e o favicon. O site tem
seções de componentes, temas numa tela real, estilos de livro com o livro de
exemplo inteiro, uma cena de dados animada em SVG e instalação. O seletor de
temas é uma paleta de comandos com prévia ao vivo. Na branch do site, as
galerias e os testes trocaram os dados de exemplo por um estudo fictício de
qualidade do ar.

## Números (26 de setembro de 2026, à noite)

| O quê | Quanto |
|---|---|
| Especificações de comportamento (ondas 1 a 4) | 222 |
| Pastas de componentes em `packages/ui` | 142 |
| Temas de interface | 4 (`tympan`, `fakhir`, `neutral`, `high-contrast`), mais `astrlabe` numa branch |
| Estilos de livro, também temas de tela | 39 |
| Conjuntos no relatório de contraste | 170 (14 de interface, 156 de impressão), todos no AA |
| Idiomas com texto próprio | 3 (inglês, português do Brasil, espanhol); qualquer outro locale recebe números, datas e plurais corretos |
| Locales na galeria | 8, incluindo árabe e hebraico da direita para a esquerda |
| Testes passando | 483 nos tokens, 2.193 nos componentes (com o canvas), 343 na impressão |
| Mensagens de interface exportadas para o catálogo do Fakhir | 2.551 |

## O que vem

- juntar as branches abertas: tokens dentro do pacote de componentes, preset
  `astrlabe`, publicação no npm, site;
- publicar os pacotes privados no npm sob `@datatechsolutions`;
- as crates `tympan-tokens` e `tympan-dioxus`, e o Astrlabe inteiro no Tympan;
- o site como vitrine, com o seletor de temas em paleta de comandos, avatares,
  bandeiras e as marcas da família Datatech;
- a quinta onda de especificações, já escrita: mais componentes gerais,
  incluindo conversa, e uma família de comércio.

## Linha do tempo

| Data | Era | O que aconteceu |
|---|---|---|
| 2026-01-26 | 1 | Começa o repositório do app de preços de combustível onde a UI nasce |
| 2026-02-15 | 1 | "Design system iOS" e notificações estilo Dynamic Island |
| 2026-02-28 | 1 | Componentes extraídos para `@datatechsolutions/ui`; vidro vira a classe `liquid-surface`; repositório próprio (1.0.3) |
| 2026-03-02 | 2 | Versão 2.6.0, publicação no npm por OIDC; nasce o monorepo mater com a UI como submódulo |
| 2026-03-03 | 2 | Canvas de workflows, primeiro num pacote próprio e no dia seguinte dentro da UI |
| 2026-03-29 | 2 | Módulo `brand` com `APP_THEMES`: um tema por produto (2.11.31) |
| 2026-05-10 | 2 | A UI passa a morar em `packages/ui` no monorepo |
| 2026-05-22 | 2 | Storybook, trava contra botão cru, testes de comportamento |
| 2026-05-26 | 2 | 3.16.0: quatro rodadas de consolidação, 162 componentes, temas de 30 países |
| 2026-07-11 | 2 | Portão de acessibilidade corrige 36 violações |
| 2026-08-30 | 3 | `@datatech/astrlabe-ui` separado da UI do Astrlabe, com 15 locales |
| 2026-09-12 | 3 | Núcleo público do Astrlabe; biblioteca TS de 102.672 linhas; começa a UI em Rust |
| 2026-09-13 | 3 | UI TypeScript apagada; Dioxus com vidro e Tailwind v4 |
| 2026-09-21 | 3 | Estudo visual reproduzível e auditoria de teclado da UI em Rust |
| 2026-09-25 | 4 | Fakhir nasce e herda o `astrlabe-ui` com histórico |
| 2026-09-26 00h40 | 4 | Direção de design: bancada editorial, evidência primeiro |
| 2026-09-26 01h11 | 5 | Especificações de sala limpa, ondas 1 a 4 (222) |
| 2026-09-26 01h39 | 5 | Tokens DTCG com gerador OKLCH e travas contra Tailwind e de proveniência |
| 2026-09-26 01h42 | 5 | Onda 1: 36 componentes, galeria com personalizador |
| 2026-09-26 03h22 | 5 | Ondas 2 e 4, casca de pesquisa, CSS só lógico |
| 2026-09-26 03h25 | 5 | Idiomas e direita para a esquerda em todos os grupos; oito locales na galeria |
| 2026-09-26 04h04 | 5 | Terceira rodada da auditoria de similaridade |
| 2026-09-26 05h50 | 5 | Canvas de fluxo: DAG, proveniência, execuções, assistente |
| 2026-09-26 11h40 | 5 | Pacotes antigos de UI apagados do Fakhir |
| 2026-09-26 15h01 | 6 | Licença FSL-1.1-ALv2 |
| 2026-09-26 15h25 | 6 | Nome Tympan, publicado pela Datatech, prefixo `ty-` |
| 2026-09-26 18h11 | 7 | 18 estilos de livro nos tokens |
| 2026-09-26 19h03 | 7 | Pacote `tympan-print` |
| 2026-09-26 19h36 | 7 | 39 estilos de livro |
| 2026-09-26 20h53 | 7 | Moldes de página dupla |
| 2026-09-26 21h12 | 7 | Estilos de livro viram temas de tela; 156 conjuntos no AA |
| 2026-09-26 21h29 | 8 | Galeria como site de documentação |
| 2026-09-26 21h34 | 7 | Estilos renomeados para ids neutros, com aliases |
| 2026-09-26 21h54 | 8 | Canvas vira o subpath `/flow` do pacote de componentes |
| 2026-09-26 21h57 | 8 | Astrlabe começa a usar o CSS do Tympan; preset `astrlabe` |
| 2026-09-26 22h15 | 8 | Começa o site do Tympan |
| 2026-09-26 22h41 | 8 | Avatares e bandeiras |
