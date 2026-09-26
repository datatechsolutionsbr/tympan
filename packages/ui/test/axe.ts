// Accessibility assertion built directly on axe-core (the engine behind
// jest-axe and vitest-axe). Colour contrast needs real layout and is checked
// in the gallery, not in jsdom.
import axe from 'axe-core'
import { expect } from 'vitest'

export async function expectNoAxeViolations(container: Element = document.body, disabledRules: string[] = []): Promise<void> {
  const rules: Record<string, { enabled: boolean }> = { 'color-contrast': { enabled: false } }
  for (const r of disabledRules) rules[r] = { enabled: false }
  const results = await axe.run(container, { rules, resultTypes: ['violations'] })
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  )
  expect(summary, summary.join('\n')).toEqual([])
}
