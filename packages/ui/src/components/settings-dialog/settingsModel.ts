// What a settings page is made of (spec: wave-2/settings-dialog.md, renamed in
// implementation). A page is a heading plus an ordered list of items; each item
// says which kind of control it is through its `type`, so the dialog draws any
// mix of entries, toggles, picks, language, portrait and passphrase change on
// any page, not only on fixed "profile / workspace / preferences" ids.
import type { ReactNode } from 'react'

/** Input flavour of a text entry. */
export type EntryFormat = 'plain' | 'mail' | 'secret' | 'link' | 'paragraph'

interface ItemBase {
  /** Stable key inside the page; also the form name of entries. */
  id: string
}

/** A line of text the person may edit, or read and copy. */
export interface EntryItem extends ItemBase {
  type: 'entry'
  caption: string
  help?: string
  text: string
  onText?: (next: string) => void
  format?: EntryFormat
  /** Read only. */
  locked?: boolean
  /** Offers a copy button (announced as "Copied"). */
  copy?: boolean
  example?: string
}

/** An on/off switch. */
export interface ToggleItem extends ItemBase {
  type: 'toggle'
  caption: string
  help?: string
  on: boolean
  onFlip: (on: boolean) => void
}

export interface Answer {
  id: string
  caption: string
  help?: string
}

/** One answer out of several, as a plain list or as cards. */
export interface PickItem extends ItemBase {
  type: 'pick'
  caption: string
  look?: 'list' | 'cards'
  chosen: string
  answers: Answer[]
  onPick: (answerId: string) => void
}

/** The interface language. */
export interface LanguageItem extends ItemBase {
  type: 'language'
  caption: string
  chosen: string
  answers: Answer[]
  onPick: (tag: string) => void
}

/** The person's picture with an optional "change" action. */
export interface PortraitItem extends ItemBase {
  type: 'portrait'
  src?: string
  initials: string
  onReplace?: () => void
}

export type PassphraseCaptions = Partial<Record<'old' | 'fresh' | 'again' | 'save', string>>

/** Change of password; the two new values are compared before `onSave` runs. */
export interface PassphraseItem extends ItemBase {
  type: 'passphrase'
  captions?: PassphraseCaptions
  onSave: (old: string, fresh: string, again: string) => void
}

export type SettingsItem = EntryItem | ToggleItem | PickItem | LanguageItem | PortraitItem | PassphraseItem

/** Content of one page of the dialog. */
export interface SettingsPage {
  heading: string
  lead?: string
  items: SettingsItem[]
}

/** Shown instead of the pages when the requested page is not open to this person. */
export interface LockedNotice {
  heading: string
  reason: string
  glyph?: ReactNode
}
