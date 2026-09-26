// Small pieces the agent editors share while the design system's wave 2 is
// pending (its StepList, ChoiceTile and TagField intents). Not exported as
// design-system components.

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { Button as AriaButton, Label, Radio, RadioGroup } from 'react-aria-components'
import { Bot, Check, X } from 'lucide-react'
import { TextField } from '@fakhir/design-system'
import { fill } from '../internal/labels'

const SAFE_IMAGE = /^(https?:|data:|blob:|\/)/

/** The agent's mark (design direction §2.11): dashed square with a bot glyph, or the agent's own image. */
export function AgentMark({ image, size = 'md' }: { image?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false)
  const usable = !broken && !!image && SAFE_IMAGE.test(image)
  const face = usable ? <img src={image!} alt="" onError={() => setBroken(true)} /> : <Bot focusable="false" />
  return (
    <span className="fk-agent-mark" data-size={size} aria-hidden="true">
      {face}
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

type StepState = 'done' | 'current' | 'future'

const stepState = (n: number, current: number, reached: number): StepState => (n === current ? 'current' : n < Math.max(current, reached) ? 'done' : 'future')

/** Ordered list of the wizard's steps; finished steps are buttons, the current one is marked for assistive tech. */
export function StepList({ steps, current, reached, label, completedWord, onJump, locale }: StepListProps) {
  const numeral = new Intl.NumberFormat(locale)
  return (
    <ol className="fk-flow-step-list" aria-label={label}>
      {steps.map((title, index) => {
        const n = index + 1
        const state = stepState(n, current, reached)
        const face = (
          <>
            <span className="fk-flow-step-list__marker" aria-hidden="true">
              {state === 'done' ? <Check focusable="false" /> : numeral.format(n)}
            </span>
            <span className="fk-flow-step-list__name">{title}</span>
          </>
        )
        return (
          <li key={title} className="fk-flow-step-list__item" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            {state === 'done' ? (
              <AriaButton className="fk-flow-step-list__jump" onPress={() => onJump(n)}>
                {face}
                <span className="fk-visually-hidden">, {completedWord}</span>
              </AriaButton>
            ) : (
              <span className="fk-flow-step-list__static">{face}</span>
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

function TileFace({ tile, chosen }: { tile: ChoiceTile; chosen: boolean }) {
  return (
    <>
      {tile.icon ? (
        <span className="fk-flow-choice-tile__icon" aria-hidden="true">
          {tile.icon}
        </span>
      ) : null}
      <span className="fk-flow-choice-tile__text">
        <span className="fk-flow-choice-tile__title">{tile.title}</span>
        {tile.detail ? <span className="fk-flow-choice-tile__detail">{tile.detail}</span> : null}
      </span>
      <span className="fk-flow-choice-tile__check" aria-hidden="true">
        {chosen ? <Check focusable="false" /> : null}
      </span>
    </>
  )
}

/** A single choice laid out as tiles (APG radio group); the choice shows a check mark, not only a colour. */
export function ChoiceTiles({ label, tiles, value, onChange, hideLabel = false }: { label: string; tiles: ChoiceTile[]; value: string | null; onChange: (v: string) => void; hideLabel?: boolean }) {
  const naming = hideLabel ? { 'aria-label': label } : {}
  return (
    <RadioGroup className="fk-choice-tiles" value={value} onChange={onChange} {...naming}>
      {!hideLabel && <Label className="fk-choice-tiles__label">{label}</Label>}
      <div className="fk-choice-tiles__grid">
        {tiles.map((tile) => (
          <Radio key={tile.value} value={tile.value} className="fk-flow-choice-tile" aria-label={[tile.title, tile.detail].filter(Boolean).join(', ')}>
            {({ isSelected }) => <TileFace tile={tile} chosen={isSelected} />}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}

/** Words typed so far, split at commas, trimmed, without blanks or repeats of `known`. */
function freshTags(typed: string, known: readonly string[]): string[] {
  const out: string[] = []
  for (const piece of typed.split(',')) {
    const tag = piece.trim()
    if (tag && !known.includes(tag) && !out.includes(tag)) out.push(tag)
  }
  return out
}

/** Stand-in tag field: Enter or a comma turns the typed word into a tag; each tag has its own remove button. */
export function TagInput({ label, value, onChange, placeholder, removeLabel }: { label: string; value: string[]; onChange: (tags: string[]) => void; placeholder?: string; removeLabel: string }) {
  const [typed, setTyped] = useState('')
  const settle = () => {
    const extra = freshTags(typed, value)
    if (extra.length) onChange([...value, ...extra])
    setTyped('')
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const isInput = (e.target as HTMLElement).tagName === 'INPUT'
    if (!isInput || (e.key !== 'Enter' && e.key !== ',')) return
    e.preventDefault()
    e.stopPropagation()
    settle()
  }
  return (
    <div className="fk-tag-input">
      <div onKeyDown={onKey}>
        <TextField label={label} value={typed} onChange={setTyped} {...(placeholder ? { placeholder } : {})} onBlur={settle} />
      </div>
      {value.length > 0 && (
        <ul className="fk-tag-input__list" aria-label={label}>
          {value.map((tag) => (
            <li key={tag} className="fk-tag-input__tag">
              <span>{tag}</span>
              <AriaButton className="fk-tag-input__remove" aria-label={fill(removeLabel, { tag })} onPress={() => onChange(value.filter((t) => t !== tag))}>
                <X focusable="false" aria-hidden="true" />
              </AriaButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Writes a spoken value (tier or range name) on a React Aria slider input, which only formats numbers itself. */
export function useValueText(inputRef: RefObject<HTMLInputElement | null>, text: string) {
  const spoken = useRef(text)
  spoken.current = text
  useLayoutEffect(() => {
    const input = inputRef.current
    if (input) input.setAttribute('aria-valuetext', spoken.current)
  })
}
