// Canvas tokens (--ty-flow-*) for the flow canvas (@datatechsolutions/tympan/flow): kind tones, connectors,
// node frame and state rings, the canvas plane, provenance band and research
// step sizes, and data shape colours.
//
// Colour tokens are references to theme roles, emitted as `var(--ty-role)` so
// every theme, mode, contrast level and forced-colours mapping follows without
// a per-theme copy. In DTCG they are aliases (`{color.accent}`,
// `{dimension.radius-card}`); a soft tint carries its mix in
// `$extensions["br.com.datatechsolutions.tympan"].mix`. Sizes are plain px dimensions (the
// provenance layout reads them at mount). No gradients: the design direction
// reserves the gradient for the primary button.

export type FlowToken =
  | { type: 'color'; ref: string; mix?: number }
  | { type: 'dimension'; ref: string }
  | { type: 'dimension'; px: number }

export const FLOW_TONES = [
  'categorical-1', 'categorical-2', 'categorical-3', 'categorical-4',
  'categorical-5', 'categorical-6', 'categorical-7', 'categorical-8', 'neutral',
] as const
export type FlowTone = (typeof FLOW_TONES)[number]

/** Tint strength of a tone's soft variant (badge background). */
const SOFT_MIX = 14

const color = (ref: string, mix?: number): FlowToken => (mix === undefined ? { type: 'color', ref } : { type: 'color', ref, mix })
const px = (value: number): FlowToken => ({ type: 'dimension', px: value })

function toneTokens(): Array<[string, FlowToken]> {
  const out: Array<[string, FlowToken]> = []
  const cats = FLOW_TONES.filter((t) => t !== 'neutral')
  // Full strength (bubble fill, port, overview map), ink on it, soft tint and text in the tone.
  for (const t of cats) out.push([`tone-${t}`, color(t)])
  out.push(['tone-neutral', color('ink-3')])
  for (const t of cats) out.push([`tone-${t}-ink`, color('on-accent')])
  out.push(['tone-neutral-ink', color('surface-solid')])
  for (const t of cats) out.push([`tone-${t}-soft`, color(t, SOFT_MIX)])
  out.push(['tone-neutral-soft', color('surface-sunken')])
  for (const t of cats) out.push([`tone-${t}-text`, color(t)])
  out.push(['tone-neutral-text', color('ink-2')])
  return out
}

/** Every canvas token, in stylesheet order (name without the `--ty-flow-` prefix). */
export const FLOW_TOKENS: ReadonlyArray<readonly [string, FlowToken]> = [
  ...toneTokens(),
  // Connectors. Rest uses the >=3:1 boundary role (WCAG 1.4.11), not line-strong.
  ['connector', color('input')],
  ['connector-active', color('accent')],
  ['connector-true', color('success')],
  ['connector-false', color('danger')],
  ['connector-rule', color('categorical-2')],
  ['connector-width', px(1.5)],
  ['connector-width-active', px(2.5)],
  // Node frame and state rings.
  ['node-border', color('line-strong')],
  ['node-border-hover', color('input')],
  ['ring-selected', color('accent')],
  ['ring-running', color('warning')],
  ['ring-succeeded', color('success')],
  ['ring-failed', color('danger')],
  ['node-surface', color('surface-raised-solid')],
  ['node-radius', { type: 'dimension', ref: 'radius-card' }],
  // Canvas plane.
  ['plane', color('surface-sunken')],
  ['grid-dot', color('line-strong')],
  ['guide', color('accent')],
  ['marquee', color('accent-soft')],
  // Provenance bands.
  ['band', px(96)],
  ['band-label', px(130)],
  ['node-h', px(72)],
  ['node-w', px(236)],
  // Research steps and the data shapes on their ports (colour always paired with the shape word).
  ['step-w', px(250)],
  ['step-h', px(86)],
  ['col-gap', px(56)],
  ['shape-records', color('accent')],
  ['shape-table', color('categorical-1')],
  ['shape-number', color('warning')],
  ['shape-chart', color('categorical-8')],
  ['shape-decision', color('danger')],
]

export const flowCssName = (name: string) => `--ty-flow-${name}`

/** CSS value of one canvas token. */
export function flowTokenCss(token: FlowToken): string {
  if ('px' in token) return `${token.px}px`
  const ref = `var(--ty-${token.ref})`
  return token.type === 'color' && token.mix !== undefined ? `color-mix(in oklab, ${ref} ${token.mix}%, transparent)` : ref
}

/** Ordered `[--ty-flow-name, value]` pairs (the generator's direct serialisation). */
export function flowVariables(): Array<[string, string]> {
  return FLOW_TOKENS.map(([name, token]) => [flowCssName(name), flowTokenCss(token)])
}

/** DTCG tree of the canvas tokens; colour and radius values alias the theme tree. */
export function flowToDtcg(): Record<string, unknown> {
  const flow: Record<string, unknown> = {}
  for (const [name, token] of FLOW_TOKENS) {
    const app: Record<string, unknown> = { cssName: flowCssName(name) }
    let $value: unknown
    if ('px' in token) $value = { value: token.px, unit: 'px' }
    else if (token.type === 'color') {
      $value = `{color.${token.ref}}`
      if (token.mix !== undefined) app.mix = { space: 'oklab', amount: token.mix / 100, with: 'transparent' }
    } else $value = `{dimension.${token.ref}}`
    flow[name] = { $type: token.type, $value, $extensions: { 'br.com.datatechsolutions.tympan': app } }
  }
  return {
    $description: 'Canvas tokens for the flow canvas (@datatechsolutions/tympan/flow). Colour values alias theme roles and are emitted as var() references. Generated by @datatechsolutions/tympan-tokens.',
    flow,
  }
}

/**
 * The `[data-tone]` mapping: a tone name on any element selects its four parts
 * as `--ty-flow-tone`, `-ink`, `-soft` and `-text`.
 */
export function flowToneRules(): string {
  return FLOW_TONES.map(
    (t) =>
      `[data-tone="${t}"] {\n` +
      ['', '-ink', '-soft', '-text'].map((part) => `  --ty-flow-tone${part}: var(--ty-flow-tone-${t}${part});`).join('\n') +
      '\n}',
  ).join('\n\n')
}
