import { CircleCheck, CircleDashed } from 'lucide-react'
import { cx } from '../../internal/cx'
import { LiveNote } from '../../internal/forms-a/LiveNote'
import { useMessages } from '../../internal/provider'

export interface PasswordPolicy {
  minLength?: number
  uppercase?: boolean
  lowercase?: boolean
  digit?: boolean
  symbol?: boolean
}

type RuleKey = 'minLength' | 'uppercase' | 'lowercase' | 'digit' | 'symbol'

export interface PasswordStrengthProps {
  password: string
  policy?: PasswordPolicy
  showRequirements?: boolean
  levelLabels?: [string, string, string, string]
  /** Checklist text per rule; the length rule receives the minimum. */
  ruleLabels?: Partial<{ minLength: (count: number) => string; uppercase: string; lowercase: string; digit: string; symbol: string }>
  /** Id for the host's `aria-describedby` on the password field. */
  id?: string
  className?: string
}

export const defaultPasswordPolicy: Required<PasswordPolicy> = { minLength: 8, uppercase: true, lowercase: true, digit: true, symbol: false }

const TESTS: Record<Exclude<RuleKey, 'minLength'>, RegExp> = {
  uppercase: /\p{Lu}/u,
  lowercase: /\p{Ll}/u,
  digit: /\p{Nd}/u,
  symbol: /[^\p{L}\p{Nd}\s]/u,
}

export interface PasswordRuleResult {
  key: RuleKey
  met: boolean
}

/** Pure evaluation: which rules hold, and the level 1 to 4 (0 for an empty password). */
export function evaluatePassword(password: string, policy: PasswordPolicy = defaultPasswordPolicy) {
  const p = { ...defaultPasswordPolicy, ...policy }
  const rules: PasswordRuleResult[] = [{ key: 'minLength', met: password.length >= p.minLength }]
  for (const key of Object.keys(TESTS) as Array<keyof typeof TESTS>) {
    if (p[key]) rules.push({ key, met: TESTS[key].test(password) })
  }
  if (!password) return { rules, level: 0 as const }
  const share = rules.filter((r) => r.met).length / rules.length
  const long = password.length >= Math.max(12, p.minLength + 4)
  // Mostly the share of rules met, plus a smaller bonus for length; only a
  // password meeting every rule and reasonably long reaches the top level.
  const points = share * 3 + (long ? 0.75 : 0)
  const level = share === 1 && long ? 4 : Math.min(3, 1 + Math.floor(points))
  return { rules, level: level as 1 | 2 | 3 | 4 }
}

const TONE = ['danger', 'danger', 'pending', 'success', 'success'] as const

/** Advisory strength meter under a new-password field (spec: wave-2/password-strength.md). */
export function PasswordStrength({ password, policy, showRequirements = false, levelLabels, ruleLabels, id, className }: PasswordStrengthProps) {
  const copy = useMessages().passwordStrength
  const { rules, level } = evaluatePassword(password, policy)
  if (level === 0) return null
  const words = levelLabels ?? copy.levels
  const word = words[level - 1]!
  const min = { ...defaultPasswordPolicy, ...policy }.minLength
  const textOf = (key: RuleKey) => {
    if (key === 'minLength') return (ruleLabels?.minLength ?? copy.rules.minLength)(min)
    return ruleLabels?.[key] ?? copy.rules[key]
  }

  return (
    <div id={id} className={cx('fk-password-strength', className)} data-level={level} data-tone={TONE[level]}>
      <div
        className="fk-password-strength__meter"
        role="meter"
        aria-label={copy.label}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={level}
        aria-valuetext={word}
      >
        <span className="fk-password-strength__bar" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="fk-password-strength__segment" data-filled={n <= level || undefined} />
          ))}
        </span>
        <span className="fk-password-strength__word">{word}</span>
      </div>
      <LiveNote text={copy.announce(word)} delay={700} />
      {showRequirements ? (
        <ul className="fk-password-strength__rules">
          {rules.map((r) => {
            const Glyph = r.met ? CircleCheck : CircleDashed
            return (
              <li key={r.key} className="fk-password-strength__rule" data-met={r.met || undefined}>
                <Glyph className="fk-password-strength__glyph" aria-hidden="true" focusable="false" />
                <span className="fk-visually-hidden">{r.met ? copy.met : copy.notMet} </span>
                {textOf(r.key)}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
