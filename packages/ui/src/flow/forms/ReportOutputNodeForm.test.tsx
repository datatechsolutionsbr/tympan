import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { ReportOutputNodeForm } from './ReportOutputNodeForm'

const report = { sections: [{ type: 'figures', data: { items: [{ label: 'Casos', value: 94 }] } }] }

describe('ReportOutputNodeForm', () => {
  it('opens in inline mode when the config holds a report', () => {
    render(<ReportOutputNodeForm value={{ report }} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Inline definition' })).toBeChecked()
    expect((screen.getByRole('textbox', { name: /Report definition/ }) as HTMLTextAreaElement).value).toContain('"figures"')
  })

  it('saves a trimmed reference and no report in reference mode', async () => {
    const onSave = vi.fn()
    const { container } = render(<ReportOutputNodeForm value={{ from: '  step1.report  ' }} onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'report-output', from: 'step1.report' })
    await expectNoAxeViolations(container)
  })

  it('blocks saving unparseable inline text and shows the error', async () => {
    const onSave = vi.fn()
    render(<ReportOutputNodeForm value={{ report: {} }} onSave={onSave} onCancel={() => {}} />)
    const area = screen.getByRole('textbox', { name: /Report definition/ })
    await userEvent.clear(area)
    await userEvent.type(area, '{{not json')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/not valid structured data/)).toBeInTheDocument()
  })

  it('previews valid inline content with ReportView', async () => {
    render(<ReportOutputNodeForm value={{ report }} onSave={() => {}} onCancel={() => {}} />)
    const toggle = screen.getByRole('button', { name: 'Preview' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Preview' })).toHaveTextContent('Casos')
  })

  it('says a run is needed for a reference preview', async () => {
    render(<ReportOutputNodeForm value={{ from: 'a.b' }} onSave={() => {}} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByText('The preview of a report from an earlier step needs a run.')).toBeInTheDocument()
  })

  it('uses Spanish strings and works in RTL', async () => {
    const onSave = vi.fn()
    render(
      <TympanProvider locale="es">
        <div dir="rtl">
          <ReportOutputNodeForm value={{}} onSave={onSave} onCancel={() => {}} />
        </div>
      </TympanProvider>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Definición propia' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'report-output', report: {} })
  })
})
