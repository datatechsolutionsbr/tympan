import type { ElementDefinition } from '../definition.ts'

/** `<ty-gradient-mark>`: the GradientMark's single source (element-first; see docs/design/single-source-components.md). */
export const gradientMarkDefinition = {
  tag: 'ty-gradient-mark',
  name: 'TyGradientMark',
  kind: 'enhancing',
  doc: 'App-icon style badge: a rounded square filled with the brand gradient, holding an arbitrary glyph (the default slot). Named by `label` (an img role) or decorative without one. The gradient and corner radius default to token values and can be overridden per instance with CSS values.',
  props: {
    label: { type: 'string', attribute: 'label', doc: 'Accessible name; set it and the badge is an img role, leave it out and the badge is decorative (`aria-hidden`).' },
    size: { type: 'enum', values: ['small', 'medium', 'large'], default: 'medium', attribute: 'size', doc: 'Badge size step (24 / 32 / 48 px from the spacing scale).' },
    gradient: { type: 'string', attribute: 'gradient', doc: 'CSS gradient image of the badge (e.g. `linear-gradient(135deg, #e11d48, #7c3aed)`); the default is the token brand gradient (`--ty-info` → `--ty-brand` → `--ty-brand-strong`). Applied as the `--ty-gradient-mark-gradient` custom property when the element upgrades.' },
    radius: { type: 'string', attribute: 'radius', doc: 'CSS corner-radius override (a length or `50%` for a circle); the default is a squircle scaled from the size. Applied as the `--ty-gradient-mark-radius` custom property when the element upgrades.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the badge (`data-testid`).' },
  },
  events: [],
  slots: {
    default: { doc: 'The glyph inside the badge (an icon or an initial); decorative — the badge is named by `label`.' },
  },
  anatomy: {
    tag: 'span',
    class: 'ty-gradient-mark',
    attrs: {
      role: { value: 'img', when: ['label'] },
      'aria-label': { prop: 'label' },
      'aria-hidden': { value: 'true', when: ['!label'] },
      'data-size': { prop: 'size' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      { tag: 'span', class: 'ty-gradient-mark__glyph', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:default'], children: [{ slot: 'default' }] },
    ],
  },
  examples: [
    { name: 'default', props: { label: 'Northstar' }, slots: { default: 'N' } },
    { name: 'small', props: { label: 'Northstar', size: 'small' }, slots: { default: 'N' } },
    { name: 'large', props: { label: 'Northstar', size: 'large' }, slots: { default: 'N' } },
    { name: 'decorative', props: {}, slots: { default: '◆' } },
    { name: 'no-glyph', props: { label: 'Northstar' }, slots: {} },
  ],
} as const satisfies ElementDefinition
