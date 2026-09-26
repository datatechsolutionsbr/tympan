import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileText } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { TextField } from '../text-field/TextField'
import { FieldGrid, FieldGridItem, FormContainer, FormSection, FramedForm, InlineRow } from './FormLayout'

describe('FormLayout', () => {
  it('FramedForm is a form named by its title with header, body and footer', () => {
    render(
      <FramedForm title="New source" subtitle="Where the search began" icon={<FileText />} submitLabel="Save" onSubmit={() => {}}>
        <TextField label="Name" />
      </FramedForm>,
    )
    const form = screen.getByRole('form', { name: 'New source' })
    expect(form.querySelector('.fk-form-layout__header')).not.toBeNull()
    expect(form.querySelector('.fk-form-layout__footer')).not.toBeNull()
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('shows no cancel button without onCancel', () => {
    render(
      <FramedForm title="Form" submitLabel="Save" cancelLabel="Cancel" onSubmit={() => {}}>
        <TextField label="Name" />
      </FramedForm>,
    )
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('submits once on Enter without reloading', async () => {
    const onSubmit = vi.fn()
    render(
      <FramedForm title="Form" submitLabel="Save" onSubmit={onSubmit}>
        <TextField label="Name" />
      </FramedForm>,
    )
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Boti{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]![0].defaultPrevented).toBe(true)
  })

  it('disables submit and marks the form busy', () => {
    render(
      <FramedForm title="Form" submitLabel="Save" onSubmit={() => {}} busy>
        <TextField label="Name" />
      </FramedForm>,
    )
    expect(screen.getByRole('form', { name: 'Form' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Saving' })).toHaveAttribute('aria-busy', 'true')
  })

  it('FieldGrid is one column below 640 px and two above', () => {
    const { container } = render(
      <FieldGrid>
        <FieldGridItem>
          <TextField label="A" />
        </FieldGridItem>
        <FieldGridItem span="full">
          <TextField label="B" />
        </FieldGridItem>
      </FieldGrid>,
    )
    expect(container.querySelector('[data-part="grid"]')).toHaveAttribute('data-columns', '2')
    const css = cssOf('components/form-layout/FormLayout.css')
    expect(css).toMatch(/\[data-part='grid'\]\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(mediaBlock(css, /\(min-width:\s*640px\)/)).toMatch(/repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  })

  it('FormSection is a group labelled by a heading at the requested level', () => {
    render(
      <FormSection title="Identification" headingLevel={4}>
        <TextField label="Name" />
      </FormSection>,
    )
    const heading = screen.getByRole('heading', { level: 4, name: 'Identification' })
    expect(screen.getByRole('group', { name: 'Identification' })).toContainElement(heading)
  })

  it('FormSection can be a fieldset with a legend', () => {
    render(
      <FormSection title="Answer" asFieldset>
        <TextField label="Name" />
      </FormSection>,
    )
    expect(screen.getByRole('group', { name: 'Answer' }).tagName).toBe('FIELDSET')
  })

  it('FormContainer prevents the native submission when a handler is given', async () => {
    const onSubmit = vi.fn()
    render(
      <FormContainer onSubmit={onSubmit} aria-label="Search">
        <InlineRow>
          <TextField label="Query" />
          <button type="submit">Go</button>
        </InlineRow>
      </FormContainer>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]![0].defaultPrevented).toBe(true)
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FramedForm title={`Form ${scheme}`} submitLabel="Save" cancelLabel="Cancel" onCancel={() => {}} onSubmit={() => {}}>
              <FormSection title="Section">
                <FieldGrid>
                  <FieldGridItem>
                    <TextField label="A" />
                  </FieldGridItem>
                </FieldGrid>
              </FormSection>
            </FramedForm>
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
