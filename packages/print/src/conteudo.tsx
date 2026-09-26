// Content JSON (brasil-real/conteudo/: livro.json + capitulos/<id>.json) to
// components. Each panel node is `{ tipo: <ComponentName>, props }`; Painel
// nodes carry nested nodes in `props.children`. `propsDesconhecidas` lists any
// prop a node carries that its component does not read, so an editor or a
// test can refuse silently ignored content.
import type { ComponentType, ReactNode } from 'react'
import type { PrintPresetName, PrintStyle, PrintStyleOverrides } from '@datatechsolutions/tympan-tokens'
import { GraficoMetodo } from './grafico/GraficoMetodo.tsx'
import { Dupla } from './livro/Dupla.tsx'
import { LivroPrint } from './livro/LivroPrint.tsx'
import { Pagina } from './livro/Pagina.tsx'
import { LogoDatatech } from './marca/LogoDatatech.tsx'
import { LogoLakebrasil } from './marca/LogoLakebrasil.tsx'
import { AberturaParte, Capa, ComoLer, LinhaDoTempo, Mapa } from './paineis/Aberturas.tsx'
import { MarcaProva } from './paineis/MarcaProva.tsx'
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
} from './paineis/Metodo.tsx'
import { Painel } from './paineis/Painel.tsx'
import { Anotacao, Margem, Texto } from './paineis/Texto.tsx'

export interface NoJson {
  tipo: string
  props: Record<string, unknown>
}

export interface PaginaJson {
  lado: 'par' | 'impar'
  variante?: 'normal' | 'capa' | 'prancha'
  cabeco?: string
  folio?: boolean
  paineis: NoJson[]
}

export interface DuplaJson {
  numero: string
  rotulo?: string
  densidade?: string
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
  barras: [...BASE_GRAFICO, 'escala', 'unidade', 'barras', 'linhas', 'rotuloA', 'rotuloB'],
  serie: [...BASE_GRAFICO, 'escala', 'eixoX', 'unidade', 'interpolar', 'pontos', 'eventos', 'faixas'],
  contagem: [...BASE_GRAFICO, 'unidade', 'grupos', 'linhas', 'rotuloA', 'rotuloB', 'rotuloUnidade', 'icone'],
  esquema: [...BASE_GRAFICO, 'nome', 'rotulos'],
}
const ITENS_SPEC: Record<string, string[]> = {
  linhas: ['rotulo', 'nota', 'a', 'b', 'destaque', 'marca', 'local'],
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
  Texto: { componente: Texto, props: ['eyebrow', 'titulo', 'nivel', 'variante', 'paragrafos', 'lista', 'largura', 'className'] },
  Margem: { componente: Margem, props: ['titulo', 'texto', 'className'] },
  Anotacao: { componente: Anotacao, props: ['alvo', 'texto', 'className'] },
  Promessa: { componente: Promessa, props: ['citacao', 'norma', 'data', 'resumo', 'urn', 'detalhes', 'genealogia', 'className'] },
  Numeros: { componente: Numeros, props: ['itens', 'exemplo', 'className'] },
  GraficoMetodo: { componente: GraficoMetodo, props: ['spec', 'renderizador', 'alt', 'tabela', 'local', 'largura', 'className'] },
  TabelaDados: { componente: TabelaDados, props: ['titulo', 'colunas', 'linhas', 'nota', 'className'] },
  Veredito: { componente: Veredito, props: ['promessa', 'texto', 'estado', 'itens', 'medicaoMarcada', 'proposto', 'className'] },
  MarcaProva: { componente: MarcaProva, props: ['estado', 'grande', 'forma', 'className'] },
  NaoDaParaAfirmar: { componente: NaoDaParaAfirmar, props: ['itens', 'className'] },
  Rastro: {
    componente: Rastro,
    props: ['ref', 'referencia', 'numero', 'descricao', 'consulta', 'sha256', 'tabela', 'cobertura', 'fonteOficial', 'licenca', 'versao', 'edicao', 'className'],
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
  Mapa: { componente: Mapa, props: ['titulo', 'alt', 'exemplo', 'legenda', 'comoLer', 'naoMostra', 'sangria', 'className'] },
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
      for (const [lista, chaves] of Object.entries(ITENS_SPEC)) {
        const arr = spec[lista]
        if (Array.isArray(arr)) arr.forEach((it, i) => Object.keys(it ?? {}).forEach((k) => (chaves.includes(k) ? null : out.push(`${caminho}.spec.${lista}[${i}].${k}`))))
      }
    }
  }
  if (no.tipo === 'Painel' && Array.isArray(no.props.children)) {
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
  if (no.tipo === 'Painel' && Array.isArray(no.props.children)) {
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

export function PaginaConteudo({ pagina }: { pagina: PaginaJson }) {
  return (
    <Pagina lado={pagina.lado} variante={pagina.variante} cabeco={pagina.cabeco} folio={pagina.folio ?? true}>
      {pagina.paineis.map((no, i) => (
        <NoConteudo key={i} no={no} />
      ))}
    </Pagina>
  )
}

/** Every spread of a chapter; the first one opens on an even (left) page in print. */
export function CapituloConteudo({ capitulo }: { capitulo: CapituloJson }) {
  const c = cabecos(capitulo)
  return (
    <>
      {capitulo.duplas.map((d, i) => (
        <Dupla key={d.numero} numero={d.numero} parte={c.parte} capitulo={c.capitulo} abreCapitulo={i === 0}>
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
  /** Chapters by id (the files of conteudo/capitulos/). */
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
