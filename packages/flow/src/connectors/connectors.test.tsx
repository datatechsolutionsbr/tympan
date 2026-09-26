import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import { DecisionNode } from '../decision/DecisionNode'
import { connectorCurve } from '../geometry/curve'
import type { FlowConnector } from '../model/types'
import type { ConnectorShape } from '../surface/types'
import { branchOf, ConditionalConnector, splitConnector, type ConditionalConnectorOptions } from './ConditionalConnector'
import { ConnectorInsertMenu } from './ConnectorInsertMenu'

const from = { point: { x: 0, y: 0 }, side: 'end' as const }
const to = { point: { x: 300, y: 0 }, side: 'start' as const }
const shape: ConnectorShape = { ...connectorCurve(from, to), from, to, sourceRect: { x: -100, y: -20, width: 100, height: 40 }, targetRect: { x: 300, y: -20, width: 100, height: 40 } }

function draw(c: FlowConnector, o: Partial<ConditionalConnectorOptions> = {}) {
  return render(<ConditionalConnector connector={c} shape={shape} sourceName="Check stock" targetName="Ship" {...o} />)
}

describe('ConditionalConnector', () => {
  it('labels a connector from a true output with icon and word', () => {
    const { container } = draw({ id: 'c', source: 'a', target: 'b', sourcePort: 'true' })
    const label = container.querySelector('.ty-connector-controls__label')!
    expect(label).toHaveTextContent('true')
    expect(label.querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'from Check stock to Ship, branch true' })).toBeInTheDocument()
    expect(branchOf({ sourcePort: 'false' })).toEqual({ key: 'false', wellKnown: 'false' })
  })

  it('keeps the control pill visible while the pointer moves from the line to the pill', () => {
    vi.useFakeTimers()
    const { container } = draw({ id: 'c', source: 'a', target: 'b' })
    const controls = container.querySelector('.ty-connector-controls')!
    fireEvent.pointerEnter(container.querySelector('.ty-connector__hit')!)
    expect(controls).toHaveAttribute('data-visible', 'true')
    fireEvent.pointerLeave(container.querySelector('.ty-connector__hit')!)
    act(() => vi.advanceTimersByTime(50))
    fireEvent.pointerEnter(controls)
    act(() => vi.advanceTimersByTime(500))
    expect(controls).toHaveAttribute('data-visible', 'true')
    vi.useRealTimers()
  })

  it('splits through the inserted node: the first half keeps label and condition', () => {
    const cs: FlowConnector[] = [{ id: 'c', source: 'a', target: 'b', label: 'yes', condition: { op: 'eq' }, targetPort: 'in' }, { id: 'd', source: 'b', target: 'e' }]
    const out = splitConnector(cs, 'c', 'n')
    expect(out).toHaveLength(3)
    expect(out[0]).toMatchObject({ id: 'c', source: 'a', target: 'n', label: 'yes', condition: { op: 'eq' } })
    expect(out[1]).toMatchObject({ source: 'n', target: 'b', targetPort: 'in' })
    expect(out[1]!.condition).toBeUndefined()
    expect(out[2]).toBe(cs[1])
  })

  it('inserts a compute step from the built-in menu', async () => {
    const onInsertStep = vi.fn()
    draw({ id: 'c', source: 'a', target: 'b' }, { onInsertStep })
    await userEvent.click(screen.getByRole('button', { name: 'Insert step between Check stock and Ship' }))
    await userEvent.click(await screen.findByRole('option', { name: /Compute/ }))
    expect(onInsertStep).toHaveBeenCalledWith('c', 'code', shape.mid)
  })

  it('hands insertion to the host picker when given', async () => {
    const onOpenInsertPicker = vi.fn()
    draw({ id: 'c', source: 'a', target: 'b' }, { onOpenInsertPicker })
    await userEvent.click(screen.getByRole('button', { name: /Insert step/ }))
    expect(onOpenInsertPicker).toHaveBeenCalledWith('c', shape.mid)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows no controls when locked', () => {
    const { container } = draw({ id: 'c', source: 'a', target: 'b' }, { locked: true })
    fireEvent.pointerEnter(container.querySelector('.ty-connector__hit')!)
    expect(screen.queryByRole('button', { name: /Insert step|Delete connection/ })).toBeNull()
  })

  it('deletes with the Delete key on the focused connector', async () => {
    const onDelete = vi.fn()
    const { container } = draw({ id: 'c', source: 'a', target: 'b', sourcePort: 'false' }, { onDelete })
    screen.getByRole('button', { name: /branch false/ }).focus()
    await userEvent.keyboard('{Delete}')
    expect(onDelete).toHaveBeenCalledWith('c')
    expect(container.querySelector('.ty-connector')).toHaveAttribute('data-branch', 'false')
    await expectNoAxeViolations(container)
  })

  it('draws false dashed and labelled, stops the flow animation under reduced motion, CanvasText in forced colours', () => {
    const css = cssOf('connectors/ConditionalConnector.css')
    expect(css).toMatch(/data-branch='false'\] \.ty-connector__path\s*\{[^}]*stroke-dasharray/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })

  it('reads branch words in the locale (pt-BR)', () => {
    render(
      <TympanProvider locale="pt-BR">
        <ConditionalConnector connector={{ id: 'c', source: 'a', target: 'b', sourcePort: 'true' }} shape={shape} sourceName="A" targetName="B" />
      </TympanProvider>,
    )
    expect(screen.getByRole('button', { name: 'de A para B, ramo verdadeiro' })).toBeInTheDocument()
  })
})

describe('ConnectorInsertMenu', () => {
  const options = [
    { kind: 'code', label: 'Compute' },
    { kind: 'if-else', label: 'Branch' },
    { kind: 'decision', label: 'Decision' },
  ]
  function Harness({ onSelect = vi.fn(), onClose = vi.fn() }: { onSelect?: (k: string) => void; onClose?: () => void }) {
    const ref = useRef<HTMLButtonElement>(null)
    return (
      <>
        <button ref={ref} type="button">
          insert
        </button>
        <ConnectorInsertMenu anchor={{ x: 0, y: 0 }} triggerRef={ref} options={options} onSelect={onSelect} onClose={onClose} />
      </>
    )
  }

  it('focuses the search field and filters by substring', async () => {
    render(<Harness />)
    expect(screen.getByRole('searchbox')).toHaveFocus()
    await userEvent.keyboard('comp')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Compute'])
  })

  it('shows the empty message and Enter does nothing without matches', async () => {
    const onSelect = vi.fn()
    render(<Harness onSelect={onSelect} />)
    await userEvent.keyboard('zzz{Enter}')
    expect(screen.getByText('No step kind matches')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('ArrowDown then Enter picks the first option and closes', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<Harness onSelect={onSelect} onClose={onClose} />)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('code')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Escape and on an outside press', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    render(
      <div>
        <p>outside</p>
        <Harness onClose={onClose} />
      </div>,
    )
    await userEvent.click(screen.getByText('outside'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('opens as a bottom drawer on narrow screens', () => {
    setViewportWidth(375)
    render(<Harness />)
    expect(document.querySelector('.ty-drawer')).not.toBeNull()
  })
})

describe('DecisionNode (B-002)', () => {
  const config = {
    kind: 'decision' as const,
    input: { ref: 'assertion.value' },
    options: [
      { value: 'confirmed_primary', label: 'Confirmed, primary' },
      { value: 'confirmed_secondary', label: 'Confirmed, secondary' },
      { value: 'not_confirmed', label: 'Not confirmed' },
    ],
    provider: 'prov',
    model: 'family',
    modelVersion: '2026-06-01',
    threshold: 0.6,
  }
  const result = { value: 'confirmed_primary', probabilities: { confirmed_primary: 0.82, confirmed_secondary: 0.13, not_confirmed: 0.05 }, provider: 'prov', model: 'family', modelVersion: '2026-06-01' }

  it('shows input, provider, model and version as text', () => {
    render(<DecisionNode id="d" config={config} />)
    expect(screen.getByText(/assertion\.value/)).toBeInTheDocument()
    expect(document.body).toHaveTextContent(/prov · family/)
    expect(document.body).toHaveTextContent(/2026-06-01/)
  })

  it('lists every option probability as text, highest first, and names the chosen value', async () => {
    const { container } = render(<DecisionNode id="d" config={config} result={result} onConfigure={() => {}} />)
    const items = [...container.querySelectorAll('.ty-decision-node__option-text')].map((e) => e.textContent)
    expect(items).toEqual(['Confirmed, primary: 82%', 'Confirmed, secondary: 13%', 'Not confirmed: 5%'])
    expect(container.querySelector('[data-chosen="true"]')).toHaveTextContent('Confirmed, primary')
    expect(document.body).toHaveTextContent(/chosen: Confirmed, primary/)
    await expectNoAxeViolations(container)
  })

  it('flags a result that needs review and a node that is not configured', () => {
    const { rerender, container } = render(<DecisionNode id="d" config={config} result={{ ...result, needsReview: true }} />)
    expect(screen.getAllByText(/Needs review/).length).toBeGreaterThan(0)
    rerender(<DecisionNode id="d" config={{ ...config, options: [] }} />)
    expect(container.querySelector('.ty-node-card')).toHaveAttribute('data-problem', 'true')
  })

  it('formats percentages in the locale (ar)', () => {
    render(
      <TympanProvider locale="ar-EG">
        <DecisionNode id="d" config={config} result={result} />
      </TympanProvider>,
    )
    expect(document.body.textContent).toMatch(/٨٢/)
  })
})
