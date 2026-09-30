// Componentes: a catalogue home with live thumbnails (the real pages, scaled down and inert, so they follow
// the site's theme, mode and language), and a page per group with the gallery's documentation cards
// (Preview / Code, light / dark, width), an "on this page" list and previous / next links. Research screens
// are whole applications shown in a frame; print links to Livro; tools include the theme customizer.
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { ThemeScope, useTheme } from '@datatechsolutions/tympan'
import { Encaixe } from '../../comum/Encaixe'
import { GALLERY_PAGES, GalleryFrameContext } from '../../galerias'
import { useI18n } from '../../i18n/I18n'
import { Cabeca, Moldura, useHref } from '../../Moldura'
import { lerRota, type Rota, type RotaDe } from '../../rotas'
import { QuandoVisivel } from '../livro/Spread'
import { CATALOGO, GRUPOS, itemDoCatalogo, type GrupoId, type ItemCatalogo } from './catalogo'
import '../../../../../packages/ui/gallery/src/gallery.css'
import './componentes.css'

const Telas = lazy(() => import('./Telas').then((m) => ({ default: m.Telas })))

function useTextos() {
  const { td, t } = useI18n()
  return useMemo(
    () => ({
      titulo: (i: ItemCatalogo) => td(`pagina.${i.id}`, i.titulo),
      descricao: (i: ItemCatalogo) => td(`pagina.${i.id}.descricao`, i.descricao),
      grupo: (g: GrupoId) => td(`grupo.${g.replace(/\s/g, '')}`, g),
      exemplos: (n: number) => t('componentes.exemplos', { n }),
    }),
    [td, t],
  )
}

function destino(i: ItemCatalogo): Rota {
  if (i.id === 'print-estilos') return lerRota('#/livro')
  if (i.id === 'print-livro') return lerRota('#/livro/jornal/estudo/cor/completo')
  return { secao: 'componentes', pagina: i.id }
}

function Lateral({ atual }: { atual?: string }) {
  const href = useHref()
  const tx = useTextos()
  const { t } = useI18n()
  return (
    <div className="ty-site-lista">
      <a className="ty-site-estilo ty-site-estilo--texto ty-site-lista__inicio" href={href({ secao: 'componentes' })} aria-current={!atual ? 'page' : undefined} data-fecha-gaveta="">
        <span className="ty-site-estilo__nome">{t('componentes.todos')}</span>
      </a>
      {GRUPOS.map((g) => (
        <section key={g} className="ty-site-lista__grupo" aria-labelledby={`grupo-${g.replace(/\s/g, '')}`}>
          <h2 className="ty-site-lista__titulo" id={`grupo-${g.replace(/\s/g, '')}`}>
            {tx.grupo(g)}
          </h2>
          <ul className="ty-site-lista__itens">
            {CATALOGO.filter((i) => i.grupo === g).map((i) => (
              <li key={i.id}>
                <a className="ty-site-estilo ty-site-estilo--texto" href={href(destino(i))} aria-current={i.id === atual ? 'page' : undefined} data-fecha-gaveta="">
                  <span className="ty-site-estilo__nome">{tx.titulo(i)}</span>
                  {i.exemplos ? <span className="ty-site-lista__conta">{i.exemplos}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** A gallery page scaled down: inert, hidden from assistive technology, in the site's theme. */
function Miniatura({ item }: { item: ItemCatalogo }) {
  const th = useTheme()
  const Page = GALLERY_PAGES.find((p) => p.id === item.id)?.Component as ComponentType<{ scope: string }> | undefined
  return (
    <span className="ty-site-miniatura" aria-hidden="true">
      <QuandoVisivel reserva={<span className="ty-site-miniatura__reserva" />}>
        <Encaixe>
          <ThemeScope theme={th.theme} mode={th.resolvedMode} density={th.density} className="ty-site-miniatura__pagina" inert>
            {Page ? (
              <GalleryFrameContext.Provider value={null}>
                <Page scope={`mini-${item.id}`} />
              </GalleryFrameContext.Provider>
            ) : (
              <Suspense fallback={null}>
                <Telas id={item.id} miniatura />
              </Suspense>
            )}
          </ThemeScope>
        </Encaixe>
      </QuandoVisivel>
    </span>
  )
}

function Catalogo() {
  const { t, n } = useI18n()
  const href = useHref()
  const tx = useTextos()
  const total = CATALOGO.reduce((s, i) => s + (i.exemplos ?? 0), 0)
  return (
    <>
      <Cabeca
        eyebrow={
          <>
            <LayoutGrid aria-hidden="true" className="ty-icon" /> {t('componentes.eyebrow', { n: total })}
          </>
        }
        titulo={t('componentes.titulo')}
        lead={t('componentes.lead')}
      />
      {GRUPOS.map((g) => {
        const itens = CATALOGO.filter((i) => i.grupo === g)
        return (
          <section key={g} className="ty-site-catalogo" aria-labelledby={`cat-${g.replace(/\s/g, '')}`}>
            <h2 className="ty-site-catalogo__titulo" id={`cat-${g.replace(/\s/g, '')}`}>
              {tx.grupo(g)} <span className="ty-site-catalogo__conta">{n(itens.length)}</span>
            </h2>
            <ul className="ty-site-catalogo__grade">
              {itens.map((i) => (
                <li key={i.id} className="ty-site-cartao">
                  <div className="ty-site-cartao__link">
                    {i.tipo === 'link' ? <span className="ty-site-miniatura ty-site-miniatura--livro" aria-hidden="true" /> : <Miniatura item={i} />}
                    <a className="ty-site-cartao__titulo ty-site-cartao__alvo" href={href(destino(i))}>
                      {tx.titulo(i)}
                    </a>
                    <span className="ty-site-cartao__descricao">{tx.descricao(i)}</span>
                    {i.exemplos ? <span className="ty-site-cartao__meta">{tx.exemplos(i.exemplos)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

interface Entrada {
  id: string
  titulo: string
}

function usePaginaNoIndice(chave: string): Entrada[] {
  const [e, setE] = useState<Entrada[]>([])
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const hs = document.querySelectorAll<HTMLElement>('.ty-site-pagina-galeria .ty-gallery-card__title')
      setE([...hs].map((h) => ({ id: h.id, titulo: h.textContent ?? '' })))
    })
    return () => cancelAnimationFrame(id)
  }, [chave])
  return e
}

function PaginaGaleria({ item }: { item: ItemCatalogo }) {
  const th = useTheme()
  const { t } = useI18n()
  const href = useHref()
  const tx = useTextos()
  const pagina = GALLERY_PAGES.find((p) => p.id === item.id)
  const Page = pagina?.Component as ComponentType<{ scope: string }> | undefined
  const indice = usePaginaNoIndice(item.id)
  const lista = CATALOGO.filter((i) => i.tipo !== 'link')
  const pos = lista.findIndex((i) => i.id === item.id)
  const anterior = lista[pos - 1]
  const proximo = lista[pos + 1]
  return (
    <div className="ty-site-doc">
      <div className="ty-site-doc__principal">
        <Cabeca eyebrow={tx.grupo(item.grupo)} titulo={tx.titulo(item)} lead={tx.descricao(item)} />
        {item.exemplos ? <p className="ty-site-dica">{tx.exemplos(item.exemplos)}</p> : null}
        {Page ? (
          <GalleryFrameContext.Provider value={{ theme: th.theme, mode: th.resolvedMode, density: th.density }}>
            <div className="ty-site-pagina-galeria ty-gallery-page" key={item.id}>
              <Page scope="site" />
            </div>
          </GalleryFrameContext.Provider>
        ) : (
          <div className="ty-site-tela">
            <Suspense fallback={<p className="ty-site-dica">{t('comum.carregando')}</p>}>
              <Telas id={item.id} />
            </Suspense>
          </div>
        )}
        <nav className="ty-site-paginador" aria-label={t('componentes.paginador')}>
          {anterior ? (
            <a href={href(destino(anterior))} className="ty-site-paginador__link">
              <span className="ty-site-paginador__dica">
                <ArrowLeft aria-hidden="true" className="ty-icon ty-site-seta" /> {t('componentes.anterior')}
              </span>
              {tx.titulo(anterior)}
            </a>
          ) : (
            <span />
          )}
          {proximo ? (
            <a href={href(destino(proximo))} className="ty-site-paginador__link ty-site-paginador__link--fim">
              <span className="ty-site-paginador__dica">
                {t('componentes.proximo')} <ArrowRight aria-hidden="true" className="ty-icon ty-site-seta" />
              </span>
              {tx.titulo(proximo)}
            </a>
          ) : null}
        </nav>
      </div>
      {indice.length ? (
        <nav className="ty-site-indice" aria-label={t('componentes.nestaPagina')}>
          <h2 className="ty-site-lista__titulo">{t('componentes.nestaPagina')}</h2>
          <ul>
            {indice.map((e) => (
              <li key={e.id}>
                <a
                  href={`#${e.id}`}
                  onClick={(ev) => {
                    ev.preventDefault()
                    document.getElementById(e.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {e.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}

export function Componentes({ rota }: { rota: RotaDe<'componentes'> }) {
  const { t } = useI18n()
  const item = itemDoCatalogo(rota.pagina)
  return (
    <Moldura secao="componentes" className="ty-site-pagina--componentes" rotuloLateral={t('componentes.lista')} lateral={<Lateral atual={item?.id} />}>
      {item ? <PaginaGaleria item={item} /> : <Catalogo />}
    </Moldura>
  )
}
