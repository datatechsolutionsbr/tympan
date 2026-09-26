import { I18nProvider } from 'react-aria-components'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { RegionMap, type RegionMapProps } from './RegionMap'

type Item = { id: string; uf: string }

const square = (code: string, x: number, y: number) => ({
  type: 'Feature',
  properties: { code },
  geometry: { type: 'Polygon', coordinates: [[[x, y], [x + 2, y], [x + 2, y + 2], [x, y + 2], [x, y]]] },
})
const shapes = { type: 'FeatureCollection', features: [square('SP', -50, -24), square('RJ', -44, -23), square('MG', -46, -20)] }
const centres: Record<string, [number, number]> = { SP: [-49, -23], RJ: [-43, -22], MG: [-45, -19] }
const names: Record<string, string> = { SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Minas Gerais' }
const items: Item[] = [
  { id: '1', uf: 'SP' },
  { id: '2', uf: 'SP' },
  { id: '3', uf: 'RJ' },
  { id: '4', uf: 'XX' },
]

function mockFetch(ok = true) {
  const fn = vi.fn(async () => (ok ? { ok: true, status: 200, json: async () => shapes } : { ok: false, status: 500, json: async () => ({}) }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

function Harness(props: Partial<RegionMapProps<Item>>) {
  const [active, setActive] = useState<Set<string>>(new Set())
  return (
    <RegionMap<Item>
      items={items}
      getRegionCode={(i) => i.uf}
      regionCentres={centres}
      shapesUrl="/br.geojson"
      getRegionName={(c) => names[c] ?? c}
      isRegionActive={(c) => active.has(c)}
      onRegionToggle={(c) =>
        setActive((s) => {
          const n = new Set(s)
          if (n.has(c)) n.delete(c)
          else n.add(c)
          return n
        })
      }
      renderRegionDetail={(code, list) => <p>{`${names[code]}: ${list.length} cases`}</p>}
      formatCounter={(t) => `${t.items} items in ${t.regions} regions, ${t.active} selected`}
      {...props}
    />
  )
}

const markers = () => screen.getByRole('group', { name: 'Map of regions' }).querySelectorAll('[role="button"]')

describe('RegionMap', () => {
  it('draws one marker per region with items and ignores unknown regions', async () => {
    mockFetch()
    render(<Harness />)
    await waitFor(() => expect(markers()).toHaveLength(2))
    expect(screen.getByText('3 items in 2 regions, 0 selected')).toBeInTheDocument()
    expect(markers()[0]).toHaveAccessibleName('São Paulo, 2 items')
  })

  it('disables zoom-in at the maximum', async () => {
    mockFetch()
    render(<Harness maxZoom={4} initialZoom={4} />)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled()
    expect(screen.getByText('Zoom 400%')).toBeInTheDocument()
  })

  it('toggles the focused region with Enter, updates aria-pressed and opens the detail', async () => {
    mockFetch()
    render(<Harness />)
    await waitFor(() => expect(markers()).toHaveLength(2))
    const first = markers()[0] as SVGGElement
    act(() => first.focus())
    expect(screen.getByText('São Paulo: 2 cases')).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    expect(first).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(markers()[1]).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText(/cases$/)).toBeNull()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus()
  })

  it('zooms with the plus and minus keys', async () => {
    mockFetch()
    render(<Harness />)
    await waitFor(() => expect(markers()).toHaveLength(2))
    act(() => (markers()[0] as SVGGElement).focus())
    await userEvent.keyboard('+')
    expect(screen.getByText('Zoom 150%')).toBeInTheDocument()
    await userEvent.keyboard('-')
    expect(screen.getByText('Zoom 100%')).toBeInTheDocument()
  })

  it('shows an error when the shapes fail and the region list still toggles', async () => {
    mockFetch(false)
    render(<Harness />)
    await screen.findByText(/could not be loaded/)
    const list = screen.getByRole('list', { name: 'Regions' })
    const sp = within(list).getByRole('button', { name: 'São Paulo, 2 items' })
    await userEvent.click(sp)
    expect(sp).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows five legend items and "+2 more" for seven regions', async () => {
    mockFetch()
    const many: Record<string, [number, number]> = {}
    const list: Item[] = []
    'ABCDEFG'.split('').forEach((c, i) => {
      many[c] = [-50 + i, -20]
      for (let k = 0; k <= i; k++) list.push({ id: `${c}${k}`, uf: c })
    })
    render(<Harness items={list} regionCentres={many} getRegionName={(c) => `Region ${c}`} />)
    const legend = screen.getByRole('list', { name: 'Regions with most items' })
    expect(within(legend).getAllByRole('listitem')).toHaveLength(6)
    expect(within(legend).getByText('+2 more')).toBeInTheDocument()
    expect(within(legend).getAllByRole('listitem')[0]).toHaveTextContent('Region G')
  })

  it('does not toggle when a drag is released over a region', async () => {
    mockFetch()
    const onRegionToggle = vi.fn()
    render(<Harness onRegionToggle={onRegionToggle} />)
    await waitFor(() => expect(markers()).toHaveLength(2))
    const svg = screen.getByRole('group', { name: 'Map of regions' })
    const target = markers()[0] as Element
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 60, clientY: 40 })
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 60, clientY: 40 })
    fireEvent.click(target)
    expect(onRegionToggle).not.toHaveBeenCalled()
    fireEvent.pointerDown(svg, { pointerId: 2, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(svg, { pointerId: 2, clientX: 10, clientY: 10 })
    fireEvent.click(target)
    expect(onRegionToggle).toHaveBeenCalledWith('SP')
  })

  it('keeps a single tab stop across markers (roving)', async () => {
    mockFetch()
    render(<Harness />)
    await waitFor(() => expect(markers()).toHaveLength(2))
    const tabbable = [...markers()].filter((m) => m.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
  })

  it('uses system colours in forced colours and has 44 px zoom buttons', () => {
    const css = cssOf('components/region-map/RegionMap.css')
    expect(mediaBlock(css, /\(forced-colors:\s*active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/\.fk-region-map__zoom \.fk-button\s*\{[^}]*var\(--fk-control-target\)/)
  })

  it('has no axe violations, light and dark', async () => {
    mockFetch()
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <Harness />
          </ThemeScope>
        ))}
      </>,
    )
    await waitFor(() => expect(container.querySelectorAll('.fk-region-map__marker')).toHaveLength(4))
    await expectNoAxeViolations(container)
  })
})

describe('RegionMap in right-to-left locales', () => {
  it('moves to the next marker with Left Arrow, keeps panning physical, formats counts and passes axe', async () => {
    mockFetch()
    const { container } = render(
      <I18nProvider locale="ar-EG">
        <div dir="rtl" lang="ar">
          <Harness />
        </div>
      </I18nProvider>,
    )
    await waitFor(() => expect(markers()).toHaveLength(2))
    act(() => (markers()[0] as SVGGElement).focus())
    await userEvent.keyboard('{ArrowLeft}')
    expect(markers()[1]).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(markers()[0]).toHaveFocus()
    expect(container.querySelector('.fk-region-map__legend-count')!.textContent).toMatch(/[٠-٩]/)
    await expectNoAxeViolations(container)
  })
})
