import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { TextField } from '../text-field/TextField'
import { Field, FieldLabel, Fieldset, FieldStack, useField } from './Field'

import * as rtlDom from '@testing-library/react'
import { expectNoAxeViolations as axeRtl } from '../../../test/axe'
import { renderRtl } from '../../../test/rtl'

function NativeInput() {
  const field = useField()
  return <input id={field?.controlId} aria-describedby={field?.describedBy} aria-invalid={field?.invalid || undefined} />
}

describe('Field', () => {
  it('points the label at a TextField without ids', () => {
    render(
      <Field label="Name">
        <TextField />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(screen.getByText('Name').closest('label')).toHaveAttribute('for', input.id)
  })

  it('targets an explicit id on the control', () => {
    render(
      <Field label="Name">
        <TextField id="person-name" />
      </Field>,
    )
    expect(screen.getByText('Name').closest('label')).toHaveAttribute('for', 'person-name')
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('id', 'person-name')
  })

  it('lets an explicit for on the label win over the context id', () => {
    render(
      <Field>
        <FieldLabel htmlFor="custom">City</FieldLabel>
        <input id="custom" />
      </Field>,
    )
    expect(screen.getByLabelText('City')).toHaveAttribute('id', 'custom')
  })

  it('hides the hint, describes the error and marks the control invalid', () => {
    render(
      <Field label="Email" hint="Work address" errorMessage="Enter a valid email">
        <TextField />
      </Field>,
    )
    expect(screen.queryByText('Work address')).not.toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Enter a valid email')
  })

  it('lists hint in aria-describedby for native controls', () => {
    render(
      <Field label="Year" hint="Four digits">
        <NativeInput />
      </Field>,
    )
    expect(screen.getByLabelText('Year')).toHaveAccessibleDescription('Four digits')
  })

  it('makes the control required and reads the marker as text', () => {
    render(
      <Field label="Title" required>
        <TextField />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: /Title/ })
    expect(input).toBeRequired()
    expect(screen.getByText(/\(required\)/)).toBeInTheDocument()
  })

  it('disables every nested control in a disabled Fieldset', () => {
    render(
      <Fieldset legend="Address" disabled>
        <Field label="Street">
          <TextField />
        </Field>
        <Field label="Number">
          <NativeInput />
        </Field>
      </Fieldset>,
    )
    expect(screen.getByRole('textbox', { name: 'Street' })).toBeDisabled()
    expect(screen.getByLabelText('Number')).toBeDisabled()
  })

  it('names the group by its legend', () => {
    render(
      <Fieldset legend="Contact" description="How we reach you">
        <FieldStack>
          <Field label="Phone">
            <TextField />
          </Field>
        </FieldStack>
      </Fieldset>,
    )
    const group = screen.getByRole('group', { name: 'Contact' })
    expect(group).toHaveAccessibleDescription('How we reach you')
  })

  it('works for a control outside any Field with its own id', () => {
    render(<TextField id="solo" label="Solo" />)
    expect(screen.getByRole('textbox', { name: 'Solo' })).toHaveAttribute('id', 'solo')
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <Fieldset legend="Profile">
        <Field label="Name" hint="As in documents" required>
          <TextField />
        </Field>
        <Field label="Email" errorMessage="Invalid">
          <TextField />
        </Field>
      </Fieldset>,
    )
    await expectNoAxeViolations(container)
  })
})

describe('Field in right-to-left (ar)', () => {
  it('renders mirrored where directional and passes axe', async () => {
    const { container } = renderRtl(<Field label="سنة الإطلاق" hint="أربعة أرقام." controlId="rtl-year"><input id="rtl-year" /></Field>)
    expect(rtlDom.screen.getByRole('textbox', { name: 'سنة الإطلاق' })).toBeInTheDocument()
    await axeRtl(container)
  })
})
