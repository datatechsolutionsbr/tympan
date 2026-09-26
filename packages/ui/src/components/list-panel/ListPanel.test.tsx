import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { Button } from '../button/Button'
import { ListPanel, ListPanelRow } from './ListPanel'

describe('ListPanel', () => {
  it('renders static rows as a list of items with nothing focusable', async () => {
    render(
      <ListPanel>
        <ListPanelRow>One</ListPanelRow>
        <ListPanelRow>Two</ListPanelRow>
        <ListPanelRow>Three</ListPanelRow>
      </ListPanel>,
    )
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3)
    await userEvent.tab()
    expect(document.body).toHaveFocus()
  })

  it('activates a row with Enter exactly once', async () => {
    const onAction = vi.fn()
    render(
      <ListPanel label="Settings">
        <ListPanelRow onAction={onAction} leading={<Settings />}>
          General
        </ListPanelRow>
        <ListPanelRow>Modules</ListPanelRow>
      </ListPanel>,
    )
    await userEvent.tab()
    expect(screen.getAllByRole('row')[0]).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('fires only the trailing handler when its control is activated', async () => {
    const onAction = vi.fn()
    const onTrailing = vi.fn()
    render(
      <ListPanel label="Members">
        <ListPanelRow onAction={onAction} textValue="Ana" trailing={<Button onPress={onTrailing}>Remove</Button>}>
          Ana
        </ListPanelRow>
      </ListPanel>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onTrailing).toHaveBeenCalledTimes(1)
    expect(onAction).not.toHaveBeenCalled()
  })

  it('moves between rows with the arrow keys in the grid form', async () => {
    render(
      <ListPanel label="Settings">
        <ListPanelRow onAction={() => {}}>General</ListPanelRow>
        <ListPanelRow onAction={() => {}}>Modules</ListPanelRow>
      </ListPanel>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('row')[1]).toHaveFocus()
  })

  it('reports position and set size of each feed entry and pages between them', async () => {
    render(
      <ListPanel as="feed" label="Activity">
        {Array.from({ length: 20 }, (_, i) => (
          <ListPanelRow key={i}>{`Entry ${i + 1}`}</ListPanelRow>
        ))}
      </ListPanel>,
    )
    const articles = within(screen.getByRole('feed', { name: 'Activity' })).getAllByRole('article')
    expect(articles).toHaveLength(20)
    expect(articles[4]).toHaveAttribute('aria-posinset', '5')
    expect(articles[4]).toHaveAttribute('aria-setsize', '20')
    articles[0]!.focus()
    await userEvent.keyboard('{PageDown}')
    expect(articles[1]).toHaveFocus()
    await userEvent.keyboard('{PageUp}')
    expect(articles[0]).toHaveFocus()
  })

  it('keeps activatable rows 44 px tall and drops the transition under reduced motion', () => {
    const css = cssOf('components/list-panel/ListPanel.css')
    expect(css).toMatch(/\.fk-list-panel__row\s*\{[^}]*min-block-size:\s*var\(--fk-control-target\)/)
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/transition:\s*none/)
    expect(css).not.toMatch(/scale\(/)
  })

  it('has no axe violations in every form, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <ListPanel>
              <ListPanelRow>Static</ListPanelRow>
            </ListPanel>
            <ListPanel label={`Actions ${scheme}`} elevation="raised">
              <ListPanelRow onAction={() => {}}>Open</ListPanelRow>
              <ListPanelRow disabled onAction={() => {}}>
                Disabled
              </ListPanelRow>
            </ListPanel>
            <ListPanel as="feed" label={`Feed ${scheme}`}>
              <ListPanelRow>Entry</ListPanelRow>
            </ListPanel>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
