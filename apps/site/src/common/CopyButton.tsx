import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@datatechsolutions/tympan'
import { useI18n } from '../i18n/I18n'
import { copiar } from './copiar'

/** Copy button with feedback in place ("Copiado" / "Não copiou") for a couple of seconds. */
export function CopyButton({ texto, rotulo }: { texto: string; rotulo: string }) {
  const { t } = useI18n()
  const [feito, setFeito] = useState<null | boolean>(null)
  return (
    <Button
      variant="quiet"
      size="compact"
      leadingIcon={<Copy aria-hidden="true" />}
      onPress={async () => {
        setFeito(await copiar(texto))
        window.setTimeout(() => setFeito(null), 1800)
      }}
      accessibleLabel={`${t('comum.copiar')}: ${rotulo}`}
    >
      <span aria-live="polite">{feito === null ? t('comum.copiar') : feito ? t('comum.copiado') : t('comum.naoCopiou')}</span>
    </Button>
  )
}
