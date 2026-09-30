import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { defineTympanElement } from '../../src/elements/base'
import { TySegmentedControlElement } from '../../src/elements/segmented-control/element'

defineTympanElement(TySegmentedControlElement)

describe('debug', () => {
  it('traces keyboard commits', async () => {
    const host = document.createElement('div')
    host.innerHTML = `<ty-segmented-control label="Period" options='["Day","Week","Month"]'></ty-segmented-control>`
    document.body.append(host)
    const el = host.querySelector('ty-segmented-control')!
    const dump = (tag: string) => {
      const states = Array.from(el.querySelectorAll('.ty-segmented-control__segment')).map((s) => `${s.getAttribute('data-value')}:${s.getAttribute('aria-checked')}:${s.getAttribute('tabindex')}`)
      console.log(tag, '| value attr:', el.getAttribute('value'), '| segments:', states.join(' '), '| focused:', (document.activeElement as HTMLElement)?.getAttribute?.('data-value'))
    }
    dump('after connect')
    const day = el.querySelector('.ty-segmented-control__segment') as HTMLElement
    day.focus()
    await userEvent.keyboard('{ArrowLeft}')
    dump('after ArrowLeft')
    await userEvent.keyboard('{ArrowRight}')
    dump('after ArrowRight')
    expect(true).toBe(true)
  })
})
