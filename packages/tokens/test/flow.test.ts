import { describe, expect, it } from 'vitest'
import { buildStylesheet, FLOW_TONES, flowToDtcg, flowToneRules, flowVariables, presetThemeVars, themeToDtcg, resolveTheme, presets } from '../src/index.ts'

const vars = new Map(flowVariables())

describe('flow canvas tokens (--ty-flow-*)', () => {
  it('reference theme roles instead of copying values, so every theme follows', () => {
    expect(vars.get('--ty-flow-connector')).toBe('var(--ty-input)')
    expect(vars.get('--ty-flow-connector-active')).toBe('var(--ty-accent)')
    expect(vars.get('--ty-flow-ring-running')).toBe('var(--ty-warning)')
    expect(vars.get('--ty-flow-ring-failed')).toBe('var(--ty-danger)')
    expect(vars.get('--ty-flow-node-radius')).toBe('var(--ty-radius-card)')
    expect(vars.get('--ty-flow-shape-chart')).toBe('var(--ty-categorical-8)')
    expect(vars.get('--ty-flow-tone-categorical-3-soft')).toBe('color-mix(in oklab, var(--ty-categorical-3) 14%, transparent)')
  })

  it('carry the provenance band, research step and connector sizes in px', () => {
    expect(vars.get('--ty-flow-band')).toBe('96px')
    expect(vars.get('--ty-flow-band-label')).toBe('130px')
    expect(vars.get('--ty-flow-node-h')).toBe('72px')
    expect(vars.get('--ty-flow-node-w')).toBe('236px')
    expect(vars.get('--ty-flow-step-w')).toBe('250px')
    expect(vars.get('--ty-flow-step-h')).toBe('86px')
    expect(vars.get('--ty-flow-col-gap')).toBe('56px')
    expect(vars.get('--ty-flow-connector-width')).toBe('1.5px')
  })

  it('never use a gradient', () => {
    for (const v of vars.values()) expect(v).not.toMatch(/gradient/i)
  })

  it('emit DTCG aliases that resolve in every generated theme tree', () => {
    const tree = flowToDtcg() as { flow: Record<string, { $type: string; $value: unknown; $extensions: Record<string, { cssName: string; mix?: unknown }> }> }
    expect(tree.flow.connector!.$value).toBe('{color.input}')
    expect(tree.flow['node-radius']!.$value).toBe('{dimension.radius-card}')
    expect(tree.flow.band!.$value).toEqual({ value: 96, unit: 'px' })
    expect(tree.flow['tone-categorical-1-soft']!.$extensions['br.com.datatechsolutions.tympan']!.mix).toEqual({ space: 'oklab', amount: 0.14, with: 'transparent' })
    for (const preset of presets) {
      const theme = themeToDtcg(resolveTheme(preset, 'dark')) as Record<string, Record<string, unknown>>
      for (const [name, token] of Object.entries(tree.flow)) {
        if (typeof token.$value !== 'string') continue
        const [group, key] = (token.$value as string).slice(1, -1).split('.')
        expect(theme[group!]?.[key!], `${preset.name}: ${name} -> ${token.$value}`).toBeDefined()
      }
    }
  })

  it('are declared on every theme and mode scope, with the [data-tone] mapping', () => {
    const css = buildStylesheet({ themes: presetThemeVars(), components: flowVariables(), componentRules: flowToneRules() })
    expect(css).toMatch(/:root,\n\s*\[data-ty-theme\],\n\s*\[data-ty-mode\] \{\n\s*--ty-flow-tone-categorical-1: var\(--ty-categorical-1\);/)
    for (const tone of FLOW_TONES) expect(css).toContain(`[data-tone="${tone}"] {`)
    expect(flowToneRules()).toContain('--ty-flow-tone-soft: var(--ty-flow-tone-neutral-soft);')
  })
})
