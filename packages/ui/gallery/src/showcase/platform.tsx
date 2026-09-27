// Gallery section for the "platform" group: touch gestures (each with its
// non-gesture path), layout helpers, developer aids and utilities.
import { useRef, useState } from 'react'
import { useLocale } from 'react-aria-components'
import {
  Button,
  CascadeGrid,
  DecorativeMotion,
  EdgeSwipeBack,
  GlassCheckToggle,
  PullToRefresh,
  SafeAreaInset,
  SafeAreaSpacer,
  SwipeRow,
  Text,
  formatAddress,
  formatDateTime,
  formatMoney,
  formatPercent,
  motionDuration,
  toneForStatus,
  useSwipeActionPresets,
  useToast,
  type PullToRefreshHandle,
} from '../../../src'
import { Section } from '../Section'

const cases = ['Centro station', 'Harbour station', 'Park station']

export function PlatformShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const toast = useToast()
  const presets = useSwipeActionPresets()
  const { locale } = useLocale()
  const pull = useRef<PullToRefreshHandle>(null)
  const [refreshed, setRefreshed] = useState(0)
  const [replay, setReplay] = useState(0)

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('swipe-row')} title="SwipeRow">
        <Text size="meta" tone="muted">
          Swipe a row on a touch screen, or use its actions button.
        </Text>
        <div>
          {cases.map((name) => (
            <SwipeRow
              key={name}
              label={name}
              leadingActions={[presets.favourite(() => toast.info(`${name}: favourite`))]}
              trailingActions={[presets.archive(() => toast.info(`${name}: archived`)), presets.delete(() => toast.info(`${name}: deleted`), { undoable: true })]}
            >
              <div className="ty-gallery-row">
                <Text>{name}</Text>
              </div>
            </SwipeRow>
          ))}
        </div>
      </Section>

      <Section id={id('pull-to-refresh')} title="PullToRefresh">
        <div className="ty-gallery-row">
          <Button onPress={() => void pull.current?.refresh()}>Refresh</Button>
          <Text size="meta" tone="muted">
            Refreshed {refreshed} times
          </Text>
        </div>
        <PullToRefresh
          ref={pull}
          onRefresh={() =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                setRefreshed((n) => n + 1)
                resolve()
              }, 900),
            )
          }
        >
          <Text>Pull down from the top on a touch screen, or press Refresh.</Text>
        </PullToRefresh>
      </Section>

      <Section id={id('safe-area')} title="SafeAreaInset, SafeAreaSpacer, EdgeSwipeBack">
        <SafeAreaInset edges={['top', 'bottom', 'start', 'end']}>
          <Text>Padded by the device safe-area insets (zero on this screen).</Text>
        </SafeAreaInset>
        <SafeAreaSpacer position="bottom" />
        {scope === 'light' ? (
          <EdgeSwipeBack onBack={() => toast.info('Back')}>
            <Text size="meta" tone="muted">
              Edge swipe back is active on touch screens: swipe from the start edge.
            </Text>
          </EdgeSwipeBack>
        ) : (
          <Text size="meta" tone="muted">
            Edge swipe back is mounted once, in the light column.
          </Text>
        )}
      </Section>

      <Section id={id('glass-check')} title="GlassCheckToggle (developer only)">
        <GlassCheckToggle enabled label={scope === 'light' ? 'Glass check' : 'Glass check (dark column)'} />
      </Section>

      <Section id={id('cascade')} title="CascadeGrid (decorativeMotion on)">
        <div>
          <Button size="compact" onPress={() => setReplay((n) => n + 1)}>
            Replay
          </Button>
        </div>
        <DecorativeMotion enabled>
          <CascadeGrid
            key={replay}
            cascade
            role="list"
            aria-label={`Modules (${scope})`}
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--ty-space-3)' }}
          >
            {['Stations', 'Instruments', 'Base', 'Atlas', 'Analyses', 'Editions'].map((w) => (
              <div key={w} role="listitem" className="ty-gallery-section">
                <Text>{w}</Text>
              </div>
            ))}
          </CascadeGrid>
        </DecorativeMotion>
      </Section>

      <Section id={id('formatters')} title="Formatters, MotionFoundation">
        <div className="ty-gallery-stack">
          <Text>formatMoney: {formatMoney(1234.5, 'BRL', locale)}</Text>
          <Text>formatPercent: {formatPercent(12.5, locale)}</Text>
          <Text>
            formatDateTime: {formatDateTime('2026-09-20T14:02:00Z', { locale, withTimeZone: true, timeZone: 'America/Sao_Paulo' })}
          </Text>
          <Text>formatAddress (unregistered country): {formatAddress({ street: 'Rua das Estações, 100', district: '', city: 'Vila Aurora' }, 'BR')}</Text>
          <Text>formatMoney(null): {formatMoney(null, 'BRL')}</Text>
          <Text>toneForStatus rejected: {toneForStatus('rejected')}</Text>
          <Text>
            Durations: instant {motionDuration.ms.instant} ms, quick {motionDuration.ms.quick} ms, base {motionDuration.ms.base} ms
          </Text>
        </div>
      </Section>
    </div>
  )
}
