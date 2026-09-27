// Temas: the 4 UI presets and the 39 book styles as UI themes, on a real application screen. The side list
// is navigation (which theme to inspect); the site's own theme is changed with ThemePalette (top bar) or
// the "Apply to the site" button. Modes Um / Comparar / Antes × depois / Galeria; state in the hash.
import { Check, Columns2, GalleryHorizontalEnd, Palette, SplitSquareHorizontal, Square, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, ListboxSelect, SearchBar, SegmentedControl, ThemeSwatch, useMediaQuery, useTheme } from '@datatechsolutions/tympan'
import type { Navegar } from '../../App'
import { BotaoCopiar } from '../../comum/BotaoCopiar'
import { Cortina } from '../../comum/Cortina'
import { Encaixe } from '../../comum/Encaixe'
import { contraste, hex, lerCor, nivelContraste } from '../../cores'
import { useI18n, type Chave } from '../../i18n/I18n'
import { useFavoritos } from '../../local'
import { Cabeca, Moldura, useGruposTema, useHref, useNomeTema } from '../../Moldura'
import { teclaDeTroca, vizinho, type Modo, type RotaDe } from '../../rotas'
import { QuandoVisivel } from '../livro/Dupla'
import { Quadro } from './Quadro'

type RotaTemas = RotaDe<'temas'>

function useTodosTemas(): string[] {
  const grupos = useGruposTema()
  return useMemo(() => grupos.flatMap((g) => g.themes.map((t) => t.id)), [grupos])
}

function ListaTemas({ atual, favs, aoEscolher }: { atual: string; favs: string[]; aoEscolher: (id: string) => void }) {
  const { t, n } = useI18n()
  const th = useTheme()
  const grupos = useGruposTema()
  const [busca, setBusca] = useState('')
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
  const q = norm(busca.trim())
  const item = (id: string, label: string) => (
    <li key={id}>
      <button type="button" className="ty-site-estilo" aria-current={id === atual ? 'true' : undefined} data-fecha-gaveta="" onClick={() => aoEscolher(id)}>
        <ThemeSwatch theme={id} mode={th.resolvedMode} />
        <span className="ty-site-estilo__nome">{label}</span>
        {favs.includes(id) ? <Star className="ty-site-estilo__fav" aria-label={t('livro.favorito')} /> : th.theme === id ? <Check className="ty-site-estilo__fav" aria-label={t('temas.emUso')} /> : null}
      </button>
    </li>
  )
  const todos = grupos.flatMap((g) => g.themes)
  const favoritos = todos.filter((x) => favs.includes(x.id))
  return (
    <div className="ty-site-lista">
      <div className="ty-site-lista__busca">
        <SearchBar query={busca} onQueryChange={setBusca} placeholder={t('temas.buscar')} label={t('temas.buscar')} />
      </div>
      {favoritos.length && !q ? (
        <section className="ty-site-lista__grupo" aria-labelledby="temas-favs">
          <h2 className="ty-site-lista__titulo" id="temas-favs">
            {t('livro.favoritos', { n: favoritos.length })}
          </h2>
          <ul className="ty-site-lista__itens">{favoritos.map((x) => item(x.id, x.label))}</ul>
        </section>
      ) : null}
      {grupos.map((g) => {
        const lista = g.themes.filter((x) => !q || norm(`${x.label} ${x.id}`).includes(q))
        if (!lista.length) return null
        return (
          <section key={g.id} className="ty-site-lista__grupo" aria-labelledby={`temas-${g.id}`}>
            <h2 className="ty-site-lista__titulo" id={`temas-${g.id}`}>
              {g.heading} ({n(lista.length)})
            </h2>
            <ul className="ty-site-lista__itens">{lista.map((x) => item(x.id, x.label))}</ul>
          </section>
        )
      })}
    </div>
  )
}

/** Resolved tokens of a theme, read back from a rendered scope, with contrast of each text pair. */
function Tokens({ tema }: { tema: string }) {
  const { t, n } = useI18n()
  const th = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const [vals, setVals] = useState<Record<string, string>>({})
  const nomes = ['--ty-bg', '--ty-surface-solid', '--ty-ink', '--ty-ink-2', '--ty-ink-3', '--ty-accent', '--ty-on-accent', '--ty-line-strong', '--ty-success', '--ty-warning', '--ty-danger', '--ty-font-serif', '--ty-font-sans', '--ty-radius-control']
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      const cs = getComputedStyle(el)
      const probe = el.querySelector<HTMLElement>('[data-sonda]')
      const out: Record<string, string> = {}
      for (const v of nomes) {
        const raw = cs.getPropertyValue(v).trim()
        if (v.startsWith('--ty-font') || v.startsWith('--ty-radius')) out[v] = raw
        else if (probe) {
          probe.style.color = `var(${v})`
          out[v] = getComputedStyle(probe).color
        }
      }
      setVals(out)
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, th.resolvedMode])
  const cor = (v: string) => lerCor(vals[v] ?? '')
  const pares: Array<[Chave, string, string]> = [
    ['temas.parTexto', '--ty-ink', '--ty-bg'],
    ['temas.parTexto2', '--ty-ink-2', '--ty-bg'],
    ['temas.parMeta', '--ty-ink-3', '--ty-bg'],
    ['temas.parBotao', '--ty-on-accent', '--ty-accent'],
    ['temas.parSuperficie', '--ty-ink', '--ty-surface-solid'],
  ]
  const snippet = `import '@datatechsolutions/tympan/styles.css'\n${tema.startsWith('print-') ? `import '@datatechsolutions/tympan-tokens/print-themes/${tema}.css'\n` : ''}\n<html data-ty-theme="${tema}" data-ty-mode="${th.resolvedMode}">`
  const familia = (s: string) => (s.split(',')[0] ?? '').replace(/["']/g, '').trim()
  return (
    <aside className="ty-site-ficha" aria-labelledby="tokens-titulo">
      <div ref={ref} data-ty-theme={tema} data-ty-mode={th.resolvedMode} className="ty-site-sonda" aria-hidden="true">
        <span data-sonda="" />
      </div>
      <h2 className="ty-site-ficha__titulo" id="tokens-titulo">
        {t('temas.tokens')} <code className="ty-site-ficha__nome ty-site-mono">{tema}</code>
      </h2>
      <section className="ty-site-ficha__bloco" aria-labelledby="tokens-cores">
        <h3 className="ty-site-ficha__sub" id="tokens-cores">
          {t('temas.cores')}
        </h3>
        <ul className="ty-site-cores">
          {nomes
            .filter((v) => !v.startsWith('--ty-font') && !v.startsWith('--ty-radius'))
            .map((v) => {
              const c = cor(v)
              return (
                <li key={v} className="ty-site-cor">
                  <span className="ty-site-cor__amostra" style={{ background: vals[v] }} aria-hidden="true" />
                  <span className="ty-site-cor__nome ty-site-mono">{v.replace('--ty-', '')}</span>
                  <code className="ty-site-cor__hex">{c ? hex(c) : '…'}</code>
                </li>
              )
            })}
        </ul>
      </section>
      <section className="ty-site-ficha__bloco" aria-labelledby="tokens-contraste">
        <h3 className="ty-site-ficha__sub" id="tokens-contraste">
          {t('temas.contraste')}
        </h3>
        <ul className="ty-site-contrastes">
          {pares.map(([k, a, b]) => {
            const ca = cor(a)
            const cb = cor(b)
            const r = ca && cb ? contraste(ca, cb) : 0
            const nivel = nivelContraste(r)
            return (
              <li key={k} className="ty-site-contraste">
                <span className="ty-site-contraste__amostra" style={{ background: vals[b], color: vals[a] }} aria-hidden="true">
                  Aa
                </span>
                <span className="ty-site-contraste__nome">{t(k)}</span>
                <span className="ty-site-contraste__razao">{r ? `${n(r, { maximumFractionDigits: 1 })}:1` : '…'}</span>
                <span className="ty-site-contraste__nivel" data-nivel={nivel}>
                  {nivel === 'AA18' ? t('temas.aaGrande') : nivel === 'falha' ? t('temas.abaixo') : nivel}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
      <section className="ty-site-ficha__bloco" aria-labelledby="tokens-tipos">
        <h3 className="ty-site-ficha__sub" id="tokens-tipos">
          {t('livro.tipos')}
        </h3>
        <dl className="ty-site-ficha__dados">
          <div className="ty-site-ficha__linha">
            <dt>{t('temas.fonteTitulos')}</dt>
            <dd style={{ fontFamily: vals['--ty-font-serif'] }}>{familia(vals['--ty-font-serif'] ?? '')}</dd>
          </div>
          <div className="ty-site-ficha__linha">
            <dt>{t('temas.fonteTexto')}</dt>
            <dd style={{ fontFamily: vals['--ty-font-sans'] }}>{familia(vals['--ty-font-sans'] ?? '')}</dd>
          </div>
          <div className="ty-site-ficha__linha">
            <dt>{t('livro.raio')}</dt>
            <dd>{vals['--ty-radius-control'] ?? ''}</dd>
          </div>
        </dl>
      </section>
      <section className="ty-site-ficha__bloco" aria-labelledby="tokens-uso">
        <h3 className="ty-site-ficha__sub" id="tokens-uso">
          {t('livro.uso')}
        </h3>
        <div className="ty-site-codigo">
          <div className="ty-site-codigo__topo">
            <span className="ty-site-codigo__rotulo">{t('temas.snippet')}</span>
            <BotaoCopiar texto={snippet} rotulo={t('temas.snippet')} />
          </div>
          <pre className="ty-site-codigo__pre" dir="ltr">
            <code>{snippet}</code>
          </pre>
        </div>
      </section>
    </aside>
  )
}

function SeletorTemaLocal({ rotulo, valor, aoMudar }: { rotulo: string; valor: string; aoMudar: (id: string) => void }) {
  const grupos = useGruposTema()
  const th = useTheme()
  return (
    <ListboxSelect
      label={rotulo}
      className="ty-site-seletor"
      value={valor}
      onChange={aoMudar}
      sections={grupos.map((g) => ({
        title: g.heading,
        options: g.themes.map((x) => ({ value: x.id, label: x.label, icon: <ThemeSwatch theme={x.id} mode={th.resolvedMode} /> })),
      }))}
    />
  )
}

export function Temas({ rota, ir }: { rota: RotaTemas; ir: Navegar }) {
  const { t, dir } = useI18n()
  const th = useTheme()
  const href = useHref()
  const nomeTema = useNomeTema()
  const todos = useTodosTemas()
  const [favs, alternar] = useFavoritos('temas:favoritos')
  const estreito = useMediaQuery('(max-width: 767.98px)')
  const { tema, modo, b } = rota
  const set = (m: Partial<RotaTemas>, substituir = false) => ir({ ...rota, ...m }, { substituir })

  useEffect(() => {
    const on = (ev: KeyboardEvent) => {
      if ((ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') || ev.altKey || ev.metaKey || ev.ctrlKey || !teclaDeTroca(ev.target)) return
      ev.preventDefault()
      const frente = (ev.key === 'ArrowRight') !== (dir === 'rtl')
      ir({ ...rota, tema: vizinho(todos, tema, frente ? 1 : -1) }, { substituir: true })
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [rota, ir, todos, tema, dir])

  const outro = th.resolvedMode === 'dark' ? 'light' : 'dark'
  const corpo = (() => {
    if (modo === 'galeria') {
      return (
        <ul className="ty-site-galeria ty-site-galeria--temas" aria-label={t('temas.galeria')}>
          {todos.map((id) => (
            <li key={id} className="ty-site-cartao" data-atual={id === tema || undefined}>
              <a className="ty-site-cartao__link" href={href({ ...rota, tema: id, modo: 'um' })}>
                <span className="ty-site-cartao__mesa ty-site-cartao__mesa--tema" aria-hidden="true">
                  <QuandoVisivel reserva={<span className="ty-site-cartao__reserva ty-site-cartao__reserva--tema" />}>
                    <Encaixe>
                      <div className="ty-site-quadro-fixo">
                        <Quadro tema={id} modo={th.resolvedMode} miniatura />
                      </div>
                    </Encaixe>
                  </QuandoVisivel>
                </span>
                <span className="ty-site-cartao__titulo">{nomeTema(id)}</span>
                <span className="ty-site-cartao__meta">{id}</span>
              </a>
              <button type="button" className="ty-site-estrela" aria-pressed={favs.includes(id)} aria-label={t('livro.favoritarEstilo', { estilo: nomeTema(id) })} onClick={() => alternar(id)}>
                <Star aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )
    }
    if (modo === 'comparar') {
      return (
        <div className="ty-site-dois">
          {(
            [
              ['A', tema, (id: string) => set({ tema: id }, true)],
              ['B', b, (id: string) => set({ b: id }, true)],
            ] as const
          ).map(([letra, id, mudar]) => (
            <section key={letra} className="ty-site-lado" aria-label={`${letra}: ${nomeTema(id)}`}>
              <SeletorTemaLocal rotulo={t('temas.temaLetra', { letra })} valor={id} aoMudar={mudar} />
              <Quadro tema={id} modo={th.resolvedMode} />
            </section>
          ))}
        </div>
      )
    }
    if (modo === 'antes') {
      return (
        <div className="ty-site-antes">
          <div className="ty-site-antes__seletores">
            <SeletorTemaLocal rotulo={t('livro.antes')} valor={b} aoMudar={(id) => set({ b: id }, true)} />
            <SeletorTemaLocal rotulo={t('livro.depois')} valor={tema} aoMudar={(id) => set({ tema: id }, true)} />
          </div>
          <Cortina rotuloAntes={nomeTema(b)} rotuloDepois={nomeTema(tema)} antes={<Quadro tema={b} modo={th.resolvedMode} miniatura />} depois={<Quadro tema={tema} modo={th.resolvedMode} miniatura />} />
        </div>
      )
    }
    return (
      <div className="ty-site-dois">
        <section className="ty-site-lado" aria-label={t(th.resolvedMode === 'dark' ? 'aparencia.modoEscuro' : 'aparencia.modoClaro')}>
          <p className="ty-site-lado__rotulo">{t(th.resolvedMode === 'dark' ? 'aparencia.modoEscuro' : 'aparencia.modoClaro')}</p>
          <Quadro tema={tema} modo={th.resolvedMode} />
        </section>
        <section className="ty-site-lado" aria-label={t(outro === 'dark' ? 'aparencia.modoEscuro' : 'aparencia.modoClaro')}>
          <p className="ty-site-lado__rotulo">{t(outro === 'dark' ? 'aparencia.modoEscuro' : 'aparencia.modoClaro')}</p>
          <Quadro tema={tema} modo={outro} />
        </section>
      </div>
    )
  })()

  const emUso = th.theme === tema
  const fav = favs.includes(tema)
  return (
    <Moldura secao="temas" className="ty-site-pagina--temas" rotuloLateral={t('temas.lista')} lateral={<ListaTemas atual={tema} favs={favs} aoEscolher={(id) => set({ tema: id, ...(modo === 'galeria' ? { modo: 'um' as Modo } : {}) })} />}>
      <Cabeca
        eyebrow={
          <>
            <Palette aria-hidden="true" className="ty-icon" /> {t('temas.eyebrow', { n: todos.length })}
          </>
        }
        titulo={modo === 'galeria' ? t('temas.tituloGaleria') : nomeTema(tema)}
        lead={modo === 'galeria' ? t('temas.leadGaleria') : tema.startsWith('print-') ? t('temas.leadLivro') : t('temas.leadInterface')}
        acoes={
          modo !== 'galeria' ? (
            <>
              <Button variant={fav ? 'primary' : 'secondary'} leadingIcon={<Star aria-hidden="true" />} onPress={() => alternar(tema)} current={fav}>
                {fav ? t('livro.favorito') : t('livro.favoritar')}
              </Button>
              <Button variant={emUso ? 'secondary' : 'primary'} leadingIcon={<Check aria-hidden="true" />} disabled={emUso} onPress={() => th.setTheme(tema)}>
                {emUso ? t('temas.emUso') : t('temas.aplicar')}
              </Button>
            </>
          ) : undefined
        }
      />
      <div className="ty-site-barra" role="toolbar" aria-label={t('temas.ferramentas')}>
        <SegmentedControl
          label={t('livro.modo')}
          size="compact"
          iconOnly={estreito}
          value={modo}
          onChange={(v) => set({ modo: v as Modo })}
          options={[
            { value: 'um', label: t('temas.modoUm'), icon: Square },
            { value: 'comparar', label: t('modo.comparar'), icon: Columns2 },
            { value: 'antes', label: t('modo.antes'), icon: SplitSquareHorizontal },
            { value: 'galeria', label: t('modo.galeria'), icon: GalleryHorizontalEnd },
          ]}
        />
      </div>
      <div className="ty-site-livro-corpo">
        <div className="ty-site-livro-grade" data-ficha={modo !== 'galeria' ? '' : undefined}>
          <div className="ty-site-livro-corpo__principal">
            {corpo}
            {modo !== 'galeria' ? <p className="ty-site-dica">{t('temas.dica')}</p> : null}
          </div>
          {modo !== 'galeria' ? <Tokens tema={tema} /> : null}
        </div>
      </div>
    </Moldura>
  )
}
