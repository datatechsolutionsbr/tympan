import { Copy, Download, Eye } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { writeClipboard } from '../../internal/data-a/clipboard'
import { requestHaptic } from '../../internal/haptics'
import type { DataAMessages } from '../../internal/messages/data-a'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type RecoveryCodeStrings = DataAMessages['recoveryCodes']

export interface RecoveryCodeListProps {
  codes: string[]
  revealed?: boolean
  onReveal?: () => void
  onCopyAll?: () => void
  allowDownload?: boolean
  fileName?: string
  /** Overrides of any text, including the lines of the downloaded file. */
  strings?: Partial<RecoveryCodeStrings>
  /** Generation time written into the file; defaults to the moment of download. */
  generatedAt?: Date
  className?: string
}

/** Body of the downloaded file: title, ISO time, keep-safe sentence, then numbered codes. */
export function recoveryCodesFile(codes: string[], strings: Pick<RecoveryCodeStrings, 'fileTitle' | 'generatedAt' | 'keepSafe'>, at: Date): string {
  const header = [strings.fileTitle, strings.generatedAt(at.toISOString()), strings.keepSafe, '']
  const body = codes.map((code, i) => `${i + 1}. ${code}`)
  return [...header, ...body, ''].join('\n')
}

function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  anchor.click()
  URL.revokeObjectURL(url)
}

type Feedback = '' | 'copied' | 'failed'

/** One-use recovery codes with copy and download (spec: wave-2/recovery-code-list.md). */
export function RecoveryCodeList(props: RecoveryCodeListProps) {
  const { codes, revealed = true, allowDownload = true } = props
  const text: RecoveryCodeStrings = { ...useMessages().recoveryCodes, ...props.strings }
  const [feedback, setFeedback] = useState<Feedback>('')
  const clear = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(clear.current), [])

  const copyAll = async () => {
    const ok = await writeClipboard(codes.join('\n'))
    setFeedback(ok ? 'copied' : 'failed')
    clearTimeout(clear.current)
    if (!ok) return
    requestHaptic('medium')
    props.onCopyAll?.()
    clear.current = setTimeout(() => setFeedback(''), 2500)
  }

  const status = feedback === 'copied' ? text.copied : feedback === 'failed' ? text.copyFailed : ''

  if (!revealed) {
    return (
      <div className={cx('fk-recovery-codes', props.className)} data-revealed="false">
        <p className="fk-recovery-codes__hidden">{text.hidden}</p>
        {props.onReveal ? (
          <Button leadingIcon={<Eye />} onPress={props.onReveal}>
            {text.reveal}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cx('fk-recovery-codes', props.className)} data-revealed="true">
      <ol className="fk-recovery-codes__list" aria-label={text.listLabel}>
        {codes.map((code, i) => (
          <li key={`${i}-${code}`} className="fk-recovery-codes__code">
            {code}
          </li>
        ))}
      </ol>
      <div className="fk-recovery-codes__actions">
        <Button leadingIcon={<Copy />} onPress={() => void copyAll()}>
          {text.copyAll}
        </Button>
        {allowDownload ? (
          <Button
            leadingIcon={<Download />}
            onPress={() => saveText(props.fileName ?? text.fileName, recoveryCodesFile(codes, text, props.generatedAt ?? new Date()))}
          >
            {text.download}
          </Button>
        ) : null}
      </div>
      <p className="fk-recovery-codes__status" role="status">
        {status}
      </p>
    </div>
  )
}
