import { useId, useState } from 'react'
import type { AuthBrandMessages } from '../../internal/messages/auth-brand'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { Link } from '../link/Link'

export type ConsentAnswer = 'accepted' | 'rejected'
export type ConsentTexts = AuthBrandMessages['consent']

export const DEFAULT_CONSENT_KEY = 'ty-consent'

/** Storage access that never throws (blocked storage behaves as "no answer yet"). */
const consentStore = {
  read(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  write(key: string, answer: ConsentAnswer): void {
    try {
      window.localStorage.setItem(key, answer)
    } catch {
      /* the choice still applies for this visit */
    }
  },
}

export interface ConsentBannerProps {
  policyHref: string
  storageKey?: string
  onAccept?: () => void
  onReject?: () => void
  texts?: Partial<ConsentTexts>
  className?: string
}

/** Non-modal cookie consent region with an equal-weight choice (spec: wave-2/consent-banner.md). */
export function ConsentBanner({ policyHref, storageKey = DEFAULT_CONSENT_KEY, onAccept, onReject, texts, className }: ConsentBannerProps) {
  const t: ConsentTexts = { ...useMessages().consent, ...texts }
  const messageId = `ty-consent-${useId().replace(/:/g, '')}`
  const [answered, setAnswered] = useState(() => {
    const stored = typeof window === 'undefined' ? null : consentStore.read(storageKey)
    return stored === 'accepted' || stored === 'rejected'
  })
  if (answered) return null

  const choose = (answer: ConsentAnswer) => {
    consentStore.write(storageKey, answer)
    setAnswered(true)
    ;(answer === 'accepted' ? onAccept : onReject)?.()
  }

  return (
    <section className={className ? `ty-consent ${className}` : 'ty-consent'} aria-label={t.label} aria-describedby={messageId}>
      <p id={messageId} className="ty-consent__message">
        {t.message} <Link href={policyHref}>{t.learnMore}</Link>
      </p>
      <div className="ty-consent__choices">
        <Button onPress={() => choose('rejected')}>{t.reject}</Button>
        <Button onPress={() => choose('accepted')}>{t.accept}</Button>
      </div>
    </section>
  )
}
