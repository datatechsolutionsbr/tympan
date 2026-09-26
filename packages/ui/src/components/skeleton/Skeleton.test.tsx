import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { PageLoadingState, Skeleton, type SkeletonPreset } from './Skeleton'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

const presets: SkeletonPreset[] = ['stats', 'cards', 'section-heading', 'filters', 'analysis']

describe('Skeleton and PageLoadingState', () => {
  it('announces the label once and marks the region busy', () => {
    const { container } = render(<PageLoadingState label="Loading the catalogue" />)
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveTextContent('Loading the catalogue')
    expect(container.querySelector('.ty-page-loading')).toHaveAttribute('aria-busy', 'true')
  })

  it.each(presets)('exposes nothing but the status for preset %s', (preset) => {
    const { container } = render(<PageLoadingState label="Loading" preset={preset} />)
    const blocks = container.querySelectorAll('.ty-skeleton')
    expect(blocks.length).toBeGreaterThan(0)
    for (const b of blocks) expect(b.closest('[aria-hidden="true"]')).not.toBeNull()
    // Everything except the status lives under aria-hidden.
    const exposed = Array.from(container.querySelectorAll('.ty-page-loading > *')).filter(
      (el) => el.getAttribute('aria-hidden') !== 'true',
    )
    expect(exposed).toEqual([screen.getByRole('status')])
  })

  it('renders three stat tiles in one row of three columns', () => {
    const { container } = render(<Skeleton preset="stats" count={3} columns={3} />)
    const grid = container.querySelector<HTMLElement>('.ty-skeleton-grid')
    expect(grid?.style.getPropertyValue('--ty-skeleton-columns')).toBe('3')
    expect(container.querySelectorAll('[data-part="stat"]')).toHaveLength(3)
    expect(cssOf('components/skeleton/Skeleton.css')).toMatch(
      /grid-template-columns:\s*repeat\(var\(--ty-skeleton-columns/,
    )
  })

  it('stops the pulse under reduced motion (opacity-only pulse otherwise)', () => {
    const css = cssOf('components/skeleton/Skeleton.css')
    expect(css).toMatch(/animation:\s*ty-skeleton-pulse var\(--ty-dur-pulse\)/)
    expect(css).toMatch(/@keyframes ty-skeleton-pulse\s*\{[^@]*opacity[^@]*\}/)
    expect(css).not.toMatch(/@keyframes ty-skeleton-pulse\s*\{[^@]*transform/)
    const reduced = mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.ty-skeleton\s*\{[^}]*animation:\s*none/)
  })

  it('varies widths across three lines', () => {
    const { container } = render(<Skeleton lines={3} />)
    const widths = Array.from(container.querySelectorAll('.ty-skeleton')).map((b) => b.getAttribute('data-width'))
    expect(widths).toHaveLength(3)
    expect(new Set(widths).size).toBeGreaterThanOrEqual(2)
  })

  it('accepts a CSS length as width', () => {
    const { container } = render(<Skeleton width="12rem" />)
    expect(container.querySelector<HTMLElement>('.ty-skeleton')?.style.inlineSize).toBe('12rem')
  })

  it('outlines blocks in forced-colors mode', () => {
    expect(mediaBlock(cssOf('components/skeleton/Skeleton.css'), /\(forced-colors:\s*active\)/)).toMatch(/GrayText/)
  })

  it('renders host-supplied skeletons hidden and uses the default label', () => {
    render(
      <PageLoadingState compact>
        <p>custom</p>
      </PageLoadingState>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    expect(screen.getByText('custom').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <PageLoadingState label="Loading the catalogue" preset="analysis" />
        <Skeleton preset="filters" />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Skeleton in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<PageLoadingState label="جارٍ تحميل الفهرس"><Skeleton lines={3} /></PageLoadingState>)
    expect(rtlDom.screen.getByRole('status')).toHaveTextContent('جارٍ تحميل الفهرس')
    await axeRtl(container)
  })
})
