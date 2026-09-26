// The editor's keyboard map, kept as data so the shortcut panel, tool tips and
// the listener read the same list. "Mod" is Command on Apple platforms and
// Control elsewhere.

export type EditorAction =
  | 'escape'
  | 'selectTool'
  | 'panTool'
  | 'toggleGrid'
  | 'toggleMinimap'
  | 'zoom100'
  | 'zoom50'
  | 'group'
  | 'ungroup'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'duplicate'
  | 'fit'
  | 'zoomOut'
  | 'zoomIn'
  | 'delete'

export interface KeyBinding {
  action: EditorAction
  /** Display chords, e.g. "Mod+Shift+Z". */
  chords: string[]
  /** A bare character key (WCAG 2.1.4: only while the canvas has focus, host can turn off). */
  singleKey?: boolean
}

export const editorKeyMap: readonly KeyBinding[] = Object.freeze([
  { action: 'escape', chords: ['Escape'] },
  { action: 'selectTool', chords: ['V'], singleKey: true },
  { action: 'panTool', chords: ['H'], singleKey: true },
  { action: 'toggleGrid', chords: ['G'], singleKey: true },
  { action: 'toggleMinimap', chords: ['M'], singleKey: true },
  { action: 'zoom100', chords: ['Shift+1'] },
  { action: 'zoom50', chords: ['Shift+5'] },
  { action: 'group', chords: ['Mod+G'] },
  { action: 'ungroup', chords: ['Mod+Shift+G'] },
  { action: 'undo', chords: ['Mod+Z'] },
  { action: 'redo', chords: ['Mod+Shift+Z', 'Mod+Y'] },
  { action: 'copy', chords: ['Mod+C'] },
  { action: 'paste', chords: ['Mod+V'] },
  { action: 'selectAll', chords: ['Mod+A'] },
  { action: 'duplicate', chords: ['Mod+D'] },
  { action: 'fit', chords: ['Mod+1', 'Mod+Shift+F'] },
  { action: 'zoomOut', chords: ['Mod+-'] },
  { action: 'zoomIn', chords: ['Mod+=', 'Mod++'] },
  { action: 'delete', chords: ['Delete', 'Backspace'] },
])

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? ''
  return /mac|iphone|ipad|ipod/i.test(p)
}

/** Physical digit keys under Shift (Shift+1 reads "!" on many layouts). */
function keyName(e: KeyboardEvent): string {
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5)
  if (e.key === '+' || e.key === '=' || e.code === 'Equal') return e.key === '+' ? '+' : '='
  if (e.key === '-' || e.code === 'Minus') return '-'
  return e.key.length === 1 ? e.key.toUpperCase() : e.key
}

/** The chord of a keyboard event in the map's notation. */
export function chordOf(e: KeyboardEvent, apple = isApplePlatform()): string {
  const mod = apple ? e.metaKey : e.ctrlKey
  const parts: string[] = []
  if (mod) parts.push('Mod')
  if (e.shiftKey && e.key !== 'Shift') parts.push('Shift')
  parts.push(keyName(e))
  return parts.join('+')
}

/** Binding matched by an event, or undefined. */
export function matchBinding(e: KeyboardEvent, apple = isApplePlatform()): KeyBinding | undefined {
  if (e.altKey) return undefined
  const chord = chordOf(e, apple)
  // "Mod++" arrives as Shift+= on most layouts.
  const alt = chord === 'Mod+Shift+=' ? 'Mod+=' : chord
  return editorKeyMap.find((b) => b.chords.includes(chord) || b.chords.includes(alt))
}

/** aria-keyshortcuts value for a binding (Mod resolved for the platform). */
export function ariaShortcut(action: EditorAction, apple = isApplePlatform()): string {
  const b = editorKeyMap.find((k) => k.action === action)
  return b ? b.chords.map((c) => c.replace('Mod', apple ? 'Meta' : 'Control')).join(' ') : ''
}
