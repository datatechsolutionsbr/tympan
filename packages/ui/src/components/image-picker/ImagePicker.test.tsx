import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { ImagePicker } from './ImagePicker'

const MIB = 1024 * 1024
const file = (name: string, type: string, bytes = 1024) => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: bytes })
  return f
}
const input = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement

describe('ImagePicker', () => {
  it('opens the native chooser from the trigger', async () => {
    const { container } = render(<ImagePicker fallbackText="GB" upload={vi.fn()} />)
    const click = vi.spyOn(input(container), 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Change picture' }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('rejects a disallowed type without uploading', async () => {
    const upload = vi.fn()
    const { container } = render(<ImagePicker upload={upload} />)
    await userEvent.upload(input(container), file('a.gif', 'image/gif'), { applyAccept: false })
    expect(screen.getByRole('status')).toHaveTextContent(/not accepted/)
    expect(upload).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Change picture' })).toHaveAccessibleDescription(/not accepted/)
  })

  it('rejects a file above the limit', async () => {
    const upload = vi.fn()
    const { container } = render(<ImagePicker upload={upload} maxBytes={5 * MIB} />)
    await userEvent.upload(input(container), file('big.png', 'image/png', 6 * MIB))
    expect(screen.getByRole('status')).toHaveTextContent(/larger than 5 MiB/)
    expect(upload).not.toHaveBeenCalled()
  })

  it('uploads a valid file, reports the key once and keeps the new preview', async () => {
    const onUploaded = vi.fn()
    const created = vi.fn(() => 'blob:preview')
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: created })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    const { container } = render(<ImagePicker upload={async () => ({ ok: true, key: 'k1' })} onUploaded={onUploaded} />)
    await userEvent.upload(input(container), file('me.png', 'image/png'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Picture updated'))
    expect(onUploaded).toHaveBeenCalledTimes(1)
    expect(onUploaded).toHaveBeenCalledWith('k1')
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:preview')
  })

  it('shows the host error and reverts the preview when the upload is refused', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:new' })
    const { container } = render(<ImagePicker value="/old.png" upload={async () => ({ ok: false, error: 'Quota reached' })} />)
    await userEvent.upload(input(container), file('me.png', 'image/png'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Quota reached'))
    expect(container.querySelector('img')).toHaveAttribute('src', '/old.png')
  })

  it('shows the thrown message', async () => {
    const { container } = render(
      <ImagePicker
        upload={async () => {
          throw new Error('Network down')
        }}
      />,
    )
    await userEvent.upload(input(container), file('me.png', 'image/png'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Network down'))
  })

  it('is busy and disabled while uploading', async () => {
    let finish: (r: { ok: boolean }) => void = () => {}
    const { container } = render(<ImagePicker upload={() => new Promise((r) => (finish = r))} />)
    await userEvent.upload(input(container), file('me.png', 'image/png'))
    const trigger = screen.getByRole('button', { name: 'Change picture' })
    expect(trigger).toHaveAttribute('aria-busy', 'true')
    expect(trigger).toBeDisabled()
    finish({ ok: true })
    await waitFor(() => expect(trigger).not.toHaveAttribute('aria-busy'))
  })

  it('is exposed as disabled', () => {
    render(<ImagePicker upload={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: 'Change picture' })).toBeDisabled()
  })

  it('validates the same file chosen twice in a row', async () => {
    const upload = vi.fn()
    const { container } = render(<ImagePicker upload={upload} />)
    const gif = file('a.gif', 'image/gif')
    await userEvent.upload(input(container), gif, { applyAccept: false })
    expect(input(container).value).toBe('')
    await userEvent.upload(input(container), gif, { applyAccept: false })
    expect(screen.getByRole('status')).toHaveTextContent(/not accepted/)
    expect(upload).not.toHaveBeenCalled()
  })

  it('stops the spinner under reduced motion and shows the badge on touch', () => {
    const css = cssOf('components/image-picker/ImagePicker.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(pointer:\s*coarse\)/)).toMatch(/opacity:\s*1/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ImagePicker fallbackText="GB" label={`Picture ${scheme}`} upload={vi.fn()} hint="JPEG, PNG or WebP up to 5 MiB." />
            <ImagePicker shape="rounded" size="md" value="/logo.png" label={`Logo ${scheme}`} upload={vi.fn()} droppable />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
