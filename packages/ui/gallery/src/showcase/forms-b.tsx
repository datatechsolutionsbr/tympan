// Gallery section for the "forms-b" group: pickers, tag entry, money,
// images, schema-driven requests and form layout.
import { FileText } from 'lucide-react'
import { useState } from 'react'
import {
  CategoryLabel,
  CategoryTabs,
  CurrencyField,
  DateField,
  FieldGrid,
  FieldGridItem,
  FormActions,
  FormSection,
  FramedForm,
  ImagePicker,
  InlineRow,
  LocalePicker,
  MonthField,
  SchemaRequestForm,
  TagField,
  TextField,
  TimeField,
  WheelPicker,
  WheelPickerGroup,
  Button,
  type TimeOfDay,
} from '../../../src'
import { Section } from '../Section'

const categories = [
  { key: 'ce', code: 'CE', name: 'CE Centro', marker: 1 as const },
  { key: 'hb', code: 'HB', name: 'HB Harbour', marker: 3 as const },
  { key: 'pk', code: 'PK', name: 'PK Park', marker: 5 as const },
  { key: 'no', code: 'NO', name: 'NO North', marker: 7 as const },
]
const locales = [
  { code: 'pt-BR', nativeName: 'Português', shortCode: 'PT' },
  { code: 'en', nativeName: 'English', shortCode: 'EN' },
  { code: 'es', nativeName: 'Español', shortCode: 'ES' },
]
const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-06', '2026-09']
const hours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))

export function FormsBShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-fb-${s}`
  const [category, setCategory] = useState<string | null>('ce')
  const [tags, setTags] = useState(['x-request-id', 'accept'])
  const [langs, setLangs] = useState(['pt'])
  const [amount, setAmount] = useState('1500000.5')
  const [date, setDate] = useState<Date | null>(new Date(2026, 8, 20))
  const [time, setTime] = useState<TimeOfDay | null>({ hours: 9, minutes: 5 })
  const [month, setMonth] = useState('2026-03')
  const [hour, setHour] = useState('09')
  const [day, setDay] = useState('20')
  const [mon, setMon] = useState('Sep')
  const [locale, setLocale] = useState('pt-BR')

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('category')} title="CategoryTabs, CategoryLabel">
        <CategoryTabs label={`Station (${scope})`} items={categories} selected={category} onSelect={setCategory} allowNone />
        <div className="ty-gallery-row">
          <CategoryLabel code="CE" name="Centro" marker={1} />
          <CategoryLabel code="HB" name="Harbour" marker={3} size="small" />
        </div>
      </Section>

      <Section id={id('tags')} title="TagField">
        <TagField label="Headers to keep" value={tags} onChange={setTags} helperText="Enter or comma adds a value." placeholder="Header name" />
        <TagField
          label="Languages"
          value={langs}
          onChange={setLangs}
          suggestions={['pt', 'en', 'es', 'fr']}
          suggestionLabels={{ pt: 'Português', en: 'English', es: 'Español', fr: 'Français' }}
          allowFreeText={false}
          tone="accent"
          max={3}
        />
        <TagField label="Codes" value={['a1']} onChange={() => {}} errorText="Use at least two codes." tone={4} />
      </Section>

      <Section id={id('currency')} title="CurrencyField">
        <CurrencyField label="Sensor budget" value={amount} onValueChange={setAmount} currency="BRL" locale="pt-BR" hint="Total for the monitoring network." />
        <CurrencyField label="Daily readings" value="1460" decimals={0} size="display" />
        <CurrencyField label="Fee" value="" currency="EUR" locale="en-US" error="Enter the fee." size="small" />
      </Section>

      <Section id={id('dates')} title="DateField, TimeField, MonthField">
        <FieldGrid>
          <FieldGridItem>
            <DateField label="Read on" value={date} onChange={setDate} disallowFuture hint="The day the station file was opened." />
          </FieldGridItem>
          <FieldGridItem>
            <TimeField label="Read at" value={time} onChange={setTime} referenceDate={date} disallowFuture />
          </FieldGridItem>
          <FieldGridItem>
            <DateField label="Installed on" value={null} onChange={() => {}} errorText="Choose a date." />
          </FieldGridItem>
          <FieldGridItem>
            <TimeField label="Freeze time" value={null} onChange={() => {}} disabled />
          </FieldGridItem>
        </FieldGrid>
        <div className="ty-gallery-row">
          <MonthField label="Reporting period" value={month} onChange={setMonth} availableMonths={months} />
          <MonthField label="Empty period" value="" onChange={() => {}} availableMonths={months} />
        </div>
      </Section>

      <Section id={id('wheel')} title="WheelPicker, WheelPickerGroup">
        <div className="ty-gallery-row">
          <WheelPicker label="Hour" options={hours} value={hour} onChange={setHour} showLabel />
          <WheelPickerGroup
            label="Freeze date"
            columns={[
              { label: 'Day', options: Array.from({ length: 30 }, (_, d) => String(d + 1)), value: day, onChange: setDay },
              { label: 'Month', options: ['Jul', 'Aug', 'Sep', 'Oct'], value: mon, onChange: setMon, share: 2 },
            ]}
          />
        </div>
      </Section>

      <Section id={id('locale')} title="LocalePicker">
        <div className="ty-gallery-row">
          <LocalePicker locales={locales} value={locale} onChange={setLocale} />
          <LocalePicker locales={locales} value={locale} onChange={setLocale} presentation="dialog" title="Idioma" />
        </div>
      </Section>

      <Section id={id('image')} title="ImagePicker">
        <div className="ty-gallery-row">
          <ImagePicker fallbackText="MD" label="Change profile picture" upload={async () => ({ ok: true, key: 'k1' })} hint="JPEG, PNG or WebP up to 5 MiB." />
          <ImagePicker fallbackText="EL" shape="rounded" size="md" label="Change organisation logo" upload={async () => ({ ok: false, error: 'Upload refused' })} droppable />
          <ImagePicker fallbackText="AG" size="md" label="Change agent picture" upload={async () => ({ ok: true })} disabled />
        </div>
      </Section>

      <Section id={id('request')} title="SchemaRequestForm">
        <SchemaRequestForm
          runId="run-2026-09-20"
          request={{
            stepId: 'verify-reading',
            prompt: 'Does the raw station file confirm the daily PM2.5 mean?',
            description: 'Centro station, Vila Aurora, 14 July. Value in the edition: 38 µg/m³.',
            fields: [
              { key: 'verdict', kind: 'choice', label: 'Verdict', required: true, options: [{ value: 'proved', label: 'Yes, proved' }, { value: 'refuted', label: 'No, refuted' }, { value: 'not_disclosed', label: 'The file does not say' }] },
              { key: 'excerpt', kind: 'longText', label: 'Line that proves it', rows: 2 },
              { key: 'page', kind: 'number', label: 'Row', min: 1 },
              { key: 'opened', kind: 'boolean', label: 'I opened the station file', required: true },
            ],
            submitLabel: 'Save and continue',
          }}
          submit={() => new Promise((r) => setTimeout(r, 600))}
        />
      </Section>

      <Section id={id('layout')} title="FramedForm, FormSection, FieldGrid, InlineRow, FormActions">
        <FramedForm title="New collection session" subtitle="Where the collection began." icon={<FileText />} submitLabel="Create session" cancelLabel="Cancel" onCancel={() => {}} onSubmit={() => {}}>
          <FormSection title="Identification" description="How the session appears in the trail.">
            <FieldGrid>
              <FieldGridItem>
                <TextField label="Name" defaultValue="Winter readings, port district" />
              </FieldGridItem>
              <FieldGridItem>
                <TextField label="Stations" defaultValue="Harbour, Riverside" />
              </FieldGridItem>
              <FieldGridItem span="full">
                <TextField label="Goal" defaultValue="Import the hourly PM2.5 and NO₂ files of every station." />
              </FieldGridItem>
            </FieldGrid>
          </FormSection>
          <FormSection title="Search">
            <InlineRow>
              <TextField label="First query" defaultValue="pm25 hourly 2026-07" />
              <Button>Try it</Button>
            </InlineRow>
          </FormSection>
        </FramedForm>
        <FormActions cancelLabel="Keep edition" saveLabel="Delete edition" onCancel={() => {}} onSave={() => {}} emphasis="destructive" />
        <FormActions cancelLabel="Cancel" saveLabel="Saving" onCancel={() => {}} onSave={() => {}} saving />
      </Section>
    </div>
  )
}
