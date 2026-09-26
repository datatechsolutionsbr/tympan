// Provenance example with the census shape (placeholder ids). The trail runs
// from a search query to a sentence of the manuscript; side branches give the
// filters and the focus mode something to work on. Titles are data, so the
// Arabic and Japanese variants translate the data, not only the labels.

import { useMemo, useState } from 'react'
import { FakhirProvider, SegmentedControl } from '@fakhir/design-system'
import { NumberTrace, ProvenanceGraph, type EditionComparison, type ProofCertificate, type ProvActor, type ProvItem, type ProvStatement, type TracedPassage } from '../../../src'

type Lang = 'pt-BR' | 'en' | 'es' | 'ar' | 'ja'

const coder: ProvActor = { id: 'agent-coder', kind: 'agent', name: 'coder', agentKey: 'census.coder', model: 'claude-opus-5-5' }
const reviewer: ProvActor = { id: 'person-natalia', kind: 'person', name: 'Natalia Mesquita', email: 'natalia@example.org' }
const freezer: ProvActor = { id: 'system-freeze', kind: 'system', name: 'edition.freeze@2' }

interface Texts {
  reason: string
  quote: string
  obl1: string
  obl2: string
  obl3: string
  dValue: string
  dCoder: string
  dImported: string
  dHash: string
  dUsed: string
  verification: string
  passage: [string, string, string]
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
    reason: 'Confirmada por duas leituras da fonte oficial e revisão humana.',
    quote: 'A plataforma TAMM é operada pelo Departamento de Capacitação Governamental.',
    obl1: 'Hash da fonte confere',
    obl2: 'Revisão por pessoa diferente de quem codificou',
    obl3: 'Segunda fonte independente',
    dValue: 'Valor',
    dCoder: 'Codificação original',
    dImported: 'Importado de',
    dHash: 'Hash do valor',
    dUsed: 'Usado em',
    verification: 'Resposta de verificação',
    passage: ['Os estágios 3 e 4 somam ', ' dos ', ' casos.'],
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
    reason: 'Confirmed by two readings of the official source and a human review.',
    quote: 'The TAMM platform is operated by the Department of Government Enablement.',
    obl1: 'Source hash matches',
    obl2: 'Reviewed by someone other than the coder',
    obl3: 'Second independent source',
    dValue: 'Value',
    dCoder: 'Original coding',
    dImported: 'Imported from',
    dHash: 'Value hash',
    dUsed: 'Used in',
    verification: 'Verification response',
    passage: ['Stages 3 and 4 add up to ', ' of the ', ' cases.'],
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
    reason: 'Confirmada por dos lecturas de la fuente oficial y una revisión humana.',
    quote: 'La plataforma TAMM es operada por el Departamento de Habilitación Gubernamental.',
    obl1: 'El hash de la fuente coincide',
    obl2: 'Revisada por alguien distinto de quien codificó',
    obl3: 'Segunda fuente independiente',
    dValue: 'Valor',
    dCoder: 'Codificación original',
    dImported: 'Importado de',
    dHash: 'Hash del valor',
    dUsed: 'Usado en',
    verification: 'Respuesta de verificación',
    passage: ['Las etapas 3 y 4 suman ', ' de los ', ' casos.'],
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
    reason: 'تم التأكيد بقراءتين للمصدر الرسمي ومراجعة بشرية.',
    quote: 'تشغّل منصة تم دائرة التمكين الحكومي.',
    obl1: 'تجزئة المصدر مطابقة',
    obl2: 'روجع من شخص غير المرمِّز',
    obl3: 'مصدر ثانٍ مستقل',
    dValue: 'القيمة',
    dCoder: 'الترميز الأصلي',
    dImported: 'مستورد من',
    dHash: 'تجزئة القيمة',
    dUsed: 'مستخدم في',
    verification: 'رد التحقق',
    passage: ['تجمع المرحلتان 3 و4 معًا ', ' من أصل ', ' حالة.'],
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
    reason: '公式情報源の2回の読み取りと人によるレビューで確認済み。',
    quote: 'TAMMプラットフォームは政府能力開発局が運営している。',
    obl1: '情報源のハッシュが一致',
    obl2: 'コーダーとは別の人がレビュー',
    obl3: '独立した2つ目の情報源',
    dValue: '値',
    dCoder: '元のコーディング',
    dImported: '取り込み元',
    dHash: '値のハッシュ',
    dUsed: '使用先',
    verification: '検証の回答',
    passage: ['段階3と段階4を合わせると', '件中', '件になる。'],
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
    { id: 'r115b', kind: 'retrieval', title: 'r115b', meta: ['sha256:9f2c…41ab', 'HTTP 200'], actor: coder, at: '2026-09-02T10:15:12Z', proofState: 'proved', verifiedBy: reviewer.name, rule: 'hash-match@1', hashCheck: 'match' },
    { id: 'r116a', kind: 'retrieval', title: 'r116a', meta: ['sha256:03be…9c10'], actor: coder, at: '2026-09-02T10:19:40Z', proofState: 'pending', hashCheck: 'not-reread' },
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
      proofReason: t.reason,
      evidence: t.quote,
      obligations: [
        { id: 'o1', label: t.obl1, status: 'ok', detail: 'sha256:9f2c…41ab = sha256:9f2c…41ab' },
        { id: 'o2', label: t.obl2, status: 'ok', detail: 'coder ≠ Natalia Mesquita' },
        { id: 'o3', label: t.obl3, status: 'pending', detail: 'r116a: 0/1' },
      ],
      details: [
        { label: t.dValue, value: 'confirmed_primary', mono: true },
        { label: t.dCoder, value: 'census.coder' , mono: true },
        { label: t.dImported, value: 'census-api edition 2026-09-20', mono: true },
        { label: t.dHash, value: 'sha256:c41d…7a02', mono: true },
        { label: t.dUsed, value: 'ae-tamm-4-0' , mono: true },
      ],
    },
    { id: 'vf-0931', kind: 'verification', title: t.verification, meta: ['vf-0931'], actor: reviewer, at: '2026-09-05T14:00:00Z', proofState: 'proved' },
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
    { subject: 'vf-0931', relation: 'used', object: 'as-reg-position' },
    { subject: 'ed-2026-09-20', relation: 'wasDerivedFrom', object: 'ae-tamm-4-0' },
    { subject: 'an-stage-count', relation: 'used', object: 'ed-2026-09-20' },
    { subject: 'ms-dgo-s12', relation: 'wasDerivedFrom', object: 'an-stage-count' },
    { subject: 'as-reg-position', relation: 'wasAttributedTo', object: 'agent-coder' },
    { subject: 'ae-tamm-4-0', relation: 'wasAttributedTo', object: 'person-natalia' },
    { subject: 'ed-2026-09-20', relation: 'wasAttributedTo', object: 'system-freeze' },
  ]
  return { items, statements }
}

function certificates(t: Texts): Record<string, ProofCertificate> {
  const cert: ProofCertificate = {
    claimId: 'as-reg-position',
    claim: `${t.assertion} = confirmed_primary`,
    verdict: 'proved',
    verifier: 'fakhir-verify 0.7.2',
    ranAt: '2026-09-21T09:12:00Z',
    inputEdition: '2026-09-20',
    hash: 'sha256:5be0…d91c',
    obligations: [
      { id: 'c1', label: t.obl1, status: 'ok', detail: 'r115b sha256:9f2c…41ab', children: [{ id: 'c1a', label: t.dHash, status: 'ok', detail: 'sha256:c41d…7a02' }] },
      { id: 'c2', label: t.obl2, status: 'ok', detail: 'coder ≠ Natalia Mesquita' },
      { id: 'c3', label: t.obl3, status: 'pending', detail: 'r116a: 0/1' },
    ],
  }
  return { 'as-reg-position': cert, 'ms-dgo-s12': cert }
}

function comparison(t: Texts): EditionComparison {
  return {
    a: { id: 'ed-2026-08-01', label: '2026-08-01' },
    b: { id: 'ed-2026-09-20', label: '2026-09-20' },
    rows: [
      { itemId: 'as-reg-position', label: t.assertion, a: 'unclear', b: 'confirmed_primary', change: 'altered', who: reviewer },
      { itemId: 'as-sovereignty', label: t.assertion2, b: 'hosted_abroad', change: 'new', who: coder },
      { itemId: 'as-old', label: t.assertion3, a: 'partial', change: 'removed', who: reviewer },
    ],
  }
}

function passage(t: Texts): TracedPassage {
  const chain = [
    { id: 'ms-dgo-s12', kind: 'manuscript' as const, title: t.sentence, meta: 'dgo2027 §4 ¶2', status: 'pending' as const },
    { id: 'an-stage-count', kind: 'analysis' as const, title: t.analysis, meta: 'run 2026-09-20T14:02', status: 'ok' as const },
    { id: 'ed-2026-09-20', kind: 'edition' as const, title: t.edition, meta: 'edition=2026-09-20', status: 'ok' as const },
    { id: 'ae-tamm-4-0', kind: 'record' as const, title: 'ae-tamm-4-0', meta: 'stage=4', status: 'ok' as const },
    { id: 'as-reg-position', kind: 'assertion' as const, title: t.assertion, meta: 'confirmed_primary', status: 'ok' as const },
  ]
  return [t.passage[0], { id: 'n37', text: '37', chain }, t.passage[1], { id: 'n94', text: '94', chain: chain.slice(0, 3) }, t.passage[2]]
}

const TITLE: Record<Lang, string> = { 'pt-BR': 'Proveniência', en: 'Provenance', es: 'Procedencia', ar: 'المنشأ', ja: '来歴' }

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
          <ProvenanceGraph
            key={lang}
            title={TITLE[lang]}
            breadcrumb="EACH/USP / censo-ia-gov / ed-2026-09-20"
            items={data.items}
            statements={data.statements}
            actors={[coder, reviewer, freezer]}
            defaultFocusId="ms-dgo-s12"
            defaultSelectedId="as-reg-position"
            defaultBack={7}
            defaultForward={1}
            certificates={certificates(TEXTS[lang])}
            comparison={comparison(TEXTS[lang])}
            onReread={() => undefined}
            onRequestVerification={() => undefined}
            onRerunCertificate={() => undefined}
            onDownloadCertificate={() => undefined}
          />
        </div>
        <section className="fk-gallery-section" aria-label="NumberTrace" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
          <NumberTrace passage={passage(TEXTS[lang])} />
        </section>
      </FakhirProvider>
    </div>
  )
}
