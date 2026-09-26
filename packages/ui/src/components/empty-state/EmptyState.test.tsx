import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { EmptyState } from './EmptyState'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('EmptyState', () => {
  it('no-results with onClearFilters says nothing matches and offers "Clear filters"', async () => {
    const onClear = vi.fn()
    render(<EmptyState reason="no-results" onClearFilters={onClear} />)
    expect(screen.getByRole('heading', { name: /no records match these filters/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('calls action.onPress once', async () => {
    const onPress = vi.fn()
    render(<EmptyState reason="no-data" action={{ label: 'Add source', onPress }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add source' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders no button without actions', () => {
    render(<EmptyState />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('page framing is a region named by the title', () => {
    render(<EmptyState framing="page" title="No sources yet" />)
    expect(screen.getByRole('region', { name: 'No sources yet' })).toBeInTheDocument()
  })

  it('section framing is not a landmark', () => {
    render(<EmptyState title="Nothing" />)
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('announce wraps the title in a status', () => {
    render(<EmptyState announce title="No matches" />)
    expect(screen.getByRole('status')).toHaveTextContent('No matches')
  })

  it('headingLevel 2 renders an h2', () => {
    render(<EmptyState headingLevel={2} title="Empty" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Empty' })).toBeInTheDocument()
  })

  it('offline with onRetry offers "Try again"; the icon is hidden', async () => {
    const onRetry = vi.fn()
    const { container } = render(<EmptyState reason="offline" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <EmptyState framing="page" title="No sources yet" action={{ label: 'Add', onPress: () => {} }} />
        <EmptyState reason="no-results" onClearFilters={() => {}} headingLevel={2} />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('EmptyState in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<EmptyState reason="no-data" title="لا توجد مصادر بعد" description="يبدأ المسار عند فتح جلسة." />)
    expect(rtlDom.screen.getByText('لا توجد مصادر بعد')).toBeInTheDocument()
    await axeRtl(container)
  })
})
