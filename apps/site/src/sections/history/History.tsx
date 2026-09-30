// História: Tympan's history as an era-grouped vertical timeline, read from docs/history/timeline.json
// (written on its own branch; this page renders whatever is there and says so while it is missing). Text in
// the active language when the entry has it, else English, else Portuguese. Each entry has a deep link.
import { History, Link2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { CopyButton } from '../../comum/CopyButton'
import { useI18n } from '../../i18n/I18n'
import { Cabeca, Layout, useHref } from '../../Layout'
import type { RotaDe } from '../../routes'
import { lerLinhaDoTempo, textoNoIdioma, type EntradaHistory } from './timeline'
import './history.css'

const fontes = import.meta.glob<unknown>('../../../../../docs/history/timeline.json', { eager: true, import: 'default' })

export function useLinhaDoTempo(): EntradaHistory[] {
  return useMemo(() => lerLinhaDoTempo(Object.values(fontes)[0]), [])
}

export function History({ rota }: { rota: RotaDe<'history'> }) {
  const { t, locale } = useI18n()
  const href = useHref()
  const entradas = useLinhaDoTempo()
  const eras = useMemo(() => {
    const out: Array<{ era: string; itens: EntradaHistory[] }> = []
    for (const e of entradas) {
      const era = textoNoIdioma(e.era, locale)
      const ultima = out[out.length - 1]
      if (ultima && ultima.era === era) ultima.itens.push(e)
      else out.push({ era, itens: [e] })
    }
    return out
  }, [entradas, locale])

  useEffect(() => {
    if (rota.entrada) document.getElementById(`h-${rota.entrada}`)?.scrollIntoView({ block: 'start' })
  }, [rota.entrada, entradas])

  return (
    <Layout
      secao="history"
      rotuloLateral={t('historia.eras')}
      lateral={
        eras.length ? (
          <div className="ty-site-lista">
            <h2 className="ty-site-lista__titulo">{t('historia.eras')}</h2>
            <ul className="ty-site-lista__itens">
              {eras.map((g) => (
                <li key={g.era}>
                  <a className="ty-site-estilo ty-site-estilo--texto" href={href({ secao: 'history', entrada: g.itens[0]!.id })} data-fecha-gaveta="">
                    <span className="ty-site-estilo__nome">{g.era}</span>
                    <span className="ty-site-lista__conta">{g.itens.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : undefined
      }
    >
      <div className="ty-site-leitura">
        <Cabeca
          eyebrow={
            <>
              <History aria-hidden="true" className="ty-icon" /> {t('historia.eyebrow')}
            </>
          }
          titulo={t('historia.titulo')}
          lead={t('historia.lead')}
        />
        {!entradas.length ? <p className="ty-site-dica">{t('historia.emPreparo')}</p> : null}
        {eras.map((g) => (
          <section key={g.era} className="ty-site-era" aria-labelledby={`era-${g.itens[0]!.id}`}>
            <h2 className="ty-site-era__titulo" id={`era-${g.itens[0]!.id}`}>
              {g.era}
            </h2>
            <ol className="ty-site-linha-tempo">
              {g.itens.map((e) => {
                const link = `${location.href.split('#')[0]}${href({ secao: 'history', entrada: e.id })}`
                return (
                  <li key={e.id} id={`h-${e.id}`} className="ty-site-marco" data-atual={rota.entrada === e.id || undefined}>
                    <time className="ty-site-marco__data" dateTime={e.data}>
                      {e.data}
                    </time>
                    <h3 className="ty-site-marco__titulo">
                      <a href={href({ secao: 'history', entrada: e.id })}>
                        {textoNoIdioma(e.titulo, locale)}
                        <Link2 aria-hidden="true" className="ty-icon ty-site-marco__elo" />
                      </a>
                    </h3>
                    <p className="ty-site-marco__texto">{textoNoIdioma(e.texto, locale)}</p>
                    {e.metricas.length ? (
                      <ul className="ty-site-marco__metricas" aria-label={t('historia.metricas')}>
                        {e.metricas.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    ) : null}
                    <CopyButton texto={link} rotulo={t('historia.copiarLink')} />
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </Layout>
  )
}
