// What a settings page is made of (spec: wave-2/settings-dialog.md, renamed in
// implementation). A page is a heading plus an ordered list of items; each
// item's `type` picks its control, so any page can mix entries, toggles,
// picks, the language, the portrait and the passphrase change.
//
// The item kinds are one table (`ItemFields`, kind → its own fields); every
// item type and the union are derived from it, so adding a kind is one entry.
import type { ReactNode } from 'react'

/** `R` required, `O` optional. */
type Fields<R, O = unknown> = R & { [K in keyof O]?: O[K] }
declare const entryFormats: readonly ['plain', 'mail', 'secret', 'link', 'paragraph']
declare const passphraseSlots: readonly ['old', 'fresh', 'again', 'save']

/** Input flavour of a text entry. */
export type EntryFormat = (typeof entryFormats)[number]

/** One possible answer of a pick or of the language list. */
export type Answer = Fields<{ id: string; caption: string }, { help: string }>

/** Optional captions of the passphrase form. */
export type PassphraseCaptions = { [Slot in (typeof passphraseSlots)[number]]?: string }

/** Several answers, one chosen, reported by id (or language tag). */
type Choosing = { caption: string; chosen: string; answers: Answer[]; onPick: (id: string) => void }

interface ItemFields {
  /** A line of text to edit, or to read and copy (`locked`, `copy`). */
  entry: Fields<
    { caption: string; text: string },
    { help: string; onText: (next: string) => void; format: EntryFormat; locked: boolean; copy: boolean; example: string }
  >
  /** An on/off switch. */
  toggle: Fields<{ caption: string; on: boolean; onFlip: (on: boolean) => void }, { help: string }>
  /** One answer out of several, as a plain list or as cards. */
  pick: Fields<Choosing, { look: 'list' | 'cards' }>
  /** The interface language. */
  language: Choosing
  /** The person's picture, with an optional "change" action. */
  portrait: Fields<{ initials: string }, { src: string; onReplace: () => void }>
  /** Password change; the two new values are compared before `onSave` runs. */
  passphrase: Fields<{ onSave: (old: string, fresh: string, again: string) => void }, { captions: PassphraseCaptions }>
}

type Kind = keyof ItemFields
/** Item of one kind: its discriminant, a stable `id` (also the entry's form name) and its fields. */
type ItemOf<K extends Kind> = { type: K; id: string } & ItemFields[K]

export type EntryItem = ItemOf<'entry'>
export type ToggleItem = ItemOf<'toggle'>
export type PickItem = ItemOf<'pick'>
export type LanguageItem = ItemOf<'language'>
export type PortraitItem = ItemOf<'portrait'>
export type PassphraseItem = ItemOf<'passphrase'>

/** Any item: the union of every kind in the table. */
export type SettingsItem = { [K in Kind]: ItemOf<K> }[Kind]

/** Content of one page of the dialog. */
export type SettingsPage = Fields<{ heading: string; items: SettingsItem[] }, { lead: string }>

/** Shown instead of the pages when the page asked for is not open to this person. */
export type LockedNotice = Fields<{ heading: string; reason: string }, { glyph: ReactNode }>
