import { X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Button as AriaButton,
  Link as AriaLink,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  type Key,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMessages } from '../../internal/provider'

export type TagTone = 'neutral' | 'accent' | 'category'
export type TagSize = 'small' | 'regular' | 'large'

export interface TagProps {
  tone?: TagTone
  /** Categorical token (1 to 8) for `tone="category"`; shown as a small square only. */
  categoryIndex?: number
  size?: TagSize
  icon?: ReactNode
  onPress?: () => void
  href?: string
  removable?: boolean
  onRemove?: () => void
  /** Accessible name of the remove button; must include the tag text. */
  removeLabel?: string
  children: ReactNode
  className?: string
}

function categoryStyle(index: number | undefined): CSSProperties | undefined {
  if (!index) return undefined
  const n = ((Math.max(1, Math.round(index)) - 1) % 8) + 1
  return { '--fk-tag-category': `var(--fk-chart-${n})` } as CSSProperties
}

function Leading({ tone, categoryIndex, icon }: Pick<TagProps, 'tone' | 'categoryIndex' | 'icon'>) {
  if (icon) {
    return (
      <span className="fk-tag__icon" aria-hidden="true">
        {icon}
      </span>
    )
  }
  if (tone === 'category') return <span className="fk-tag__swatch" aria-hidden="true" style={categoryStyle(categoryIndex)} />
  return null
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return ''
}

/** Small label for static metadata, optionally pressable or removable (spec: wave-1/tag.md). */
export function Tag({
  tone = 'neutral',
  categoryIndex,
  size = 'regular',
  icon,
  onPress,
  href,
  removable = false,
  onRemove,
  removeLabel,
  children,
  className,
}: TagProps) {
  const messages = useMessages()
  const text = textOf(children)
  devWarning(removable && !onRemove, 'Tag: `removable` requires `onRemove`.')
  const common = {
    'data-tone': tone,
    'data-size': size,
    'data-interactive': onPress || href ? true : undefined,
  }
  const inner = (
    <>
      <Leading tone={tone} categoryIndex={categoryIndex} icon={icon} />
      <span className="fk-tag__text" title={text || undefined}>
        {children}
      </span>
    </>
  )

  let body: ReactNode
  if (href) {
    body = (
      <AriaLink href={href} onPress={onPress} className={cx('fk-tag', className)} {...common}>
        {inner}
      </AriaLink>
    )
  } else if (onPress) {
    body = (
      <AriaButton onPress={onPress} className={cx('fk-tag', className)} {...common}>
        {inner}
      </AriaButton>
    )
  } else {
    body = (
      <span className={cx('fk-tag', className)} {...common} data-removable={removable || undefined}>
        {inner}
        {removable ? (
          <AriaButton className="fk-tag__remove" aria-label={removeLabel ?? messages.tag.remove(text)} onPress={() => onRemove?.()}>
            <X aria-hidden="true" focusable="false" />
          </AriaButton>
        ) : null}
      </span>
    )
  }
  return body
}

export interface TagListItem {
  id: string
  label: string
  tone?: TagTone
  categoryIndex?: number
  icon?: ReactNode
}

export interface TagListProps {
  /** Accessible name of the tag group. */
  label: string
  items: TagListItem[]
  /** Called for a removed tag (remove button, Delete or Backspace). */
  onRemove?: (id: string) => void
  size?: TagSize
  className?: string
}

/** A set of tags; removable sets follow the grid-like tag group pattern (RAC TagGroup). */
export function TagList({ label, items, onRemove, size = 'regular', className }: TagListProps) {
  const messages = useMessages()
  return (
    <AriaTagGroup
      aria-label={label}
      className={cx('fk-tag-list', className)}
      onRemove={onRemove ? (keys: Set<Key>) => keys.forEach((k) => onRemove(String(k))) : undefined}
    >
      <AriaTagList className="fk-tag-list__items" items={items}>
        {(item) => (
          <AriaTag
            id={item.id}
            textValue={item.label}
            className="fk-tag"
            data-tone={item.tone ?? 'neutral'}
            data-size={size}
            data-removable={onRemove ? true : undefined}
          >
            <Leading tone={item.tone} categoryIndex={item.categoryIndex} icon={item.icon} />
            <span className="fk-tag__text" title={item.label}>
              {item.label}
            </span>
            {onRemove ? (
              <AriaButton slot="remove" className="fk-tag__remove" aria-label={messages.tag.remove(item.label)}>
                <X aria-hidden="true" focusable="false" />
              </AriaButton>
            ) : null}
          </AriaTag>
        )}
      </AriaTagList>
    </AriaTagGroup>
  )
}
