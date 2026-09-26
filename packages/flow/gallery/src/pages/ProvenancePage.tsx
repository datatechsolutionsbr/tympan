// Provenance example with the census shape (placeholder ids). The trail runs
// from a search query to a sentence of the manuscript; side branches give the
// filters and the focus mode something to work on. Titles are data, so the
// Arabic and Japanese variants translate the data, not only the labels.

import { useMemo, useState } from 'react'
import { FakhirProvider, SegmentedControl } from '@fakhir/design-system'
import { ProvenanceGraph, type ProvActor, type ProvItem, type ProvStatement } from '../../../src'

type Lang = 'pt-BR' | 'en' | 'es' | 'ar' | 'ja'

const coder: ProvActor = { id: 'agent-coder', kind: 'agent', name: 'coder', agentKey: 'census.coder', model: 'claude-opus-5-5' }
const reviewer: ProvActor = { id: 'person-natalia', kind: 'person', name: 'Natalia Mesquita', email: 'natalia@example.org' }
const freezer: ProvActor = { id: 'system-freeze', kind: 'system', name: 'edition.freeze@2' }

interface Texts {
  query: string
  source: string
  source2: string
  assertion: string
  assertion2: string
  assertion3: string
  analysis: string
  edition: string
  sentence: string
}

const TEXTS: Record<Lang, Texts> = {
  'pt-BR': {
    query: 'IA gov Emirados assistente TAMM',
    source: 'Portal TAMM: sobre o assistente',
    source2: 'Relatório anual do Departamento de Governo Digital',
    assertion: 'Posição regulatória do operador',
    assertion2: 'Soberania do modelo',
    assertion3: 'Escopo de integração com outros órgãos',
    analysis: 'Contagem por estágio',
    edition: 'Edição congelada 2026-09-20',
    sentence: 'Os estágios 3 e 4 somam 37 dos 94 casos.',
  },
  en: {
    query: 'UAE gov AI TAMM assistant',
    source: 'TAMM portal: about the assistant',
    source2: 'Digital Government Department annual report',
    assertion: 'Operator regulatory position',
    assertion2: 'Model sovereignty',
    assertion3: 'Integration scope across agencies',
    analysis: 'Count by stage',
    edition: 'Frozen edition 2026-09-20',
    sentence: 'Stages 3 and 4 add up to 37 of the 94 cases.',
  },
  es: {
    query: 'IA gobierno Emiratos asistente TAMM',
    source: 'Portal TAMM: sobre el asistente',
    source2: 'Informe anual del Departamento de Gobierno Digital',
    assertion: 'Posición regulatoria del operador',
    assertion2: 'Soberanía del modelo',
    assertion3: 'Alcance de integración entre organismos',
    analysis: 'Recuento por etapa',
    edition: 'Edición congelada 2026-09-20',
    sentence: 'Las etapas 3 y 4 suman 37 de los 94 casos.',
  },
  ar: {
    query: 'الذكاء الاصطناعي الحكومي في الإمارات مساعد تم',
    source: 'بوابة تم: عن المساعد',
    source2: 'التقرير السنوي لدائرة الحكومة الرقمية',
    assertion: 'الموقف التنظيمي للجهة المشغلة',
    assertion2: 'سيادة النموذج',
    assertion3: 'نطاق التكامل بين الجهات',
    analysis: 'العدد حسب المرحلة',
    edition: 'إصدار مجمّد 2026-09-20',
    sentence: 'تجمع المرحلتان 3 و4 معًا 37 من أصل 94 حالة.',
  },
  ja: {
    query: 'UAE 政府 AI TAMM アシスタント',
    source: 'TAMM ポータル：アシスタントについて',
    source2: 'デジタル政府局 年次報告書',
    assertion: '運営者の規制上の位置づけ',
    assertion2: 'モデルの主権',
    assertion3: '機関間の統合範囲',
    analysis: '段階別の件数',
    edition: '凍結版 2026-09-20',
    sentence: '段階3と段階4を合わせると94件中37件になる。',
  },
}

function census(t: Texts): { items: ProvItem[]; statements: ProvStatement[] } {
  const items: ProvItem[] = [
    { id: 'q-0412', kind: 'query', title: t.query, meta: ['q-0412', 'lang=en'], actor: coder, at: '2026-09-02T10:14:00Z', proofState: null },
    { id: 'r115b', kind: 'retrieval', title: 'r115b', meta: ['sha256:9f2c…41ab', 'HTTP 200'], actor: coder, at: '2026-09-02T10:15:12Z', proofState: 'proved', verifiedBy: reviewer.name, rule: 'hash-match@1' },
    { id: 'r116a', kind: 'retrieval', title: 'r116a', meta: ['sha256:03be…9c10'], actor: coder, at: '2026-09-02T10:19:40Z', proofState: 'pending' },
    { id: 'src-tamm-about', kind: 'source', title: t.source, meta: ['tamm.abudhabi/about'], actor: coder, at: '2026-09-02T10:15:12Z', proofState: 'proved' },
    { id: 'src-dgd-report', kind: 'source', title: t.source2, meta: ['dgd.gov.ae/report-2025.pdf'], actor: coder, at: '2026-09-02T10:19:40Z', proofState: 'pending' },
    {
      id: 'as-reg-position',
      kind: 'assertion',
      title: t.assertion,
      meta: ['governance.operator_regulatory_position = confirmed_primary'],
      actor: coder,
      at: '2026-09-03T08:01:00Z',
      proofState: 'proved',
      verifiedBy: reviewer.name,
      rule: 'two-source@3',
    },
    { id: 'as-sovereignty', kind: 'assertion', title: t.assertion2, meta: ['governance.model_sovereignty = hosted_abroad'], actor: coder, at: '2026-09-03T08:05:00Z', proofState: 'refuted', verifiedBy: reviewer.name, rule: 'two-source@3' },
    { id: 'as-integration', kind: 'assertion', title: t.assertion3, meta: ['governance.integration_scope = ?'], actor: coder, at: '2026-09-03T08:09:00Z', proofState: 'not_disclosed' },
    { id: 'ae-tamm-4-0', kind: 'record', title: 'ae-tamm-4-0', meta: ['case=TAMM', 'stage=4'], actor: reviewer, at: '2026-09-10T16:30:00Z', proofState: 'proved' },
    { id: 'an-stage-count', kind: 'analysis', title: t.analysis, meta: ['run 2026-09-20T14:02', 'result sha256:77a1…0e3d'], actor: coder, at: '2026-09-20T14:02:00Z', proofState: 'proved' },
    { id: 'ed-2026-09-20', kind: 'edition', title: t.edition, meta: ['edition=2026-09-20', '94 records'], actor: freezer, at: '2026-09-20T12:00:00Z', proofState: 'proved' },
    { id: 'ms-dgo-s12', kind: 'manuscript', title: t.sentence, meta: ['dgo2027 §4 ¶2'], actor: reviewer, at: '2026-09-24T09:00:00Z', proofState: 'pending' },
  ]
  const statements: ProvStatement[] = [
    { subject: 'r115b', relation: 'used', object: 'q-0412' },
    { subject: 'r116a', relation: 'used', object: 'q-0412' },
    { subject: 'src-tamm-about', relation: 'wasGeneratedBy', object: 'r115b' },
    { subject: 'src-dgd-report', relation: 'wasGeneratedBy', object: 'r116a' },
    { subject: 'as-reg-position', relation: 'wasDerivedFrom', object: 'src-tamm-about' },
    { subject: 'as-sovereignty', relation: 'wasDerivedFrom', object: 'src-dgd-report' },
    { subject: 'as-integration', relation: 'wasDerivedFrom', object: 'src-tamm-about' },
    { subject: 'ae-tamm-4-0', relation: 'wasDerivedFrom', object: 'as-reg-position' },
    { subject: 'ae-tamm-4-0', relation: 'wasDerivedFrom', object: 'as-sovereignty' },
    { subject: 'ae-tamm-4-0', relation: 'wasDerivedFrom', object: 'as-integration' },
    { subject: 'ed-2026-09-20', relation: 'wasDerivedFrom', object: 'ae-tamm-4-0' },
    { subject: 'an-stage-count', relation: 'used', object: 'ed-2026-09-20' },
    { subject: 'ms-dgo-s12', relation: 'wasDerivedFrom', object: 'an-stage-count' },
    { subject: 'as-reg-position', relation: 'wasAttributedTo', object: 'agent-coder' },
    { subject: 'ae-tamm-4-0', relation: 'wasAttributedTo', object: 'person-natalia' },
    { subject: 'ed-2026-09-20', relation: 'wasAttributedTo', object: 'system-freeze' },
  ]
  return { items, statements }
}

const LANGS: Array<{ value: Lang; label: string }> = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'ar', label: 'العربية' },
  { value: 'ja', label: '日本語' },
]

export function ProvenancePage() {
  const [lang, setLang] = useState<Lang>('pt-BR')
  const data = useMemo(() => census(TEXTS[lang]), [lang])
  const rtl = lang === 'ar'
  return (
    <div className="fk-gallery-page">
      <div className="fk-gallery-page__bar">
        <SegmentedControl label="Language" size="compact" options={LANGS} value={lang} onChange={(v) => setLang(v as Lang)} />
      </div>
      <FakhirProvider locale={lang}>
        <div className="fk-gallery-page__stage" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <ProvenanceGraph key={lang} items={data.items} statements={data.statements} actors={[coder, reviewer, freezer]} defaultFocusId="as-reg-position" defaultHops={3} defaultDirection="both" />
        </div>
      </FakhirProvider>
    </div>
  )
}
