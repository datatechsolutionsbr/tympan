// Notes per book style, kept in this browser, with a copy button that puts the style, its theme id, the
// favourites and the note together (after the Estúdio's "my choice and comments").
import { TextArea } from '@datatechsolutions/tympan'
import { CopyButton } from '../../comum/CopyButton'
import { temaDoEstilo } from '../../styles'
import { useI18n } from '../../i18n/I18n'
import { lerLocal, useLocal } from '../../local'
import type { PrintPresetName } from '../../tokens'
import { useTextosEstilo } from './texts'

export function Notas({ estilo }: { estilo: PrintPresetName }) {
  const { t } = useI18n()
  const { rotulo } = useTextosEstilo()
  const [notas, setNotas] = useLocal<Record<string, string>>('livro:notas', {})
  const nota = notas[estilo] ?? ''
  const favs = lerLocal<string[]>('livro:favoritos', [])
  const texto = [
    t('notas.cabecalho'),
    `${t('notas.estilo')}: ${rotulo(estilo)} (${temaDoEstilo(estilo)})`,
    favs.length ? `${t('notas.favoritos')}: ${favs.map((f) => rotulo(f)).join('; ')}` : '',
    nota ? `${t('notas.nota')}: ${nota}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return (
    <section className="ty-site-ficha__bloco" aria-labelledby="ficha-notas">
      <h3 className="ty-site-ficha__sub" id="ficha-notas">
        {t('notas.titulo')}
      </h3>
      <TextArea accessibleLabel={t('notas.titulo')} value={nota} onChange={(v) => setNotas({ ...notas, [estilo]: v })} rows={3} autoGrow placeholder={t('notas.placeholder')} />
      <div className="ty-site-id">
        <CopyButton texto={texto} rotulo={t('notas.copiar')} />
        <span className="ty-site-dica">{t('notas.dica')}</span>
      </div>
    </section>
  )
}
