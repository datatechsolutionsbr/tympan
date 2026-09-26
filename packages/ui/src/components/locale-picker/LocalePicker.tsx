import { Check, Languages } from 'lucide-react'
import { useState } from 'react'
import { ListBox, ListBoxItem, type Key } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { Drawer } from '../drawer/Drawer'
import { ModalDialog } from '../modal-dialog/ModalDialog'

export interface LocaleEntry {
  code: string
  /** Name of the language in that language ("Português"). */
  nativeName: string
  shortCode?: string
  /** Decorative flag (emoji or short text). */
  flag?: string
}

export interface LocalePickerProps {
  locales: LocaleEntry[]
  value: string
  /** Called with a different locale; the host applies it. */
  onChange: (code: string) => void
  presentation?: 'drawer' | 'dialog'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  showTrigger?: boolean
  className?: string
}

const shortOf = (l: LocaleEntry) => l.shortCode ?? l.code.split('-')[0]!.toUpperCase()

/** The list of locales, each written in its own language. */
function LocaleList(props: { locales: LocaleEntry[]; value: string; label: string; grid: boolean; onPick: (code: string) => void }) {
  const pick = (keys: 'all' | Set<Key>) => {
    if (keys === 'all') return
    // Re-activating the current locale empties the selection: treat it as "keep".
    const [key] = [...keys]
    props.onPick(key != null ? String(key) : props.value)
  }
  return (
    <ListBox
      aria-label={props.label}
      className="ty-locale-picker__list"
      data-layout={props.grid ? 'grid' : 'list'}
      layout={props.grid ? 'grid' : 'stack'}
      items={props.locales.map((l) => ({ ...l, id: l.code }))}
      selectionMode="single"
      selectedKeys={[props.value]}
      onSelectionChange={pick}
      autoFocus
    >
      {(entry) => (
        <ListBoxItem id={entry.code} textValue={entry.nativeName} className="ty-locale-picker__option">
          {({ isSelected }) => (
            <>
              {entry.flag ? (
                <span className="ty-locale-picker__flag" aria-hidden="true">
                  {entry.flag}
                </span>
              ) : null}
              <span className="ty-locale-picker__name" lang={entry.code}>
                {entry.nativeName}
              </span>
              <span className="ty-locale-picker__code" aria-hidden="true">
                {shortOf(entry)}
              </span>
              <Check className="ty-icon ty-locale-picker__check" aria-hidden="true" focusable="false" data-shown={isSelected || undefined} />
            </>
          )}
        </ListBoxItem>
      )}
    </ListBox>
  )
}

/** Interface language chooser (spec: wave-2/locale-picker.md). */
export function LocalePicker(props: LocalePickerProps) {
  const t = useMessages().localePicker
  const title = props.title ?? t.title
  const [innerOpen, setInnerOpen] = useState(false)
  const open = props.open ?? innerOpen
  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  const current = props.locales.find((l) => l.code === props.value)
  const currentName = current?.nativeName ?? props.value
  const pick = (code: string) => {
    if (code !== props.value) props.onChange(code)
    setOpen(false)
  }
  const dialog = props.presentation === 'dialog'
  const body = (
    <div className="ty-locale-picker__body">
      <LocaleList locales={props.locales} value={props.value} label={t.list} grid={dialog} onPick={pick} />
      <p className="ty-locale-picker__footer">{t.current(currentName, current ? shortOf(current) : props.value)}</p>
    </div>
  )

  return (
    <span className={cx('ty-locale-picker', props.className)}>
      {props.showTrigger === false ? null : (
        <Button
          variant="quiet"
          leadingIcon={<Languages />}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPress={() => setOpen(true)}
          className="ty-locale-picker__trigger"
        >
          <span className="ty-visually-hidden">{t.trigger(title, currentName)}</span>
          <span aria-hidden="true">{current?.flag ?? (current ? shortOf(current) : props.value)}</span>
        </Button>
      )}
      {dialog ? (
        <ModalDialog isOpen={open} onOpenChange={setOpen} title={title} width="regular">
          {body}
        </ModalDialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen} title={title} placement="end" width="medium">
          {body}
        </Drawer>
      )}
    </span>
  )
}
