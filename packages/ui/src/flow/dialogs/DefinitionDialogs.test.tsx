import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import type { FlowGraph } from '../model/types'
import { DefinitionExportDialog, definitionFileName, flowDefinitionText } from './DefinitionExportDialog'
import { checkFlowDefinition, DefinitionImportDialog } from './DefinitionImportDialog'

const graph: FlowGraph = {
  nodes: [
    { id: 'a', kind: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    { id: 'b', kind: 'code', position: { x: 200, y: 0 }, data: { label: 'Count' } },
    { id: 'c', kind: 'end', position: { x: 400, y: 0 }, data: { label: 'End' } },
  ],
  connectors: [
    { id: 'ab', source: 'a', target: 'b', condition: { operation: 'eq', left: { ref: 'x' }, right: { value: 1 } } },
    { id: 'bc', source: 'b', target: 'c' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
}
const flow = { name: 'Pricing', version: 2 }
const at = () => new Date('2026-09-20T12:00:00Z')

afterEach(() => vi.restoreAllMocks())

describe('DefinitionExportDialog', () => {
  it('shows node and connector counts', async () => {
    const { baseElement } = render(<DefinitionExportDialog open onClose={() => {}} flow={flow} graph={graph} now={at} />)
    const meta = screen.getByText('Steps').closest('div')!
    expect(meta).toHaveTextContent('3')
    expect(screen.getByText('Connections').closest('div')).toHaveTextContent('2')
    await expectNoAxeViolations(baseElement)
  })

  it('truncates a long preview to the limit plus an ellipsis line', () => {
    render(<DefinitionExportDialog open onClose={() => {}} flow={flow} graph={graph} now={at} previewLineLimit={5} />)
    const preview = screen.getByRole('region', { name: 'Definition preview' })
    const lines = preview.textContent!.split('\n')
    expect(lines).toHaveLength(6)
    expect(lines[5]).toMatch(/^… \d+ more lines$/)
    expect(preview).toHaveAttribute('dir', 'ltr')
  })

  it('copies the full definition and announces "Copied"', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    render(<DefinitionExportDialog open onClose={() => {}} flow={flow} graph={graph} now={at} previewLineLimit={3} />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith(flowDefinitionText(flow, graph, at()))
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
  })

  it('reports a copy failure instead of claiming success', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } })
    render(<DefinitionExportDialog open onClose={() => {}} flow={flow} graph={graph} now={at} />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByText(/Could not copy/)).toBeInTheDocument()
  })

  it('downloads a file named from the flow name and version', async () => {
    const created: HTMLAnchorElement[] = []
    const orig = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, o?: ElementCreationOptions) => {
      const el = orig(tag, o)
      if (tag === 'a') {
        created.push(el as HTMLAnchorElement)
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {})
      }
      return el
    })
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    render(<DefinitionExportDialog open onClose={() => {}} flow={{ name: 'Pricing', version: 2 }} graph={graph} now={at} />)
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(created.at(-1)!.download).toBe('Pricing-v2.json')
  })

  it('keeps letters of any script in file names and strips forbidden characters', () => {
    expect(definitionFileName({ name: 'تحليل: المراحل/2026', version: 1 })).toBe('تحليل-المراحل2026-v1.json')
    expect(definitionFileName({ name: 'Análise de preços', version: 3 })).toBe('Análise-de-preços-v3.json')
  })

  it('keeps branch conditions in the exported definition', () => {
    const parsed = JSON.parse(flowDefinitionText(flow, graph, at()))
    expect(parsed.graph.connectors[0].condition).toEqual(graph.connectors[0]!.condition)
    expect(parsed.exportedAt).toBe('2026-09-20T12:00:00.000Z')
  })

  it('formats counts with the provider locale and uses es strings', () => {
    render(
      <TympanProvider locale="es">
        <DefinitionExportDialog open onClose={() => {}} flow={flow} graph={graph} now={at} />
      </TympanProvider>,
    )
    expect(screen.getByRole('button', { name: 'Descargar' })).toBeInTheDocument()
  })
})

function file(text: string, name = 'flow.json') {
  return new File([text], name, { type: 'application/json' })
}

describe('DefinitionImportDialog', () => {
  it('accepts a valid file, shows the counts and enables Import', async () => {
    render(<DefinitionImportDialog open onClose={() => {}} onImport={() => {}} />)
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    await userEvent.upload(input, file(JSON.stringify({ graph })))
    expect(await screen.findByText('3 steps and 2 connections ready to import.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled()
  })

  it('lists "invalid format" for an unparseable file and keeps Import disabled', async () => {
    render(<DefinitionImportDialog open onClose={() => {}} onImport={() => {}} />)
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file('{nope'))
    expect(await screen.findByText(/Invalid format/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
  })

  it('names the item index and the missing field', () => {
    const bad = structuredClone(graph) as unknown as { nodes: Array<Record<string, unknown>> }
    delete bad.nodes[2]!.position
    const r = checkFlowDefinition(JSON.stringify(bad))
    expect(r.ok).toBe(false)
    expect(!r.ok && r.errors).toEqual(['Step 2: missing position.'])
  })

  it('reaches the file picker by keyboard and it is a real button', async () => {
    const { baseElement } = render(<DefinitionImportDialog open onClose={() => {}} onImport={() => {}} />)
    const picker = screen.getByRole('button', { name: 'Choose file' })
    picker.focus()
    expect(picker).toHaveFocus()
    expect(screen.getByText('Drop a definition file here').closest('[role="button"]')).toBeNull()
    await expectNoAxeViolations(baseElement)
  })

  it('imports the connector with its condition', async () => {
    const onImport = vi.fn()
    render(<DefinitionImportDialog open onClose={() => {}} onImport={onImport} />)
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file(JSON.stringify(graph)))
    await screen.findByText(/ready to import/)
    await userEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(onImport.mock.calls[0]![0].connectors[0].condition).toEqual(graph.connectors[0]!.condition)
  })

  it('returns to the drop zone with focus on the picker after "Choose another"', async () => {
    render(<DefinitionImportDialog open onClose={() => {}} onImport={() => {}} />)
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file('{}'))
    await userEvent.click(await screen.findByRole('button', { name: 'Choose another file' }))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect(screen.getByRole('button', { name: 'Choose file' })).toHaveFocus()
  })

  it('normalises missing data, ports and viewport numbers', () => {
    const r = checkFlowDefinition(JSON.stringify({ nodes: [{ id: 'a', kind: 'k', position: {} }], connectors: [{ id: 'c', source: 'a', target: 'a' }], viewport: {} }))
    expect(r.ok && r.graph).toMatchObject({ nodes: [{ data: { label: '' }, position: { x: 0, y: 0 } }], connectors: [{ sourcePort: 'out', targetPort: 'in' }], viewport: { x: 0, y: 0, zoom: 1 } })
  })

  it('marks drag-over with a thicker border, not colour alone, and stops the transition under reduced motion', () => {
    const css = cssOf('flow/dialogs/Dialogs.css')
    expect(css).toMatch(/\.ty-definition-import__zone\[data-drop-target\]\s*\{[^}]*border: 3px solid/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/4px solid Highlight/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/transition: none/)
  })

  it('lists validation messages in pt-BR', async () => {
    render(
      <TympanProvider locale="pt-BR">
        <DefinitionImportDialog open onClose={() => {}} onImport={() => {}} />
      </TympanProvider>,
    )
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file('[]'))
    expect(await screen.findByText('A definição precisa ser um objeto.')).toBeInTheDocument()
  })
})
