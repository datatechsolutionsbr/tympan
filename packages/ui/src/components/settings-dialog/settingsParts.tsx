// Controls of SettingsDialog, one per item type, plus the copy action and
// the passphrase form.
import { Copy } from 'lucide-react'
import { useReducer, useState, type FormEvent, type ReactNode } from 'react'
import { Label, Radio, RadioGroup, Text } from 'react-aria-components'
import { useMessages } from '../../internal/provider'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { NativeSelect } from '../native-select/NativeSelect'
import { Switch } from '../switch/Switch'
import { TextArea } from '../text-area/TextArea'
import { TextField } from '../text-field/TextField'
import type { EntryFormat, EntryItem, PassphraseItem, PickItem, SettingsItem } from './settingsModel'

type Wire = { label: string; hint?: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string; name: string }

const BY_FORMAT: { [F in EntryFormat]: (w: Wire) => ReactNode } = {
  plain: (w) => <TextField {...w} inputType="text" />,
  mail: (w) => <TextField {...w} inputType="email" />,
  link: (w) => <TextField {...w} inputType="url" />,
  secret: (w) => <TextField {...w} mode="password" />,
  paragraph: (w) => <TextArea {...w} rows={3} />,
}

function Copier({ caption, text }: { caption: string; text: string }) {
  const words = useMessages().settingsDialog
  const [said, setSaid] = useState('')
  const run = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setSaid(words.copied)
    } catch {
      setSaid('')
    }
  }
  return (
    <>
      <Button size="compact" iconOnly leadingIcon={<Copy />} accessibleLabel={words.copy(caption)} onPress={() => void run()} />
      <span role="status" className="fk-visually-hidden">
        {said}
      </span>
    </>
  )
}

function Entry({ item }: { item: EntryItem }) {
  const draw = BY_FORMAT[item.format ?? 'plain']
  return (
    <div className="fk-settings-dialog__field" data-copyable={item.copy ? '' : undefined}>
      <div className="fk-settings-dialog__field-control">
        {draw({ label: item.caption, hint: item.help, value: item.text, onChange: item.onText, readOnly: item.locked, placeholder: item.example, name: item.id })}
      </div>
      {item.copy ? <Copier caption={item.caption} text={item.text} /> : null}
    </div>
  )
}

type Slot = 'old' | 'fresh' | 'again'
type Draft = Record<Slot, string> & { differ: boolean }
type Change = [Slot, string] | 'differ'

const draftAfter = (draft: Draft, change: Change): Draft =>
  change === 'differ'
    ? { ...draft, differ: true }
    : // Touching either new value clears the "different" notice.
      { ...draft, [change[0]]: change[1], differ: change[0] === 'old' && draft.differ }

function Passphrase({ item }: { item: PassphraseItem }) {
  const words = useMessages().settingsDialog
  const [draft, apply] = useReducer(draftAfter, { old: '', fresh: '', again: '', differ: false })
  const caption = (slot: Slot | 'save') =>
    item.captions?.[slot] ?? { old: words.currentPassword, fresh: words.newPassword, again: words.confirmPassword, save: words.changePassword }[slot]
  const box = (slot: Slot, autoComplete: string) => (
    <TextField
      mode="password"
      label={caption(slot)}
      value={draft[slot]}
      autoComplete={autoComplete}
      onChange={(text) => apply([slot, text])}
      errorMessage={slot === 'again' && draft.differ ? words.passwordMismatch : undefined}
    />
  )
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.fresh !== draft.again) return apply('differ')
    item.onSave(draft.old, draft.fresh, draft.again)
  }
  return (
    <form noValidate className="fk-settings-dialog__password" onSubmit={send}>
      {box('old', 'current-password')}
      {box('fresh', 'new-password')}
      {box('again', 'new-password')}
      <div>
        <Button type="submit">{caption('save')}</Button>
      </div>
    </form>
  )
}

function Pick({ item }: { item: PickItem }) {
  return (
    <RadioGroup className="fk-settings-dialog__choices" data-cards={item.look === 'cards' ? '' : undefined} value={item.chosen} onChange={item.onPick}>
      <Label className="fk-settings-dialog__legend">{item.caption}</Label>
      <div className="fk-settings-dialog__choice-grid">
        {item.answers.map((answer) => (
          <Radio key={answer.id} value={answer.id} className="fk-settings-dialog__choice">
            <span aria-hidden="true" className="fk-settings-dialog__choice-mark" />
            <span className="fk-settings-dialog__choice-text">
              <span className="fk-settings-dialog__choice-label">{answer.caption}</span>
              {answer.help ? (
                <Text slot="description" className="fk-settings-dialog__choice-hint">
                  {answer.help}
                </Text>
              ) : null}
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

function Portrait({ src, initials, onReplace }: { src?: string; initials: string; onReplace?: () => void }) {
  const words = useMessages().settingsDialog
  return (
    <div className="fk-settings-dialog__picture">
      <Avatar decorative size="large" src={src} fallbackText={initials} />
      {onReplace ? <Button onPress={onReplace}>{words.changePicture}</Button> : null}
    </div>
  )
}

/** Draws one item by its type. */
export function ItemControl({ item }: { item: SettingsItem }) {
  switch (item.type) {
    case 'entry':
      return <Entry item={item} />
    case 'toggle':
      return <Switch label={item.caption} description={item.help} isSelected={item.on} onChange={item.onFlip} />
    case 'pick':
      return <Pick item={item} />
    case 'language':
      return <NativeSelect label={item.caption} value={item.chosen} options={item.answers.map((a) => ({ value: a.id, label: a.caption }))} onChange={item.onPick} />
    case 'portrait':
      return <Portrait src={item.src} initials={item.initials} onReplace={item.onReplace} />
    case 'passphrase':
      return <Passphrase item={item} />
  }
}
