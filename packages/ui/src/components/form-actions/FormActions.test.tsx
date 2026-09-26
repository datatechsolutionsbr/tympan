import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { FormActions } from './FormActions'
import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

describe('FormActions', () => {
  it('calls onCancel from the secondary button', async () => {
    const onCancel = vi.fn()
    render(<FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={onCancel} onSave={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('submits the enclosing form when onSave is absent', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={() => {}} />
      </form>,
    )
    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toHaveAttribute('type', 'submit')
    await userEvent.click(save)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables only the primary with saveDisabled', () => {
    render(<FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={() => {}} saveDisabled />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
  })

  it('disables both and exposes busy while saving', async () => {
    const onSave = vi.fn()
    render(<FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={() => {}} onSave={onSave} saving />)
    const primary = screen.getByRole('button', { name: 'Saving' })
    expect(primary).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.click(primary)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('stacks full width below 640 px by layout reversal, keeping DOM order', () => {
    render(<FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={() => {}} />)
    const [first, second] = screen.getAllByRole('button')
    expect(first).toHaveTextContent('Cancel')
    expect(second).toHaveTextContent('Save')
    const phone = mediaBlock(cssOf('components/form-actions/FormActions.css'), /\(max-width:\s*639\.98px\)/)
    expect(phone).toMatch(/flex-direction:\s*column-reverse/)
    expect(phone).toMatch(/inline-size:\s*100%/)
  })

  it('uses the danger variant with an icon and word when destructive', () => {
    render(<FormActions cancelLabel="Keep" saveLabel="Delete edition" onCancel={() => {}} onSave={() => {}} emphasis="destructive" />)
    const primary = screen.getByRole('button', { name: 'Delete edition' })
    expect(primary).toHaveAttribute('data-variant', 'danger')
    expect(primary.querySelector('svg')).not.toBeNull()
  })

  it('renders free children in a group', () => {
    render(
      <FormActions label="Row">
        <button type="button">One</button>
      </FormActions>,
    )
    expect(screen.getByRole('group', { name: 'Row' })).toContainElement(screen.getByRole('button', { name: 'One' }))
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FormActions cancelLabel="Cancel" saveLabel="Save" onCancel={() => {}} onSave={() => {}} />
            <FormActions cancelLabel="Keep" saveLabel="Delete" onCancel={() => {}} onSave={() => {}} emphasis="destructive" saving />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('FormActions in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<FormActions cancelLabel="إلغاء" saveLabel="حفظ" onCancel={() => {}} onSave={() => {}} />)
    expect(rtlDom.screen.getByRole('button', { name: 'حفظ' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
