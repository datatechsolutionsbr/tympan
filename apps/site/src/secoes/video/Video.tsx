// Vídeo: a short data scene playing in any theme (after the Estúdio's Vídeos tab: play/pause, scrubber,
// one theme or two in sync, ← → through themes, space to play). Drawn with SVG from a time value driven
// by requestAnimationFrame; no video library.
import { Clapperboard, Columns2, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, ListboxSelect, SegmentedControl, ThemeScope, ThemeSwatch, useReducedMotion, useTheme } from '@datatechsolutions/tympan'
import type { Navegar } from '../../App'
import { useI18n } from '../../i18n/I18n'
import { useLocal } from '../../local'
import { Cabeca, Moldura, useGruposTema, useNomeTema } from '../../Moldura'
import { teclaDeTroca, vizinho, type RotaDe } from '../../rotas'
import { useFontesDoTema } from '../inicio/Inicio'
import { Cena, DURACAO } from './Cena'

function Palco({ tema, t, rotulo }: { tema: string; t: number; rotulo: string }) {
  const th = useTheme()
  useFontesDoTema(tema)
  return (
    <figure className="ty-site-video-palco">
      <ThemeScope theme={tema} mode={th.resolvedMode} className="ty-site-video-quadro">
        <Cena t={t} />
      </ThemeScope>
      <figcaption>{rotulo}</figcaption>
    </figure>
  )
}

export function Video({ rota, ir }: { rota: RotaDe<'video'>; ir: Navegar }) {
  const { t: tr, n, dir } = useI18n()
  const th = useTheme()
  const nomeTema = useNomeTema()
  const grupos = useGruposTema()
  const todos = grupos.flatMap((g) => g.themes.map((x) => x.id))
  const reduzido = useReducedMotion()
  const [t, setT] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [comparar, setComparar] = useLocal('video:comparar', false)
  const [b, setB] = useLocal('video:b', 'print-jornal')
  const ultimo = useRef<number | null>(null)
  const tema = rota.tema

  // Starts playing unless the viewer asked for reduced motion.
  useEffect(() => {
    if (!reduzido) setTocando(true)
  }, [reduzido])

  useEffect(() => {
    if (!tocando) {
      ultimo.current = null
      return
    }
    let id = 0
    const passo = (agora: number) => {
      const antes = ultimo.current ?? agora
      ultimo.current = agora
      setT((x) => (x + (agora - antes) / 1000) % DURACAO)
      id = requestAnimationFrame(passo)
    }
    id = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(id)
  }, [tocando])

  const alternar = useCallback(() => setTocando((p) => !p), [])
  useEffect(() => {
    const on = (ev: KeyboardEvent) => {
      if (!teclaDeTroca(ev.target)) return
      if (ev.key === ' ' && !(ev.target as HTMLElement).closest('button, a')) {
        ev.preventDefault()
        alternar()
      } else if ((ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault()
        const frente = (ev.key === 'ArrowRight') !== (dir === 'rtl')
        ir({ secao: 'video', tema: vizinho(todos, tema, frente ? 1 : -1) }, { substituir: true })
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [alternar, ir, todos, tema, dir])

  const tempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const secoes = grupos.map((g) => ({
    title: g.heading,
    options: g.themes.map((x) => ({ value: x.id, label: x.label, icon: <ThemeSwatch theme={x.id} mode={th.resolvedMode} /> })),
  }))

  return (
    <Moldura secao="video" className="ty-site-pagina--video">
      <Cabeca
        eyebrow={
          <>
            <Clapperboard aria-hidden="true" className="ty-icon" /> {tr('video.eyebrowPagina')}
          </>
        }
        titulo={tr('video.tituloPagina')}
        lead={tr('video.leadPagina')}
        acoes={
          <SegmentedControl
            label={tr('livro.modo')}
            size="compact"
            value={comparar ? 'dois' : 'um'}
            onChange={(v) => setComparar(v === 'dois')}
            options={[
              { value: 'um', label: tr('video.umTema'), icon: Square },
              { value: 'dois', label: tr('modo.comparar'), icon: Columns2 },
            ]}
          />
        }
      />
      <div className="ty-site-video-temas">
        <ListboxSelect label={comparar ? tr('temas.temaLetra', { letra: 'A' }) : tr('aparencia.tema')} sections={secoes} value={tema} onChange={(v) => ir({ secao: 'video', tema: v }, { substituir: true })} className="ty-site-seletor" />
        {comparar ? <ListboxSelect label={tr('temas.temaLetra', { letra: 'B' })} sections={secoes} value={b} onChange={setB} className="ty-site-seletor" /> : null}
      </div>
      <div className="ty-site-video-palcos" data-comparar={comparar || undefined}>
        <Palco tema={tema} t={t} rotulo={nomeTema(tema)} />
        {comparar ? <Palco tema={b} t={t} rotulo={nomeTema(b)} /> : null}
      </div>
      <div className="ty-site-video-controles" role="group" aria-label={tr('video.controles')}>
        <Button variant="primary" iconOnly accessibleLabel={tocando ? tr('video.pausar') : tr('video.tocar')} leadingIcon={tocando ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />} onPress={alternar} />
        <Button variant="quiet" iconOnly accessibleLabel={tr('video.recomecar')} leadingIcon={<RotateCcw aria-hidden="true" />} onPress={() => setT(0)} />
        <input
          className="ty-site-video-scrub"
          type="range"
          min={0}
          max={DURACAO}
          step={0.04}
          value={t}
          aria-label={tr('video.posicao')}
          aria-valuetext={tr('video.posicaoTexto', { atual: tempo(t), total: tempo(DURACAO) })}
          onChange={(e) => {
            setTocando(false)
            setT(Number(e.target.value))
          }}
        />
        <span className="ty-site-video-tempo">
          {tempo(t)} / {tempo(DURACAO)} · {n(Math.floor(t * 30))}
        </span>
      </div>
      <p className="ty-site-dica">{tr('video.dica')}</p>
    </Moldura>
  )
}
