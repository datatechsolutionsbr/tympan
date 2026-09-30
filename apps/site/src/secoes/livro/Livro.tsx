// Livro: the 39 book styles of @datatechsolutions/tympan-print on the sample method spread. A real list of
// styles (search, swatches, favourites), the spread on a neutral desk with fit-to-width zoom and fullscreen,
// ← → to change style, the modes Um / Comparar / Antes × depois / Galeria (from the Estúdio's Livro tab),
// and the style sheet: fonts, palette, paper, proof states, theme id and snippets. State lives in the hash.
import { BookOpen, BookOpenText, ChevronLeft, ChevronRight, Columns2, Expand, GalleryHorizontalEnd, Minus, PanelRightClose, PanelRightOpen, Plus, Scan, SplitSquareHorizontal, Square, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, ListboxSelect, SearchBar, SegmentedControl, useMediaQuery } from '@datatechsolutions/tympan'
import { ESTADOS_PROVA, printPresets, resolvePrintStyle, type PrintPresetName } from '../../tokens'
import { Cortina } from '../../comum/Cortina'
import { Encaixe } from '../../comum/Encaixe'
import { BotaoCopiar } from '../../comum/BotaoCopiar'
import { amostra, familia, filtrarEstilos, paleta, temaDoEstilo } from '../../estilos'
import { useI18n, type Chave } from '../../i18n/I18n'
import { useFavoritos, useLocal } from '../../local'
import { Cabeca, Moldura, useHref } from '../../Moldura'
import { teclaDeTroca, TODOS_ESTILOS, vizinho, type Grafico, type Modo, type RotaDe } from '../../rotas'
import { DuplaEstilo, QuandoVisivel } from './Spread'
import { DUPLAS, DuplaDoLivroNoEstilo } from './LivroCompleto'
import { Notas } from './Notas'
import { Visor } from '../../comum/Visor'
import { useTextosEstilo } from './textos'

type RotaLivro = RotaDe<'livro'>
type Ir = (r: RotaLivro, opcoes?: { substituir?: boolean }) => void

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const

// ---------------------------------------------------------------- list of styles (side column)

function Amostra({ id }: { id: PrintPresetName }) {
  const a = amostra(printPresets[id])
  return (
    <span className="ty-site-amostra" aria-hidden="true" style={{ background: a.papel, color: a.tinta }}>
      <span className="ty-site-amostra__linha" />
      <span className="ty-site-amostra__ponto" style={{ background: a.destaque }} />
    </span>
  )
}

function ItemEstilo({ id, atual, fav, aoEscolher }: { id: PrintPresetName; atual: boolean; fav: boolean; aoEscolher: (id: PrintPresetName) => void }) {
  const { rotulo } = useTextosEstilo()
  const { t } = useI18n()
  return (
    <li>
      <button
        type="button"
        className="ty-site-estilo"
        aria-current={atual ? 'true' : undefined}
        data-fecha-gaveta=""
        onClick={() => aoEscolher(id)}
      >
        <Amostra id={id} />
        <span className="ty-site-estilo__nome">{rotulo(id)}</span>
        {fav ? <Star className="ty-site-estilo__fav" aria-label={t('livro.favorito')} /> : null}
      </button>
    </li>
  )
}

function ListaEstilos({ atual, favs, aoEscolher }: { atual: PrintPresetName; favs: string[]; aoEscolher: (id: PrintPresetName) => void }) {
  const { t, n } = useI18n()
  const { rotulo } = useTextosEstilo()
  const [busca, setBusca] = useState('')
  const filtrados = useMemo(() => {
    // Search matches the translated label too.
    const q = busca.trim()
    const base = filtrarEstilos(TODOS_ESTILOS, q)
    if (!q) return base
    const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
    const extra = TODOS_ESTILOS.filter((id) => !base.includes(id) && norm(rotulo(id)).includes(norm(q)))
    return TODOS_ESTILOS.filter((id) => base.includes(id) || extra.includes(id))
  }, [busca, rotulo])
  const favoritos = TODOS_ESTILOS.filter((id) => favs.includes(id))
  return (
    <div className="ty-site-lista">
      <div className="ty-site-lista__busca">
        <SearchBar query={busca} onQueryChange={setBusca} placeholder={t('livro.buscar')} label={t('livro.buscar')} />
      </div>
      {favoritos.length ? (
        <section className="ty-site-lista__grupo" aria-labelledby="livro-favs">
          <h2 className="ty-site-lista__titulo" id="livro-favs">
            {t('livro.favoritos', { n: favoritos.length })}
          </h2>
          <ul className="ty-site-lista__itens">
            {favoritos.map((id) => (
              <ItemEstilo key={id} id={id} atual={id === atual} fav aoEscolher={aoEscolher} />
            ))}
          </ul>
        </section>
      ) : null}
      <section className="ty-site-lista__grupo" aria-labelledby="livro-todos">
        <h2 className="ty-site-lista__titulo" id="livro-todos">
          {filtrados.length === TODOS_ESTILOS.length
            ? t('livro.estilosTodos', { n: TODOS_ESTILOS.length })
            : t('livro.estilosFiltrados', { n: filtrados.length, total: n(TODOS_ESTILOS.length) })}
        </h2>
        {filtrados.length ? (
          <ul className="ty-site-lista__itens">
            {filtrados.map((id) => (
              <ItemEstilo key={id} id={id} atual={id === atual} fav={favs.includes(id)} aoEscolher={aoEscolher} />
            ))}
          </ul>
        ) : (
          <p className="ty-site-dica">{t('livro.nenhumEstilo')}</p>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------- desk (the spread on a neutral surface)

interface MesaProps {
  estilo: PrintPresetName
  grafico: Grafico
  pb: boolean
  zoom: number
  rotulo: string
  /** Fit width and height (fullscreen). */
  inteira?: boolean
  onEscala?: (k: number) => void
}

function Mesa({ estilo, grafico, pb, zoom, rotulo, inteira, onEscala }: MesaProps) {
  return (
    <figure className="ty-site-mesa" data-inteira={inteira ? '' : undefined}>
      <Encaixe zoom={zoom} onEscala={onEscala} ajustarAltura={inteira}>
        <DuplaEstilo estilo={estilo} grafico={grafico} pb={pb} />
      </Encaixe>
      <figcaption className="ty-site-visually-hidden">{rotulo}</figcaption>
    </figure>
  )
}

// ---------------------------------------------------------------- style sheet (side panel)

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="ty-site-ficha__linha">
      <dt>{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function SpecSheet({ estilo, pb, notas }: { estilo: PrintPresetName; pb: boolean; notas?: ReactNode }) {
  const { t } = useI18n()
  const { rotulo, papelDe, rendDe, marcaDe, rotuloProva } = useTextosEstilo()
  const s = useMemo(() => resolvePrintStyle(printPresets[estilo], { pb }), [estilo, pb])
  const tema = temaDoEstilo(estilo)
  const snippetTema = `import '@datatechsolutions/tympan-tokens/print-themes/${tema}.css'\n\n<html data-ty-theme="${tema}">`
  const snippetLivro = `import { PrintBook } from '@datatechsolutions/tympan-print'\n\n<PrintBook estilo="${estilo}"${pb ? ' pb' : ''}>\n  …\n</PrintBook>`
  const papeis: Array<[Chave, string, string]> = [
    ['livro.fonteTitulo', s.fontes.titulo, t('livro.amostraTitulo')],
    ['livro.fonteCorpo', s.fontes.corpo, t('livro.amostraCorpo')],
    ['livro.fonteNumero', s.fontes.numero, '41 × 18 · 0123456789'],
    ['livro.fonteRotulo', s.fontes.rotulo, t('livro.amostraRotulo')],
    ['livro.fonteAnotacao', s.fontes.anotacao, t('livro.amostraAnotacao')],
    ['livro.fonteMono', s.fontes.mono, 'consultas/ar/pm25-fronteira.sql'],
  ]
  return (
    <aside className="ty-site-ficha" aria-labelledby="ficha-titulo">
      <h2 className="ty-site-ficha__titulo" id="ficha-titulo">
        {t('livro.ficha')} <span className="ty-site-ficha__nome">{rotulo(estilo)}</span>
      </h2>

      <section className="ty-site-ficha__bloco" aria-labelledby="ficha-tipos">
        <h3 className="ty-site-ficha__sub" id="ficha-tipos">
          {t('livro.tipos')}
        </h3>
        <ul className="ty-site-tipos">
          {papeis.map(([chave, pilha, texto]) => (
            <li key={chave} className="ty-site-tipos__item">
              <span className="ty-site-tipos__papel">
                {t(chave)} · <span className="ty-site-mono">{familia(pilha)}</span>
              </span>
              <span className="ty-site-tipos__amostra" style={{ fontFamily: pilha }} lang="pt-BR">
                {texto}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ty-site-ficha__bloco" aria-labelledby="ficha-cores">
        <h3 className="ty-site-ficha__sub" id="ficha-cores">
          {t('livro.paleta')}
          {pb ? <span className="ty-site-ficha__nota"> · {t('livro.paletaPb')}</span> : null}
        </h3>
        <ul className="ty-site-cores">
          {paleta(s).map((c) => (
            <li key={c.nome} className="ty-site-cor">
              <span className="ty-site-cor__amostra" style={{ background: c.cor }} aria-hidden="true" />
              <span className="ty-site-cor__nome">{t(`cor.${c.nome.replace(/[ -]/g, '')}` as Chave)}</span>
              <code className="ty-site-cor__hex">{c.cor}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="ty-site-ficha__bloco" aria-labelledby="ficha-papel">
        <h3 className="ty-site-ficha__sub" id="ficha-papel">
          {t('livro.papelTraco')}
        </h3>
        <dl className="ty-site-ficha__dados">
          <Linha rotulo={t('livro.papel')}>{papelDe(s)}</Linha>
          <Linha rotulo={t('livro.raio')}>{s.raio > 0 ? t('livro.raioMm', { mm: s.raio }) : t('livro.raioZero')}</Linha>
          <Linha rotulo={t('livro.renderizador')}>{rendDe(s)}</Linha>
          <Linha rotulo={t('livro.marcaProva')}>{marcaDe(s)}</Linha>
          <Linha rotulo={t('livro.traco')}>{t('livro.tracoMm', { mm: s.traco.largura })}</Linha>
        </dl>
      </section>

      <section className="ty-site-ficha__bloco" aria-labelledby="ficha-prova">
        <h3 className="ty-site-ficha__sub" id="ficha-prova">
          {t('livro.estadosProva')}
        </h3>
        <ul className="ty-site-provas">
          {ESTADOS_PROVA.map((e) => (
            <li key={e} className="ty-site-prova" style={{ color: s.cor.prova[e] }}>
              <span className="ty-site-prova__marca" aria-hidden="true" />
              <span className="ty-site-prova__nome">{rotuloProva(e)}</span>
              <code className="ty-site-cor__hex">{s.cor.prova[e]}</code>
            </li>
          ))}
        </ul>
      </section>

      {notas}
      <section className="ty-site-ficha__bloco" aria-labelledby="ficha-uso">
        <h3 className="ty-site-ficha__sub" id="ficha-uso">
          {t('livro.uso')}
        </h3>
        <div className="ty-site-id">
          <span className="ty-site-id__rotulo">{t('livro.idTema')}</span>
          <code className="ty-site-id__valor">{tema}</code>
          <BotaoCopiar texto={tema} rotulo={t('livro.idTema')} />
        </div>
        <div className="ty-site-codigo">
          <div className="ty-site-codigo__topo">
            <span className="ty-site-codigo__rotulo">{t('livro.snippetTema')}</span>
            <BotaoCopiar texto={snippetTema} rotulo={t('livro.snippetTema')} />
          </div>
          <pre className="ty-site-codigo__pre" dir="ltr">
            <code>{snippetTema}</code>
          </pre>
        </div>
        <div className="ty-site-codigo">
          <div className="ty-site-codigo__topo">
            <span className="ty-site-codigo__rotulo">{t('livro.snippetLivro')}</span>
            <BotaoCopiar texto={snippetLivro} rotulo={t('livro.snippetLivro')} />
          </div>
          <pre className="ty-site-codigo__pre" dir="ltr">
            <code>{snippetLivro}</code>
          </pre>
        </div>
      </section>
    </aside>
  )
}

// ---------------------------------------------------------------- style picker (Comparar, Antes × depois)

function SeletorEstilo({ rotulo, valor, aoMudar }: { rotulo: string; valor: PrintPresetName; aoMudar: (id: PrintPresetName) => void }) {
  const { rotulo: nome } = useTextosEstilo()
  const opcoes = useMemo(
    () =>
      TODOS_ESTILOS.map((id) => {
        const a = amostra(printPresets[id])
        return {
          value: id,
          label: nome(id),
          icon: (
            <span className="ty-site-amostra ty-site-amostra--p" style={{ background: a.papel, color: a.tinta }}>
              <span className="ty-site-amostra__ponto" style={{ background: a.destaque }} />
            </span>
          ),
        }
      }),
    [nome],
  )
  return <ListboxSelect label={rotulo} options={opcoes} value={valor} onChange={(v) => aoMudar(v as PrintPresetName)} className="ty-site-seletor" />
}

// ---------------------------------------------------------------- page

export function Livro({ rota, ir }: { rota: RotaLivro; ir: Ir }) {
  const { t, n, dir } = useI18n()
  const href = useHref()
  const { rotulo, descricao } = useTextosEstilo()
  const [favs, alternar] = useFavoritos('livro:favoritos')
  const [zoom, setZoom] = useLocal<number>('livro:zoom', 1)
  const [ficha, setFicha] = useLocal<boolean>('livro:ficha', true)
  const [escala, setEscala] = useState(0)
  const [cheia, setCheia] = useState(false)
  const [so, setSo] = useState<'todos' | 'favoritos'>('todos')
  const estreito = useMediaQuery('(max-width: 767.98px)')
  const { estilo, grafico, pb, modo, b } = rota
  const set = useCallback((m: Partial<RotaLivro>, substituir = false) => ir({ ...rota, ...m }, { substituir }), [ir, rota])
  const escolher = useCallback((id: PrintPresetName) => set({ estilo: id, ...(modo === 'galeria' ? { modo: 'um' as Modo } : {}) }), [set, modo])

  // ← → change the main style (mirrored in right-to-left layouts).
  useEffect(() => {
    const on = (ev: KeyboardEvent) => {
      if ((ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') || ev.altKey || ev.metaKey || ev.ctrlKey || !teclaDeTroca(ev.target)) return
      const frente = (ev.key === 'ArrowRight') !== (dir === 'rtl')
      ev.preventDefault()
      set({ estilo: vizinho(TODOS_ESTILOS, estilo, frente ? 1 : -1) }, true)
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [estilo, set, dir])

  const passoZoom = (d: 1 | -1) => {
    const i = ZOOMS.findIndex((z) => z >= zoom - 1e-6)
    const j = Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 2 : i) + d))
    setZoom(ZOOMS[j]!)
  }
  const fav = favs.includes(estilo)

  const graficos: Array<{ value: Grafico; label: string }> = [
    { value: 'estudo', label: t('livro.graficoEstudo') },
    { value: 'halteres', label: t('livro.graficoHalteres') },
    { value: 'barras', label: t('livro.graficoBarras') },
    { value: 'contagem', label: t('livro.graficoContagem') },
    { value: 'mapa', label: t('livro.graficoMapa') },
  ]

  const barra = (
    <div className="ty-site-barra" role="toolbar" aria-label={t('livro.ferramentas')}>
      <SegmentedControl
        label={t('livro.modo')}
        size="compact"
        iconOnly={estreito}
        value={modo}
        onChange={(v) => set({ modo: v as Modo })}
        options={[
          { value: 'um', label: t('modo.um'), icon: Square },
          { value: 'comparar', label: t('modo.comparar'), icon: Columns2 },
          { value: 'antes', label: t('modo.antes'), icon: SplitSquareHorizontal },
          { value: 'galeria', label: t('modo.galeria'), icon: GalleryHorizontalEnd },
          { value: 'completo', label: t('modo.completo'), icon: BookOpenText },
        ]}
      />
      {estreito ? (
        <ListboxSelect accessibleLabel={t('livro.grafico')} options={graficos} value={grafico} onChange={(v) => set({ grafico: v as Grafico }, true)} className="ty-site-barra__select" />
      ) : (
        <SegmentedControl label={t('livro.grafico')} size="compact" value={grafico} onChange={(v) => set({ grafico: v as Grafico }, true)} options={graficos} />
      )}
      <SegmentedControl
        label={t('livro.impressao')}
        size="compact"
        value={pb ? 'pb' : 'cor'}
        onChange={(v) => set({ pb: v === 'pb' }, true)}
        options={[
          { value: 'cor', label: t('livro.cor') },
          { value: 'pb', label: t('livro.pb') },
        ]}
      />
      {modo !== 'galeria' ? (
        <div className="ty-site-zoom" role="group" aria-label={t('livro.zoom')}>
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.zoomMenos')} leadingIcon={<Minus aria-hidden="true" />} onPress={() => passoZoom(-1)} disabled={zoom <= ZOOMS[0]} />
          <output className="ty-site-zoom__valor" aria-live="polite" aria-label={t('livro.escalaAtual')}>
            {escala ? n(escala, { style: 'percent', maximumFractionDigits: 0 }) : '…'}
          </output>
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.zoomMais')} leadingIcon={<Plus aria-hidden="true" />} onPress={() => passoZoom(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]!} />
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.ajustar')} leadingIcon={<Scan aria-hidden="true" />} onPress={() => setZoom(1)} disabled={zoom === 1} />
        </div>
      ) : null}
      <div className="ty-site-barra__fim">
        {modo !== 'galeria' ? (
          <div className="ty-site-passos" role="group" aria-label={t('livro.trocarEstilo')}>
            <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.estiloAnterior')} leadingIcon={dir === 'rtl' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />} onPress={() => set({ estilo: vizinho(TODOS_ESTILOS, estilo, -1) }, true)} />
            <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.proximoEstilo')} leadingIcon={dir === 'rtl' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />} onPress={() => set({ estilo: vizinho(TODOS_ESTILOS, estilo, 1) }, true)} />
          </div>
        ) : null}
        {modo === 'um' || modo === 'completo' ? (
          <Button
            variant="quiet"
            size="compact"
            iconOnly={estreito}
            accessibleLabel={t('livro.telaCheia')}
            leadingIcon={<Expand aria-hidden="true" />}
            onPress={() => setCheia(true)}
          >
            {estreito ? undefined : t('livro.telaCheia')}
          </Button>
        ) : null}
        {modo !== 'galeria' ? (
          <Button
            variant="quiet"
            size="compact"
            iconOnly={estreito}
            accessibleLabel={ficha ? t('livro.esconderFicha') : t('livro.mostrarFicha')}
            leadingIcon={ficha ? (dir === 'rtl' ? <PanelRightOpen aria-hidden="true" /> : <PanelRightClose aria-hidden="true" />) : dir === 'rtl' ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
            onPress={() => setFicha(!ficha)}
            aria-controls="ficha-titulo"
          >
            {estreito ? undefined : t('livro.fichaBotao')}
          </Button>
        ) : null}
      </div>
    </div>
  )

  const duplaAtual = DUPLAS.find((d) => d.id === rota.dupla) ?? DUPLAS[0]!
  const iDupla = DUPLAS.indexOf(duplaAtual)
  const irDupla = (i: number) => set({ dupla: DUPLAS[(i + DUPLAS.length) % DUPLAS.length]!.id }, true)
  const corpo = (() => {
    if (modo === 'completo') {
      return (
        <div className="ty-site-completo">
          <div className="ty-site-completo__nav">
            <nav className="ty-site-completo__capitulos" aria-label={t('completo.capitulos')}>
              {DUPLAS.map((d, i) => (
                <a key={d.id} href={href({ ...rota, dupla: d.id })} className="ty-site-completo__capitulo" aria-current={d.id === duplaAtual.id ? 'page' : undefined}>
                  <span className="ty-site-completo__num">{n(i + 1)}</span>
                  {t(d.chave)}
                </a>
              ))}
            </nav>
            <div className="ty-site-passos" role="group" aria-label={t('completo.navegar')}>
              <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('completo.anterior')} leadingIcon={dir === 'rtl' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />} onPress={() => irDupla(iDupla - 1)} />
              <span className="ty-site-completo__pos">{t('completo.posicao', { n: iDupla + 1, total: DUPLAS.length })}</span>
              <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('completo.proxima')} leadingIcon={dir === 'rtl' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />} onPress={() => irDupla(iDupla + 1)} />
            </div>
          </div>
          <figure className="ty-site-mesa">
            <Encaixe zoom={zoom} onEscala={setEscala}>
              <DuplaDoLivroNoEstilo id={duplaAtual.id} estilo={estilo} grafico={grafico} pb={pb} />
            </Encaixe>
            <figcaption className="ty-site-visually-hidden">{t(duplaAtual.chave)}</figcaption>
          </figure>
          {cheia ? (
            <Visor titulo={t(duplaAtual.chave)} subtitulo={rotulo(estilo)} aoFechar={() => setCheia(false)} aoAnterior={() => irDupla(iDupla - 1)} aoProximo={() => irDupla(iDupla + 1)}>
              <DuplaDoLivroNoEstilo id={duplaAtual.id} estilo={estilo} grafico={grafico} pb={pb} />
            </Visor>
          ) : null}
        </div>
      )
    }
    if (modo === 'galeria') {
      return (
        <>
        <div className="ty-site-linha">
          <SegmentedControl
            label={t('livro.mostrar')}
            size="compact"
            value={so}
            onChange={(v) => setSo(v as 'todos' | 'favoritos')}
            options={[
              { value: 'todos', label: t('livro.mostrarTodos', { n: TODOS_ESTILOS.length }) },
              { value: 'favoritos', label: t('livro.mostrarFavoritos', { n: favs.length }) },
            ]}
          />
        </div>
        {so === 'favoritos' && !favs.length ? <p className="ty-site-dica">{t('livro.semFavoritos')}</p> : null}
        <ul className="ty-site-galeria" aria-label={t('livro.galeria')}>
          {TODOS_ESTILOS.filter((id) => so === 'todos' || favs.includes(id)).map((id) => (
            <li key={id} className="ty-site-cartao" data-atual={id === estilo || undefined}>
              <a className="ty-site-cartao__link" href={href({ ...rota, estilo: id, modo: 'um' })}>
                <span className="ty-site-cartao__mesa" aria-hidden="true">
                  <QuandoVisivel reserva={<span className="ty-site-cartao__reserva" style={{ background: printPresets[id].cor.papel }} />}>
                    <Encaixe>
                      <DuplaEstilo estilo={id} grafico={grafico} pb={pb} />
                    </Encaixe>
                  </QuandoVisivel>
                </span>
                <span className="ty-site-cartao__titulo">{rotulo(id)}</span>
                <span className="ty-site-cartao__meta">{temaDoEstilo(id)}</span>
              </a>
              <button
                type="button"
                className="ty-site-estrela"
                aria-pressed={favs.includes(id)}
                aria-label={t('livro.favoritarEstilo', { estilo: rotulo(id) })}
                onClick={() => alternar(id)}
              >
                <Star aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        </>
      )
    }
    if (modo === 'comparar') {
      return (
        <div className="ty-site-dois">
          {([
            ['A', estilo, (id: PrintPresetName) => set({ estilo: id }, true)],
            ['B', b, (id: PrintPresetName) => set({ b: id }, true)],
          ] as const).map(([letra, id, mudar]) => (
            <section key={letra} className="ty-site-lado" aria-label={`${letra}: ${rotulo(id)}`}>
              <SeletorEstilo rotulo={t('livro.estiloLetra', { letra })} valor={id} aoMudar={mudar} />
              <Mesa estilo={id} grafico={grafico} pb={pb} zoom={zoom} rotulo={rotulo(id)} onEscala={letra === 'A' ? setEscala : undefined} />
            </section>
          ))}
        </div>
      )
    }
    if (modo === 'antes') {
      return (
        <div className="ty-site-antes">
          <div className="ty-site-antes__seletores">
            <SeletorEstilo rotulo={t('livro.antes')} valor={b} aoMudar={(id) => set({ b: id }, true)} />
            <SeletorEstilo rotulo={t('livro.depois')} valor={estilo} aoMudar={(id) => set({ estilo: id }, true)} />
          </div>
          <Cortina
            rotuloAntes={rotulo(b)}
            rotuloDepois={rotulo(estilo)}
            antes={<Mesa estilo={b} grafico={grafico} pb={pb} zoom={1} rotulo={rotulo(b)} />}
            depois={<Mesa estilo={estilo} grafico={grafico} pb={pb} zoom={1} rotulo={rotulo(estilo)} onEscala={setEscala} />}
          />
        </div>
      )
    }
    return (
      <div className="ty-site-palco">
        <Mesa estilo={estilo} grafico={grafico} pb={pb} zoom={zoom} rotulo={rotulo(estilo)} onEscala={setEscala} />
        {cheia ? (
          <Visor
            titulo={rotulo(estilo)}
            subtitulo={descricao(estilo)}
            aoFechar={() => setCheia(false)}
            aoAnterior={() => set({ estilo: vizinho(TODOS_ESTILOS, estilo, -1) }, true)}
            aoProximo={() => set({ estilo: vizinho(TODOS_ESTILOS, estilo, 1) }, true)}
          >
            <DuplaEstilo estilo={estilo} grafico={grafico} pb={pb} />
          </Visor>
        ) : null}
      </div>
    )
  })()

  return (
    <Moldura
      secao="livro"
      className="ty-site-pagina--livro"
      rotuloLateral={t('livro.listaEstilos')}
      lateral={<ListaEstilos atual={estilo} favs={favs} aoEscolher={escolher} />}
    >
      <Cabeca
        eyebrow={
          <>
            <BookOpen aria-hidden="true" className="ty-icon" /> {t('livro.eyebrow', { n: TODOS_ESTILOS.length })}
          </>
        }
        titulo={modo === 'galeria' ? t('livro.tituloGaleria') : rotulo(estilo)}
        lead={modo === 'galeria' ? t('livro.leadGaleria') : descricao(estilo)}
        acoes={
          modo !== 'galeria' ? (
            <Button variant={fav ? 'primary' : 'secondary'} leadingIcon={<Star aria-hidden="true" />} onPress={() => alternar(estilo)} current={fav}>
              {fav ? t('livro.favorito') : t('livro.favoritar')}
            </Button>
          ) : undefined
        }
      />
      {barra}
      <div className="ty-site-livro-corpo">
        <div className="ty-site-livro-grade" data-ficha={ficha && modo !== 'galeria' ? '' : undefined}>
        <div className="ty-site-livro-corpo__principal">
          {corpo}
          {modo !== 'galeria' ? <p className="ty-site-dica">{t('livro.dicaTeclas')}</p> : null}
        </div>
        {ficha && modo !== 'galeria' ? <SpecSheet estilo={estilo} pb={pb} notas={<Notas estilo={estilo} />} /> : null}
        </div>
      </div>
    </Moldura>
  )
}
