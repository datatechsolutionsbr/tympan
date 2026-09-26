// Icon registry: catalog icon keys (kebab-case lucide names) → components.
// Unknown keys resolve to a neutral generic glyph (design direction §4.4).

import {
  BookOpen,
  Bot,
  Box,
  Braces,
  ChartColumn,
  ClipboardCheck,
  Code,
  Database,
  Dices,
  FileChartColumn,
  FileSearch,
  FileText,
  Fingerprint,
  Flag,
  GitBranch,
  Group,
  Landmark,
  Library,
  MessageSquare,
  Newspaper,
  Play,
  Quote,
  Repeat,
  Scale,
  ScrollText,
  Search,
  Split,
  SquareFunction,
  StickyNote,
  Target,
  Workflow,
} from 'lucide-react'
import type { IconComponent } from '@fakhir/design-system'

export const GENERIC_ICON: IconComponent = Box

const builtIn: Record<string, IconComponent> = {
  play: Play,
  flag: Flag,
  'git-branch': GitBranch,
  split: Split,
  code: Code,
  braces: Braces,
  'square-function': SquareFunction,
  repeat: Repeat,
  bot: Bot,
  'message-square': MessageSquare,
  'file-chart-column': FileChartColumn,
  'chart-column': ChartColumn,
  database: Database,
  'sticky-note': StickyNote,
  group: Group,
  dices: Dices,
  scale: Scale,
  target: Target,
  workflow: Workflow,
  // Provenance kinds.
  search: Search,
  fingerprint: Fingerprint,
  'file-search': FileSearch,
  'file-text': FileText,
  quote: Quote,
  'clipboard-check': ClipboardCheck,
  'book-open': BookOpen,
  library: Library,
  newspaper: Newspaper,
  'scroll-text': ScrollText,
  landmark: Landmark,
  box: Box,
}

let registry = new Map<string, IconComponent>(Object.entries(builtIn))

/** Adds or replaces icons (host icons for its own kinds). */
export function registerIcons(map: Record<string, IconComponent>): void {
  registry = new Map([...registry, ...Object.entries(map)])
}

export function resolveIcon(key: string | undefined | null): IconComponent {
  return (key && registry.get(key)) || GENERIC_ICON
}

/** Default icon key per kind when the catalog is not loaded. */
export const FALLBACK_KIND_ICONS: Readonly<Record<string, string>> = Object.freeze({
  start: 'play',
  end: 'flag',
  'if-else': 'git-branch',
  branch: 'git-branch',
  switch: 'split',
  code: 'code',
  compute: 'square-function',
  iteration: 'repeat',
  loop: 'repeat',
  simulation: 'dices',
  agent: 'bot',
  answer: 'message-square',
  rule: 'scale',
  decision: 'target',
  'report-output': 'file-chart-column',
  datasource: 'database',
  note: 'sticky-note',
  group: 'group',
  query: 'search',
  retrieval: 'fingerprint',
  source: 'file-text',
  assertion: 'quote',
  record: 'clipboard-check',
  analysis: 'chart-column',
  edition: 'library',
  manuscript: 'scroll-text',
  verification: 'scale',
})
