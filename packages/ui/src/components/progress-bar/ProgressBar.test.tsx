import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ProgressBar } from './ProgressBar'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('ProgressBar', () => {
  it('exposes value 40 as "40%" under its label', () => {
    render(<ProgressBar value={40} label="Upload" />)
    const bar = screen.getByRole('progressbar', { name: 'Upload' })
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(bar).toHaveAttribute('aria-valuetext', '40%')
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('clamps values above the maximum', () => {
    render(<ProgressBar value={150} maxValue={100} label="Upload" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('uses a custom value label as aria-valuetext', () => {
    render(<ProgressBar value={3} maxValue={8} valueLabel="3 of 8 steps" label="Setup" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 8 steps')
  })

  it('omits aria-valuenow when indeterminate', () => {
    render(<ProgressBar indeterminate label="Import" />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('runs no transition under reduced motion', () => {
    const reduced = mediaBlock(cssOf('components/progress-bar/ProgressBar.css'), /\(prefers-reduced-motion:\s*reduce\)/)
    expect(reduced).toMatch(/\.fk-progress__fill\s*\{[^}]*transition:\s*none/)
    expect(reduced).toMatch(/animation:\s*none/)
  })

  it('uses system colours in forced-colors mode', () => {
    const forced = mediaBlock(cssOf('components/progress-bar/ProgressBar.css'), /\(forced-colors:\s*active\)/)
    expect(forced).toMatch(/CanvasText/)
    expect(forced).toMatch(/Highlight/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <ProgressBar value={40} label="Upload" />
        <ProgressBar indeterminate label="Import" tone="warning" />
        <ProgressBar value={20} aria-label="Unlabelled" showValue={false} />
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('ProgressBar in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<ProgressBar label="إعادة التشغيل" indeterminate />)
    expect(rtlDom.screen.getByRole('progressbar', { name: 'إعادة التشغيل' })).toBeInTheDocument()
    // The indeterminate sweep runs from the inline start (right) in right-to-left.
    expect(cssOf('components/progress-bar/ProgressBar.css')).toMatch(/animation-name:\s*fk-progress-slide-rtl/)
    await axeRtl(container)
  })
})
