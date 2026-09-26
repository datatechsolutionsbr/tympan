import { Check, Moon, Sun } from 'lucide-react'
import { Button as AriaButton, Switch as AriaSwitch } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type ThemeSwitcherMode = 'light' | 'dark'

export interface ThemeSwitcherProps {
  /** Appearance in use; the host applies and persists it. */
  mode: ThemeSwitcherMode
  onModeChange: (mode: ThemeSwitcherMode) => void
  variant?: 'full' | 'compact'
  /** Constant name of the full switch. */
  label?: string
  toLightLabel?: string
  toDarkLabel?: string
  disabled?: boolean
  className?: string
}

const flip = (m: ThemeSwitcherMode): ThemeSwitcherMode => (m === 'dark' ? 'light' : 'dark')

function Glyph({ of, active }: { of: ThemeSwitcherMode; active?: boolean }) {
  const Icon = of === 'dark' ? Moon : Sun
  return (
    <span className="fk-theme-switcher__glyph" data-glyph={of} data-active={active || undefined} aria-hidden="true">
      <Icon focusable="false" />
    </span>
  )
}

/** Light/dark appearance control, as a switch or a compact button (spec: wave-2/theme-switcher.md). */
export function ThemeSwitcher(props: ThemeSwitcherProps) {
  const copy = useMessages().themeSwitcher
  const next = flip(props.mode)
  const shared = { 'data-mode': props.mode, isDisabled: props.disabled }

  if (props.variant === 'compact') {
    const name = next === 'light' ? (props.toLightLabel ?? copy.toLight) : (props.toDarkLabel ?? copy.toDark)
    return (
      <AriaButton
        {...shared}
        className={cx('fk-theme-switcher', props.className)}
        data-variant="compact"
        aria-label={name}
        onPress={() => props.onModeChange(next)}
      >
        <Glyph of={next} active />
      </AriaButton>
    )
  }

  const name = props.label ?? copy.label
  return (
    <AriaSwitch
      {...shared}
      className={cx('fk-theme-switcher', props.className)}
      data-variant="full"
      isSelected={props.mode === 'dark'}
      onChange={(on) => props.onModeChange(on ? 'dark' : 'light')}
    >
      <Glyph of="light" active={props.mode === 'light'} />
      <span className="fk-theme-switcher__track" aria-hidden="true">
        <span className="fk-theme-switcher__knob">
          <Check className="fk-theme-switcher__knob-check" focusable="false" />
        </span>
      </span>
      <Glyph of="dark" active={props.mode === 'dark'} />
      <span className="fk-theme-switcher__name">{name}</span>
    </AriaSwitch>
  )
}
