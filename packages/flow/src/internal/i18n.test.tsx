import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { autoLayout, rankDirectionOf } from '../layout/autoLayout'
import { CanvasSurface, physicalSide } from '../surface/CanvasSurface'
import { canvasToolItems } from '../toolbar/canvasTools'
import { defineLabels, FlowMessagesProvider, useFlowLocale, useLabels } from './labels'
import { formatMessage } from './messageFormat'

const probeLabels = defineLabels('Probe', {
  en: { hello: 'Hello {name}', count: '{n, plural, =0 {no nodes} one {# node} other {# nodes}}' },
  'pt-BR': { hello: 'Olá {name}', count: '{n, plural, =0 {nenhum nó} one {# nó} other {# nós}}' },
  es: { hello: 'Hola {name}' },
})

function Probe({ override }: { override?: string }) {
  const l = useLabels(probeLabels, override ? { hello: override } : undefined)
  const { locale, direction } = useFlowLocale()
  return (
    <p data-dir={direction}>
      {formatMessage(l.hello, { name: 'Ana' }, locale)} / {formatMessage(l.count, { n: 1200 }, locale)}
    </p>
  )
}

describe('i18n foundations', () => {
  it('formats the ICU subset: arguments, numbers, plurals with exact matches and select', () => {
    expect(formatMessage('{n, plural, =0 {none} one {# item} other {# items}}', { n: 0 }, 'en')).toBe('none')
    expect(formatMessage('{n, plural, one {# item} other {# items}}', { n: 1 }, 'en')).toBe('1 item')
    expect(formatMessage('{n, plural, one {# item} other {# items}}', { n: 2500 }, 'pt-BR')).toBe('2.500 items')
    expect(formatMessage('{k, select, agent {an agent} other {a step}}', { k: 'agent' })).toBe('an agent')
    expect(formatMessage('{a} of {b, number}', { a: 'x', b: 1234 }, 'en')).toBe('x of 1,234')
  })

  it('picks the built-in bundle of the provider locale, by exact tag then language', () => {
    const { rerender } = render(
      <TympanProvider locale="pt-BR">
        <Probe />
      </TympanProvider>,
    )
    expect(screen.getByText(/Olá Ana/)).toHaveTextContent('Olá Ana / 1.200 nós')
    rerender(
      <TympanProvider locale="es-MX">
        <Probe />
      </TympanProvider>,
    )
    // Spanish greeting, English plural fallback (es bundle is partial), Mexican number grouping.
    expect(screen.getByText(/Hola Ana/)).toHaveTextContent('Hola Ana / 1,200 nodes')
  })

  it('lets the host catalogue and then the prop override the bundle', () => {
    render(
      <TympanProvider locale="pt-BR">
        <FlowMessagesProvider messages={{ Probe: { hello: 'Oi {name}' } }}>
          <Probe />
          <Probe override="Salve {name}" />
        </FlowMessagesProvider>
      </TympanProvider>,
    )
    expect(screen.getByText(/Oi Ana/)).toBeInTheDocument()
    expect(screen.getByText(/Salve Ana/)).toBeInTheDocument()
  })

  it('reports right-to-left for Arabic', () => {
    const { container } = render(
      <TympanProvider locale="ar">
        <Probe />
      </TympanProvider>,
    )
    expect(container.querySelector('[data-dir]')).toHaveAttribute('data-dir', 'rtl')
  })

  it('mirrors logical port sides and horizontal layouts in RTL, with an opt-out', () => {
    expect(physicalSide('start', true)).toBe('end')
    expect(physicalSide('top', true)).toBe('top')
    expect(rankDirectionOf('right', true)).toBe('right-left')
    expect(rankDirectionOf('right', true, true)).toBe('left-right')
    const out = autoLayout(
      [
        { id: 'A', kind: 'code', position: { x: 0, y: 0 } },
        { id: 'B', kind: 'code', position: { x: 0, y: 0 } },
      ],
      [{ source: 'A', target: 'B' }],
      'right-left',
    )
    expect(out[0]!.position.x).toBeGreaterThan(out[1]!.position.x)
  })

  it('attaches connectors to the mirrored side inside an Arabic canvas', () => {
    const nodes = [
      { id: 'a', rect: { x: 400, y: 0, width: 200, height: 80 } },
      { id: 'b', rect: { x: 0, y: 0, width: 200, height: 80 } },
    ]
    const { container } = render(
      <TympanProvider locale="ar">
        <CanvasSurface label="مسار" nodes={nodes} fit="none" connectors={[{ id: 'c', source: 'a', target: 'b' }]} renderNode={(n) => <span>{n.id}</span>} />
      </TympanProvider>,
    )
    // Source leaves a's physical left edge (x = 400) toward b's right edge (x = 200).
    expect(container.querySelector('.ty-flow-surface__connector')!.getAttribute('d')!.startsWith('M400,40 ')).toBe(true)
    expect(container.querySelector('.ty-flow-surface')).toHaveAttribute('data-direction', 'rtl')
  })

  it('names canvas tools in the requested locale', () => {
    const items = canvasToolItems({ zoom: 1, mode: 'select', onModeChange() {}, onZoomIn() {}, onZoomOut() {}, onZoomReset() {}, onFit() {}, locale: 'pt-BR' })
    expect(items[0]!.label).toBe('Selecionar')
    expect(items.find((i) => i.id === 'zoom-level')!.text).toBe('100%')
  })
})
