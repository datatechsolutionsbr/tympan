// Gallery section for the "forms-a" group: choices, filters, switches and codes.
import { Bot, Coins, Cpu, Flag, Globe, Languages, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import {
  ChipGroup,
  ChoiceCard,
  ChoiceCardGroup,
  ChoiceGrid,
  ChoiceTile,
  FilterChips,
  FilterField,
  FilterTile,
  FilterTileGrid,
  FilterTileGroupHeading,
  FlagSetPicker,
  OneTimeCodeField,
  PasswordStrength,
  SearchBar,
  StateSwitch,
  Tag,
  ThemeSwitcher,
  type ActiveFilter,
  type ChipItem,
  type FlagSet,
} from '../../../src'
import { Section } from '../Section'

const startFilters: ActiveFilter[] = [
  { kind: 'country', value: 'br', label: 'Brazil', tone: 2 },
  { kind: 'stage', value: '4', label: 'Stage 4' },
  { kind: 'year', value: '2024', label: '2024' },
]

export function FormsAShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-fa-${s}`
  const [mode, setMode] = useState<'light' | 'dark'>(scope === 'dark' ? 'dark' : 'light')
  const [active, setActive] = useState(true)
  const [code, setCode] = useState('12')
  const [password, setPassword] = useState('abcdefg1')
  const [query, setQuery] = useState('tamm')
  const [filters, setFilters] = useState(startFilters)
  const [dialog, setDialog] = useState(false)
  const [filterText, setFilterText] = useState('ana')
  const [tiles, setTiles] = useState<Set<string>>(new Set(['br']))
  const [model, setModel] = useState('b')
  const [cardOn, setCardOn] = useState(true)
  const [tile, setTile] = useState('pt')
  const [currency, setCurrency] = useState('BRL')
  const [items, setItems] = useState<ChipItem[]>([
    { id: 'pt', name: 'Portuguese', code: 'pt' },
    { id: 'et', name: 'Estonian', code: 'et', marker: 3 },
    { id: 'en', name: 'English', code: 'en' },
  ])
  const [chips, setChips] = useState(['pt'])
  const [flags, setFlags] = useState<FlagSet>({ cite: true, review: false, freeze: false })
  const [preset, setPreset] = useState<string | null>(null)

  const toggleTile = (key: string) =>
    setTiles((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <div className="fk-gallery-showcase">
      <Section id={id('switches')} title="ThemeSwitcher, StateSwitch">
        <div className="fk-gallery-row">
          <ThemeSwitcher mode={mode} onModeChange={setMode} />
          <ThemeSwitcher mode={mode} variant="compact" onModeChange={setMode} />
          <StateSwitch label="Agent status" checked={active} onCheckedChange={setActive} />
          <StateSwitch label="Saving status" checked={false} onCheckedChange={() => {}} pending />
        </div>
      </Section>

      <Section id={id('otc')} title="OneTimeCodeField, PasswordStrength">
        <OneTimeCodeField value={code} onChange={setCode} />
        <OneTimeCodeField label="Recovery code" value="12345" onChange={() => {}} errorText="The code expired. Ask for a new one." />
        <label className="fk-gallery-stack">
          <span>New password (demo input)</span>
          <input className="fk-gallery-native-input" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={id('pw')} />
        </label>
        <PasswordStrength id={id('pw')} password={password} showRequirements policy={{ symbol: true }} />
      </Section>

      <Section id={id('search')} title="SearchBar, FilterField, FilterChips">
        <SearchBar
          label={`Search cases (${scope})`}
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          kindIcons={{ country: MapPin }}
          onRemoveFilter={(f) => setFilters((all) => all.filter((x) => x !== f))}
          onClearAll={() => {
            setQuery('')
            setFilters([])
          }}
          filterDialog={{
            open: dialog,
            onOpenChange: setDialog,
            activeCount: filters.length,
            onClear: () => setFilters([]),
            context: { icon: <Globe size={16} />, label: 'Catalogue', countText: '94 cases' },
            content: <p>Filter controls supplied by the host.</p>,
          }}
        />
        <FilterField label="Filter members" value={filterText} onChange={setFilterText} resultCountText={`${filterText ? 2 : 14} results`} />
        <FilterChips filters={startFilters} kindIcons={{ country: MapPin }} onRemove={() => {}} onClearAll={() => {}} groupLabel={`Applied filters (${scope})`} />
      </Section>

      <Section id={id('tiles')} title="FilterTile, ChoiceTile">
        <FilterTileGroupHeading label="Countries" icon={<Globe />} />
        <FilterTileGrid label={`Country filters (${scope})`}>
          <FilterTile selected={tiles.has('br')} onToggle={() => toggleTile('br')} label="Brazil" detail="42 records" icon={<Flag />} tone={2} />
          <FilterTile selected={tiles.has('ee')} onToggle={() => toggleTile('ee')} label="Estonia" detail="7 records" icon={<Flag />} tone={5} />
          <FilterTile selected={tiles.has('uk')} onToggle={() => toggleTile('uk')} label="United Kingdom" detail="12 records" icon={<Flag />} iconSurface="neutral" />
          <FilterTile selected={false} onToggle={() => {}} label="Unavailable" detail="0 records" icon={<Flag />} disabled />
        </FilterTileGrid>
        <div className="fk-gallery-row">
          {[
            ['pt', 'Português'],
            ['et', 'Eesti'],
            ['en', 'English'],
          ].map(([key, text]) => (
            <ChoiceTile key={key} shape="pill" selected={tile === key} onPress={() => setTile(key!)}>
              {text}
            </ChoiceTile>
          ))}
          <ChoiceTile selected={false} label="Languages" shape="card">
            <Languages aria-hidden="true" />
          </ChoiceTile>
        </div>
      </Section>

      <Section id={id('cards')} title="ChoiceCard, ChoiceGrid">
        <ChoiceCardGroup label="Model" value={model} onChange={setModel}>
          <ChoiceCard value="a" label="Small" icon={<Cpu />} description="Fast answers" />
          <ChoiceCard value="b" label="Medium" icon={<Bot />} trailing={<Tag size="small" tone="accent">recommended</Tag>} />
          <ChoiceCard value="c" label="Large" icon={<Sparkles />} available={false} unavailableReason="Not offered by this provider" />
        </ChoiceCardGroup>
        <ChoiceCard selected={cardOn} onSelect={() => setCardOn((v) => !v)} label="Web search tool" description="Lets the agent open public pages." arrangement="inline" icon={<Globe />} />
        <ChoiceGrid
          title="Currency"
          icon={Coins}
          columns={3}
          value={currency}
          onChange={setCurrency}
          options={[
            { value: 'BRL', symbol: '🇧🇷', label: 'Real' },
            { value: 'USD', symbol: '🇺🇸', label: 'Dollar' },
            { value: 'EUR', symbol: '🇪🇺', label: 'Euro' },
          ]}
        />
      </Section>

      <Section id={id('chips')} title="ChipGroup, FlagSetPicker">
        <ChipGroup label="Languages" items={items} selectedIds={chips} onSelectionChange={setChips} allowCustom onItemsChange={setItems} />
        <FlagSetPicker
          label="Review rules"
          labels={{ cite: 'Cite sources', review: 'Require a second reviewer', freeze: 'Freeze on publish' }}
          descriptions={{ cite: 'Every value links to a retrieval.' }}
          values={flags}
          onChange={setFlags}
          presets={[
            { id: 'strict', label: 'Strict', description: 'Everything on', values: { cite: true, review: true, freeze: true } },
            { id: 'light', label: 'Light', description: 'Only citations', values: { cite: true, review: false, freeze: false } },
          ]}
          presetId={preset}
          onPresetChange={setPreset}
        />
      </Section>
    </div>
  )
}
