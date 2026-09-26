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
  { key: 'br', code: 'BR', name: 'BR Brasil', marker: 1 as const },
  { key: 'ee', code: 'EE', name: 'EE Estonia', marker: 3 as const },
  { key: 'uk', code: 'UK', name: 'UK United Kingdom', marker: 5 as const },
  { key: 'ae', code: 'AE', name: 'AE Country A', marker: 7 as const },
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
  const [category, setCategory] = useState<string | null>('br')
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
        <CategoryTabs label={`Country (${scope})`} items={categories} selected={category} onSelect={setCategory} allowNone />
        <div className="ty-gallery-row">
          <CategoryLabel code="BR" name="Brasil" marker={1} />
          <CategoryLabel code="EE" name="Estonia" marker={3} size="small" />
        </div>
      </Section>

      <Section id={id('tags')} title="TagField">
        <TagField label="Headers to keep" value={tags} onChange={setTags} helperText="Enter or comma adds a value." placeholder="Header name" />
        <TagField
          label="Languages"
          value={langs}
          onChange={setLangs}
          suggestions={['pt', 'en', 'es', 'et']}
          suggestionLabels={{ pt: 'Português', en: 'English', es: 'Español', et: 'Eesti' }}
          allowFreeText={false}
          tone="accent"
          max={3}
        />
        <TagField label="Codes" value={['a1']} onChange={() => {}} errorText="Use at least two codes." tone={4} />
      </Section>

      <Section id={id('currency')} title="CurrencyField">
        <CurrencyField label="Budget" value={amount} onValueChange={setAmount} currency="BRL" locale="pt-BR" hint="Total for the edition." />
        <CurrencyField label="Records" value="94" decimals={0} size="display" />
        <CurrencyField label="Fee" value="" currency="EUR" locale="en-US" error="Enter the fee." size="small" />
      </Section>

      <Section id={id('dates')} title="DateField, TimeField, MonthField">
        <FieldGrid>
          <FieldGridItem>
            <DateField label="Retrieved on" value={date} onChange={setDate} disallowFuture hint="The day the page was opened." />
          </FieldGridItem>
          <FieldGridItem>
            <TimeField label="Retrieved at" value={time} onChange={setTime} referenceDate={date} disallowFuture />
          </FieldGridItem>
          <FieldGridItem>
            <DateField label="Launch" value={null} onChange={() => {}} errorText="Choose a date." />
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
          <ImagePicker fallbackText="NM" label="Change profile picture" upload={async () => ({ ok: true, key: 'k1' })} hint="JPEG, PNG or WebP up to 5 MiB." />
          <ImagePicker fallbackText="EA" shape="rounded" size="md" label="Change organisation logo" upload={async () => ({ ok: false, error: 'Upload refused' })} droppable />
          <ImagePicker fallbackText="AG" size="md" label="Change agent picture" upload={async () => ({ ok: true })} disabled />
        </div>
      </Section>

      <Section id={id('request')} title="SchemaRequestForm">
        <SchemaRequestForm
          runId="run-2026-09-20"
          request={{
            stepId: 'verify-launch',
            prompt: 'Does the source confirm the launch year?',
            description: 'Case A, example city. Value coded in the edition: 2024.',
            fields: [
              { key: 'verdict', kind: 'choice', label: 'Verdict', required: true, options: [{ value: 'proved', label: 'Yes, proved' }, { value: 'refuted', label: 'No, refuted' }, { value: 'not_disclosed', label: 'The source does not say' }] },
              { key: 'excerpt', kind: 'longText', label: 'Excerpt that proves it', rows: 2 },
              { key: 'page', kind: 'number', label: 'Page', min: 1 },
              { key: 'opened', kind: 'boolean', label: 'I opened the source', required: true },
            ],
            submitLabel: 'Save and continue',
          }}
          submit={() => new Promise((r) => setTimeout(r, 600))}
        />
      </Section>

      <Section id={id('layout')} title="FramedForm, FormSection, FieldGrid, InlineRow, FormActions">
        <FramedForm title="New research session" subtitle="Where the search began." icon={<FileText />} submitLabel="Create session" cancelLabel="Cancel" onCancel={() => {}} onSubmit={() => {}}>
          <FormSection title="Identification" description="How the session appears in the trail.">
            <FieldGrid>
              <FieldGridItem>
                <TextField label="Name" defaultValue="Government assistants, Gulf" />
              </FieldGridItem>
              <FieldGridItem>
                <TextField label="Language of the queries" defaultValue="ar, en" />
              </FieldGridItem>
              <FieldGridItem span="full">
                <TextField label="Goal" defaultValue="Find the launch pages of every assistant." />
              </FieldGridItem>
            </FieldGrid>
          </FormSection>
          <FormSection title="Search">
            <InlineRow>
              <TextField label="First query" defaultValue="government chatbot launch" />
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
