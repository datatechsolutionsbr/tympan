import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { ThemeScope } from '../../internal/ThemeScope'
import { FlagSetPicker } from './FlagSetPicker'

const labels = { a: 'Cite sources', b: 'Require review' }
const strict = { id: 'Strict', label: 'Strict', description: 'Everything on', values: { a: true, b: true } }

describe('FlagSetPicker', () => {
  it('renders two checkboxes and no preset group without presets', () => {
    render(<FlagSetPicker label="Rules" labels={labels} values={{ a: false, b: false }} onChange={() => {}} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByRole('group', { name: 'Rules' })).toBeInTheDocument()
  })

  it('toggling a merges the change and reports no preset', async () => {
    const onChange = vi.fn()
    const onPresetChange = vi.fn()
    render(<FlagSetPicker label="Rules" labels={labels} values={{ a: false, b: true }} onChange={onChange} onPresetChange={onPresetChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Cite sources' }))
    expect(onChange).toHaveBeenCalledWith({ a: true, b: true })
    expect(onPresetChange).toHaveBeenCalledWith(null)
  })

  it('choosing a preset reports exactly its map and id', async () => {
    const onChange = vi.fn()
    const onPresetChange = vi.fn()
    render(
      <FlagSetPicker label="Rules" labels={labels} values={{ a: false, b: false }} presets={[strict]} presetId={null} onChange={onChange} onPresetChange={onPresetChange} />,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Strict' }))
    expect(onChange).toHaveBeenCalledWith({ a: true, b: true })
    expect(onPresetChange).toHaveBeenCalledWith('Strict')
  })

  it('an edit while a preset is active reports the preset as null', async () => {
    const onPresetChange = vi.fn()
    render(<FlagSetPicker label="Rules" labels={labels} values={{ a: true, b: true }} presets={[strict]} presetId="Strict" onChange={() => {}} onPresetChange={onPresetChange} />)
    expect(screen.getByRole('radio', { name: 'Strict' })).toBeChecked()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Require review' }))
    expect(onPresetChange).toHaveBeenCalledWith(null)
  })

  it('uses each description as the checkbox description', () => {
    render(<FlagSetPicker label="Rules" labels={labels} descriptions={{ a: 'Every value links to a source' }} values={{}} onChange={() => {}} />)
    expect(screen.getByRole('checkbox', { name: 'Cite sources' })).toHaveAccessibleDescription('Every value links to a source')
  })

  it('has no axe violations, light and dark', async () => {
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((scheme) => (
          <ThemeScope key={scheme} scheme={scheme}>
            <FlagSetPicker label={`Rules ${scheme}`} labels={labels} descriptions={{ b: 'Two people' }} values={{ a: true }} presets={[strict]} presetId={null} onChange={() => {}} />
          </ThemeScope>
        ))}
      </>,
    )
    await expectNoAxeViolations(container)
  })
})
