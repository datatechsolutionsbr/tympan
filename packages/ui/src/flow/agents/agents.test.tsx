import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { createDialogStack, DialogStackProvider } from '../state/dialogStack'
import { AgentCreationWizard, type AgentCreationWizardProps } from './AgentCreationWizard'
import { AgentEditorDialog, type AgentModel, type AgentProvider } from './AgentEditorDialog'

const models: AgentModel[] = [
  { id: 'small-1', name: 'Small', family: 'alpha', capability: 10, contextSize: 32000, outputLimit: 4000 },
  { id: 'mid-2', name: 'Mid', family: 'alpha', capability: 50, contextSize: 128000, outputLimit: 8000 },
  { id: 'deep-3', name: 'Deep', family: 'beta', capability: 90, reasoning: true, contextSize: 200000, outputLimit: 32000 },
]
const providers: AgentProvider[] = [{ id: 'p-alpha', name: 'Alpha cloud', families: ['alpha'], configured: true }]

function openEditor(onPersist = vi.fn(async () => {}), agent: Record<string, unknown> | undefined = { id: 'a1', name: 'coder', model: 'small-1' }, wrap?: (ui: React.ReactElement) => React.ReactElement) {
  const stack = createDialogStack()
  const ui = (
    <DialogStackProvider stack={stack}>
      <AgentEditorDialog onPersist={onPersist} models={models} providers={providers} credentialsHref="/account/credentials" saveDelay={250} />
    </DialogStackProvider>
  )
  const view = render(wrap ? wrap(ui) : ui)
  act(() => stack.open('agent-editor', { mode: agent ? 'edit' : 'create', ...(agent ? { agent } : {}) }))
  return { ...view, stack, onPersist }
}

describe('AgentEditorDialog', () => {
  it('never persists when nothing is edited', async () => {
    const { onPersist } = openEditor()
    await new Promise((r) => setTimeout(r, 300))
    expect(onPersist).not.toHaveBeenCalled()
  })

  it('persists once with the new name after the idle delay', async () => {
    const { onPersist } = openEditor()
    const name = await screen.findByRole('textbox', { name: 'Agent name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'reviewer')
    await waitFor(() => expect(onPersist).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 300))
    expect(onPersist).toHaveBeenCalledTimes(1)
    expect((onPersist.mock.calls as unknown[][])[0]![0]).toMatchObject({ name: 'reviewer', model: 'small-1', provider: 'p-alpha' })
  })

  it('shows "Not saved" and Retry when persisting fails', async () => {
    openEditor(vi.fn(async () => Promise.reject(new Error('offline'))))
    await userEvent.type(await screen.findByRole('textbox', { name: 'Agent name' }), 'x')
    expect(await screen.findByText('Not saved')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('selects a more capable model when the capability slider moves up and names the tier', async () => {
    openEditor()
    const slider = await screen.findByRole('slider', { name: /Capability/ })
    slider.focus()
    await userEvent.keyboard('{End}')
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringMatching(/advanced/i))
    expect(screen.getAllByText(/deep-3|Deep/).length).toBeGreaterThan(0)
  })

  it('replaces the temperature with reasoning effort for a reasoning model', async () => {
    openEditor(undefined, { id: 'a2', name: 'thinker', model: 'deep-3' })
    await userEvent.click(await screen.findByRole('tab', { name: 'Instructions' }))
    expect(screen.queryByRole('slider', { name: /Sampling/ })).toBeNull()
    expect(screen.getByRole('radiogroup', { name: 'Reasoning effort' })).toBeInTheDocument()
  })

  it('warns when no configured provider serves the model family', async () => {
    openEditor(undefined, { id: 'a3', name: 'x', model: 'deep-3' })
    expect(await screen.findByText('No configured provider serves this model family.')).toBeInTheDocument()
  })

  it('moves between sections from the rail with Down Arrow and Enter', async () => {
    openEditor()
    const engine = await screen.findByRole('tab', { name: 'Engine' })
    engine.focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByRole('tab', { name: 'Instructions' })).toHaveAttribute('aria-selected', 'true')
  })

  it('is a named dialog without axe violations, and uses the agent language (square mark, word agent)', async () => {
    openEditor()
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('.ty-agent-mark')).not.toBeNull()
    expect(dialog).toHaveTextContent('agent')
    await expectNoAxeViolations(dialog)
  })

  it('works under an Arabic provider (rail tabs by keyboard) and picks Portuguese strings under pt-BR', async () => {
    openEditor(undefined, undefined, (ui) => <TympanProvider locale="ar">{ui}</TympanProvider>)
    const first = await screen.findAllByRole('tab')
    first[0]!.focus()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(first[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('has reduced-motion and forced-colour rules for the slider, status and autonomy levels', () => {
    const css = cssOf('flow/agents/agents.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/\.ty-agent-autonomy__level\s*\{[^}]*min-block-size:\s*44px/)
  })
})

function Wizard(props: Partial<AgentCreationWizardProps>) {
  return (
    <AgentCreationWizard
      models={[{ id: 'm1', name: 'Model one' }, { id: 'm2', name: 'Model two' }]}
      connections={[{ id: 'c1', name: 'Research account', provider: 'Alpha cloud' }]}
      presets={[{ id: 'p-coder', name: 'Station coder', role: 'Codes assertions from sources' }]}
      onSubmit={vi.fn(async () => {})}
      onCancel={vi.fn()}
      {...props}
    />
  )
}

describe('AgentCreationWizard', () => {
  it('clamps an out-of-range initial step to the review step', () => {
    render(<Wizard initialStep={9} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Review')
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument()
  })

  it('stays on identity with an error when Next is used with an empty name', async () => {
    render(<Wizard initialStep={2} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Identity')
    expect(screen.getByText('Give the agent a name.')).toBeInTheDocument()
  })

  it('pre-fills name and role from a chosen preset', async () => {
    render(<Wizard />)
    await userEvent.click(screen.getByRole('radio', { name: /Station coder/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Station coder')
    expect(screen.getByRole('textbox', { name: 'Role' })).toHaveValue('Codes assertions from sources')
  })

  it('jumps from the review to the model step and reports it', async () => {
    const onStepChange = vi.fn()
    render(<Wizard initialStep={5} onStepChange={onStepChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Edit Model' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Model')
    expect(onStepChange).toHaveBeenCalledWith(3)
  })

  it('cancels without confirmation when nothing was touched', async () => {
    const onCancel = vi.fn()
    const confirm = vi.fn(async () => true)
    render(<Wizard onCancel={onCancel} confirm={confirm} />)
    screen.getByRole('heading', { level: 1 }).focus()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('keeps values and shows the message when creation fails', async () => {
    const onSubmit = vi.fn(async () => Promise.reject(new Error('quota exceeded')))
    render(<Wizard initialStep={2} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'Stage counter')
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.click(screen.getByRole('button', { name: 'Create agent' }))
    expect(await screen.findByText('quota exceeded')).toBeInTheDocument()
    expect(screen.getAllByText('Stage counter').length).toBeGreaterThan(0)
    expect((onSubmit.mock.calls as unknown[][])[0]![0]).toMatchObject({ name: 'Stage counter', model: 'm1', connectionId: 'c1' })
  })

  it('advances with Enter when focus is not in a field, and moves focus to the step heading', async () => {
    const { container } = render(<Wizard />)
    screen.getByRole('heading', { level: 1 }).focus()
    await userEvent.keyboard('{Enter}')
    const h = screen.getByRole('heading', { level: 1 })
    expect(h).toHaveTextContent('Identity')
    await waitFor(() => expect(h).toHaveFocus())
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Identity')
    await expectNoAxeViolations(container)
  })

  it('works right to left and in Portuguese', async () => {
    function Host() {
      const [step, setStep] = useState(1)
      return (
        <TympanProvider locale="ar">
          <div dir="rtl">
            <Wizard initialStep={step} onStepChange={setStep} />
          </div>
        </TympanProvider>
      )
    }
    const { unmount } = render(<Host />)
    screen.getByRole('heading', { level: 1 }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Identity')
    unmount()
    render(
      <TympanProvider locale="pt-BR">
        <Wizard />
      </TympanProvider>,
    )
    expect(screen.getByRole('button', { name: 'Avançar' })).toBeInTheDocument()
  })
})
