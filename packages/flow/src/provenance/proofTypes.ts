// Data shapes of the proof views that sit beside the provenance graph: the
// obligations of a proof, the certificate a deterministic verifier issues for
// a claim, the difference between two editions, and the trace of a number in
// the manuscript. They are plain data; hosts fill them from the contract.

import type { ProvActor, ProvKind, ProvProofState } from './model'

/** Outcome of one proof obligation. */
export type ObligationStatus = 'ok' | 'pending' | 'failed'

/** One thing that must hold for a claim to count as proved. */
export interface ProofObligation {
  id: string
  label: string
  status: ObligationStatus
  /** Technical detail (rule, hash, count), shown in mono. */
  detail?: string
  children?: ProofObligation[]
}

/** Certificate issued by the verifier for one claim (G7a). */
export interface ProofCertificate {
  claimId: string
  /** The claim in words, as the root of the obligation tree. */
  claim: string
  verdict: Exclude<ProvProofState, 'not_disclosed'>
  /** Verifier name and version, e.g. "proof-verify 0.7.2". */
  verifier: string
  /** When the verifier ran (ISO 8601). */
  ranAt: string
  /** Edition the verifier read, e.g. "2026-09-20". */
  inputEdition: string
  /** Hash of the certificate document. */
  hash: string
  /** One line under the claim (certificate type, verifier version). */
  note?: string
  obligations: ProofObligation[]
}

export type EditionChange = 'altered' | 'new' | 'removed'

export interface EditionRef {
  id: string
  label: string
}

export interface EditionDiffRow {
  itemId: string
  /** Name of the item (field label, record, assertion). */
  label: string
  /** Value in edition A; absent for new items. */
  a?: string
  /** Value in edition B; absent for removed items. */
  b?: string
  change: EditionChange
  /** Who made the change. */
  who?: ProvActor
  /** One mono line under each value (source, coder, date). */
  aNote?: string
  bNote?: string
}

export interface EditionComparison {
  a: EditionRef
  b: EditionRef
  rows: EditionDiffRow[]
  /** Hashes that differ between the two editions (a count, or a placeholder word). */
  divergentHashes?: number | string
}

/** One step of the chain behind a number in the manuscript. */
export interface NumberTraceStep {
  id: string
  kind: ProvKind
  title: string
  /** Identifiers in mono (run id, edition, record id). */
  meta?: string
  status: 'ok' | 'pending'
}

/** A number in a manuscript passage and the chain that produced it. */
export interface TracedNumber {
  id: string
  /** The number exactly as written in the text. */
  text: string
  /** What the number counts, in words (under the number in the panel). */
  caption?: string
  /** Chain from the sentence back to the assertions: sentence → run → edition → records → assertions. */
  chain: NumberTraceStep[]
}

/** A manuscript passage: plain text runs and traced numbers, in reading order. */
export type TracedPassage = Array<string | TracedNumber>
