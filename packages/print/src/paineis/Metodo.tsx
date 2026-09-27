import type { EstadoProva } from '@datatechsolutions/tympan-tokens'
import { LogoLakebrasil, SeloLakebrasil } from '../marca/LogoLakebrasil.tsx'
import { usePrint } from '../contexto.tsx'
import { cx, formatarNumero } from '../util.ts'
import { BordaMao, comColchetes } from './comum.tsx'
import { MOLDURAS_CAIXA } from './Painel.tsx'
import { MarcaProva } from './MarcaProva.tsx'

// ---------------------------------------------------------------------------
// Promessa
// ---------------------------------------------------------------------------

export interface Termo {
  termo: string
  definicao: string
}

export interface PromessaProps {
  /** The law's promise, quoted. */
  citacao: string
  /** The norm, as checked in the official text. */
  norma: string
  /** Date of the norm (ISO, AAAA-MM-DD). */
  data?: string
  /** What must hold if the promise is true. */
  resumo?: string
  /** LexML URN of the norm. */
  urn?: string
  detalhes?: Termo[]
  /** Genealogy of the rule: earlier and later norms; `atual` marks this one. */
  genealogia?: Array<{ ano: string; texto: string; atual?: boolean }>
  className?: string
}

function dataBr(iso?: string): string | undefined {
  if (!iso) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export function Promessa({ citacao, norma, data, resumo, urn, detalhes, genealogia, className }: PromessaProps) {
  return (
    <div className={cx('ty-print-promessa', className)}>
      <blockquote className="ty-print-promessa-citacao">
        <p>“{comColchetes(citacao.replace(/^["“]|["”]$/g, ''))}”</p>
      </blockquote>
      <p className="ty-print-norma">
        <cite>{comColchetes(norma)}</cite>
        {data ? (
          <>
            {' · '}
            <time dateTime={data}>{dataBr(data)}</time>
          </>
        ) : null}
      </p>
      {urn ? <p className="ty-print-urn">{urn}</p> : null}
      {detalhes?.length ? <Ficha itens={detalhes} className="ty-print-promessa-detalhes" /> : null}
      {genealogia?.length ? (
        <ol className="ty-print-genealogia" aria-label="Genealogia da regra">
          {genealogia.map((g, i) => (
            <li key={i} data-atual={g.atual ? '' : undefined}>
              <span className="ty-print-genealogia-ano">{comColchetes(g.ano)}</span>
              <span className="ty-print-genealogia-texto">{comColchetes(g.texto)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {resumo ? <p className="ty-print-resumo">{comColchetes(resumo)}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Numeros
// ---------------------------------------------------------------------------

export interface NumeroItem {
  valor: string | number
  /** Unit printed small before the value (R$, US$) or after it (km², %). */
  unidade?: string
  comparado?: string | number
  rotulo: string
  /** Context line under the label (year, base). */
  meta?: string
  /** Number tag (#k1), leads to the trace. */
  ref: string
}

export interface NumerosProps {
  itens: NumeroItem[]
  /** Example data: prints the "Dados de exemplo" tag. */
  exemplo?: boolean
  className?: string
}

const antes = (u?: string) => Boolean(u && /^(R\$|US\$|€|\$)/.test(u))

export function Numeros({ itens, exemplo = false, className }: NumerosProps) {
  return (
    <div className={cx('ty-print-numeros-bloco', className)}>
      {exemplo ? <p className="ty-print-selo-exemplo">Dados de exemplo</p> : null}
      <dl className="ty-print-numeros">
        {itens.map((it, i) => (
          <div key={i} className="ty-print-numero">
            <dt className="ty-print-numero-rotulo">
              {comColchetes(it.rotulo)}
              {it.meta ? <span className="ty-print-numero-meta"> {comColchetes(it.meta)}</span> : null}{' '}
              <span className="ty-print-ref">{comColchetes(it.ref)}</span>
            </dt>
            <dd className="ty-print-numero-valor">
              {antes(it.unidade) ? <span className="ty-print-unidade">{it.unidade} </span> : null}
              <span className="ty-print-valor">{comColchetes(formatarNumero(it.valor))}</span>
              {it.unidade && !antes(it.unidade) ? <span className="ty-print-unidade"> {it.unidade}</span> : null}
              {it.comparado !== undefined ? (
                <>
                  <span className="ty-print-vs" aria-label="contra">
                    {' × '}
                  </span>
                  <span className="ty-print-comparado">{comColchetes(formatarNumero(it.comparado))}</span>
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabelaDados
// ---------------------------------------------------------------------------

export type ColunaTabela = string | { rotulo: string; numerica?: boolean; mono?: boolean }

export interface TabelaDadosProps {
  titulo?: string
  colunas: ColunaTabela[]
  linhas: Array<Array<string | number>>
  nota?: string
  className?: string
}

export function TabelaDados({ titulo, colunas, linhas, nota, className }: TabelaDadosProps) {
  const cols = colunas.map((c) => (typeof c === 'string' ? { rotulo: c } : c))
  // A column is numeric when declared, or when every cell of it is a number.
  const numerica = cols.map((c, j) => c.numerica ?? (linhas.length > 0 && linhas.every((l) => typeof l[j] === 'number')))
  return (
    <div className={cx('ty-print-tabela-bloco', className)}>
      <table className="ty-print-tabela">
        {titulo ? <caption>{comColchetes(titulo)}</caption> : null}
        <thead>
          <tr>
            {cols.map((c, j) => (
              <th key={j} scope="col" data-numerica={numerica[j] ? '' : undefined}>
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i}>
              {cols.map((c, j) => {
                const v = l[j] ?? ''
                return (
                  <td key={j} data-numerica={numerica[j] ? '' : undefined} data-mono={c.mono ? '' : undefined}>
                    {typeof v === 'number' ? formatarNumero(v) : comColchetes(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {nota ? <p className="ty-print-tabela-nota">{comColchetes(nota)}</p> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Veredito, Testes, NaoDaParaAfirmar, QuandoODadoChegar
// ---------------------------------------------------------------------------

export interface VereditoItem {
  afirmacao: string
  base: string
  estado: EstadoProva
}

export interface VereditoProps {
  promessa: string
  texto: string
  /** State of the whole promise, printed large. */
  estado?: EstadoProva
  itens: VereditoItem[]
  /** For pending verdicts: when the measurement is scheduled. */
  medicaoMarcada?: string
  /** States are proposed, pending the author's formal test. */
  proposto?: boolean
  className?: string
}

export function Veredito({ promessa, texto, estado, itens, medicaoMarcada, proposto = false, className }: VereditoProps) {
  return (
    <div className={cx('ty-print-veredito', className)} data-estado={estado}>
      <div className="ty-print-veredito-topo">
        <blockquote className="ty-print-veredito-promessa">
          <p>“{comColchetes(promessa.replace(/^["“]|["”]$/g, ''))}”</p>
        </blockquote>
        {estado ? <MarcaProva estado={estado} grande /> : null}
      </div>
      <p className="ty-print-veredito-texto">{comColchetes(texto)}</p>
      {itens.length ? (
        <ul className="ty-print-veredito-itens">
          {itens.map((it, i) => (
            <li key={i}>
              <span className="ty-print-afirmacao">
                <span>{comColchetes(it.afirmacao)}</span>
                <small className="ty-print-base">{comColchetes(it.base)}</small>
              </span>
              <MarcaProva estado={it.estado} />
            </li>
          ))}
        </ul>
      ) : null}
      {medicaoMarcada ? (
        <p className="ty-print-medicao-marcada">
          <span className="ty-print-medicao-rotulo">Medição marcada:</span> {comColchetes(medicaoMarcada)}
        </p>
      ) : null}
      {proposto ? <p className="ty-print-proposto">Estados propostos, a confirmar pela autora depois do teste formal.</p> : null}
    </div>
  )
}

export interface TestesProps {
  titulo?: string
  itens: Array<{ pergunta: string; estado: EstadoProva; texto: string; proposto?: boolean }>
  className?: string
}

/** The design's tests, each with its proof state. */
export function Testes({ titulo, itens, className }: TestesProps) {
  return (
    <div className={cx('ty-print-testes', className)}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      <ol className="ty-print-testes-lista">
        {itens.map((it, i) => (
          <li key={i}>
            <p className="ty-print-teste-pergunta">{comColchetes(it.pergunta)}</p>
            <MarcaProva estado={it.estado} />
            <p className="ty-print-teste-texto">{comColchetes(it.texto)}</p>
            {it.proposto ? <p className="ty-print-proposto">estado proposto</p> : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

export interface NaoDaParaAfirmarProps {
  itens: Array<{ titulo: string; texto: string; remete?: string }>
  className?: string
}

export function NaoDaParaAfirmar({ itens, className }: NaoDaParaAfirmarProps) {
  return (
    <ul className={cx('ty-print-nao', className)}>
      {itens.map((it, i) => (
        <li key={i}>
          <p className="ty-print-nao-titulo">{comColchetes(it.titulo)}</p>
          <p>
            {comColchetes(it.texto)}
            {it.remete ? <span className="ty-print-remete"> → {comColchetes(it.remete)}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  )
}

export interface QuandoODadoChegarProps {
  texto?: string
  itens?: Array<{ titulo: string; texto: string; estado: EstadoProva }>
  className?: string
}

/** What data would settle the question, and where it is now. */
export function QuandoODadoChegar({ texto, itens, className }: QuandoODadoChegarProps) {
  return (
    <aside className={cx('ty-print-quando', className)}>
      <p className="ty-print-bloco-titulo">Quando o dado chegar</p>
      {texto ? <p>{comColchetes(texto)}</p> : null}
      {itens?.length ? (
        <ul className="ty-print-quando-itens">
          {itens.map((it, i) => (
            <li key={i}>
              <MarcaProva estado={it.estado} />
              <p>
                <strong>{comColchetes(it.titulo)}</strong> {comColchetes(it.texto)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Rastro, Fonte, Ficha
// ---------------------------------------------------------------------------

export interface RastroProps {
  /** Number tag (#k5). In content JSON this is `ref` (mapped by NoConteudo; `ref` is reserved by React). */
  referencia?: string
  numero: string
  /** What the number counts. */
  descricao?: string
  consulta: string
  sha256: string
  tabela: string
  /** Coverage of the table (e.g. "5.570 municípios"). */
  cobertura?: string
  fonteOficial: string
  licenca?: string
  /** Lake version ("lake 2026-09-25"). */
  versao: string
  /** Edition date. */
  edicao?: string
  /** Sign the trace with the lakebrasil mark above the seal, as in the style studies (default true). */
  assinatura?: boolean
  className?: string
}

const curtoSha = (s: string) => (/^[0-9a-f]{16,}$/i.test(s) ? `${s.slice(0, 12)}…` : s)

/** The number's trace: number → query → lake table → official source → version. */
export function Rastro({ referencia, numero, descricao, consulta, sha256, tabela, cobertura, fonteOficial, licenca, versao, edicao, assinatura = true, className }: RastroProps) {
  const versaoLake = /(\d{4}-\d{2}-\d{2})/.exec(versao)?.[1]
  const linhas: Array<[string, string, string | undefined, boolean]> = [
    ['Número', numero, descricao, false],
    ['Consulta', consulta, `sha256 ${curtoSha(sha256)}`, true],
    ['Tabela do lake', tabela, cobertura, true],
    ['Fonte oficial', fonteOficial, licenca ? `licença ${licenca}` : undefined, false],
    ['Versão', versao, edicao ? `edição ${edicao}` : undefined, true],
  ]
  return (
    <div className={cx('ty-print-rastro-bloco', className)} data-ref={referencia}>
      <dl className="ty-print-rastro">
        {linhas.map(([k, v, nota, mono], i) => (
          <div key={k} className="ty-print-rastro-passo" data-passo={i}>
            <dt>{k}</dt>
            <dd>
              <span className={cx('ty-print-rastro-valor', i === 0 && 'ty-print-rastro-numero', mono && 'ty-print-mono')}>{comColchetes(v)}</span>
              {nota ? <span className="ty-print-rastro-nota">{comColchetes(nota)}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      {assinatura || versaoLake ? (
        <div className="ty-print-rastro-assina">
          {assinatura ? <LogoLakebrasil largura={26} /> : null}
          {versaoLake ? <SeloLakebrasil versaoLake={versaoLake} /> : null}
        </div>
      ) : null}
    </div>
  )
}

export interface FonteProps {
  texto: string
  /** Lake version; adds the "Dados lakebrasil · lake <versão>" seal. Omit for numbers not from the published lake. */
  versaoLake?: string
  /** Pin the source line to the foot of the page. */
  rodape?: boolean
  className?: string
}

export function Fonte({ texto, versaoLake, rodape = false, className }: FonteProps) {
  return (
    <p className={cx('ty-print-fonte', className)} data-rodape={rodape ? '' : undefined}>
      <b>Fonte:</b> {comColchetes(texto.replace(/^Fontes?:\s*/, ''))}
      {versaoLake ? (
        <>
          {' '}
          <SeloLakebrasil versaoLake={versaoLake} />
        </>
      ) : null}
    </p>
  )
}

export interface FichaProps {
  titulo?: string
  itens: Termo[]
  className?: string
}

/** Term and definition list (credits, catalogue card, details of a norm). */
export function Ficha({ titulo, itens, className }: FichaProps) {
  return (
    <div className={cx('ty-print-ficha', className)}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      <dl>
        {itens.map((t, i) => (
          <div key={i}>
            <dt>{comColchetes(t.termo)}</dt>
            <dd>{comColchetes(t.definicao)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DesenhoPublicado, NaSuaCidade, ManchetaIlustrativa, ProximoCapitulo
// ---------------------------------------------------------------------------

export interface DesenhoPublicadoProps {
  titulo?: string
  itens: Array<{ rotulo: string; texto: string }>
  className?: string
}

/** Pre-registered design: how the book will measure when the data arrives. */
export function DesenhoPublicado({ titulo, itens, className }: DesenhoPublicadoProps) {
  return (
    <div className={cx('ty-print-desenho', className)}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      <dl>
        {itens.map((it, i) => (
          <div key={i}>
            <dt>{comColchetes(it.rotulo)}</dt>
            <dd>{comColchetes(it.texto)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export interface NaSuaCidadeProps {
  titulo?: string
  /** Blank fields for the reader to fill in. */
  campos: string[]
  nota?: string
  url: string
  versaoLake?: string
  className?: string
}

/** "In your city": a card to fill in, with the web address where it comes filled. */
export function NaSuaCidade({ titulo, campos, nota, url, versaoLake, className }: NaSuaCidadeProps) {
  return (
    <div className={cx('ty-print-cidade', className)}>
      {titulo ? <p className="ty-print-bloco-titulo">{comColchetes(titulo)}</p> : null}
      <dl className="ty-print-cidade-campos">
        {campos.map((c, i) => (
          <div key={i}>
            <dt>{comColchetes(c)}</dt>
            <dd aria-label="a preencher" />
          </div>
        ))}
      </dl>
      {nota ? <p className="ty-print-cidade-nota">{comColchetes(nota)}</p> : null}
      <p className="ty-print-cidade-url">
        <span className="ty-print-mono">{url}</span>
        {versaoLake ? <SeloLakebrasil versaoLake={versaoLake} /> : null}
      </p>
    </div>
  )
}

export interface ManchetaIlustrativaProps {
  texto: string
  className?: string
}

/** An illustrative headline (not a real clipping), always tagged as such. */
export function ManchetaIlustrativa({ texto, className }: ManchetaIlustrativaProps) {
  const { estilo } = usePrint()
  const mao = estilo.traco.tremor > 0 && MOLDURAS_CAIXA.has(estilo.estrutura.painel)
  return (
    <figure className={cx('ty-print-manchete', className)} data-mao={mao ? '' : undefined}>
      {mao ? <BordaMao chave={`manchete-${texto.slice(0, 24)}`} /> : null}
      <p className="ty-print-manchete-texto">{comColchetes(texto.replace(/^\[Manchete ilustrativa:\s*/i, '').replace(/\]$/, ''))}</p>
      <figcaption className="ty-print-selo-exemplo">Manchete ilustrativa</figcaption>
    </figure>
  )
}

export interface ProximoCapituloProps {
  titulo: string
  texto: string
  className?: string
}

export function ProximoCapitulo({ titulo, texto, className }: ProximoCapituloProps) {
  return (
    <aside className={cx('ty-print-proximo', className)}>
      <p className="ty-print-sobretitulo">Próximo capítulo</p>
      <p className="ty-print-proximo-titulo">{comColchetes(titulo)} →</p>
      <p>{comColchetes(texto)}</p>
    </aside>
  )
}
