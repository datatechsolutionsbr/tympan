// Provenance gallery page. Project rule: no invented research data.
//
// Only these values are real (census, edition 2026-09-20): record
// ae-tamm-4-0, retrieval r115b, assertion
// governance.operator_regulatory_position = confirmed_primary, original coder
// deep-research/middle-east-africa, and the edition itself (a manifest of 857
// hashes). None of them has a proof yet (the verifier does not exist), so
// they are shown as "no proof".
//
// Everything else is a neutral placeholder (Caso A, Fonte 1, [hash],
// [trecho citado], [modelo]) and the page carries a visible "sample data"
// badge. Placeholders take several proof states only so the legend and the
// filters have something to show.

import { useMemo, useState } from 'react'
import { FakhirProvider, SegmentedControl, Tag } from '@fakhir/design-system'
import { NumberTrace, ProvenanceGraph, type EditionComparison, type ProofCertificate, type ProvActor, type ProvItem, type ProvStatement, type TracedPassage } from '../../../src'

type Lang = 'pt-BR' | 'en' | 'es' | 'ar' | 'ja'

/** The real original coder of the census assertion. */
const realCoder: ProvActor = { id: 'agent-dr-mea', kind: 'agent', name: 'deep-research/middle-east-africa', model: '[modelo]' }

interface Words {
  badge: string
  title: string
  query: string
  source: (n: number) => string
  caseName: (letter: string) => string
  field: (n: number) => string
  quote: string
  reviewer: string
  system: string
  analysis: string
  sentence: string
  obligation: (n: number) => string
  passage: [string, string, string]
  editionNote: string
}

const WORDS: Record<Lang, Words> = {
  'pt-BR': {
    badge: 'Dados de exemplo',
    title: 'Proveniência',
    query: 'Consulta 1',
    source: (n) => `Fonte ${n}`,
    caseName: (c) => `Caso ${c}`,
    field: (n) => `Campo ${n}`,
    quote: '[trecho citado]',
    reviewer: 'Pessoa revisora A',
    system: 'Sistema A',
    analysis: 'Análise de exemplo',
    sentence: '[frase do manuscrito]',
    obligation: (n) => `Obrigação de exemplo ${n}`,
    passage: ['[Frase de exemplo] O estágio X soma ', ' de ', ' casos de exemplo.'],
    editionNote: 'manifesto com 857 hashes',
  },
  en: {
    badge: 'Sample data',
    title: 'Provenance',
    query: 'Query 1',
    source: (n) => `Source ${n}`,
    caseName: (c) => `Case ${c}`,
    field: (n) => `Field ${n}`,
    quote: '[quoted passage]',
    reviewer: 'Reviewer A',
    system: 'System A',
    analysis: 'Sample analysis',
    sentence: '[manuscript sentence]',
    obligation: (n) => `Sample obligation ${n}`,
    passage: ['[Sample sentence] Stage X adds up to ', ' of ', ' sample cases.'],
    editionNote: 'manifest with 857 hashes',
  },
  es: {
    badge: 'Datos de ejemplo',
    title: 'Procedencia',
    query: 'Consulta 1',
    source: (n) => `Fuente ${n}`,
    caseName: (c) => `Caso ${c}`,
    field: (n) => `Campo ${n}`,
    quote: '[fragmento citado]',
    reviewer: 'Persona revisora A',
    system: 'Sistema A',
    analysis: 'Análisis de ejemplo',
    sentence: '[frase del manuscrito]',
    obligation: (n) => `Obligación de ejemplo ${n}`,
    passage: ['[Frase de ejemplo] La etapa X suma ', ' de ', ' casos de ejemplo.'],
    editionNote: 'manifiesto con 857 hashes',
  },
  ar: {
    badge: 'بيانات تجريبية',
    title: 'المنشأ',
    query: 'استعلام 1',
    source: (n) => `مصدر ${n}`,
    caseName: (c) => `حالة ${c}`,
    field: (n) => `حقل ${n}`,
    quote: '[مقتطف مقتبس]',
    reviewer: 'مراجع أ',
    system: 'نظام أ',
    analysis: 'تحليل تجريبي',
    sentence: '[جملة من المخطوطة]',
    obligation: (n) => `التزام تجريبي ${n}`,
    passage: ['[جملة تجريبية] تجمع المرحلة س ', ' من أصل ', ' حالة تجريبية.'],
    editionNote: 'بيان يضم 857 تجزئة',
  },
  ja: {
    badge: 'サンプルデータ',
    title: '来歴',
    query: 'クエリ 1',
    source: (n) => `情報源 ${n}`,
    caseName: (c) => `ケース ${c}`,
    field: (n) => `項目 ${n}`,
    quote: '［引用箇所］',
    reviewer: 'レビュー担当 A',
    system: 'システム A',
    analysis: 'サンプル分析',
    sentence: '［原稿の文］',
    obligation: (n) => `サンプルの義務 ${n}`,
    passage: ['［サンプル文］段階 X は ', ' 件で、全体は ', ' 件のサンプル。'],
    editionNote: '857 件のハッシュを含むマニフェスト',
  },
}

function trail(w: Words): { items: ProvItem[]; statements: ProvStatement[]; actors: ProvActor[] } {
  const reviewer: ProvActor = { id: 'person-a', kind: 'person', name: w.reviewer }
  const system: ProvActor = { id: 'system-a', kind: 'system', name: w.system }
  const sampleCoder: ProvActor = { id: 'agent-sample', kind: 'agent', name: '[agente]', model: '[modelo]' }
  const items: ProvItem[] = [
    // Placeholders
    { id: 'q-1', kind: 'query', title: w.query, meta: ['[consulta]'], actor: sampleCoder, proofState: null },
    { id: 'src-1', kind: 'source', title: w.source(1), meta: ['[url]'], actor: sampleCoder, proofState: 'proved' },
    { id: 'r-2', kind: 'retrieval', title: 'r-2', meta: ['[hash]'], actor: sampleCoder, proofState: 'pending', hashCheck: 'not-reread' },
    { id: 'src-2', kind: 'source', title: w.source(2), meta: ['[url]'], actor: sampleCoder, proofState: 'pending' },
    { id: 'as-b', kind: 'assertion', title: `${w.caseName('B')} · ${w.field(1)}`, meta: ['[valor]'], actor: sampleCoder, proofState: 'refuted' },
    { id: 'as-c', kind: 'assertion', title: `${w.caseName('C')} · ${w.field(2)}`, meta: ['[valor]'], actor: sampleCoder, proofState: 'not_disclosed' },
    { id: 'an-1', kind: 'analysis', title: w.analysis, meta: ['[execução]'], actor: sampleCoder, proofState: 'pending' },
    { id: 'ms-1', kind: 'manuscript', title: w.sentence, meta: ['[seção]'], actor: reviewer, proofState: 'pending' },
    // Real census values (edition 2026-09-20); no proof exists yet.
    { id: 'r115b', kind: 'retrieval', title: 'r115b', meta: ['[hash]'], actor: realCoder, proofState: null, hashCheck: 'not-reread' },
    {
      id: 'as-reg-position',
      kind: 'assertion',
      title: 'governance.operator_regulatory_position',
      meta: ['governance.operator_regulatory_position = confirmed_primary'],
      actor: realCoder,
      proofState: null,
      evidence: w.quote,
      obligations: [
        { id: 'o1', label: w.obligation(1), status: 'pending', detail: '[regra]' },
        { id: 'o2', label: w.obligation(2), status: 'pending', detail: '[regra]' },
      ],
      details: [
        { label: 'value', value: 'confirmed_primary', mono: true },
        { label: 'coder', value: 'deep-research/middle-east-africa', mono: true },
        { label: 'edition', value: '2026-09-20', mono: true },
        { label: 'hash', value: '[hash]', mono: true },
        { label: 'used in', value: 'ae-tamm-4-0', mono: true },
      ],
    },
    { id: 'ae-tamm-4-0', kind: 'record', title: 'ae-tamm-4-0', meta: ['ae-tamm-4-0'], actor: realCoder, proofState: null },
    { id: 'ed-2026-09-20', kind: 'edition', title: '2026-09-20', meta: [w.editionNote], actor: system, at: '2026-09-20T00:00:00Z', proofState: null },
  ]
  const statements: ProvStatement[] = [
    { subject: 'r115b', relation: 'used', object: 'q-1' },
    { subject: 'r-2', relation: 'used', object: 'q-1' },
    { subject: 'src-1', relation: 'wasGeneratedBy', object: 'r115b' },
    { subject: 'src-2', relation: 'wasGeneratedBy', object: 'r-2' },
    { subject: 'as-reg-position', relation: 'wasDerivedFrom', object: 'src-1' },
    { subject: 'as-b', relation: 'wasDerivedFrom', object: 'src-2' },
    { subject: 'as-c', relation: 'wasDerivedFrom', object: 'src-1' },
    { subject: 'ae-tamm-4-0', relation: 'wasDerivedFrom', object: 'as-reg-position' },
    { subject: 'ed-2026-09-20', relation: 'wasDerivedFrom', object: 'ae-tamm-4-0' },
    { subject: 'an-1', relation: 'used', object: 'ed-2026-09-20' },
    { subject: 'ms-1', relation: 'wasDerivedFrom', object: 'an-1' },
    { subject: 'as-reg-position', relation: 'wasAttributedTo', object: 'agent-dr-mea' },
  ]
  return { items, statements, actors: [realCoder, reviewer, system, sampleCoder] }
}

function certificates(w: Words): Record<string, ProofCertificate> {
  const cert: ProofCertificate = {
    claimId: 'as-b',
    claim: `${w.caseName('B')} · ${w.field(1)}`,
    verdict: 'pending',
    verifier: '[verificador]',
    ranAt: '2026-01-01T00:00:00Z',
    inputEdition: '[edição]',
    hash: '[hash]',
    obligations: [
      { id: 'c1', label: w.obligation(1), status: 'ok', detail: '[regra]' },
      { id: 'c2', label: w.obligation(2), status: 'pending', detail: '[regra]' },
    ],
  }
  return { 'as-b': cert, 'ms-1': cert }
}

function comparison(w: Words): EditionComparison {
  return {
    a: { id: 'ed-a', label: '[edição A]' },
    b: { id: 'ed-b', label: '[edição B]' },
    rows: [
      { itemId: 'f1', label: `${w.caseName('A')} · ${w.field(1)}`, a: '[valor A]', b: '[valor B]', change: 'altered' },
      { itemId: 'f2', label: `${w.caseName('B')} · ${w.field(2)}`, b: '[valor B]', change: 'new' },
      { itemId: 'f3', label: `${w.caseName('C')} · ${w.field(3)}`, a: '[valor A]', change: 'removed' },
    ],
  }
}

function passage(w: Words): TracedPassage {
  const chain = [
    { id: 'ms-1', kind: 'manuscript' as const, title: w.sentence, meta: '[seção]', status: 'pending' as const },
    { id: 'an-1', kind: 'analysis' as const, title: w.analysis, meta: '[execução]', status: 'pending' as const },
    { id: 'ed-2026-09-20', kind: 'edition' as const, title: '2026-09-20', meta: w.editionNote, status: 'pending' as const },
    { id: 'ae-tamm-4-0', kind: 'record' as const, title: 'ae-tamm-4-0', meta: 'ae-tamm-4-0', status: 'pending' as const },
    { id: 'as-reg-position', kind: 'assertion' as const, title: 'governance.operator_regulatory_position', meta: 'confirmed_primary', status: 'pending' as const },
  ]
  return [w.passage[0], { id: 'n1', text: '12', chain }, w.passage[1], { id: 'n2', text: '30', chain: chain.slice(0, 3) }, w.passage[2]]
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
  const w = WORDS[lang]
  const data = useMemo(() => trail(w), [w])
  const rtl = lang === 'ar'
  return (
    <div className="fk-gallery-page">
      <div className="fk-gallery-page__bar">
        <SegmentedControl label="Language" size="compact" options={LANGS} value={lang} onChange={(v) => setLang(v as Lang)} />
        <Tag tone="accent">{w.badge}</Tag>
      </div>
      <FakhirProvider locale={lang}>
        <div className="fk-gallery-page__stage" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <ProvenanceGraph
            key={lang}
            title={w.title}
            breadcrumb="EACH/USP / censo-ia-gov / 2026-09-20"
            items={data.items}
            statements={data.statements}
            actors={data.actors}
            defaultFocusId="ms-1"
            defaultSelectedId="as-reg-position"
            defaultBack={7}
            defaultForward={1}
            certificates={certificates(w)}
            comparison={comparison(w)}
            onReread={() => undefined}
            onRequestVerification={() => undefined}
            onRerunCertificate={() => undefined}
            onDownloadCertificate={() => undefined}
          />
        </div>
        <section className="fk-gallery-section" aria-label="NumberTrace" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <NumberTrace passage={passage(w)} />
        </section>
      </FakhirProvider>
    </div>
  )
}
