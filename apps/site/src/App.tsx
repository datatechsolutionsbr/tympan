// Routing (hash, path segments) and the pieces every section shares: the ⌘K search and lazy sections.
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useI18n } from './i18n/I18n'
import { BuscaContext } from './Moldura'
import { Busca } from './Busca'
import { formatarRota, lerRota, segmentos, type Rota } from './routes'

const Home = lazy(() => import('./sections/home/Home').then((m) => ({ default: m.Inicio })))
const History = lazy(() => import('./sections/history/History').then((m) => ({ default: m.Historia })))
const Components = lazy(() => import('./sections/components/Components').then((m) => ({ default: m.Componentes })))
const Themes = lazy(() => import('./sections/themes/Themes').then((m) => ({ default: m.Temas })))
const Book = lazy(() => import('./sections/book/Book').then((m) => ({ default: m.Livro })))
const Video = lazy(() => import('./sections/video/Video').then((m) => ({ default: m.Video })))
const Install = lazy(() => import('./sections/install/Install').then((m) => ({ default: m.Instalar })))

export type Navegar = (r: Rota, opcoes?: { substituir?: boolean }) => void

/** Current route from the hash; `navegar` writes the hash (replacing the history entry when asked). */
export function useRota(locale: string): [Rota, Navegar] {
  const [rota, setRota] = useState<Rota>(() => lerRota(location.hash))
  useEffect(() => {
    const on = () => setRota(lerRota(location.hash))
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  // The hash always names the active locale, so a copied link opens in the same language.
  useEffect(() => {
    const s = segmentos(location.hash)
    if (s.locale !== locale) history.replaceState(null, '', formatarRota(lerRota(location.hash), locale))
  }, [locale])
  const navegar = useCallback<Navegar>(
    (r, opcoes) => {
      const h = formatarRota(r, locale)
      if (opcoes?.substituir) history.replaceState(null, '', h)
      else history.pushState(null, '', h)
      setRota(r)
    },
    [locale],
  )
  return [rota, navegar]
}

export function App() {
  const { locale, t } = useI18n()
  const [rota, navegar] = useRota(locale)
  const [busca, setBusca] = useState(false)
  const abrirBusca = useCallback(() => setBusca(true), [])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBusca((b) => !b)
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [])

  useEffect(() => {
    document.title = rota.secao === 'home' ? 'Tympan' : `${t(`secao.${rota.secao}`)} · Tympan`
  }, [rota.secao, t])

  // A new section starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [rota.secao])

  return (
    <BuscaContext.Provider value={abrirBusca}>
      <Suspense fallback={<div className="ty-site-carregando" role="status">{t('comum.carregando')}</div>}>
        {rota.secao === 'home' ? <Inicio /> : null}
        {rota.secao === 'history' ? <Historia rota={rota} /> : null}
        {rota.secao === 'components' ? <Componentes rota={rota} /> : null}
        {rota.secao === 'themes' ? <Temas rota={rota} ir={navegar} /> : null}
        {rota.secao === 'book' ? <Livro rota={rota} ir={navegar} /> : null}
        {rota.secao === 'video' ? <Video rota={rota} ir={navegar} /> : null}
        {rota.secao === 'install' ? <Instalar /> : null}
      </Suspense>
      <Busca aberta={busca} aoFechar={() => setBusca(false)} navegar={navegar} />
    </BuscaContext.Provider>
  )
}
