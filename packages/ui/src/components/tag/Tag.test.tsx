import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf } from '../../../test/css'
import { renderWithProvider } from '../../../test/render'
import { Tag, TagList, type TagListItem } from './Tag'

describe('Tag', () => {
  it('static tag is inline text with no interactive role', () => {
    const { container } = render(<Tag>Survey</Tag>)
    expect(container.querySelector('.fk-tag')?.tagName).toBe('SPAN')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('fires onPress on click, Enter and Space', async () => {
    const onPress = vi.fn()
    render(<Tag onPress={onPress}>Filter</Tag>)
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onPress).toHaveBeenCalledTimes(3)
  })

  it('is a link with href', async () => {
    const navigate = vi.fn()
    renderWithProvider(<Tag href="/tags/survey">Survey</Tag>, { navigate })
    await userEvent.click(screen.getByRole('link', { name: 'Survey' }))
    expect(navigate).toHaveBeenCalledWith('/tags/survey', undefined)
  })

  it('names the remove button with the tag text', async () => {
    const onRemove = vi.fn()
    render(
      <Tag removable onRemove={onRemove}>
        São Paulo
      </Tag>,
    )
    const remove = screen.getByRole('button', { name: /São Paulo/ })
    await userEvent.click(remove)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('in a tag group, Delete removes the focused tag and focus moves to a neighbour', async () => {
    const onRemove = vi.fn()
    function Host() {
      const [items, setItems] = useState<TagListItem[]>([
        { id: 'a', label: 'Brazil' },
        { id: 'b', label: 'Chile' },
        { id: 'c', label: 'Peru' },
      ])
      return (
        <TagList
          label="Countries"
          items={items}
          onRemove={(id) => {
            onRemove(id)
            setItems((xs) => xs.filter((x) => x.id !== id))
          }}
        />
      )
    }
    render(<Host />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('row', { name: 'Chile' })).toHaveFocus()
    await userEvent.keyboard('{Delete}')
    expect(onRemove).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('row', { name: 'Chile' })).toBeNull()
    await vi.waitFor(() => {
      const focused = document.activeElement as HTMLElement
      expect(focused.getAttribute('role')).toBe('row')
      expect(focused.textContent).toMatch(/Brazil|Peru/)
    })
  })

  it('keeps text at least 12 px at size small', () => {
    const { container } = render(<Tag size="small">Tiny</Tag>)
    expect(container.querySelector('.fk-tag')).toHaveAttribute('data-size', 'small')
    expect(cssOf('components/tag/Tag.css')).toMatch(/\.fk-tag\[data-size='small'\]\s*\{[^}]*font-size:\s*var\(--fk-font-size-meta\)/)
  })

  it('uses a categorical square for tone category', () => {
    const { container } = render(
      <Tag tone="category" categoryIndex={3}>
        Stage 3
      </Tag>,
    )
    const swatch = container.querySelector<HTMLElement>('.fk-tag__swatch')!
    expect(swatch.style.getPropertyValue('--fk-tag-category')).toBe('var(--fk-chart-3)')
  })

  it('gives interactive parts a 44 px hit area', () => {
    expect(cssOf('components/tag/Tag.css')).toMatch(/\.fk-tag__remove::before[^{]*\{[^}]*max\(100%,\s*var\(--fk-control-target\)\)/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Tag>Static</Tag>
        <Tag tone="accent" onPress={() => {}}>
          Pressable
        </Tag>
        <Tag removable onRemove={() => {}}>
          Removable
        </Tag>
        <TagList label="Filters" items={[{ id: 'x', label: 'Stage 4', tone: 'category', categoryIndex: 4 }]} onRemove={() => {}} />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
