import { KeyRound } from 'lucide-react'
import type { IconComponent } from '../../internal/types'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { ThirdPartyMarkGlyph } from '../third-party-mark-slot/ThirdPartyMarkSlot'

export interface IdentityProvider {
  id: string
  name: string
  /** Neutral glyph supplied by the host. */
  glyph?: IconComponent
  /** Key of a host-registered mark (MarkRegistryProvider); preferred over `glyph`. */
  markKey?: string
}

export interface FederatedSignInProps {
  providers: readonly IdentityProvider[]
  onSelect: (id: string) => void
  arrangement?: 'stack' | 'row'
  busyId?: string | null
  disabled?: boolean
  actionLabel?: (name: string) => string
  /** Name of the group (e.g. "Other ways to sign in"); ignored when `aria-labelledby` is given. */
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}

function leadingFor(p: IdentityProvider) {
  if (p.markKey) return <ThirdPartyMarkGlyph markKey={p.markKey} category="service" />
  const Glyph = p.glyph ?? KeyRound
  return <Glyph aria-hidden="true" focusable="false" />
}

/** "Continue with {provider}" buttons (spec: wave-2/federated-sign-in.md). */
export function FederatedSignIn(props: FederatedSignInProps) {
  const copy = useMessages()
  const text = props.actionLabel ?? copy.federatedSignIn.continueWith
  const inFlight = props.busyId ?? null
  const labelledBy = props['aria-labelledby']
  return (
    <div
      role="group"
      className={props.className ? `fk-federated ${props.className}` : 'fk-federated'}
      data-arrangement={props.arrangement ?? 'stack'}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : (props['aria-label'] ?? copy.federatedSignIn.groupLabel)}
    >
      {props.providers.map((p) => {
        const mine = inFlight === p.id
        return (
          <Button
            key={p.id}
            variant="secondary"
            fullWidth
            leadingIcon={leadingFor(p)}
            busy={mine}
            disabled={props.disabled || (inFlight !== null && !mine)}
            onPress={() => props.onSelect(p.id)}
            className="fk-federated__button"
          >
            {text(p.name)}
          </Button>
        )
      })}
    </div>
  )
}
