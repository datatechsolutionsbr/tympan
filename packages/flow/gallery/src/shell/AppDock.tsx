// The app dock of the shell (search, assistant, notifications | theme,
// language). In the gallery the last two switch the theme and the language.

import { Bell, Bot, Languages, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '@fakhir/design-system'

const WORDS: Record<string, Record<string, string>> = {
  'pt-BR': { dock: 'Atalhos', search: 'Buscar', assistant: 'Assistente', alerts: 'Notificações', theme: 'Alternar tema', language: 'Idioma' },
  en: { dock: 'Shortcuts', search: 'Search', assistant: 'Assistant', alerts: 'Notifications', theme: 'Switch theme', language: 'Language' },
}

export function AppDock({ locale, onNextLocale }: { locale: string; onNextLocale: () => void }) {
  const w = WORDS[locale] ?? WORDS.en!
  const theme = useTheme()
  const dark = theme.resolvedMode === 'dark'
  return (
    <div className="fk-app-dock" role="toolbar" aria-label={w.dock}>
      <button type="button" className="fk-app-dock__item" aria-label={w.search}>
        <Search aria-hidden="true" />
      </button>
      <button type="button" className="fk-app-dock__item" aria-label={w.assistant}>
        <Bot aria-hidden="true" />
      </button>
      <button type="button" className="fk-app-dock__item" aria-label={w.alerts}>
        <Bell aria-hidden="true" />
      </button>
      <span className="fk-app-dock__rule" aria-hidden="true" />
      <button type="button" className="fk-app-dock__item" aria-label={w.theme} aria-pressed={dark} onClick={() => theme.setMode(dark ? 'light' : 'dark')}>
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>
      <button type="button" className="fk-app-dock__item" aria-label={`${w.language}: ${locale}`} onClick={onNextLocale}>
        <Languages aria-hidden="true" />
      </button>
    </div>
  )
}
