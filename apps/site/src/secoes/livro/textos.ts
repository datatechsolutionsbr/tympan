// Localised words about a book style: label, neutral description, paper, renderer, proof mark and state.
// Built from catalogue keys; never from the preset's `referencia`.
import { useMemo } from 'react'
import { printPresets, type EstadoProva, type PrintPresetName, type PrintStyle } from '../../tokens'
import { familia } from '../../styles'
import { useI18n } from '../../i18n/I18n'

export function useTextosEstilo() {
  const { t, td, n } = useI18n()
  return useMemo(() => {
    const rotulo = (id: string) => td(`estilo.${id}`, printPresets[id as PrintPresetName]?.label ?? id)
    const rendDe = (s: PrintStyle) => td(`render.${s.grafico}`, s.grafico)
    const papelDe = (s: PrintStyle) => td(`textura.${s.papel.textura}`, s.papel.textura)
    const marcaDe = (s: PrintStyle) => td(`marca.${s.marcaProva}`, s.marcaProva)
    const rotuloProva = (e: EstadoProva) => td(`prova.${e}`, e)
    const descricao = (id: PrintPresetName) => {
      const s = printPresets[id]
      const titulo = familia(s.fontes.titulo)
      const corpo = familia(s.fontes.corpo)
      const fontes = titulo === corpo ? t('descricao.umaFonte', { fonte: titulo }) : t('descricao.duasFontes', { titulo, corpo })
      const cantos = s.raio > 0 ? t('descricao.cantos', { mm: n(s.raio) }) : t('descricao.cantosRetos')
      return t('descricao.frase', { fontes, papel: papelDe(s), corPapel: s.cor.papel, destaque: s.cor.destaque, render: rendDe(s), cantos })
    }
    return { rotulo, descricao, rendDe, papelDe, marcaDe, rotuloProva }
  }, [t, td, n])
}
