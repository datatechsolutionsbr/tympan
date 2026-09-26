import type { ReactNode } from 'react'
import type { AuthBrandMessages } from '../../internal/messages/auth-brand'
import { useMessages } from '../../internal/provider'
import { Tag } from '../tag/Tag'

export interface EnvironmentFacts {
  appName?: string
  port?: string | number
  apiBase?: string
}

export interface EnvironmentBannerProps {
  /**
   * Environment name from the host config, or a function reading it. `null`,
   * a production name, or a failing reader render nothing.
   */
  environment?: string | null | (() => string | null | undefined)
  /** Shows the banner whatever the environment (stories, visual tests). */
  forceShow?: boolean
  user?: { email?: string; role?: string }
  facts?: EnvironmentFacts
  /** Word shown in the tag; the environment name when omitted. */
  environmentWord?: string
  texts?: Partial<Pick<AuthBrandMessages['environment'], 'label' | 'message'>>
  /** Extra controls (for example a GlassCheckToggle). */
  children?: ReactNode
  className?: string
}

function readEnvironment(source: EnvironmentBannerProps['environment']): string | null {
  try {
    const value = typeof source === 'function' ? source() : source
    return value ? String(value) : null
  } catch {
    return null
  }
}

const PRODUCTION = /^(prod|production|live)$/i

/** Strip naming the non-production environment and its facts (spec: wave-2/environment-banner.md). */
export function EnvironmentBanner(props: EnvironmentBannerProps) {
  const copy = useMessages().environment
  const env = readEnvironment(props.environment)
  const show = props.forceShow || (env !== null && !PRODUCTION.test(env.trim()))
  if (!show) return null

  const t = { ...copy, ...props.texts }
  const rows: Array<[string, string | number | undefined]> = [
    [copy.appName, props.facts?.appName],
    [copy.port, props.facts?.port],
    [copy.apiBase, props.facts?.apiBase],
    [copy.email, props.user?.email],
    [copy.role, props.user?.role],
  ]
  const present = rows.filter((r): r is [string, string | number] => r[1] !== undefined && r[1] !== '')

  return (
    <section className={props.className ? `fk-env-banner ${props.className}` : 'fk-env-banner'} aria-label={t.label}>
      <Tag>{props.environmentWord ?? env ?? t.label}</Tag>
      <p className="fk-env-banner__message">{t.message}</p>
      {present.length ? (
        <dl className="fk-env-banner__facts">
          {present.map(([term, value]) => (
            <div key={term} className="fk-env-banner__fact">
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {props.children}
    </section>
  )
}
