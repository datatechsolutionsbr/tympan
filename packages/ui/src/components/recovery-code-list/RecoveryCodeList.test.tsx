import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { defaultMessages } from '../../internal/messages'
import { ThemeScope } from '../../internal/ThemeScope'
import { RecoveryCodeList, recoveryCodesFile } from './RecoveryCodeList'

const codes = ['1234-5678', '2345-6789', '3456-7890']

afterEach(() => vi.restoreAllMocks())

describe('RecoveryCodeList', () => {
  it('shows the codes in an ordered list numbered from 1', () => {
    render(<RecoveryCodeList codes={codes} />)
    const list = screen.getByRole('list', { name: 'Recovery codes' })
    expect(list.tagName).toBe('OL')
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(codes)
  })

  it('copies every code, one per line, then calls onCopyAll', async () => {
    const user = userEvent.setup()
    const onCopyAll = vi.fn()
    render(<RecoveryCodeList codes={codes} onCopyAll={onCopyAll} />)
    await user.click(screen.getByRole('button', { name: 'Copy all' }))
    expect(await navigator.clipboard.readText()).toBe(codes.join('\n'))
    expect(onCopyAll).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
  })

  it('says so when the clipboard is unavailable', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('no'))
    const onCopyAll = vi.fn()
    render(<RecoveryCodeList codes={codes} onCopyAll={onCopyAll} />)
    await user.click(screen.getByRole('button', { name: 'Copy all' }))
    expect(onCopyAll).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/not available/)
  })

  it('downloads a text file listing the codes numbered after the header lines', async () => {
    const blobs: Blob[] = []
    const create = vi.fn((b: Blob) => {
      blobs.push(b)
      return 'blob:codes'
    })
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const at = new Date('2026-09-26T10:00:00.000Z')
    render(<RecoveryCodeList codes={codes} generatedAt={at} />)
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(click).toHaveBeenCalledTimes(1)
    expect(blobs[0]?.type).toMatch(/text\/plain/)
    const body = recoveryCodesFile(codes, defaultMessages.recoveryCodes, at)
    expect(body.split('\n').slice(0, 4)).toEqual(['Recovery codes', 'Generated at 2026-09-26T10:00:00.000Z', defaultMessages.recoveryCodes.keepSafe, ''])
    expect(body).toContain('1. 1234-5678\n2. 2345-6789\n3. 3456-7890')
  })

  it('offers no download when allowDownload is false', () => {
    render(<RecoveryCodeList codes={codes} allowDownload={false} />)
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull()
  })

  it('shows no codes, actions or reveal button when hidden without onReveal', () => {
    render(<RecoveryCodeList codes={codes} revealed={false} />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(defaultMessages.recoveryCodes.hidden)).toBeInTheDocument()
  })

  it('calls onReveal from the reveal action', async () => {
    const onReveal = vi.fn()
    render(<RecoveryCodeList codes={codes} revealed={false} onReveal={onReveal} />)
    await userEvent.click(screen.getByRole('button', { name: 'Show codes' }))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('uses two columns above 640 and keeps the panel border in forced colours', () => {
    const css = cssOf('components/recovery-code-list/RecoveryCodeList.css')
    expect(mediaBlock(css, /\(min-width:\s*640px\)/)).toMatch(/repeat\(2/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <RecoveryCodeList codes={codes} strings={{ listLabel: `Codes ${scheme}` }} />
            <RecoveryCodeList codes={codes} revealed={false} onReveal={() => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
