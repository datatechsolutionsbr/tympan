import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { renderWithProvider } from '../../../test/render'
import { AssistantVisualBlock } from './AssistantVisualBlock'
import { MarkdownView } from './MarkdownView'
import { envelopeToReport, inferAxes, parseAssistantVisual } from './visual'

describe('parseAssistantVisual and envelopeToReport', () => {
  it('infers x and series when a bar payload has no keys', () => {
    const env = parseAssistantVisual({ type: 'bar', title: 'T', data: [{ uf: 'SP', total: 3 }] })!
    expect(inferAxes(env)).toEqual({ x: 'uf', y: ['total'] })
    const section = envelopeToReport(env).sections[0]!
    expect(section).toMatchObject({ type: 'bar', data: { x: 'uf', y: ['total'] } })
  })

  it('accepts Portuguese (and Spanish) keys for type, title and data', () => {
    expect(parseAssistantVisual({ tipo: 'barras', titulo: 'Casos por UF', dados: [{ uf: 'SP', total: 3 }] })).toMatchObject({ type: 'bar', title: 'Casos por UF' })
    expect(parseAssistantVisual({ tipo: 'tabla', título: 'Casos', datos: [{ a: 1 }] })).toMatchObject({ type: 'table' })
    expect(parseAssistantVisual(JSON.stringify({ type: 'mapa', title: 'Map', data: [{ region: 'SP', value: 1 }] }))).toMatchObject({ type: 'region-map' })
  })

  it('returns null for prose without a body and flow without a graph', () => {
    expect(parseAssistantVisual({ type: 'prose', title: 'Note' })).toBeNull()
    expect(parseAssistantVisual({ type: 'text', title: 'Note', body: 'ok' })).toMatchObject({ type: 'prose' })
    expect(parseAssistantVisual({ type: 'flow', title: 'Pipeline' })).toBeNull()
    expect(parseAssistantVisual({ type: 'bar', data: [{ a: 1 }] })).toBeNull()
    expect(parseAssistantVisual({ type: 'bar', title: 'Empty', data: [1, 'x'] })).toBeNull()
    expect(parseAssistantVisual('not json')).toBeNull()
  })

  it('shows figures with percent format as localized percentages', () => {
    const env = parseAssistantVisual({ type: 'figures', title: 'Share', format: 'percent', data: [{ label: 'Proved', value: 0.25 }] })!
    renderWithProvider(<AssistantVisualBlock envelope={env} />, { locale: 'pt-BR' })
    expect(screen.getByText('25%')).toBeInTheDocument()
    render(<AssistantVisualBlock envelope={env} locale="de-DE" />)
    expect(screen.getByText('25 %')).toBeInTheDocument()
  })

  it('drops region map rows without a region and uses the configured country', () => {
    const env = parseAssistantVisual({ type: 'map', title: 'By state', data: [{ uf: 'SP', value: 3 }, { label: 'none', value: 9 }] })!
    const spec = envelopeToReport(env, { defaultCountry: 'BR' })
    expect(spec.sections[0]).toEqual({ type: 'region-map', data: { items: [{ region: 'SP', label: 'SP', value: 3 }], country: 'BR' } })
  })

  it('defaults numeric table columns to the number format', () => {
    const env = parseAssistantVisual({ type: 'table', title: 'Cases', data: [{ name: 'Centro', stage: 4 }] })!
    expect(envelopeToReport(env).sections[0]).toMatchObject({ data: { columns: [{ key: 'name' }, { key: 'stage', format: 'number' }] } })
  })

  it('calls onOpen for a flow card and ignores it for charts', async () => {
    const onOpen = vi.fn()
    const flow = parseAssistantVisual({ type: 'flow', title: 'Stage counter', graph: { nodes: [], connectors: [] } })!
    const { container, unmount } = render(<AssistantVisualBlock envelope={flow} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open Stage counter in canvas' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('figure', { name: 'Stage counter' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
    unmount()
    const chart = parseAssistantVisual({ type: 'bar', title: 'Cases', data: [{ uf: 'SP', total: 3 }] })!
    render(<AssistantVisualBlock envelope={chart} onOpen={onOpen} />)
    expect(screen.queryByRole('button', { name: /in canvas/ })).toBeNull()
    expect(screen.getByRole('figure', { name: 'Cases' })).toBeInTheDocument()
  })

  it('uses built-in Spanish strings under an es provider', () => {
    const flow = parseAssistantVisual({ type: 'flow', title: 'Etapas', graph: { nodes: [] } })!
    renderWithProvider(<AssistantVisualBlock envelope={flow} onOpen={() => {}} />, { locale: 'es' })
    expect(screen.getByRole('button', { name: 'Abrir Etapas en el lienzo' })).toBeInTheDocument()
  })
})

describe('MarkdownView', () => {
  it('renders blocks and inline marks as elements, never raw HTML, and drops unsafe links', () => {
    const { container } = render(<MarkdownView source={'# Title\n\nSome **bold** and `code` <img src=x onerror=alert(1)>\n\n- one\n- two\n\n[ok](https://example.org) [bad](javascript:alert(1))\n\n```json\n{"a":1}\n```'} />)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'ok' })).toHaveAttribute('href', 'https://example.org')
    expect(screen.queryByRole('link', { name: 'bad' })).toBeNull()
    expect(container.querySelector('pre')).toHaveTextContent('{"a":1}')
  })
})
