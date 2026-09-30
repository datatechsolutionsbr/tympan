// Content JSON (brasil-real/content/: livro.json + capitulos/<id>.json) to
// components. Each panel node is `{ tipo: <ComponentName>, props }`; Painel
// nodes carry nested nodes in `props.children`. `propsDesconhecidas` lists any
// prop a node carries that its component does not read, so an editor or a
// test can refuse silently ignored content.
import type { ComponentType, ReactNode } from 'react'
import type { PrintPresetName, PrintStyle, PrintStyleOverrides } from '@datatechsolutions/tympan-tokens'
import { GraficoMetodo } from './chart/MethodChart.tsx'
import { ITENS_SPEC_CORRELACAO, SPEC_CORRELACAO } from './chart/correlationContract.ts'
import { Area } from './book/Area.tsx'
import { Dupla } from './book/Spread.tsx'
import { LivroPrint } from './book/PrintBook.tsx'
import { Pagina } from './book/Page.tsx'
import { LogoDatatech } from './brand/LogoDatatech.tsx'
import { LogoLakebrasil } from './brand/LogoLakebrasil.tsx'
import { Mapa } from './map/PrintMap.tsx'
import { AberturaParte, Capa, ComoLer, LinhaDoTempo } from './panels/Openers.tsx'
import { MarcaProva } from './panels/ProofMark.tsx'
import {
  DesenhoPublicado,
  Ficha,
  Fonte,
  ManchetaIlustrativa,
  NaoDaParaAfirmar,
  NaSuaCidade,
  Numeros,
  ProximoCapitulo,
  Promessa,
  QuandoODadoChegar,
  Rastro,
  TabelaDados,
  Testes,
  Veredito,
} from './panels/Method.tsx'
import { Figuras } from './panels/Figures.tsx'
import { Painel } from './panels/Panel.tsx'
import { Anotacao, Margem, Texto } from './panels/Text.tsx'

export interface NoJson {
  tipo: string
  props: Record<string, unknown>
  /** Area of the page's molde the node goes in (livro/moldes.ts). Consecutive nodes of one area stack in it. */
  area?: string
}

export interface PaginaJson {
  lado: 'par' | 'impar'
  variante?: 'normal' | 'capa' | 'prancha'
  cabeco?: string
  folio?: boolean
  /** Template of this page, when it differs from the spread's. */
  molde?: string
  paineis: NoJson[]
}

export interface DuplaJson {
  numero: string
  rotulo?: string
  densidade?: string
  /** Template of the spread: where each area of each page sits (livro/moldes.ts). */
  molde?: string
  paginas: PaginaJson[]
}

export interface CapituloJson {
  id: string
  tipo?: string
  numero?: number | null
  parte?: string | null
  titulo: string
  pergunta?: string
  norma?: string
  degrau?: number
  notas?: string[]
  duplas: DuplaJson[]
}

export interface LivroJson {
  titulo: string
  estilo: string
  tokens?: PrintStyleOverrides
  pb?: boolean
  versaoLake?: string
  capitulos: string[]
  [k: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Qualquer = ComponentType<any>

interface Registro {
  componente: Qualquer
  /** Props the component reads (as named in the content JSON). */
  props: string[]
  /** Renames from JSON to React (`ref` is reserved by React). */
  renomear?: Record<string, string>
}

const BASE_GRAFICO = ['tipo', 'titulo', 'subtitulo', 'achado', 'anotacoes']
const SPEC: Record<string, string[]> = {
  halteres: [...BASE_GRAFICO, 'escala', 'linhas', 'rotuloA', 'rotuloB', 'unidade', 'eixoNaoComecaNoZero', 'referencias'],
  barras: [...BASE_GRAFICO, 'escala', 'unidade', 'barras', 'linhas', 'rotuloA', 'rotuloB', 'dobra'],
  serie: [...BASE_GRAFICO, 'escala', 'eixoX', 'unidade', 'interpolar', 'pontos', 'eventos', 'faixas'],
  contagem: [...BASE_GRAFICO, 'unidade', 'grupos', 'linhas', 'rotuloA', 'rotuloB', 'rotuloUnidade', 'icone'],
  esquema: [...BASE_GRAFICO, 'nome', 'rotulos'],
  ...SPEC_CORRELACAO,
}
const ITENS_SPEC: Record<string, string[]> = {
  linhas: ['rotulo', 'nota', 'a', 'b', 'destaque', 'brand', 'local'],
  barras: ['rotulo', 'valor', 'destaque', 'nota'],
  grupos: ['rotulo', 'valor', 'destaque', 'nota'],
  pontos: ['x', 'y', 'rotulo', 'chamada'],
  eventos: ['x', 'rotulo', 'nota'],
  faixas: ['de', 'ate', 'rotulo'],
  anotacoes: ['linha', 'texto'],
  referencias: ['valor', 'rotulo'],
}

/** Components by content `tipo`, with the props each one reads. */
export const COMPONENTES: Record<string, Registro> = {
  Painel: { componente: Painel, props: ['letra', 'titulo', 'eyebrow', 'largura', 'variante', 'nivel', 'children', 'className'] },
  Figuras: { componente: Figuras, props: ['arranjo', 'pesos', 'manchete', 'children', 'className'] },
  Texto: { componente: Texto, props: ['eyebrow', 'titulo', 'nivel', 'variante', 'paragrafos', 'lista', 'largura', 'className'] },
  Margem: { componente: Margem, props: ['titulo', 'texto', 'className'] },
  Anotacao: { componente: Anotacao, props: ['alvo', 'texto', 'className'] },
  Promessa: { componente: Promessa, props: ['citacao', 'norma', 'data', 'resumo', 'urn', 'detalhes', 'genealogia', 'className'] },
  Numeros: { componente: Numeros, props: ['itens', 'exemplo', 'className'] },
  GraficoMetodo: { componente: GraficoMetodo, props: ['spec', 'renderizador', 'alt', 'tabela', 'local', 'largura', 'letra', 'className'] },
  TabelaDados: { componente: TabelaDados, props: ['titulo', 'colunas', 'linhas', 'nota', 'className'] },
  Veredito: { componente: Veredito, props: ['promessa', 'texto', 'estado', 'itens', 'medicaoMarcada', 'proposto', 'className'] },
  MarcaProva: { componente: MarcaProva, props: ['estado', 'grande', 'forma', 'className'] },
  NaoDaParaAfirmar: { componente: NaoDaParaAfirmar, props: ['itens', 'className'] },
  Rastro: {
    componente: Rastro,
    props: ['ref', 'referencia', 'numero', 'descricao', 'consulta', 'sha256', 'tabela', 'cobertura', 'fonteOficial', 'licenca', 'versao', 'edicao', 'assinatura', 'className'],
    renomear: { ref: 'referencia' },
  },
  Fonte: { componente: Fonte, props: ['texto', 'versaoLake', 'rodape', 'className'] },
  LogoLakebrasil: { componente: LogoLakebrasil, props: ['variante', 'largura', 'protecao', 'decorativo', 'className'] },
  LogoDatatech: { componente: LogoDatatech, props: ['variante', 'largura', 'cor', 'cor2', 'rotulo', 'texto', 'protecao', 'className'] },
  AberturaParte: { componente: AberturaParte, props: ['numero', 'titulo', 'pergunta', 'partes', 'nestaParte', 'ondeIssoVolta', 'className'] },
  Capa: {
    componente: Capa,
    props: ['face', 'eyebrow', 'titulo', 'subtitulo', 'autora', 'chamada', 'paragrafos', 'destaque', 'cortes', 'legendaGrafismo', 'selo', 'isbn', 'editora', 'className'],
  },
  ComoLer: { componente: ComoLer, props: ['secao', 'titulo', 'letras', 'estados', 'itens', 'regra', 'className'] },
  Mapa: {
    componente: Mapa,
    props: [
      'titulo', 'alt', 'nivel', 'valores', 'classes', 'limites', 'unidade', 'escala', 'destaques', 'recorte', 'exemplo', 'legenda', 'semDado',
      'rotulos', 'comoLer', 'naoMostra', 'tabela', 'renderizador', 'largura', 'altura', 'multiplos', 'colunas', 'sangria', 'className',
    ],
  },
  Testes: { componente: Testes, props: ['titulo', 'itens', 'className'] },
  DesenhoPublicado: { componente: DesenhoPublicado, props: ['titulo', 'itens', 'className'] },
  NaSuaCidade: { componente: NaSuaCidade, props: ['titulo', 'campos', 'nota', 'url', 'versaoLake', 'className'] },
  QuandoODadoChegar: { componente: QuandoODadoChegar, props: ['texto', 'itens', 'className'] },
  ManchetaIlustrativa: { componente: ManchetaIlustrativa, props: ['texto', 'className'] },
  LinhaDoTempo: { componente: LinhaDoTempo, props: ['titulo', 'de', 'ate', 'alt', 'volumes', 'eventos', 'herdadas', 'nota', 'className'] },
  ProximoCapitulo: { componente: ProximoCapitulo, props: ['titulo', 'texto', 'className'] },
  Ficha: { componente: Ficha, props: ['titulo', 'itens', 'className'] },
}

/** Props of a node (and of its chart spec and nested nodes) that no component reads. Paths like `Veredito.x` or `GraficoMetodo.spec.linhas[0].y`. */
export function propsDesconhecidas(no: NoJson, caminho = no.tipo): string[] {
  const reg = COMPONENTES[no.tipo]
  if (!reg) return [`${caminho}: tipo desconhecido`]
  const out: string[] = []
  for (const k of Object.keys(no.props ?? {})) if (!reg.props.includes(k)) out.push(`${caminho}.${k}`)
  if (no.tipo === 'GraficoMetodo') {
    const spec = no.props.spec as Record<string, unknown> | undefined
    const aceitas = spec ? SPEC[String(spec.tipo)] : undefined
    if (!spec || !aceitas) out.push(`${caminho}.spec.tipo`)
    else {
      for (const k of Object.keys(spec)) if (!aceitas.includes(k)) out.push(`${caminho}.spec.${k}`)
      for (const [lista, chaves] of Object.entries({ ...ITENS_SPEC, ...ITENS_SPEC_CORRELACAO[String(spec.tipo)] })) {
        const arr = spec[lista]
        if (Array.isArray(arr)) arr.forEach((it, i) => Object.keys(it ?? {}).forEach((k) => (chaves.includes(k) ? null : out.push(`${caminho}.spec.${lista}[${i}].${k}`))))
      }
    }
  }
  if (Array.isArray(no.props.children)) {
    ;(no.props.children as NoJson[]).forEach((f, i) => out.push(...propsDesconhecidas(f, `${caminho}.children[${i}].${f.tipo}`)))
  }
  return out
}

/** Renders one content node (and, for Painel, its nested nodes). */
export function NoConteudo({ no }: { no: NoJson }): ReactNode {
  const reg = COMPONENTES[no.tipo]
  if (!reg) throw new Error(`tympan-print: tipo de painel desconhecido "${no.tipo}"`)
  const props: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(no.props ?? {})) {
    if (k === 'children') continue
    props[reg.renomear?.[k] ?? k] = v
  }
  const C = reg.componente
  if (Array.isArray(no.props.children)) {
    return (
      <C {...props}>
        {(no.props.children as NoJson[]).map((f, i) => (
          <NoConteudo key={i} no={f} />
        ))}
      </C>
    )
  }
  return <C {...props} />
}

/** Running heads of a chapter: the part on even pages, "Capítulo n · título" on odd pages. */
function cabecos(cap: CapituloJson) {
  const capitulo = cap.numero ? `Capítulo ${cap.numero} · ${cap.titulo}` : cap.titulo
  return { parte: cap.parte ?? undefined, capitulo }
}

/** Groups the nodes of a page by area, in order; a node without `area` joins the area before it. */
export function agruparPorArea(paineis: NoJson[]): Array<{ area: string | undefined; nos: NoJson[] }> {
  const grupos: Array<{ area: string | undefined; nos: NoJson[] }> = []
  for (const no of paineis) {
    const area = no.area ?? grupos.at(-1)?.area
    const ultimo = grupos.at(-1)
    if (ultimo && ultimo.area === area) ultimo.nos.push(no)
    else grupos.push({ area, nos: [no] })
  }
  return grupos
}

export function PaginaConteudo({ pagina }: { pagina: PaginaJson }) {
  const comAreas = pagina.paineis.some((no) => no.area)
  return (
    <Pagina lado={pagina.lado} variante={pagina.variante} cabeco={pagina.cabeco} folio={pagina.folio ?? true} molde={pagina.molde}>
      {comAreas
        ? agruparPorArea(pagina.paineis).map((g, i) =>
            g.area ? (
              <Area key={`${g.area}-${i}`} nome={g.area}>
                {g.nos.map((no, j) => (
                  <NoConteudo key={j} no={no} />
                ))}
              </Area>
            ) : (
              g.nos.map((no, j) => <NoConteudo key={`${i}-${j}`} no={no} />)
            ),
          )
        : pagina.paineis.map((no, i) => <NoConteudo key={i} no={no} />)}
    </Pagina>
  )
}

/** Every spread of a chapter; the first one opens on an even (left) page in print. */
export function CapituloConteudo({ capitulo }: { capitulo: CapituloJson }) {
  const c = cabecos(capitulo)
  return (
    <>
      {capitulo.duplas.map((d, i) => (
        <Dupla key={d.numero} numero={d.numero} parte={c.parte} capitulo={c.capitulo} abreCapitulo={i === 0} molde={d.molde}>
          {d.paginas.map((p) => (
            <PaginaConteudo key={p.lado} pagina={p} />
          ))}
        </Dupla>
      ))}
    </>
  )
}

export interface LivroConteudoProps {
  livro: LivroJson
  /** Chapters by id (the files of content/capitulos/). */
  capitulos: Record<string, CapituloJson>
  /** Style override (defaults to livro.estilo). */
  estilo?: PrintStyle | PrintPresetName
  tokens?: PrintStyleOverrides
  pb?: boolean
  incluirCss?: boolean
  carregarFontes?: boolean
}

/** The whole book from content JSON, in print order. */
export function LivroConteudo({ livro, capitulos, estilo, tokens, pb, incluirCss, carregarFontes }: LivroConteudoProps) {
  return (
    <LivroPrint estilo={estilo ?? (livro.estilo as PrintPresetName)} tokens={tokens ?? livro.tokens} pb={pb ?? livro.pb ?? false} incluirCss={incluirCss} carregarFontes={carregarFontes}>
      {livro.capitulos.map((id) => {
        const cap = capitulos[id]
        return cap ? <CapituloConteudo key={id} capitulo={cap} /> : null
      })}
    </LivroPrint>
  )
}
