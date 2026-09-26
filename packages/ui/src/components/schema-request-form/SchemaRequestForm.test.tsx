import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { SchemaRequestForm, type InputRequest } from './SchemaRequestForm'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const request: InputRequest = {
  stepId: 'verify-1',
  prompt: 'Does the source confirm the launch year?',
  description: 'TAMM, Abu Dhabi, 2024',
  fields: [
    { key: 'excerpt', kind: 'text', label: 'Quoted excerpt', required: true },
    { key: 'pages', kind: 'number', label: 'Page', min: 0 },
    { key: 'verdict', kind: 'choice', label: 'Verdict', options: [{ value: 'proved', label: 'Proved' }, { value: 'refuted', label: 'Refuted' }], default: 'proved' },
    { key: 'confident', kind: 'boolean', label: 'I opened the source', default: true },
    { key: 'reason', kind: 'longText', label: 'Reason' },
  ],
}

describe('SchemaRequestForm', () => {
  it('blocks an empty required field and focuses it', async () => {
    const submit = vi.fn()
    render(<SchemaRequestForm runId="r1" request={request} submit={submit} />)
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Page' }), '-2')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const excerpt = screen.getByRole('textbox', { name: /Quoted excerpt/ })
    expect(excerpt).toHaveAttribute('aria-invalid', 'true')
    expect(excerpt).toHaveFocus()
    expect(screen.getByText('Enter 0 or more.')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it('submits approved with the payload keys, dropping empty strings', async () => {
    const submit = vi.fn(async () => {})
    const onResolved = vi.fn()
    render(<SchemaRequestForm runId="r1" request={request} submit={submit} onResolved={onResolved} />)
    await userEvent.type(screen.getByRole('textbox', { name: /Quoted excerpt/ }), 'launched in 2024')
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Page' }), '3')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(submit).toHaveBeenCalledWith('r1', 'verify-1', {
      approved: true,
      payload: { excerpt: 'launched in 2024', pages: 3, verdict: 'proved', confident: true },
    })
    await waitFor(() => expect(onResolved).toHaveBeenCalledTimes(1))
  })

  it('rejects with the reason field, ignoring required fields', async () => {
    const submit = vi.fn(async () => {})
    render(<SchemaRequestForm runId="r1" request={request} submit={submit} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Reason' }), 'Source is offline')
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(submit).toHaveBeenCalledWith('r1', 'verify-1', { approved: false, reason: 'Source is offline' })
  })

  it('uses a generic reason when there is no reason value', async () => {
    const submit = vi.fn(async () => {})
    render(<SchemaRequestForm runId="r1" request={{ ...request, fields: request.fields.slice(0, 1) }} submit={submit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(submit).toHaveBeenCalledWith('r1', 'verify-1', { approved: false, reason: 'Rejected by the reviewer' })
  })

  it('hides reject when rejectLabel is null', () => {
    render(<SchemaRequestForm runId="r1" request={{ ...request, rejectLabel: null }} submit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull()
  })

  it('shows an alert on failure and keeps the fields editable', async () => {
    const submit = vi.fn(async () => {
      throw new Error('Conflict: someone answered first')
    })
    render(<SchemaRequestForm runId="r1" request={request} submit={submit} />)
    const excerpt = screen.getByRole('textbox', { name: /Quoted excerpt/ })
    await userEvent.type(excerpt, 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Conflict: someone answered first')
    expect(excerpt).toBeEnabled()
    expect(excerpt).toHaveValue('x')
  })

  it('ignores a second activation while sending and disables the controls', async () => {
    let finish: () => void = () => {}
    const submit = vi.fn(() => new Promise<void>((r) => (finish = r)))
    render(<SchemaRequestForm runId="r1" request={request} submit={submit} />)
    await userEvent.type(screen.getByRole('textbox', { name: /Quoted excerpt/ }), 'x{Enter}')
    const busy = screen.getByRole('button', { name: 'Sending' })
    expect(busy).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(busy)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('textbox', { name: /Quoted excerpt/ })).toBeDisabled()
    finish()
    expect(await screen.findByRole('status')).toHaveTextContent('Answer sent. The run resumed.')
  })

  it('replaces the buttons with a status sentence after success', async () => {
    const onResolved = vi.fn()
    render(<SchemaRequestForm runId="r1" request={request} submit={async () => {}} onResolved={onResolved} />)
    await userEvent.type(screen.getByRole('textbox', { name: /Quoted excerpt/ }), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Approved')
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull()
    expect(onResolved).toHaveBeenCalledTimes(1)
    expect(onResolved).toHaveBeenCalledWith({ approved: true, payload: expect.objectContaining({ excerpt: 'x' }) })
  })

  it('stacks the actions full width below 640 px and keeps the accent in forced colours', () => {
    const css = cssOf('components/schema-request-form/SchemaRequestForm.css')
    expect(mediaBlock(css, /\(max-width:\s*639\.98px\)/)).toMatch(/inline-size:\s*100%/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/border/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <SchemaRequestForm runId={`r-${scheme}`} request={{ ...request, prompt: `${request.prompt} (${scheme})` }} submit={async () => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('SchemaRequestForm in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(
      <SchemaRequestForm runId="run-1" request={{ stepId: 's', prompt: 'هل يؤكد المصدر السنة؟', fields: [{ key: 'page', kind: 'number', label: 'الصفحة', min: 1 }] }} submit={vi.fn()} />,
    )
    expect(rtlDom.screen.getByText('هل يؤكد المصدر السنة؟')).toBeInTheDocument()
    await axeRtl(container)
  })
})
