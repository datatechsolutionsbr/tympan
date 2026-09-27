// Início: the approved landing page (astrolabe plate, facts, history, "troque a placa", layers, principles,
// users, install), in the shell and in every language. The specimen is a real theme scope, so each chip
// shows the actual tokens of that theme.
import { useEffect, useState } from 'react'
import { printThemeFontUrls } from '../../tokens'
import { useTheme } from '@datatechsolutions/tympan'
import { BotaoCopiar } from '../../comum/BotaoCopiar'
import { useI18n, type Chave } from '../../i18n/I18n'
import { Moldura, useHref, useNomeTema } from '../../Moldura'
import { lerRota } from '../../rotas'
import { Placa } from './Placa'
import './inicio.css'

const PLACAS_UI = ['tympan', 'neutral', 'high-contrast'] as const
const PLACAS_LIVRO = ['print-dashboard', 'print-suico', 'print-minimo-de-tinta', 'print-papel-salmao', 'print-tropicalia', 'print-prancheta'] as const

export const SNIPPET_INSTALAR = `@datatechsolutions:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}

npm install @datatechsolutions/tympan \\
  @datatechsolutions/tympan-tokens`

/** Loads a print theme's font stylesheet once, for a scoped specimen. */
export function useFontesDoTema(tema: string) {
  useEffect(() => {
    const url = printThemeFontUrls[tema]
    if (!url || document.querySelector(`link[data-ty-site-fontes-tema="${tema}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = url
    l.setAttribute('data-ty-site-fontes-tema', tema)
    document.head.appendChild(l)
  }, [tema])
}

function Especime() {
  const { t, n } = useI18n()
  return (
    <div className="ty-site-especime">
      <div className="ty-site-especime__texto">
        <div className="ty-site-especime__eyebrow">{t('inicio.especimeEyebrow')}</div>
        <h3>{t('inicio.especimeTitulo')}</h3>
        <p>
          {t('inicio.especimeTextoA', { n: n(1312) })}
          <mark>{t('inicio.especimeMarca')}</mark>
          {t('inicio.especimeTextoB')}
        </p>
        <div className="ty-site-especime__botoes">
          <button className="ty-site-especime__b" type="button">
            {t('inicio.especimeBotao1')}
          </button>
          <button className="ty-site-especime__b2" type="button">
            {t('inicio.especimeBotao2')}
          </button>
        </div>
      </div>
      <div className="ty-site-especime__prova">
        <div className="ty-site-especime__eyebrow">{t('inicio.especimeAfirmacoes')}</div>
        <div className="ty-site-especime__barras">
          {(
            [
              ['sustentada', 72, 18, 'var(--ty-success)'],
              ['refutada', 24, 6, 'var(--ty-danger)'],
              ['nao-da-para-afirmar', 36, 9, 'var(--ty-warning)'],
            ] as const
          ).map(([e, w, v, cor]) => (
            <div key={e}>
              <span>{t(`prova.${e}` as Chave)}</span>
              <b style={{ inlineSize: `${w}%`, background: cor }} />
              <em>{n(v)}</em>
            </div>
          ))}
        </div>
        <div className="ty-site-especime__estados">
          <span style={{ color: 'var(--ty-success)' }}>{t('prova.sustentada').toLocaleLowerCase()}</span>
          <span style={{ color: 'var(--ty-danger)' }}>{t('prova.refutada').toLocaleLowerCase()}</span>
          <span style={{ color: 'var(--ty-warning)' }}>{t('prova.nao-da-para-afirmar').toLocaleLowerCase()}</span>
        </div>
      </div>
    </div>
  )
}

/** Dot in a theme's own accent on its own paper (a tiny scope of that theme). */
function Ponto({ tema }: { tema: string }) {
  const th = useTheme()
  return <span className="ty-site-chip__cor" data-ty-theme={tema} data-ty-mode={th.resolvedMode} aria-hidden="true" />
}

/** A plate chip: sets the site's theme, so the whole page is re-engraved. */
function Chip({ tema, compacto }: { tema: string; compacto?: boolean }) {
  const nome = useNomeTema()
  const th = useTheme()
  useFontesDoTema(tema)
  return (
    <button
      type="button"
      className={compacto ? 'ty-site-chip ty-site-chip--ponto' : 'ty-site-chip'}
      aria-pressed={th.theme === tema}
      aria-label={compacto ? nome(tema) : undefined}
      title={compacto ? nome(tema) : undefined}
      onClick={() => th.setTheme(tema)}
    >
      <Ponto tema={tema} />
      {compacto ? null : nome(tema)}
    </button>
  )
}

export function Inicio() {
  const { t, n } = useI18n()
  const href = useHref()
  const th = useTheme()
  const tema = th.theme
  const [temaMeta, setTemaMeta] = useState<{ papel: string; destaque: string; raio: string }>({ papel: '', destaque: '', raio: '' })

  // The specimen's resolved values, read back from the scope (so they are the real tokens).
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.ty-site-especime')
    if (!el) return
    const id = requestAnimationFrame(() => {
      const cs = getComputedStyle(el)
      setTemaMeta({ papel: cs.getPropertyValue('--ty-bg').trim(), destaque: cs.getPropertyValue('--ty-accent').trim(), raio: cs.getPropertyValue('--ty-radius-control').trim() })
    })
    return () => cancelAnimationFrame(id)
  }, [tema, th.resolvedMode])

  const historia: Array<[Chave, Chave]> = [
    ['inicio.historia1Titulo', 'inicio.historia1Texto'],
    ['inicio.historia2Titulo', 'inicio.historia2Texto'],
    ['inicio.historia3Titulo', 'inicio.historia3Texto'],
    ['inicio.historia4Titulo', 'inicio.historia4Texto'],
  ]
  const principios: Array<[Chave, Chave]> = [
    ['inicio.principio1Titulo', 'inicio.principio1Texto'],
    ['inicio.principio2Titulo', 'inicio.principio2Texto'],
    ['inicio.principio3Titulo', 'inicio.principio3Texto'],
    ['inicio.principio4Titulo', 'inicio.principio4Texto'],
  ]

  return (
    <Moldura secao="inicio" className="ty-site-pagina--inicio">
      <div className="ty-site-inicio">
        <div className="ty-site-heroi">
          <div>
            <div className="ty-site-rotulo">{t('inicio.rotulo')}</div>
            <h1 className="ty-site-heroi__titulo">
              {t('inicio.tituloA')}
              <em>{t('inicio.tituloB')}</em>
              {t('inicio.tituloC')}
            </h1>
            <p className="ty-site-heroi__lede">{t('inicio.lede')}</p>
            <div className="ty-site-heroi__placas" role="group" aria-label={t('inicio.trocarPlaca')}>
              {[...PLACAS_UI, ...PLACAS_LIVRO].map((p) => (
                <Chip key={p} tema={p} compacto />
              ))}
              <a className="ty-site-heroi__todas" href={href(lerRota('#/temas'))}>
                {t('inicio.todasAsPlacas', { n: 43 })}
              </a>
            </div>
            <div className="ty-site-heroi__acoes">
              <a className="ty-site-btn ty-site-btn--primario" href={href({ secao: 'componentes' })}>
                {t('inicio.verComponentes')}
              </a>
              <a className="ty-site-btn ty-site-btn--fantasma" href={href(lerRota('#/livro'))}>
                {t('inicio.verLivro')}
              </a>
            </div>
          </div>
          <figure className="ty-site-placa">
            <Placa rotulo={t('inicio.placaRotulo')} />
            <figcaption>{t('inicio.placaLegenda')}</figcaption>
          </figure>
        </div>

        <div className="ty-site-fatos" role="list" aria-label={t('inicio.fatosRotulo')}>
          {(
            [
              [4, 'inicio.fato1'],
              [39, 'inicio.fato2'],
              [156, 'inicio.fato3'],
              [3, 'inicio.fato4'],
            ] as const
          ).map(([v, k]) => (
            <div key={k} role="listitem">
              <strong>{n(v)}</strong>
              <span>{t(k)}</span>
            </div>
          ))}
        </div>

        <section className="ty-site-secao" aria-labelledby="historia">
          <header>
            <div className="ty-site-rotulo">{t('inicio.historiaRotulo')}</div>
            <h2 id="historia">{t('inicio.historiaTitulo')}</h2>
          </header>
          <ol className="ty-site-historia">
            {historia.map(([a, b]) => (
              <li key={a}>
                <h3>{t(a)}</h3>
                <p>{t(b)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="ty-site-secao" aria-labelledby="placas">
          <header>
            <div className="ty-site-rotulo">{t('inicio.placasRotulo')}</div>
            <h2 id="placas">{t('inicio.placasTitulo')}</h2>
            <p className="ty-site-heroi__lede">{t('inicio.placasLede')}</p>
          </header>
          <div className="ty-site-troca">
            <div className="ty-site-troca__escolha">
              <h3>{t('inicio.placasInterface')}</h3>
              <div className="ty-site-chips">
                {PLACAS_UI.map((p) => (
                  <Chip key={p} tema={p} />
                ))}
              </div>
              <h3>{t('inicio.placasLivro')}</h3>
              <div className="ty-site-chips">
                {PLACAS_LIVRO.map((p) => (
                  <Chip key={p} tema={p} />
                ))}
              </div>
              <div className="ty-site-meta" aria-live="polite">
                <span>
                  {t('inicio.metaTema')} {tema}
                </span>
                {temaMeta.papel ? (
                  <span>
                    {t('inicio.metaPapel')} {temaMeta.papel}
                  </span>
                ) : null}
                {temaMeta.destaque ? (
                  <span>
                    {t('inicio.metaDestaque')} {temaMeta.destaque}
                  </span>
                ) : null}
                {temaMeta.raio ? (
                  <span>
                    {t('inicio.metaRaio')} {temaMeta.raio}
                  </span>
                ) : null}
              </div>
              <a className="ty-site-link" href={href({ ...lerRota('#/temas'), secao: 'temas', tema, modo: 'um', b: 'tympan' })}>
                {t('inicio.abrirEmTemas')}
              </a>
            </div>
            <Especime />
          </div>
        </section>

        <section className="ty-site-secao" aria-labelledby="camadas">
          <header>
            <div className="ty-site-rotulo">{t('inicio.camadasRotulo')}</div>
            <h2 id="camadas">{t('inicio.camadasTitulo')}</h2>
          </header>
          <div className="ty-site-camadas">
            <article>
              <span className="ty-site-camadas__pacote">@datatechsolutions/tympan-tokens</span>
              <h3>{t('inicio.camadaTokens')}</h3>
              <p>{t('inicio.camadaTokensTexto')}</p>
              <a href={href({ ...lerRota('#/temas'), secao: 'temas', tema: 'tympan', modo: 'um', b: 'tympan' })}>{t('inicio.verTemas')}</a>
            </article>
            <article>
              <span className="ty-site-camadas__pacote">@datatechsolutions/tympan</span>
              <h3>{t('inicio.camadaComponentes')}</h3>
              <p>{t('inicio.camadaComponentesTexto')}</p>
              <a href={href({ secao: 'componentes' })}>{t('inicio.abrirGaleria')}</a>
            </article>
            <article>
              <span className="ty-site-camadas__pacote">@datatechsolutions/tympan-print</span>
              <h3>{t('inicio.camadaImpressao')}</h3>
              <p>{t('inicio.camadaImpressaoTexto')}</p>
              <a href={href(lerRota('#/livro'))}>{t('inicio.abrirGaleria')}</a>
            </article>
          </div>
        </section>

        <section className="ty-site-secao" aria-labelledby="principios">
          <header>
            <div className="ty-site-rotulo">{t('inicio.principiosRotulo')}</div>
            <h2 id="principios">{t('inicio.principiosTitulo')}</h2>
          </header>
          <div className="ty-site-principios">
            {principios.map(([a, b]) => (
              <div key={a}>
                <h3>{t(a)}</h3>
                <p>{t(b)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ty-site-secao" aria-labelledby="usuarios">
          <div className="ty-site-divisao">
            <div>
              <header>
                <div className="ty-site-rotulo">{t('inicio.usuariosRotulo')}</div>
                <h2 id="usuarios">{t('inicio.usuariosTitulo')}</h2>
              </header>
              <div className="ty-site-usuarios">
                <div>
                  <strong>Fakhir</strong>
                  <p>{t('inicio.usuarioFakhir')}</p>
                </div>
                <div>
                  <strong>Astrlabe</strong>
                  <p>{t('inicio.usuarioAstrlabe')}</p>
                </div>
                <div>
                  <strong>{t('inicio.usuarioLivrosNome')}</strong>
                  <p>{t('inicio.usuarioLivros')}</p>
                </div>
              </div>
            </div>
            <div>
              <header>
                <div className="ty-site-rotulo">{t('inicio.instalarRotulo')}</div>
                <h2>{t('inicio.instalarTitulo')}</h2>
              </header>
              <div className="ty-site-codigo ty-site-codigo--grande">
                <div className="ty-site-codigo__topo">
                  <span className="ty-site-codigo__rotulo">{t('inicio.instalarCodigo')}</span>
                  <BotaoCopiar texto={SNIPPET_INSTALAR} rotulo={t('inicio.instalarCodigo')} />
                </div>
                <pre className="ty-site-codigo__pre" dir="ltr">
                  <code>{SNIPPET_INSTALAR}</code>
                </pre>
              </div>
              <p className="ty-site-dica ty-site-dica--espaco">{t('inicio.instalarNota')}</p>
              <a className="ty-site-link" href={href({ secao: 'instalar' })}>
                {t('inicio.instalarMais')}
              </a>
            </div>
          </div>
        </section>

        <footer className="ty-site-rodape">
          <span>{t('inicio.rodapeEmpresa')}</span>
          <span>{t('inicio.rodapeLicenca')}</span>
        </footer>
      </div>
    </Moldura>
  )
}
