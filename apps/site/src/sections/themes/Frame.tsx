// A small research screen built from real Tympan components, inside a theme scope: what a theme looks like
// on an application (the fictional Vila Aurora air-quality study, in the active language).
import { Plus, Wind } from 'lucide-react'
import { memo, useState } from 'react'
import {
  Button,
  DataTable,
  InlineNotice,
  ProgressBar,
  ProofBadge,
  SegmentedControl,
  Switch,
  Tag,
  TextField,
  ThemeScope,
} from '@datatechsolutions/tympan'
import { useI18n } from '../../i18n/I18n'
import { useFontesDoTema } from '../home/Home'

export interface FrameProps {
  tema: string
  modo: 'light' | 'dark'
  /** Static thumbnail: no focusable content (the gallery renders it inert). */
  miniatura?: boolean
}

export const Frame = memo(function Frame({ tema, modo, miniatura }: FrameProps) {
  const { t, n } = useI18n()
  const [periodo, setPeriodo] = useState('inverno')
  const [alertas, setAlertas] = useState(true)
  useFontesDoTema(tema)
  const linhas = [
    { id: 'centro', estacao: t('quadro.estacaoCentro'), pm: 18.4, dias: 12, prova: 'proved' as const },
    { id: 'porto', estacao: t('quadro.estacaoPorto'), pm: 27.9, dias: 41, prova: 'refuted' as const },
    { id: 'parque', estacao: t('quadro.estacaoParque'), pm: 14.2, dias: 6, prova: 'pending' as const },
  ]
  return (
    <ThemeScope theme={tema} mode={modo} className="ty-site-quadro" inert={miniatura || undefined} aria-hidden={miniatura || undefined}>
      <div className="ty-site-quadro__topo">
        <span className="ty-site-quadro__marca">
          <Wind aria-hidden="true" className="ty-icon" /> {t('quadro.org')}
        </span>
        <Tag tone="accent" size="small">
          {t('quadro.edicao')}
        </Tag>
      </div>
      <p className="ty-site-quadro__eyebrow">{t('quadro.eyebrow')}</p>
      <h3 className="ty-site-quadro__titulo">{t('quadro.titulo')}</h3>
      <p className="ty-site-quadro__lead">{t('quadro.lead')}</p>
      <div className="ty-site-quadro__linha">
        <Button variant="primary" leadingIcon={<Plus aria-hidden="true" />}>
          {t('quadro.novaMedicao')}
        </Button>
        <Button>{t('quadro.verFonte')}</Button>
        <SegmentedControl
          label={t('quadro.periodo')}
          size="compact"
          value={periodo}
          onChange={setPeriodo}
          options={[
            { value: 'inverno', label: t('quadro.inverno') },
            { value: 'verao', label: t('quadro.verao') },
          ]}
        />
      </div>
      <div className="ty-site-quadro__grade">
        <DataTable
          caption={t('quadro.tabela')}
          density="compact"
          columns={[
            { id: 'estacao', header: t('quadro.colEstacao') },
            { id: 'pm', header: t('quadro.colPm'), numeric: true },
            { id: 'dias', header: t('quadro.colDias'), numeric: true },
            { id: 'prova', header: t('quadro.colProva') },
          ]}
          rows={linhas.map((l) => ({
            id: l.id,
            cells: { estacao: l.estacao, pm: n(l.pm, { minimumFractionDigits: 1 }), dias: n(l.dias), prova: <ProofBadge state={l.prova} size="inline" /> },
          }))}
        />
        <div className="ty-site-quadro__lado">
          <TextField label={t('quadro.campo')} defaultValue={t('quadro.campoValor')} />
          <ProgressBar label={t('quadro.progresso')} value={68} showValue />
          <Switch isSelected={alertas} onChange={setAlertas} label={t('quadro.alertas')} />
          <InlineNotice tone="warning" title={t('quadro.avisoTitulo')}>
            {t('quadro.avisoTexto')}
          </InlineNotice>
        </div>
      </div>
    </ThemeScope>
  )
})
