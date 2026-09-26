import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { setViewportWidth } from '../../../test/media'
import { ThemeScope } from '../../internal/ThemeScope'
import { ResizableSplit } from './ResizableSplit'

const split = (extra: Partial<Parameters<typeof ResizableSplit>[0]> = {}) => (
  <ResizableSplit label="Resize the item panel" primary={<p>Queue</p>} secondary={<p>Item</p>} defaultSize={360} min={240} max={640} {...extra} />
)

describe('ResizableSplit', () => {
  it('is a focusable vertical separator with its value range, controlling the sized pane', () => {
    render(split())
    const handle = screen.getByRole('separator', { name: 'Resize the item panel' })
    expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    expect(handle).toHaveAttribute('aria-valuenow', '360')
    expect(handle).toHaveAttribute('aria-valuemin', '240')
    expect(handle).toHaveAttribute('aria-valuemax', '640')
    expect(document.getElementById(handle.getAttribute('aria-controls')!)).toHaveTextContent('Item')
  })

  it('grows the end pane with Left Arrow by the step', async () => {
    const onSizeChange = vi.fn()
    render(split({ onSizeChange }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '368')
    expect(onSizeChange).toHaveBeenLastCalledWith(368)
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '352')
  })

  it('goes to min with Home, max with End, and Enter toggles to min and back', async () => {
    render(split())
    await userEvent.tab()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '240')
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '640')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '240')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '640')
  })

  it('grows the start pane with Right Arrow when it sits at the start', async () => {
    render(split({ secondarySide: 'start' }))
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '368')
  })

  it('follows a pointer drag within the clamp', () => {
    render(split())
    const handle = screen.getByRole('separator')
    fireEvent.pointerDown(handle, { clientX: 500, button: 0, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 460, pointerId: 1 })
    fireEvent.pointerUp(handle, { clientX: 460, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '400')
    fireEvent.pointerDown(handle, { clientX: 500, button: 0, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: -1000, pointerId: 1 })
    expect(handle).toHaveAttribute('aria-valuenow', '640')
  })

  it('stacks the panes below stackBelow, without a separator', () => {
    setViewportWidth(800)
    const { container } = render(split())
    expect(screen.queryByRole('separator')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('data-stacked')
  })

  it('keeps a 44 px hit area and system colours when forced', () => {
    const css = cssOf('components/resizable-split/ResizableSplit.css')
    expect(css).toMatch(/\.fk-split__handle::before\s*\{[^}]*inline-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            {split({ label: `Resize ${scheme}` })}
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
