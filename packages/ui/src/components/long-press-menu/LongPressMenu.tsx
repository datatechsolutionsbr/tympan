import { useId, useState, type ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink, Menu, MenuItem, MenuTrigger, Popover, Text } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import { useMenuRequest } from '../../internal/overlays-nav/hold'
import { useMessages } from '../../internal/provider'

export interface LongPressMenuItem {
  label: string
  icon?: ReactNode
  href?: string
  onAction?: () => void
  tone?: 'neutral' | 'danger'
}

export interface LongPressMenuProps {
  children: ReactNode
  items: LongPressMenuItem[]
  /** Primary navigation on tap. */
  href?: string
  /** Primary action on tap (wins over `href`). */
  onTap?: () => void
  /** A tap opens the menu instead of the primary action. */
  tapOpensMenu?: boolean
  /** Accessible name of the trigger. */
  label: string
  className?: string
}


/**
 * A tile whose tap runs its primary action while a long press, right click,
 * Shift+F10 or the context-menu key lists secondary actions
 * (spec: wave-2/long-press-menu.md).
 */
export function LongPressMenu(props: LongPressMenuProps) {
  const hint = useMessages().longPressMenu.hint
  const hintId = useId()
  const [open, setOpenState] = useState(false)
  const setOpen = (next: boolean) => {
    if (next && !open) requestHaptic('light')
    setOpenState(next)
  }

  const request = useMenuRequest(() => setOpen(true))

  const tap = () => {
    if (request.consumed()) return
    if (props.tapOpensMenu) setOpen(true)
    else props.onTap?.()
  }

  const triggerCommon = {
    className: 'fk-long-press-menu__trigger',
    'aria-label': props.label,
    'aria-describedby': hintId,
    'aria-haspopup': 'menu' as const,
  }
  const asLink = !!props.href && !props.onTap && !props.tapOpensMenu
  const trigger = asLink ? (
    <AriaLink {...triggerCommon} href={props.href}>
      {props.children}
    </AriaLink>
  ) : (
    <AriaButton {...triggerCommon} onPress={tap}>
      {props.children}
    </AriaButton>
  )

  const run = (key: React.Key) => {
    const item = props.items[Number(key)]
    item?.onAction?.()
  }

  return (
    <span className={cx('fk-long-press-menu', props.className)} {...request.props}>
      {/* Presses reach the menu trigger too; only closing (or tapOpensMenu) is accepted from it. */}
      <MenuTrigger isOpen={open} onOpenChange={(next) => (!next || props.tapOpensMenu ? setOpen(next) : undefined)}>
        {trigger}
        <Popover className="fk-long-press-menu__popover" placement="bottom start" offset={6}>
          <Menu className="fk-long-press-menu__menu" aria-label={props.label} autoFocus="first" onAction={run}>
            {props.items.map((item, i) => (
              <MenuItem key={i} id={String(i)} href={item.href} textValue={item.label} className="fk-long-press-menu__item" data-tone={item.tone ?? 'neutral'}>
                {item.icon ? (
                  <span className="fk-long-press-menu__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <Text slot="label">{item.label}</Text>
              </MenuItem>
            ))}
          </Menu>
        </Popover>
      </MenuTrigger>
      <span id={hintId} className="fk-visually-hidden">
        {hint}
      </span>
    </span>
  )
}
