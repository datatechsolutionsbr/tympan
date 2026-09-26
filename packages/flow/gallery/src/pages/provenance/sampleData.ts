// Sample data of the provenance gallery. Project rule: no invented research
// data. The only real values are the census ones: record ae-tamm-4-0,
// retrieval r115b, assertion governance.operator_regulatory_position =
// confirmed_primary, original coder deep-research/middle-east-africa and the
// frozen edition 2026-09-20 (a manifest of 857 hashes), plus the analysis
// counts per phase 9 · 26 · 24 · 18. Nothing has a proof yet (the verifier
// does not exist), so the real items read "no proof" and every check on them
// is pending. Everything else is a bracketed placeholder.

import type { EditionComparison, ProofCertificate, ProvActor, ProvItem, ProvStatement, TracedPassage } from '../../../../src'

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
  query: '[consulta]',
  reading: '[leitura]',
  source: '[fonte]',
  otherClaim: '[outra asserção]',
  record: '[registro]',
  check: '[verificação]',
  analysis: '[análise]',
  sentence: '[frase do manuscrito]',
  person: '[pessoa]',
  reviewer: 'Pessoa avaliadora A',
  importer: '[importação]',
  runner: '[execução]',
  agent: '[agente]',
  quote: '[trecho citado da fonte r115b]',
  obligations: ['A página lida existe e o hash confere', 'A fonte foi aberta por quem codificou', 'O trecho citado está no texto arquivado', 'Quem verificou não é quem codificou', 'O valor entrou na edição congelada'],
  facts: { value: 'Valor', coder: 'Codificador original', imported: 'Importado de', hash: 'Hash do valor', usedIn: 'Usado em' },
  checkFacts: { instrument: 'Instrumento', target: 'Alvo', opened: 'Fonte aberta', blind: 'Cego', answer: 'Resposta' },
  certNote: 'certificado tipo [tipo] · verificador v[n]',
  certClaim: 'Asserção: [asserção de exemplo] = [valor]',
  rules: ['A evidência cita uma página lida', 'O hash do texto arquivado confere', 'O trecho citado aparece no texto arquivado', 'A fonte é primária para esta propriedade', 'Quem verificou não é quem codificou', 'O valor pertence ao vocabulário do tipo'],
  details: ['[leitura] existe na [edição]', 'sha256 recalculado = [hash]', 'busca exata e normalizada (NFC, espaços)', 'regra da propriedade: [regra]', '[agente] ≠ [pessoa]', '[vocabulário]'],
  file: '[arquivo].tex · seção [n]',
  next: '[parágrafo seguinte]',
  before: '[texto do manuscrito antes do número]',
  caption: '[o que o número conta] na edição 2026-09-20',
  phaseCaption: (n) => `registros da [fase ${n}] na edição 2026-09-20`,
  chain: { sentence: 'Frase do manuscrito', run: 'Execução "Contagem por fase"', runMeta: 'v[n] · resultado [hash]', records: '[n] registros', recordsMeta: 'clique para abrir a lista', claims: 'Asserções com evidência', claimsMeta: '[n] provadas · [n] pendentes' },
  diff: { itemField: '[registro] · [campo]', item: '[registro]', value: '[valor]', newValue: '[valor novo]', newRecord: '[novo registro]', aNote: 'fonte [id] · codificado por [agente]', bNote: 'fonte [id] · alterado por [agente] · [data]' },
  editionMeta: 'manifesto com 857 hashes',
  and: ' e ',
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
  query: '[query]',
  reading: '[reading]',
  source: '[source]',
  otherClaim: '[other assertion]',
  record: '[record]',
  check: '[verification]',
  analysis: '[analysis]',
  sentence: '[manuscript sentence]',
  person: '[person]',
  reviewer: 'Reviewer A',
  importer: '[import]',
  runner: '[runner]',
  agent: '[agent]',
  quote: '[quoted passage of source r115b]',
  obligations: ['The page read exists and its hash matches', 'The source was opened by the coder', 'The quote is in the archived text', 'Whoever verified is not the coder', 'The value entered the frozen edition'],
  facts: { value: 'Value', coder: 'Original coder', imported: 'Imported from', hash: 'Value hash', usedIn: 'Used in' },
  checkFacts: { instrument: 'Instrument', target: 'Target', opened: 'Source opened', blind: 'Blind', answer: 'Answer' },
  certNote: 'certificate type [type] · verifier v[n]',
  certClaim: 'Assertion: [sample assertion] = [value]',
  rules: ['The evidence cites a page read', 'The hash of the archived text matches', 'The quote appears in the archived text', 'The source is primary for this property', 'Whoever verified is not the coder', 'The value is in the type’s vocabulary'],
  details: ['[reading] exists in [edition]', 'sha256 recomputed = [hash]', 'exact and normalised search (NFC, spaces)', 'property rule: [rule]', '[agent] ≠ [person]', '[vocabulary]'],
  file: '[file].tex · section [n]',
  next: '[next paragraph]',
  before: '[manuscript text before the number]',
  caption: '[what the number counts] in edition 2026-09-20',
  phaseCaption: (n) => `records of [phase ${n}] in edition 2026-09-20`,
  chain: { sentence: 'Manuscript sentence', run: 'Run "Count per phase"', runMeta: 'v[n] · result [hash]', records: '[n] records', recordsMeta: 'select to open the list', claims: 'Assertions with evidence', claimsMeta: '[n] proved · [n] pending' },
  diff: { itemField: '[record] · [field]', item: '[record]', value: '[value]', newValue: '[new value]', newRecord: '[new record]', aNote: 'source [id] · coded by [agent]', bNote: 'source [id] · changed by [agent] · [date]' },
  editionMeta: 'manifest with 857 hashes',
  and: ' and ',
}

const ES: Words = { ...EN, and: ' y ', title: 'Procedencia', numberTitle: '¿De dónde vino este número?', badge: 'Datos de ejemplo', edition: 'Edición', frozen: 'congelada', export: 'Exportar', pickEditions: 'Elegir ediciones', live: 'en vivo', seeAnswer: 'Ver la respuesta' }
const AR: Words = { ...EN, title: 'المنشأ', numberTitle: 'من أين جاء هذا الرقم؟', badge: 'بيانات تجريبية', edition: 'الإصدار', frozen: 'مجمّد', export: 'تصدير', pickEditions: 'اختيار الإصدارات', live: 'مباشر', seeAnswer: 'عرض الإجابة' }
const JA: Words = { ...EN, title: '来歴', numberTitle: 'この数値はどこから来たか', badge: 'サンプルデータ', edition: '版', frozen: '凍結', export: 'エクスポート', pickEditions: '版を選ぶ', live: 'ライブ', seeAnswer: '回答を見る' }

export const WORDS: Record<Lang, Words> = { 'pt-BR': PT, en: EN, es: ES, ar: AR, ja: JA }

/** The real original coder of the census assertion. */
const realCoder: ProvActor = { id: 'agent-dr-mea', kind: 'agent', name: 'deep-research/middle-east-africa' }

const EDITION_AT = '2026-09-20T12:00:00Z'
/** Ordering-only times for placeholder events; the page shows "[data]" for them. */
const sampleAt = (day: number) => `2026-09-${String(day).padStart(2, '0')}T12:00:00Z`
export const REAL_TIMES = new Set([Date.parse(EDITION_AT)])

export function trail(w: Words): { items: ProvItem[]; statements: ProvStatement[]; actors: ProvActor[] } {
  const agent: ProvActor = { id: 'agent-sample', kind: 'agent', name: w.agent }
  const person: ProvActor = { id: 'person-sample', kind: 'person', name: w.person }
  const reviewer: ProvActor = { id: 'reviewer-a', kind: 'person', name: w.reviewer }
  const importer: ProvActor = { id: 'importer', kind: 'system', name: w.importer }
  const runner: ProvActor = { id: 'runner', kind: 'system', name: w.runner }
  const pending = (id: string, label: string) => ({ id, label, status: 'pending' as const })
  const items: ProvItem[] = [
    { id: 'q1', kind: 'query', title: w.query, meta: ['sessão [id] · [idioma]'], actor: agent, proofState: null, at: sampleAt(1) },
    { id: 'r115b', kind: 'retrieval', title: 'r115b', meta: ['sha256 [hash] · [data]'], actor: agent, proofState: null, hashCheck: 'not-reread', at: sampleAt(4) },
    { id: 'r-2', kind: 'retrieval', title: w.reading, meta: ['sha256 [hash]'], actor: agent, proofState: null, hashCheck: 'not-reread', at: sampleAt(4) },
    { id: 'src-1', kind: 'source', title: w.source, meta: ['[tipo de fonte]'], actor: agent, proofState: null, at: sampleAt(6) },
    {
      id: 'as-reg',
      kind: 'assertion',
      title: 'governance.operator_regulatory_position',
      meta: ['= confirmed_primary'],
      actor: realCoder,
      proofState: null,
      evidence: w.quote,
      at: sampleAt(9),
      obligations: w.obligations.map((label, i) => pending(`o${i}`, label)),
      details: [
        { label: w.facts.value, value: 'confirmed_primary', mono: true },
        { label: w.facts.coder, value: 'deep-research/middle-east-africa', mono: true },
        { label: w.facts.imported, value: `${w.importer} · 2026-09-20`, mono: true },
        { label: w.facts.hash, value: '[value_sha256]', mono: true },
        { label: w.facts.usedIn, value: `ae-tamm-4-0 · ${w.analysis} · ${w.sentence}`, mono: true },
      ],
    },
    { id: 'as-2', kind: 'assertion', title: w.otherClaim, meta: ['= [valor]'], actor: agent, proofState: null, at: sampleAt(7) },
    { id: 'ae-tamm-4-0', kind: 'record', title: 'ae-tamm-4-0', meta: [w.record], actor: importer, proofState: null, at: sampleAt(12) },
    {
      id: 'ver',
      kind: 'verification',
      title: w.check,
      meta: ['item [n] de [n]'],
      actor: reviewer,
      proofState: null,
      at: sampleAt(15),
      details: [
        { label: w.checkFacts.instrument, value: '[instrumento]', mono: true },
        { label: w.checkFacts.target, value: w.record, mono: true },
        { label: w.checkFacts.opened, value: '[fonte]', mono: true },
        { label: w.checkFacts.blind, value: '[sim/não]', mono: true },
        { label: w.checkFacts.answer, value: '[resposta]', mono: true },
      ],
    },
    { id: 'an', kind: 'analysis', title: w.analysis, meta: ['v[n] · resultado [hash]'], actor: runner, proofState: null, at: sampleAt(17) },
    { id: 'ed', kind: 'edition', title: `${w.edition} 2026-09-20`, meta: [w.editionMeta], actor: person, proofState: null, at: EDITION_AT },
    { id: 'ms', kind: 'manuscript', title: w.sentence, meta: ['[arquivo].tex · linha [n]'], actor: person, proofState: null, at: sampleAt(24) },
  ]
  const statements: ProvStatement[] = [
    { subject: 'r115b', relation: 'used', object: 'q1' },
    { subject: 'r-2', relation: 'used', object: 'q1' },
    { subject: 'src-1', relation: 'wasGeneratedBy', object: 'r115b' },
    { subject: 'as-reg', relation: 'wasDerivedFrom', object: 'src-1' },
    { subject: 'as-2', relation: 'wasDerivedFrom', object: 'r-2' },
    { subject: 'ae-tamm-4-0', relation: 'wasDerivedFrom', object: 'as-reg' },
    { subject: 'ver', relation: 'used', object: 'ae-tamm-4-0' },
    { subject: 'ed', relation: 'wasDerivedFrom', object: 'ae-tamm-4-0' },
    { subject: 'an', relation: 'used', object: 'ed' },
    { subject: 'ms', relation: 'wasDerivedFrom', object: 'an' },
  ]
  return { items, statements, actors: [realCoder, agent, person, reviewer, importer, runner] }
}

export function certificates(w: Words): Record<string, ProofCertificate> {
  const statuses = ['ok', 'ok', 'pending', 'ok', 'ok', 'ok'] as const
  return {
    'as-2': {
      claimId: 'as-2',
      claim: w.certClaim,
      note: w.certNote,
      verdict: 'pending',
      verifier: '[verificador] v[n]',
      ranAt: '[data hora]',
      inputEdition: '[edição]',
      hash: '[hash]',
      obligations: w.rules.map((label, i) => ({ id: `r${i}`, label, status: statuses[i]!, detail: w.details[i]! })),
    },
  }
}

export function comparison(w: Words): EditionComparison {
  const agent: ProvActor = { kind: 'agent', name: w.agent }
  const person: ProvActor = { kind: 'person', name: w.person }
  return {
    a: { id: 'ed-2026-09-20', label: '2026-09-20' },
    b: { id: 'live', label: w.live },
    divergentHashes: '[n]',
    rows: [
      { itemId: 'c1', label: w.diff.itemField, a: w.diff.value, b: w.diff.newValue, change: 'altered', who: agent, aNote: w.diff.aNote, bNote: w.diff.bNote },
      { itemId: 'c2', label: w.diff.item, b: w.diff.newRecord, change: 'new', who: person },
      { itemId: 'c3', label: w.diff.itemField, a: w.diff.value, change: 'removed', who: person },
    ],
  }
}

const COUNTS = [9, 26, 24, 18]

export function passage(w: Words): TracedPassage {
  const chain = (caption: string, n: string) => ({
    id: `n-${n}`,
    text: n,
    caption,
    chain: [
      { id: `s-${n}`, kind: 'manuscript' as const, title: w.chain.sentence, meta: '[arquivo].tex · linha [n]', status: 'ok' as const },
      { id: `run-${n}`, kind: 'analysis' as const, title: w.chain.run, meta: w.chain.runMeta, status: 'ok' as const },
      { id: `ed-${n}`, kind: 'edition' as const, title: `${w.edition} 2026-09-20`, meta: w.editionMeta, status: 'pending' as const },
      { id: `rec-${n}`, kind: 'record' as const, title: w.chain.records, meta: w.chain.recordsMeta, status: 'ok' as const },
      { id: `as-${n}`, kind: 'assertion' as const, title: w.chain.claims, meta: w.chain.claimsMeta, status: 'pending' as const },
    ],
  })
  const [a, b, c, d] = COUNTS.map((n, i) => chain(w.phaseCaption(i + 1), String(n)))
  return [`${w.before} `, chain(w.caption, '[n]'), ' [texto] ', a!, ', ', b!, ', ', c!, w.and, d!, ' [texto].']
}
