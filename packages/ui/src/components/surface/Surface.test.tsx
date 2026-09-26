import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { Surface } from './Surface'

describe('Surface', () => {
  it('is a region named by its title when rendered as a section', () => {
    render(<Surface title="Evidence">Body</Surface>)
    expect(screen.getByRole('region', { name: 'Evidence' })).toBeInTheDocument()
  })

  it('fires onPress once when clicked anywhere outside nested controls', async () => {
    const onPress = vi.fn()
    render(
      <Surface title="TAMM" onPress={onPress}>
        <p>Abu Dhabi, 2024</p>
      </Surface>,
    )
    await userEvent.click(screen.getByText('Abu Dhabi, 2024'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires onPress when Tab reaches the title control and Enter is pressed', async () => {
    const onPress = vi.fn()
    render(<Surface title="TAMM" onPress={onPress} />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'TAMM' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires only the nested button handler when a nested button is clicked', async () => {
    const onPress = vi.fn()
    const onNested = vi.fn()
    render(
      <Surface title="TAMM" onPress={onPress}>
        <button type="button" onClick={onNested}>
          Edit
        </button>
      </Surface>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onNested).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('navigates through the router adapter with href', async () => {
    const navigate = vi.fn()
    renderWithProvider(
      <Surface title="Boti" href="/base/boti">
        <p>Argentina</p>
      </Surface>,
      { navigate },
    )
    await userEvent.click(screen.getByText('Argentina'))
    expect(navigate).toHaveBeenCalledWith('/base/boti', undefined)
    expect(screen.getByRole('link', { name: 'Boti' })).toBeInTheDocument()
  })

  it('keeps its boundary visible in forced colours', () => {
    expect(mediaBlock(cssOf('components/surface/Surface.css'), /\(forced-colors:\s*active\)/)).toMatch(/border:\s*1px solid CanvasText/)
  })

  it('shows the selected state', () => {
    const { container } = render(<Surface selected title="A" />)
    expect(container.querySelector('.fk-surface')).toHaveAttribute('data-selected')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Surface title="Sheet" description="Plain" footer={<button type="button">Save</button>}>
          Body
        </Surface>
        <Surface elevation="raised" title="Card" onPress={() => {}}>
          Pressable
        </Surface>
      </div>,
    )
    await expectNoAxeViolations(container)
  })
})
