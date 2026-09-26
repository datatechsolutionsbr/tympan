import { Camera, Check, LoaderCircle } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button as AriaButton, DropZone, useLocale, type DropZoneProps } from 'react-aria-components'

type DropEvent = Parameters<NonNullable<DropZoneProps['onDrop']>>[0]
import { cx } from '../../internal/cx'
import { useDomAttributes } from '../../internal/dom'
import { useMessages } from '../../internal/provider'

export interface UploadResult {
  ok: boolean
  key?: string
  error?: string
}

export interface ImagePickerProps {
  value?: string | null
  fallbackText?: string
  label?: string
  shape?: 'circle' | 'rounded'
  size?: 'md' | 'lg'
  accept?: string[]
  maxBytes?: number
  upload: (file: File) => Promise<UploadResult>
  onUploaded?: (key: string) => void
  hint?: ReactNode
  messages?: Partial<{ wrongType: string; tooLarge: string; failed: string }>
  /** Also accept a dropped file (the button path always exists). */
  droppable?: boolean
  disabled?: boolean
  className?: string
}

export const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIB = 1024 * 1024

type Phase = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done' } | { kind: 'error'; text: string }

/** Size limit in the locale's unit wording and digits (binary multiples, shown with the SI unit names Intl knows). */
function sizeText(bytes: number, locale: string): string {
  const whole = bytes % MIB === 0
  return new Intl.NumberFormat(locale, { style: 'unit', unit: whole ? 'megabyte' : 'kilobyte', unitDisplay: 'short', maximumFractionDigits: 0 }).format(
    whole ? bytes / MIB : Math.round(bytes / 1024),
  )
}

function previewOf(file: File): string | null {
  try {
    return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null
  } catch {
    return null
  }
}

/**
 * Picture chooser with local checks, instant preview and host upload
 * (spec: wave-2/image-picker.md).
 */
export function ImagePicker(props: ImagePickerProps) {
  const m = useMessages().imagePicker
  const { locale } = useLocale()
  const accept = props.accept ?? DEFAULT_IMAGE_TYPES
  const maxBytes = props.maxBytes ?? 5 * MIB
  const fileRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [preview, setPreview] = useState<string | null>(null)
  const base = useId()
  const hintId = props.hint != null ? `${base}-hint` : undefined
  const statusId = `${base}-status`
  const busy = phase.kind === 'busy'
  const shown = preview ?? props.value ?? null

  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL?.(preview)
  }, [preview])

  useDomAttributes(triggerRef, { 'aria-busy': busy ? 'true' : undefined })

  const reject = (text: string) => setPhase({ kind: 'error', text })

  const take = async (file: File) => {
    if (!accept.includes(file.type)) return reject(props.messages?.wrongType ?? m.wrongType)
    if (file.size > maxBytes) return reject(props.messages?.tooLarge ?? m.tooLarge(sizeText(maxBytes, locale)))
    const before = preview
    setPreview(previewOf(file))
    setPhase({ kind: 'busy' })
    try {
      const result = await props.upload(file)
      if (result.ok) {
        setPhase({ kind: 'done' })
        if (result.key != null) props.onUploaded?.(result.key)
      } else {
        setPreview(before)
        reject(result.error || (props.messages?.failed ?? m.failed))
      }
    } catch (err) {
      setPreview(before)
      reject((err instanceof Error && err.message) || (props.messages?.failed ?? m.failed))
    }
  }

  const statusText = phase.kind === 'error' ? phase.text : phase.kind === 'busy' ? m.uploading : phase.kind === 'done' ? m.updated : ''
  const describedBy = [hintId, phase.kind === 'error' ? statusId : undefined].filter(Boolean).join(' ') || undefined

  const trigger = (
    <AriaButton
      ref={triggerRef}
      className="fk-image-picker__trigger"
      aria-label={props.label ?? m.change}
      aria-describedby={describedBy}
      isDisabled={props.disabled || busy}
      onPress={() => fileRef.current?.click()}
    >
      <span className="fk-image-picker__frame" aria-hidden="true">
        {shown ? <img className="fk-image-picker__image" src={shown} alt="" /> : <span className="fk-image-picker__initials">{props.fallbackText}</span>}
      </span>
      <span className="fk-image-picker__badge" aria-hidden="true">
        {busy ? <LoaderCircle className="fk-icon fk-image-picker__spin" /> : phase.kind === 'done' ? <Check className="fk-icon" /> : <Camera className="fk-icon" />}
      </span>
    </AriaButton>
  )

  const onDrop = async (e: DropEvent) => {
    if (props.disabled || busy) return
    for (const item of e.items) {
      if (item.kind === 'file') {
        await take(await item.getFile())
        return
      }
    }
  }

  return (
    <div className={cx('fk-image-picker', props.className)} data-shape={props.shape ?? 'circle'} data-size={props.size ?? 'lg'} data-phase={phase.kind}>
      {props.droppable ? (
        <DropZone className="fk-image-picker__drop" onDrop={onDrop} isDisabled={props.disabled} aria-label={props.label ?? m.change}>
          {trigger}
        </DropZone>
      ) : (
        trigger
      )}
      <input
        ref={fileRef}
        type="file"
        className="fk-visually-hidden"
        accept={accept.join(',')}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so choosing the same file again still fires a change.
          e.target.value = ''
          if (file) void take(file)
        }}
      />
      {props.hint != null ? (
        <p id={hintId} className="fk-image-picker__hint">
          {props.hint}
        </p>
      ) : null}
      <p id={statusId} className="fk-image-picker__status" role="status" data-tone={phase.kind}>
        {statusText}
      </p>
    </div>
  )
}
