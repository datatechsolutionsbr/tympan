// Sample data of the provenance gallery. Everything here is fictional: the
// Vila Aurora urban air-quality study of Example Lab. A station reading
// (retrieval rd-0714) is cleaned into the assertion
// air.pm25_days_above_limit = 12 by the importer station-importer/centro,
// lands in record station-centro-2026, is frozen in edition 2026-09 (a
// manifest of 312 hashes) and feeds the analysis "days above the limit per
// station" 12 · 31 · 7 · 19. No item carries a proof state yet, so the items
// read "no proof" and every check on them is pending.

import type { EditionComparison, ProofCertificate, ProvActor, ProvItem, ProvStatement, TracedPassage } from '../../../../../src/flow'

export type Lang = 'pt-BR' | 'en' | 'es' | 'ar' | 'ja'

export interface Words {
  title: string
  numberTitle: string
  numberText: string
  certText: string
  badge: string
  edition: string
  frozen: string
  export: string
  pickEditions: string
  lint: string
  seeAnswer: string
  live: string
  query: string
  reading: string
  source: string
  otherClaim: string
  record: string
  check: string
  analysis: string
  sentence: string
  person: string
  reviewer: string
  importer: string
  runner: string
  agent: string
  quote: string
  obligations: [string, string, string, string, string]
  facts: { value: string; coder: string; imported: string; hash: string; usedIn: string }
  checkFacts: { instrument: string; target: string; opened: string; blind: string; answer: string }
  certNote: string
  certClaim: string
  rules: [string, string, string, string, string, string]
  details: [string, string, string, string, string, string]
  file: string
  next: string
  before: string
  caption: string
  phaseCaption: (n: number) => string
  chain: { sentence: string; run: string; runMeta: string; records: string; recordsMeta: string; claims: string; claimsMeta: string }
  diff: { itemField: string; item: string; value: string; newValue: string; newRecord: string; aNote: string; bNote: string }
  editionMeta: string
  and: string
  days: string
  after: string
}

const PT: Words = {
  title: 'Proveniência',
  numberTitle: 'De onde veio este número?',
  numberText: 'Todo número do manuscrito é um link para a execução, a edição e os registros que o produziram.',
  certText: 'Árvore de prova da asserção: cada obrigação é checada por um verificador determinístico.',
  badge: 'Dados de exemplo',
  edition: 'Edição',
  frozen: 'congelada',
  export: 'Exportar',
  pickEditions: 'Escolher edições',
  lint: 'Lint de números',
  seeAnswer: 'Ver a resposta',
  live: 'ao vivo',
  query: 'Consulta "PM2.5 diário, estação Centro"',
  reading: 'Leitura da estação Porto',
  source: 'Rede de monitoramento de Vila Aurora',
  otherClaim: 'air.no2_annual_mean',
  record: 'Estação Centro, 2026',
  check: 'Segunda leitura',
  analysis: 'Dias acima do limite por estação',
  sentence: 'Frase do manuscrito, seção 4',
  person: 'Marina Duarte',
  reviewer: 'Rafael Lima',
  importer: 'importador-rede',
  runner: 'executor-analises',
  agent: 'agente-coleta',
  quote: '“PM2.5 médio diário de 38 µg/m³ em 14/07” (leitura rd-0714)',
  obligations: ['A página lida existe e o hash confere', 'A fonte foi aberta por quem codificou', 'O trecho citado está no texto arquivado', 'Quem verificou não é quem codificou', 'O valor entrou na edição congelada'],
  facts: { value: 'Valor', coder: 'Codificador original', imported: 'Importado de', hash: 'Hash do valor', usedIn: 'Usado em' },
  checkFacts: { instrument: 'Instrumento', target: 'Alvo', opened: 'Fonte aberta', blind: 'Cego', answer: 'Resposta' },
  certNote: 'certificado tipo leitura-primária · verificador v2',
  certClaim: 'Asserção: air.no2_annual_mean = 41 µg/m³',
  rules: ['A evidência cita uma página lida', 'O hash do texto arquivado confere', 'O trecho citado aparece no texto arquivado', 'A fonte é primária para esta propriedade', 'Quem verificou não é quem codificou', 'O valor pertence ao vocabulário do tipo'],
  details: ['rd-0715 existe na edição 2026-09', 'sha256 recalculado = c41d…07fe', 'busca exata e normalizada (NFC, espaços)', 'regra da propriedade: leitura@2', 'agente-coleta ≠ Rafael Lima', 'µg/m³, número ≥ 0'],
  file: 'artigo.tex · seção 4',
  next: 'O efeito depois do inverno ainda não foi medido.',
  before: 'Na edição 2026-09, as quatro estações urbanas somaram',
  caption: 'dias acima do limite de PM2.5 nas quatro estações urbanas, edição 2026-09',
  phaseCaption: (n) => `dias acima do limite de PM2.5 na estação ${['Centro', 'Porto', 'Parque', 'Norte'][n - 1]}, edição 2026-09`,
  chain: { sentence: 'Frase do manuscrito', run: 'Execução "Dias acima do limite"', runMeta: 'v3 · resultado 9f2c…e41a', records: '1412 leituras', recordsMeta: 'clique para abrir a lista', claims: 'Asserções com evidência', claimsMeta: '4 provadas · 1 pendente' },
  diff: { itemField: 'Estação Porto · NO₂ médio', item: 'Estação Ribeirinha', value: '41 µg/m³', newValue: '39 µg/m³', newRecord: 'nova estação, 214 leituras', aNote: 'fonte rd-0715 · codificado por agente-coleta', bNote: 'fonte rd-0802 · alterado por agente-coleta · 2026-09-22' },
  editionMeta: 'manifesto com 312 hashes',
  and: ' e ',
  days: 'dias acima do limite de PM2.5:',
  after: 'nas estações Centro, Porto, Parque e Norte.',
}

const EN: Words = {
  ...PT,
  title: 'Provenance',
  numberTitle: 'Where did this number come from?',
  numberText: 'Every number in the manuscript links to the run, the edition and the records that produced it.',
  certText: 'Proof tree of the assertion: a deterministic verifier checks each obligation.',
  badge: 'Sample data',
  edition: 'Edition',
  frozen: 'frozen',
  export: 'Export',
  pickEditions: 'Choose editions',
  lint: 'Number lint',
  seeAnswer: 'See the answer',
  live: 'live',
  query: 'Query "daily PM2.5, Centro station"',
  reading: 'Harbour station reading',
  source: 'Vila Aurora monitoring network',
  otherClaim: 'air.no2_annual_mean',
  record: 'Centro station, 2026',
  check: 'Second reading',
  analysis: 'Days above the limit per station',
  sentence: 'Manuscript sentence, section 4',
  person: 'Marina Duarte',
  reviewer: 'Rafael Lima',
  importer: 'network-importer',
  runner: 'analysis-runner',
  agent: 'collection-agent',
  quote: '“Daily mean PM2.5 of 38 µg/m³ on 14 July” (reading rd-0714)',
  obligations: ['The page read exists and its hash matches', 'The source was opened by the coder', 'The quote is in the archived text', 'Whoever verified is not the coder', 'The value entered the frozen edition'],
  facts: { value: 'Value', coder: 'Original coder', imported: 'Imported from', hash: 'Value hash', usedIn: 'Used in' },
  checkFacts: { instrument: 'Instrument', target: 'Target', opened: 'Source opened', blind: 'Blind', answer: 'Answer' },
  certNote: 'certificate type primary-reading · verifier v2',
  certClaim: 'Assertion: air.no2_annual_mean = 41 µg/m³',
  rules: ['The evidence cites a page read', 'The hash of the archived text matches', 'The quote appears in the archived text', 'The source is primary for this property', 'Whoever verified is not the coder', 'The value is in the type’s vocabulary'],
  details: ['rd-0715 exists in edition 2026-09', 'sha256 recomputed = c41d…07fe', 'exact and normalised search (NFC, spaces)', 'property rule: reading@2', 'collection-agent ≠ Rafael Lima', 'µg/m³, number ≥ 0'],
  file: 'paper.tex · section 4',
  next: 'Whether the effect lasts beyond winter has not been measured yet.',
  before: 'In edition 2026-09, the four urban stations added up to',
  caption: 'days above the PM2.5 limit at the four urban stations, edition 2026-09',
  phaseCaption: (n) => `days above the PM2.5 limit at ${['Centro', 'Harbour', 'Park', 'North'][n - 1]} station, edition 2026-09`,
  chain: { sentence: 'Manuscript sentence', run: 'Run "Days above the limit"', runMeta: 'v3 · result 9f2c…e41a', records: '1412 readings', recordsMeta: 'select to open the list', claims: 'Assertions with evidence', claimsMeta: '4 proved · 1 pending' },
  diff: { itemField: 'Harbour station · mean NO₂', item: 'Riverside station', value: '41 µg/m³', newValue: '39 µg/m³', newRecord: 'new station, 214 readings', aNote: 'source rd-0715 · coded by collection-agent', bNote: 'source rd-0802 · changed by collection-agent · 2026-09-22' },
  editionMeta: 'manifest with 312 hashes',
  and: ' and ',
  days: 'days above the PM2.5 limit:',
  after: 'at Centro, Harbour, Park and North stations.',
}

const ES: Words = { ...EN, and: ' y ', title: 'Procedencia', numberTitle: '¿De dónde vino este número?', badge: 'Datos de ejemplo', edition: 'Edición', frozen: 'congelada', export: 'Exportar', pickEditions: 'Elegir ediciones', live: 'en vivo', seeAnswer: 'Ver la respuesta' }
const AR: Words = { ...EN, title: 'المنشأ', numberTitle: 'من أين جاء هذا الرقم؟', badge: 'بيانات تجريبية', edition: 'الإصدار', frozen: 'مجمّد', export: 'تصدير', pickEditions: 'اختيار الإصدارات', live: 'مباشر', seeAnswer: 'عرض الإجابة' }
const JA: Words = { ...EN, title: '来歴', numberTitle: 'この数値はどこから来たか', badge: 'サンプルデータ', edition: '版', frozen: '凍結', export: 'エクスポート', pickEditions: '版を選ぶ', live: 'ライブ', seeAnswer: '回答を見る' }

export const WORDS: Record<Lang, Words> = { 'pt-BR': PT, en: EN, es: ES, ar: AR, ja: JA }

/** The original coder of the sample assertion (a fictional importer agent). */
const coder: ProvActor = { id: 'agent-importer-centro', kind: 'agent', name: 'station-importer/centro' }

const EDITION_AT = '2026-09-20T12:00:00Z'
const sampleAt = (day: number) => `2026-09-${String(day).padStart(2, '0')}T12:00:00Z`

export function trail(w: Words): { items: ProvItem[]; statements: ProvStatement[]; actors: ProvActor[] } {
  const agent: ProvActor = { id: 'agent-sample', kind: 'agent', name: w.agent }
  const person: ProvActor = { id: 'person-sample', kind: 'person', name: w.person }
  const reviewer: ProvActor = { id: 'reviewer-a', kind: 'person', name: w.reviewer }
  const importer: ProvActor = { id: 'importer', kind: 'system', name: w.importer }
  const runner: ProvActor = { id: 'runner', kind: 'system', name: w.runner }
  const pending = (id: string, label: string) => ({ id, label, status: 'pending' as const })
  const items: ProvItem[] = [
    { id: 'q1', kind: 'query', title: w.query, meta: ['sessão s-0412 · pt-BR'], actor: agent, proofState: null, at: sampleAt(1) },
    { id: 'rd-0714', kind: 'retrieval', title: 'rd-0714', meta: ['sha256 3b7e…a90c · 2026-07-14'], actor: agent, proofState: null, hashCheck: 'not-reread', at: sampleAt(4) },
    { id: 'r-2', kind: 'retrieval', title: w.reading, meta: ['sha256 c41d…07fe'], actor: agent, proofState: null, hashCheck: 'not-reread', at: sampleAt(4) },
    { id: 'src-1', kind: 'source', title: w.source, meta: ['estação automática'], actor: agent, proofState: null, at: sampleAt(6) },
    {
      id: 'as-reg',
      kind: 'assertion',
      title: 'air.pm25_days_above_limit',
      meta: ['= 12'],
      actor: coder,
      proofState: null,
      evidence: w.quote,
      at: sampleAt(9),
      obligations: w.obligations.map((label, i) => pending(`o${i}`, label)),
      details: [
        { label: w.facts.value, value: '12', mono: true },
        { label: w.facts.coder, value: 'station-importer/centro', mono: true },
        { label: w.facts.imported, value: `${w.importer} · 2026-09-20`, mono: true },
        { label: w.facts.hash, value: '5e1a…c2d9', mono: true },
        { label: w.facts.usedIn, value: `station-centro-2026 · ${w.analysis} · ${w.sentence}`, mono: true },
      ],
    },
    { id: 'as-2', kind: 'assertion', title: w.otherClaim, meta: ['= 41 µg/m³'], actor: agent, proofState: null, at: sampleAt(7) },
    { id: 'station-centro-2026', kind: 'record', title: 'station-centro-2026', meta: [w.record], actor: importer, proofState: null, at: sampleAt(12) },
    {
      id: 'ver',
      kind: 'verification',
      title: w.check,
      meta: ['item 3 / 12'],
      actor: reviewer,
      proofState: null,
      at: sampleAt(15),
      details: [
        { label: w.checkFacts.instrument, value: 'protocolo-verificacao v2', mono: true },
        { label: w.checkFacts.target, value: w.record, mono: true },
        { label: w.checkFacts.opened, value: 'rd-0714', mono: true },
        { label: w.checkFacts.blind, value: '✓', mono: true },
        { label: w.checkFacts.answer, value: '12', mono: true },
      ],
    },
    { id: 'an', kind: 'analysis', title: w.analysis, meta: ['v3 · 9f2c…e41a'], actor: runner, proofState: null, at: sampleAt(17) },
    { id: 'ed', kind: 'edition', title: `${w.edition} 2026-09`, meta: [w.editionMeta], actor: person, proofState: null, at: EDITION_AT },
    { id: 'ms', kind: 'manuscript', title: w.sentence, meta: [w.file], actor: person, proofState: null, at: sampleAt(24) },
  ]
  const statements: ProvStatement[] = [
    { subject: 'rd-0714', relation: 'used', object: 'q1' },
    { subject: 'r-2', relation: 'used', object: 'q1' },
    { subject: 'src-1', relation: 'wasGeneratedBy', object: 'rd-0714' },
    { subject: 'as-reg', relation: 'wasDerivedFrom', object: 'src-1' },
    { subject: 'as-2', relation: 'wasDerivedFrom', object: 'r-2' },
    { subject: 'station-centro-2026', relation: 'wasDerivedFrom', object: 'as-reg' },
    { subject: 'ver', relation: 'used', object: 'station-centro-2026' },
    { subject: 'ed', relation: 'wasDerivedFrom', object: 'station-centro-2026' },
    { subject: 'an', relation: 'used', object: 'ed' },
    { subject: 'ms', relation: 'wasDerivedFrom', object: 'an' },
  ]
  return { items, statements, actors: [coder, agent, person, reviewer, importer, runner] }
}

export function certificates(w: Words): Record<string, ProofCertificate> {
  const statuses = ['ok', 'ok', 'pending', 'ok', 'ok', 'ok'] as const
  return {
    'as-2': {
      claimId: 'as-2',
      claim: w.certClaim,
      note: w.certNote,
      verdict: 'pending',
      verifier: 'verify-air v2',
      ranAt: '2026-09-18 14:02',
      inputEdition: '2026-09',
      hash: 'a81f…33b0',
      obligations: w.rules.map((label, i) => ({ id: `r${i}`, label, status: statuses[i]!, detail: w.details[i]! })),
    },
  }
}

export function comparison(w: Words): EditionComparison {
  const agent: ProvActor = { kind: 'agent', name: w.agent }
  const person: ProvActor = { kind: 'person', name: w.person }
  return {
    a: { id: 'ed-2026-09', label: '2026-09' },
    b: { id: 'live', label: w.live },
    divergentHashes: '3',
    rows: [
      { itemId: 'c1', label: w.diff.itemField, a: w.diff.value, b: w.diff.newValue, change: 'altered', who: agent, aNote: w.diff.aNote, bNote: w.diff.bNote },
      { itemId: 'c2', label: w.diff.item, b: w.diff.newRecord, change: 'new', who: person },
      { itemId: 'c3', label: w.diff.itemField, a: w.diff.value, change: 'removed', who: person },
    ],
  }
}

const COUNTS = [12, 31, 7, 19]
const TOTAL = String(COUNTS.reduce((a, b) => a + b, 0))

export function passage(w: Words): TracedPassage {
  const chain = (caption: string, n: string) => ({
    id: `n-${n}`,
    text: n,
    caption,
    chain: [
      { id: `s-${n}`, kind: 'manuscript' as const, title: w.chain.sentence, meta: w.file, status: 'ok' as const },
      { id: `run-${n}`, kind: 'analysis' as const, title: w.chain.run, meta: w.chain.runMeta, status: 'ok' as const },
      { id: `ed-${n}`, kind: 'edition' as const, title: `${w.edition} 2026-09`, meta: w.editionMeta, status: 'pending' as const },
      { id: `rec-${n}`, kind: 'record' as const, title: w.chain.records, meta: w.chain.recordsMeta, status: 'ok' as const },
      { id: `as-${n}`, kind: 'assertion' as const, title: w.chain.claims, meta: w.chain.claimsMeta, status: 'pending' as const },
    ],
  })
  const [a, b, c, d] = COUNTS.map((n, i) => chain(w.phaseCaption(i + 1), String(n)))
  return [`${w.before} `, chain(w.caption, TOTAL), ` ${w.days} `, a!, ', ', b!, ', ', c!, w.and, d!, ` ${w.after}`]
}
