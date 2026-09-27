import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductMark } from './ProductMark'
import { PRODUCT_MARKS } from './marks'

describe('ProductMark', () => {
  it('is an image named after the product by default', () => {
    render(<ProductMark product="fakhir" />)
    expect(screen.getByRole('img', { name: 'Fakhir' })).toBeInTheDocument()
  })

  it('is hidden from assistive technology when decorative', () => {
    const { container } = render(<ProductMark product="tympan" decorative />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('draws the ink in currentColor and the dot in --ty-mark-accent', () => {
    const { container } = render(<ProductMark product="astrlabe" variant="horizontal" />)
    const fills = [...container.querySelectorAll('path')].map((p) => p.getAttribute('fill'))
    expect(fills).toContain('currentColor')
    expect(fills.some((f) => f?.includes('--ty-mark-accent'))).toBe(true)
  })

  it('draws Tympan as its plate mark: three circles and the horizon', () => {
    const { container } = render(<ProductMark product="tympan" />)
    expect(container.querySelectorAll('circle')).toHaveLength(3)
    expect(container.querySelectorAll('line')).toHaveLength(1)
  })

  it('has symbol and horizontal artwork for every other product, each with one accent path', () => {
    for (const product of ['fakhir', 'astrlabe', 'datatech'] as const) {
      for (const variant of ['symbol', 'horizontal'] as const) {
        const art = PRODUCT_MARKS[product][variant]
        expect(art.paths.filter((p) => p.tone === 'accent')).toHaveLength(1)
        expect(art.viewBox.split(' ')).toHaveLength(4)
      }
    }
  })
})
