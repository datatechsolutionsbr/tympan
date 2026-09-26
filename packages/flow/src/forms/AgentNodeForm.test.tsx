import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../test/axe'
import { AgentNodeForm } from './AgentNodeForm'

const agents = [
  { id: 'a1', name: 'Census coder', model: 'claude-opus-5-5' },
  { id: 'a2', name: 'Reviewer' },
]

describe('AgentNodeForm', () => {
  it('lists supplied agents without calling the loader', async () => {
    const loadAgents = vi.fn()
    const { container } = render(<AgentNodeForm config={{}} agents={agents} loadAgents={loadAgents} agentsHref="/agents" onSave={() => {}} onCancel={() => {}} />)
    expect(loadAgents).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /Saved agent/ }))
    expect(await screen.findByRole('option', { name: /Census coder/ })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expectNoAxeViolations(container)
  })

  it('shows a loading line until the loader resolves', async () => {
    let resolve!: (a: typeof agents) => void
    const loadAgents = () => new Promise<typeof agents>((r) => (resolve = r))
    render(<AgentNodeForm config={{}} loadAgents={loadAgents} agentsHref="/agents" onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved agents')
    resolve(agents)
    await waitFor(() => expect(screen.queryByText('Loading saved agents', { selector: 'span' })).toBeNull())
    expect(screen.getByRole('button', { name: /Saved agent/ })).toBeInTheDocument()
  })

  it('shows the loader error message', async () => {
    render(<AgentNodeForm config={{}} loadAgents={() => Promise.reject(new Error('offline'))} agentsHref="/agents" onSave={() => {}} onCancel={() => {}} />)
    expect(await screen.findByText(/offline/)).toBeInTheDocument()
  })

  it('shows the legacy notice for inline model settings without a reference', () => {
    render(<AgentNodeForm config={{ model: 'm1', systemPrompt: 'x' }} agents={agents} agentsHref="/agents" onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByText(/still carries its own model settings/)).toBeInTheDocument()
  })

  it('saves only kind, reference and prompt', async () => {
    const onSave = vi.fn()
    render(<AgentNodeForm config={{ model: 'm1', temperature: 0.2 }} agents={agents} agentsHref="/agents" onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Saved agent/ }))
    await userEvent.click(await screen.findByRole('option', { name: /Census coder/ }))
    await userEvent.type(screen.getByRole('textbox', { name: /User prompt/ }), 'Summarise {{{{source.text}}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'agent', agentRef: 'a1', userPrompt: 'Summarise {{source.text}}' })
    expect(screen.getAllByText(/claude-opus-5-5/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('agent').length).toBeGreaterThan(0)
  })

  it('reads the older reference key as agentRef', async () => {
    const onSave = vi.fn()
    render(<AgentNodeForm config={{ agentId: 'a2' }} agents={agents} agentsHref="/agents" onSave={onSave} onCancel={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith({ kind: 'agent', agentRef: 'a2' })
  })

  it('offers "New agent" when there are no agents, as a link', () => {
    render(<AgentNodeForm config={{}} agents={[]} agentsHref="/agents" onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('link', { name: 'New agent' })).toHaveAttribute('href', '/agents')
  })
})
