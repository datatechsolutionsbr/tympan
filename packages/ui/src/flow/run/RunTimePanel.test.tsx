import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { renderWithProvider } from '../../../test/render'
import { RunTimePanel, type RunTimeNode } from './RunTimePanel'

const nodes: RunTimeNode[] = [
  { id: 'extract', name: 'Extração', kind: 'source', state: 'succeeded', durationMs: 8000 },
  { id: 'transform', name: 'Transformação', kind: 'transform', state: 'succeeded', durationMs: 2000 },
  { id: 'load', name: 'Carga', kind: 'sink', state: 'waiting', durationMs: null, waitingSince: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'notify', name: 'Notificação', kind: 'agent', state: 'skipped', durationMs: null },
]

describe('RunTimePanel', () => {
  it('renders the claim, one row per node and proportional bars', async () => {
    const { container } = renderWithProvider(
      <RunTimePanel
        nodes={nodes}
        claim="Extração responde por 80% do tempo desta execução."
        events={[{ at: new Date().toISOString(), text: 'Run started' }]}
      />,
    )
    expect(screen.getByText('Extração responde por 80% do tempo desta execução.')).toBeInTheDocument()
    expect(screen.getByText('Extração')).toBeInTheDocument()
    expect(screen.getByText('Transformação')).toBeInTheDocument()
    // Waiting row: word, hatched bar, no fill share.
    const waitingRow = container.querySelector('.ty-run-time__row[data-state="waiting"]')!
    expect(waitingRow).toHaveAttribute('data-waiting', '')
    expect(waitingRow.querySelector('.ty-run-time__fill')).toHaveAttribute('data-hatched', '')
    expect(waitingRow.querySelector<HTMLElement>('.ty-run-time__fill')!.style.inlineSize).toBe('0%')
    // Reported rows split the total: 8000/10000 -> 80%, 2000/10000 -> 20% (floored at 2%).
    const fills = [...container.querySelectorAll<HTMLElement>('.ty-run-time__row[data-state="succeeded"] .ty-run-time__fill')]
    expect(fills.map((f) => f.style.inlineSize)).toEqual(['80%', '20%'])
    expect(fills.every((f) => !f.hasAttribute('data-hatched'))).toBe(true)
    // The bar is labelled for assistive tech; the visible duration text is present too.
    expect(screen.getByLabelText(/, 80% of the run time/)).toBeInTheDocument()
    expect(screen.getByText('Event log')).toBeInTheDocument()
    expect(screen.getByText('Run started')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('renders without claim and without events, and marks unreported durations', async () => {
    const { container } = renderWithProvider(<RunTimePanel nodes={[{ id: 'x', name: 'X', state: 'failed', durationMs: null }]} />)
    expect(container.querySelector('.ty-run-time__claim')).toBeNull()
    expect(container.querySelector('.ty-run-time__events')).toBeNull()
    expect(screen.getByText('not reported')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('bare render (no provider) still resolves English labels', () => {
    render(<RunTimePanel nodes={[{ id: 'a', name: 'A', state: 'running', durationMs: 500 }]} />)
    expect(screen.getByText('Where the time went')).toBeInTheDocument()
    expect(screen.getByText('running')).toBeInTheDocument()
  })
})
