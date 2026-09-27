import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { cleanToolServers, ToolServerListField, type ToolServer } from './ToolServerListField'

function Controlled({ initial = [], spy, allowCommand }: { initial?: ToolServer[]; spy?: (l: ToolServer[]) => void; allowCommand?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <ToolServerListField
      value={value}
      {...(allowCommand !== undefined ? { allowCommand } : {})}
      onChange={(l) => {
        spy?.(l)
        setValue(l)
      }}
    />
  )
}

describe('ToolServerListField', () => {
  it('adds a blank entry and focuses its prefix field', async () => {
    const spy = vi.fn()
    const { container } = render(<Controlled spy={spy} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add server' }))
    expect(spy).toHaveBeenCalledWith([{}])
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Tool name prefix/ })).toHaveFocus())
    expect(screen.getByRole('status')).toHaveTextContent('Server added')
    await expectNoAxeViolations(container)
  })

  it('stores space-separated arguments as a list', async () => {
    const spy = vi.fn()
    render(<Controlled initial={[{ command: 'x' }]} spy={spy} />)
    await userEvent.type(screen.getByRole('textbox', { name: /Command arguments/ }), 'run -p tool')
    expect(spy).toHaveBeenLastCalledWith([{ command: 'x', args: ['run', '-p', 'tool'] }])
  })

  it('cleans entries: trims, drops blanks, returns undefined when nothing remains', () => {
    expect(cleanToolServers([{}, { url: ' https://x ' }])).toEqual([{ url: 'https://x' }])
    expect(cleanToolServers([{}, { prefix: '  ' }])).toBeUndefined()
  })

  it('hides command and arguments when commands are not allowed', () => {
    render(<Controlled initial={[{}]} allowCommand={false} />)
    expect(screen.queryByRole('textbox', { name: /Local command/ })).toBeNull()
    expect(screen.queryByRole('textbox', { name: /Command arguments/ })).toBeNull()
  })

  it('moves focus to the remaining entry after removing the first', async () => {
    render(<Controlled initial={[{ url: 'https://a' }, { url: 'https://b' }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove server 1' }))
    await waitFor(() => expect(screen.getAllByRole('textbox', { name: /Tool name prefix/ })[0]).toHaveFocus())
    expect(screen.getAllByRole('group', { name: /Server/ })).toHaveLength(1)
  })

  it('warns about an incomplete entry and a malformed address after blur', async () => {
    render(<Controlled initial={[{}]} />)
    expect(screen.getByText(/will be ignored on save/)).toBeInTheDocument()
    const url = screen.getByRole('textbox', { name: /Remote address/ })
    await userEvent.type(url, 'nope')
    await userEvent.tab()
    expect(screen.getByText('Not a valid address.')).toBeInTheDocument()
  })

  it('stacks fields on narrow widths and keeps entry borders in forced colours', () => {
    const css = cssOf('flow/forms/ToolServerListField.css')
    expect(mediaBlock(css, /\(min-width: 768px\)/)).toMatch(/repeat\(2/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })
})
