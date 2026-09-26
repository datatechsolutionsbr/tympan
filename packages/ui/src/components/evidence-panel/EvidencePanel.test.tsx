import { I18nProvider } from 'react-aria-components'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { EvidencePanel, type EvidencePanelProps } from './EvidencePanel'

function Host(props: Partial<EvidencePanelProps>) {
  const [open, setOpen] = useState(true)
  const [width, setWidth] = useState(380)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)}>
        Situation
      </button>
      <EvidencePanel
        title="Situation: in operation"
        subtitle="ae-tamm-4-0"
        open={open}
        onOpenChange={setOpen}
        width={width}
        onWidthChange={setWidth}
        returnFocusRef={trigger}
        proof={{ state: 'proved', provedBy: 'Reviewer', rule: 'compile@1' }}
        {...props}
      >
        <p>Quoted source text.</p>
      </EvidencePanel>
    </>
  )
}

describe('EvidencePanel', () => {
  it('docks as a non-modal complementary region at 1440 px, block proof first', () => {
    render(<Host />)
    const region = screen.getByRole('complementary', { name: 'Situation: in operation' })
    expect(screen.queryByRole('dialog')).toBeNull()
    const body = region.querySelector('.fk-evidence__body')!
    expect(body.firstElementChild).toHaveClass('fk-proof-badge')
    expect(body.firstElementChild).toHaveAttribute('data-size', 'block')
  })

  it('closes from the docked head and returns focus to the trigger', async () => {
    render(<Host />)
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(screen.getByRole('button', { name: 'Situation' })).toHaveFocus()
  })

  it('resizes with the keyboard: Left Arrow grows by 8 px up to 420, End sets 420', async () => {
    render(<Host />)
    const handle = screen.getByRole('separator', { name: 'Resize panel' })
    handle.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '388')
    await userEvent.keyboard('{Home}')
    expect(handle).toHaveAttribute('aria-valuenow', '340')
    await userEvent.keyboard('{End}')
    expect(handle).toHaveAttribute('aria-valuenow', '420')
    await userEvent.keyboard('{ArrowLeft}')
    expect(handle).toHaveAttribute('aria-valuenow', '420')
  })

  it('opens as a modal drawer at 1100 px and Escape closes it', async () => {
    setViewportWidth(1100)
    const onOpenChange = vi.fn()
    render(<Host onOpenChange={onOpenChange} />)
    const dialog = await screen.findByRole('dialog', { name: 'Situation: in operation' })
    expect(dialog.closest('.fk-evidence-modal') ?? dialog.querySelector('.fk-evidence__body')).toBeTruthy()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('is a bottom sheet at 800 px', async () => {
    setViewportWidth(800)
    render(<Host />)
    const dialog = await screen.findByRole('dialog', { name: 'Situation: in operation' })
    expect(document.querySelector('[data-placement="bottom"]')).toContainElement(dialog)
  })

  it('renders nothing when closed', () => {
    render(<Host open={false} />)
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('enters in the base duration, instantly under reduced motion, opaque when transparency is reduced', () => {
    const css = cssOf('components/evidence-panel/EvidencePanel.css')
    expect(css).toMatch(/animation:\s*fk-evidence-in var\(--fk-dur-base\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(prefers-reduced-transparency:\s*reduce\)/)).toMatch(/backdrop-filter:\s*none/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/CanvasText/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <EvidencePanel title={`Evidence ${scheme}`} open onOpenChange={() => {}} onWidthChange={() => {}} proof={{ state: 'pending' }}>
              <p>Body</p>
            </EvidencePanel>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('EvidencePanel in right-to-left', () => {
  it('grows with Right Arrow (the panel sits on the inline end, now the left) and passes axe', async () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <Host />
        </div>
      </I18nProvider>,
    )
    const handle = screen.getByRole('separator', { name: 'Resize panel' })
    handle.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(handle).toHaveAttribute('aria-valuenow', '388')
    await expectNoAxeViolations(container)
  })
})
