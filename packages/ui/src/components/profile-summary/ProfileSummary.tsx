import { cx } from '../../internal/cx'
import { Avatar } from '../avatar/Avatar'
import { Tag } from '../tag/Tag'

export interface ProfileSummaryProps {
  name: string
  /** Avatar fallback; derived from the name when omitted. */
  initials?: string
  pictureUrl?: string
  email?: string
  /** Privacy switch: the e-mail is rendered only when true. */
  showEmail?: boolean
  role?: string
  className?: string
}

/** First letter of the first and last words. */
function deriveInitials(name: string): string {
  const parts = name.split(/\s+/).filter((w) => w.length > 0)
  const picked = parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : parts
  return picked.map((w) => w[0]!.toLocaleUpperCase()).join('')
}

/** Identity block of the signed-in person (spec: wave-2/profile-summary.md). */
export function ProfileSummary({ role, email, showEmail = false, pictureUrl, initials, name, className }: ProfileSummaryProps) {
  const lines: Array<[string, string]> = [['name', name]]
  if (showEmail && email) lines.push(['email', email])
  return (
    <div className={cx('fk-profile-summary', className)}>
      <Avatar decorative src={pictureUrl} fallbackText={initials ?? deriveInitials(name)} size="regular" />
      <div className="fk-profile-summary__text">
        {role ? (
          <span className="fk-profile-summary__role">
            <Tag size="small">{role}</Tag>
          </span>
        ) : null}
        {lines.map(([kind, text]) => (
          <span key={kind} className="fk-profile-summary__line" data-line={kind} title={text}>
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
