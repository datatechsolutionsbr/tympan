// Local stand-ins used by the agent editors until the design system's wave 2
// lands: an agent mark, a step list, choice tiles and a tag field. They follow
// the wave-2 intent (StepList, ChoiceTile, TagField) but are not exported as
// design-system components.

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Button as AriaButton, Radio, RadioGroup, Label } from 'react-aria-components'
import { Bot, Check, X } from 'lucide-react'
import { TextField } from '@fakhir/design-system'
import { fill } from '../internal/labels'

/** Agent mark (design direction §2.11): a square with a dashed border and a bot icon; an image may fill it. */
export function AgentMark({ image, size = 'md' }: { image?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const src = image && !failed && /^(https?:|data:|blob:|\/)/.test(image) ? image : null
  return (
    <span className="fk-agent-mark" data-size={size} aria-hidden="true">
      {src ? <img src={src} alt="" onError={() => setFailed(true)} /> : <Bot focusable="false" />}
    </span>
  )
}

export interface StepListProps {
  steps: string[]
  /** 1-based current step. */
  current: number
  /** Steps before this one (1-based) are completed and can be jumped to. */
  reached: number
  label: string
  completedWord: string
  onJump: (step: number) => void
  locale?: string
}

/** Ordered list of steps; the current one has aria-current="step", completed ones are buttons. */
export function StepList({ steps, current, reached, label, completedWord, onJump, locale }: StepListProps) {
  return (
    <ol className="fk-step-list" aria-label={label}>
      {steps.map((name, i) => {
        const n = i + 1
        const state = n === current ? 'current' : n < reached || n < current ? 'done' : 'future'
        return (
          <li key={name} className="fk-step-list__item" data-state={state} aria-current={n === current ? 'step' : undefined}>
            {state === 'done' ? (
              <AriaButton className="fk-step-list__jump" onPress={() => onJump(n)}>
                <span className="fk-step-list__marker" aria-hidden="true">
                  <Check focusable="false" />
                </span>
                <span className="fk-step-list__name">{name}</span>
                <span className="fk-visually-hidden">, {completedWord}</span>
              </AriaButton>
            ) : (
              <span className="fk-step-list__static">
                <span className="fk-step-list__marker" aria-hidden="true">
                  {new Intl.NumberFormat(locale).format(n)}
                </span>
                <span className="fk-step-list__name">{name}</span>
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export interface ChoiceTile {
  value: string
  title: string
  detail?: string
  icon?: ReactNode
}

/** Radio group drawn as tiles (APG Radio Group); selection marked by a check, not colour alone. */
export function ChoiceTiles({ label, tiles, value, onChange, hideLabel = false }: { label: string; tiles: ChoiceTile[]; value: string | null; onChange: (v: string) => void; hideLabel?: boolean }) {
  return (
    <RadioGroup className="fk-choice-tiles" value={value} onChange={onChange} aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="fk-choice-tiles__label">{label}</Label>}
      <div className="fk-choice-tiles__grid">
        {tiles.map((t) => (
          <Radio key={t.value} value={t.value} className="fk-choice-tile" aria-label={t.detail ? `${t.title}, ${t.detail}` : t.title}>
            {({ isSelected }) => (
              <>
                {t.icon ? (
                  <span className="fk-choice-tile__icon" aria-hidden="true">
                    {t.icon}
                  </span>
                ) : null}
                <span className="fk-choice-tile__text">
                  <span className="fk-choice-tile__title">{t.title}</span>
                  {t.detail ? <span className="fk-choice-tile__detail">{t.detail}</span> : null}
                </span>
                <span className="fk-choice-tile__check" aria-hidden="true">
                  {isSelected ? <Check focusable="false" /> : null}
                </span>
              </>
            )}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

/** Tag field stand-in: type and press Enter (or comma) to add; each tag has a remove button. */
export function TagInput({ label, value, onChange, placeholder, removeLabel }: { label: string; value: string[]; onChange: (tags: string[]) => void; placeholder?: string; removeLabel: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim().replace(/,$/, '').trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="fk-tag-input">
      <div
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault()
            e.stopPropagation()
            add()
          }
        }}
      >
        <TextField label={label} value={draft} onChange={setDraft} {...(placeholder ? { placeholder } : {})} onBlur={add} />
      </div>
      {value.length ? (
        <ul className="fk-tag-input__list" aria-label={label}>
          {value.map((t) => (
            <li key={t} className="fk-tag-input__tag">
              <span>{t}</span>
              <AriaButton className="fk-tag-input__remove" aria-label={fill(removeLabel, { tag: t })} onPress={() => onChange(value.filter((x) => x !== t))}>
                <X focusable="false" aria-hidden="true" />
              </AriaButton>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Overrides a React Aria slider thumb's aria-valuetext (React Aria only formats numbers). */
export function useValueText(inputRef: RefObject<HTMLInputElement | null>, text: string) {
  const last = useRef(text)
  last.current = text
  useLayoutEffect(() => {
    inputRef.current?.setAttribute('aria-valuetext', last.current)
  })
}
