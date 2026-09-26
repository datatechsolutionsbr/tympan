import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { InlineNotice } from './InlineNotice'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('InlineNotice', () => {
  it('danger after a failed submit is an alert with the message', () => {
    render(<InlineNotice tone="danger">The form has 2 errors.</InlineNotice>)
    expect(screen.getByRole('alert')).toHaveTextContent('The form has 2 errors.')
  })

  it('success is a status', () => {
    render(<InlineNotice tone="success">Saved.</InlineNotice>)
    expect(screen.getByRole('status')).toHaveTextContent('Saved.')
  })

  it('urgency none sets no live role', () => {
    render(
      <InlineNotice tone="danger" urgency="none">
        Old error
      </InlineNotice>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('title precedes the message and is not a heading by default', () => {
    const { container } = render(
      <InlineNotice title="Draft" urgency="none">
        Not yet published.
      </InlineNotice>,
    )
    const title = container.querySelector('.ty-notice__title')!
    const message = container.querySelector('.ty-notice__message')!
    expect(title.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('title can be configured as a heading', () => {
    render(
      <InlineNotice title="Draft" titleAs="h3">
        x
      </InlineNotice>,
    )
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Draft')
  })

  it('dismiss fires onDismiss and focus moves to the next element', async () => {
    const onDismiss = vi.fn()
    function Host() {
      const [open, setOpen] = useState(true)
      return (
        <>
          {open ? (
            <InlineNotice
              dismissible
              onDismiss={() => {
                onDismiss()
                setOpen(false)
              }}
            >
              Hello
            </InlineNotice>
          ) : null}
          <button type="button">Next field</button>
        </>
      )
    }
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus())
  })

  it.each([
    ['warning', 'Warning:'],
    ['danger', 'Error:'],
    ['info', 'Information:'],
    ['success', 'Success:'],
  ] as const)('announces the tone word for %s before the message', (tone, word) => {
    const { container } = render(
      <InlineNotice tone={tone} urgency="none">
        Message
      </InlineNotice>,
    )
    expect(container.querySelector('.ty-notice')?.textContent?.startsWith(word)).toBe(true)
  })

  it('keeps boundary and icon visible in forced colours', () => {
    const forced = mediaBlock(cssOf('components/inline-notice/InlineNotice.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/\.ty-notice\s*\{[^}]*border:\s*1px solid CanvasText/)
    expect(forced).toMatch(/\.ty-notice__icon\s*\{[^}]*CanvasText/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <InlineNotice tone="danger" title="Could not save" dismissible>
          Try again.
        </InlineNotice>
        <InlineNotice tone="info" urgency="none" actions={<a href="/help">Help</a>}>
          Info
        </InlineNotice>
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('InlineNotice in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<InlineNotice tone="warning" urgency="none">لم يتم فتح مصدرين.</InlineNotice>)
    expect(rtlDom.screen.getByText('لم يتم فتح مصدرين.')).toBeInTheDocument()
    await axeRtl(container)
  })
})
