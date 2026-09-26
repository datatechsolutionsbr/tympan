// Per-script typography (`:lang()` overrides). Tympan serves the humanities and
// the exact sciences in any language, so the base stacks (IBM Plex / Source
// Serif with Noto fallbacks) are adapted per writing system:
//  - the script's Noto family is moved to the front (CJK needs the right
//    regional glyph set; Arabic and Indic need their shaping fonts first);
//  - letter-spacing is removed where it breaks joining or reads badly
//    (Arabic, Indic, Thai, CJK) and uppercase eyebrows lose their meaning;
//  - line heights grow for scripts with tall stacks or marks;
//  - line breaking follows the script (CJK strict, Thai by dictionary).
import type { VarList } from './stylesheet.ts'

interface ScriptRule {
  /** BCP 47 language tags matched with :lang(). */
  langs: string[]
  sans: string[]
  serif?: string[]
  /** Line-height multiplier applied to every --ty-font-line-height-* token. */
  leading?: number
  /** Letter-spacing off (tracking tokens set to 0). */
  noTracking?: boolean
  /** Extra declarations for the element itself. */
  text?: string[]
}

export const SCRIPT_RULES: ScriptRule[] = [
  { langs: ['ar', 'fa', 'ur', 'ps', 'ckb', 'sd', 'ug'], sans: ['Noto Sans Arabic', 'Noto Naskh Arabic'], serif: ['Noto Naskh Arabic'], leading: 1.2, noTracking: true },
  { langs: ['he', 'yi'], sans: ['Noto Sans Hebrew'], serif: ['Noto Serif Hebrew'], leading: 1.1, noTracking: true },
  { langs: ['hi', 'mr', 'ne', 'sa', 'kok', 'mai'], sans: ['Noto Sans Devanagari'], serif: ['Noto Serif Devanagari'], leading: 1.25, noTracking: true },
  { langs: ['bn', 'as'], sans: ['Noto Sans Bengali'], serif: ['Noto Serif Bengali'], leading: 1.25, noTracking: true },
  { langs: ['ta'], sans: ['Noto Sans Tamil'], serif: ['Noto Serif Tamil'], leading: 1.25, noTracking: true },
  { langs: ['te'], sans: ['Noto Sans Telugu'], leading: 1.25, noTracking: true },
  { langs: ['kn'], sans: ['Noto Sans Kannada'], leading: 1.25, noTracking: true },
  { langs: ['ml'], sans: ['Noto Sans Malayalam'], leading: 1.25, noTracking: true },
  { langs: ['gu'], sans: ['Noto Sans Gujarati'], leading: 1.25, noTracking: true },
  { langs: ['pa'], sans: ['Noto Sans Gurmukhi'], leading: 1.25, noTracking: true },
  { langs: ['si'], sans: ['Noto Sans Sinhala'], leading: 1.25, noTracking: true },
  { langs: ['th'], sans: ['Noto Sans Thai'], serif: ['Noto Serif Thai'], leading: 1.25, noTracking: true, text: ['word-break: normal;', 'line-break: auto;'] },
  { langs: ['lo'], sans: ['Noto Sans Lao'], leading: 1.25, noTracking: true },
  { langs: ['km'], sans: ['Noto Sans Khmer'], leading: 1.25, noTracking: true },
  { langs: ['my'], sans: ['Noto Sans Myanmar'], leading: 1.35, noTracking: true },
  { langs: ['am', 'ti', 'gez'], sans: ['Noto Sans Ethiopic'], serif: ['Noto Serif Ethiopic'], leading: 1.15, noTracking: true },
  { langs: ['hy'], sans: ['Noto Sans Armenian'] },
  { langs: ['ka'], sans: ['Noto Sans Georgian'] },
  { langs: ['ja'], sans: ['Noto Sans JP'], serif: ['Noto Serif JP'], leading: 1.15, noTracking: true, text: ['line-break: strict;', 'word-break: normal;', 'overflow-wrap: anywhere;'] },
  { langs: ['zh', 'zh-Hans', 'zh-CN', 'zh-SG'], sans: ['Noto Sans SC'], serif: ['Noto Serif SC'], leading: 1.15, noTracking: true, text: ['line-break: strict;', 'word-break: normal;', 'overflow-wrap: anywhere;'] },
  { langs: ['zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO'], sans: ['Noto Sans TC'], serif: ['Noto Serif TC'], leading: 1.15, noTracking: true, text: ['line-break: strict;', 'word-break: normal;', 'overflow-wrap: anywhere;'] },
  { langs: ['ko'], sans: ['Noto Sans KR'], serif: ['Noto Serif KR'], leading: 1.15, noTracking: true, text: ['word-break: keep-all;', 'overflow-wrap: anywhere;'] },
]

const quote = (family: string) => (/^[\w-]+$/.test(family) && !/\s/.test(family) ? family : `"${family}"`)

function scaledPx(value: string, factor: number): string {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(value.trim())
  if (!m) return value
  // Round up to an even pixel so text keeps sitting on the 4 px rhythm's half-steps.
  return `${Math.ceil((Number(m[1]) * factor) / 2) * 2}px`
}

/** The `:lang()` blocks, derived from the base token values. */
export function scriptRules(base: VarList): string {
  const value = (name: string) => base.find(([n]) => n === name)?.[1] ?? ''
  const sansBase = value('--ty-font-sans')
  const serifBase = value('--ty-font-serif')
  const leadings = base.filter(([n]) => n.startsWith('--ty-font-line-height-'))
  const trackings = base.filter(([n]) => n.startsWith('--ty-font-tracking-'))
  return SCRIPT_RULES.map((r) => {
    const decls: string[] = [`--ty-font-sans: ${r.sans.map(quote).join(', ')}, ${sansBase};`]
    if (r.serif) decls.push(`--ty-font-serif: ${r.serif.map(quote).join(', ')}, ${serifBase};`)
    if (r.leading) for (const [n, v] of leadings) decls.push(`${n}: ${scaledPx(v, r.leading)};`)
    if (r.noTracking) for (const [n] of trackings) decls.push(`${n}: 0em;`)
    decls.push(...(r.text ?? []))
    const selectors = r.langs.map((l) => `:lang(${l})`).join(',\n')
    return `${selectors} {\n${decls.map((d) => `  ${d}`).join('\n')}\n}`
  }).join('\n\n')
}
