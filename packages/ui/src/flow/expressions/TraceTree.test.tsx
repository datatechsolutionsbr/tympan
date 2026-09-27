import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { DryRunFailure, runDryRun, traceReportFromWire, type TraceReport } from './trace'
import { TraceTree } from './TraceTree'

const report: TraceReport = {
  truncated: false,
  frameCount: 5,
  frameLimit: 500,
  trace: {
    kind: 'operation',
    label: 'count',
    result: 3,
    children: [
      {
        kind: 'operation',
        label: 'filter',
        args: { order: 'asc', limit: 10 },
        result: [1, 2, 3],
        children: [{ kind: 'ref', label: 'census.cases', result: Array.from({ length: 12 }, (_, i) => i) }],
      },
    ],
  },
}

const row = (name: RegExp) => screen.getByRole('row', { name })

describe('TraceTree', () => {
  it('shows depth 0 and 1 and keeps depth-2 children collapsed', () => {
    render(<TraceTree report={report} />)
    expect(row(/^count/)).toBeInTheDocument()
    expect(row(/^filter/)).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('row', { name: /^census\.cases/ })).toBeNull()
    expect(row(/^filter/)).toHaveAttribute('aria-level', '2')
  })

  it('expands a collapsed row with Right Arrow', async () => {
    render(<TraceTree report={report} />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(row(/^filter/)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(row(/^census\.cases/)).toBeInTheDocument()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.queryByRole('row', { name: /^census\.cases/ })).toBeNull()
  })

  it('mirrors Left and Right in a right-to-left locale', async () => {
    render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <TraceTree report={report} />
        </div>
      </TympanProvider>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}{ArrowLeft}')
    expect(screen.getByRole('row', { name: /^census\.cases/ })).toBeInTheDocument()
  })

  it('shows the full value beneath the row when its preview is activated, and on Enter', async () => {
    render(<TraceTree report={report} />)
    await userEvent.click(screen.getByRole('button', { name: /Result of filter/ }))
    expect(screen.getByRole('region', { name: 'Result of filter' })).toHaveTextContent('1')
    await userEvent.click(screen.getByRole('button', { name: /Result of filter/ }))
    expect(screen.queryByRole('region', { name: 'Result of filter' })).toBeNull()
    row(/^count/).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('region', { name: 'Result of count' })).toHaveTextContent('3')
  })

  it('shows the truncation notice with both counts only when truncated', () => {
    const { rerender } = render(<TraceTree report={report} />)
    expect(screen.queryByText(/stopped recording/)).toBeNull()
    rerender(<TraceTree report={{ ...report, truncated: true, frameCount: 500, frameLimit: 500 }} />)
    expect(screen.getByText(/stopped recording after 500 of 500 frames/)).toBeInTheDocument()
  })

  it('labels a reference leaf with the reference tag and summarises a 12-item list', async () => {
    render(<TraceTree report={report} defaultExpandDepth={3} />)
    const leaf = row(/^census\.cases/)
    expect(leaf).toHaveTextContent('reference')
    expect(leaf).toHaveAccessibleName('census.cases, result: list of 12 items')
    expect(row(/^filter/)).toHaveTextContent('order: asc, limit: 10')
  })

  it('rejects the dry run with the HTTP status and server text', async () => {
    const fetchImpl = vi.fn(async () => new Response('boom', { status: 500 }))
    await expect(runDryRun('/dry-run', { config: {} }, fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({ status: 500, message: 'boom' })
    await expect(runDryRun('/dry-run', { config: {} }, (async () => { throw new Error('offline') }) as unknown as typeof fetch)).rejects.toBeInstanceOf(DryRunFailure)
    const ok = vi.fn(async () => new Response(JSON.stringify({ result: 1, trace: { trace: { kind: 'value', label: '1', result: 1 }, truncated: false, frame_count: 1, frame_limit: 9 } }), { status: 200 }))
    const res = await runDryRun('/dry-run', { config: { kind: 'compute' } }, ok as unknown as typeof fetch)
    expect(res.trace.frameLimit).toBe(9)
    expect(JSON.parse((ok.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ config: { kind: 'compute' } })
  })

  it('maps snake-case wire reports', () => {
    expect(traceReportFromWire({ trace: { kind: 'reference', label: 'x', child_spans: [] }, is_truncated: true, frame_count: 2, frame_limit: 3 })).toEqual({
      trace: { kind: 'ref', label: 'x' },
      truncated: true,
      frameCount: 2,
      frameLimit: 3,
    })
  })

  it('has no axe violations and keeps the rail, logical indents and forced colours', async () => {
    const { container } = render(<TraceTree report={report} />)
    await expectNoAxeViolations(container)
    const css = cssOf('flow/expressions/expressions.css')
    expect(css).toMatch(/\.ty-trace__row\s*\{[^}]*padding-inline-start/)
    expect(css).toMatch(/\.ty-trace__line\s*\{[^}]*border-inline-start/)
    expect(css).toMatch(/:dir\(rtl\) \.ty-rule-editor__chevron,\s*:dir\(rtl\) \.ty-trace__chevron-icon\s*\{\s*scale: -1 1/)
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/transition:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/ty-trace__line/)
  })
})
