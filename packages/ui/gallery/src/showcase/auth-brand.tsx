// Gallery section for the "auth-brand" group: auth frame, brand pieces,
// whole-page states, banners and the loader. Full-page frames are shown in a
// bounded, scrollable preview box.
import { Home, RotateCcw } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import {
  AmbientBackdrop,
  AuthFrame,
  BrandLoader,
  BrandMark,
  BrandPanel,
  Button,
  ConsentBanner,
  EnvironmentBanner,
  FederatedSignIn,
  HttpErrorPage,
  LegalDocumentFrame,
  ProviderMark,
  RouteProgress,
  SkeletonBlock,
  Switch,
  TextField,
  ThirdPartyMarkSlot,
  UpgradeGate,
} from '../../../src'
import { Section } from '../Section'

function previewStyle(tall: boolean): CSSProperties {
  return {
    position: 'relative',
    transform: 'translateZ(0)',
    overflow: 'auto',
    maxBlockSize: tall ? 640 : 380,
    minBlockSize: 160,
    border: '1px solid var(--ty-line)',
    borderRadius: 'var(--ty-radius-card)',
    background: 'var(--ty-bg)',
  }
}

const onAccentStyle: CSSProperties = { padding: 'var(--ty-space-4)', borderRadius: 'var(--ty-radius-card)', background: 'var(--ty-cta)' }

function Preview({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  // `transform` makes fixed-position frames stay inside the preview box.
  return (
    <div style={previewStyle(tall)}>{children}</div>
  )
}

const providers = [
  { id: 'usp', name: 'USP' },
  { id: 'orcid', name: 'ORCID' },
]

const figures = [
  { value: '94', label: 'cases' },
  { value: '31', label: 'countries' },
  { value: '512', label: 'proved claims' },
]

export function AuthBrandShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [gate, setGate] = useState(false)
  const [consentKey, setConsentKey] = useState(() => `ty-gallery-consent-${scope}-${Date.now()}`)

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('brand-mark')} title="BrandMark">
        <div className="ty-gallery-row">
          <BrandMark size="small" />
          <BrandMark />
          <BrandMark size="large" />
          <BrandMark showWordmark={false} label="Home" />
        </div>
      </Section>

      <Section id={id('auth-frame')} title="AuthFrame, BrandPanel, FederatedSignIn">
        <Preview tall>
          <AuthFrame
            mainLabel={`Sign in (${scope})`}
            mark={<BrandMark />}
            brandPanel={{ mark: <BrandMark showWordmark={false} />, title: 'Evidence before opinion', subtitle: 'A calm workbench for researchers and reviewers.', figures, footnote: 'EACH/USP' }}
          >
            <h1>Sign in</h1>
            <form className="ty-gallery-stack" onSubmit={(e) => e.preventDefault()}>
              <TextField label="E-mail" inputType="email" />
              <TextField label="Password" mode="password" />
              <Button type="submit" variant="primary" fullWidth>
                Sign in
              </Button>
              <FederatedSignIn providers={providers} busyId={busyId} onSelect={(p) => setBusyId((b) => (b === p ? null : p))} />
            </form>
          </AuthFrame>
        </Preview>
        <BrandPanel mark={<BrandMark />} title="Evidence before opinion" subtitle="Brand panel on its own, as it sits beside the form." figures={figures} />
        <FederatedSignIn providers={providers} arrangement="row" onSelect={() => {}} aria-label={`Row of providers (${scope})`} />
      </Section>

      <Section id={id('marks')} title="ThirdPartyMarkSlot, ProviderMark">
        <div className="ty-gallery-row">
          <ProviderMark modelId="eu.anthropic.claude-sonnet" />
          <ProviderMark modelId="gpt-4o" size="bubble" />
          <ProviderMark modelId="acme-7b" />
          <ThirdPartyMarkSlot markKey="postgres" name="Relational database" category="datasource" />
        </div>
      </Section>

      <Section id={id('loader')} title="BrandLoader, SkeletonBlock">
        <BrandLoader layout="inline" label="Opening the census" />
        <div className="ty-gallery-stack">
          <SkeletonBlock width="60%" />
          <SkeletonBlock />
          <div className="ty-gallery-row">
            <SkeletonBlock shape="circle" />
            <SkeletonBlock shape="pill" />
            <SkeletonBlock shape="block" width={9} />
          </div>
          <div style={onAccentStyle}>
            <SkeletonBlock variant="on-accent" width="70%" />
          </div>
        </div>
      </Section>

      <Section id={id('http-error')} title="HttpErrorPage">
        <Preview>
          <HttpErrorPage
            kind="not-found"
            focusHeading={false}
            problemType="about:blank"
            action={
              <>
                <Button variant="primary" leadingIcon={<Home />} href="#/">
                  Back to start
                </Button>
                <Button leadingIcon={<RotateCcw />}>Try again</Button>
              </>
            }
          />
        </Preview>
      </Section>

      <Section id={id('banners')} title="EnvironmentBanner, ConsentBanner, RouteProgress">
        <EnvironmentBanner environment="development" texts={{ label: `Environment (${scope})` }} facts={{ appName: 'platform', port: 3200, apiBase: '/api' }} user={{ email: 'reviewer@example.org', role: 'Owner' }} />
        <Preview>
          <ConsentBanner policyHref="#/privacy" storageKey={consentKey} texts={{ label: `Cookie choice (${scope})` }} />
          <Button size="compact" onPress={() => setConsentKey(`ty-gallery-consent-${scope}-${Date.now()}`)}>
            Ask again
          </Button>
          <RouteProgress pending={pending} label={`Loading page (${scope})`} />
        </Preview>
        <Switch isSelected={pending} onChange={setPending} label="Navigation pending" />
      </Section>

      <Section id={id('legal')} title="LegalDocumentFrame">
        <Preview tall>
          <LegalDocumentFrame title="Privacy policy" updatedAt="Updated on 20 September 2026" topBar={<BrandMark size="small" />} footer={<span>EACH/USP, 2026</span>} contentsLabel={`Contents (${scope})`}>
            <p>This policy explains what the research platform keeps and why.</p>
            <h2>Data we collect</h2>
            <p>Only what a research protocol needs: sign-in e-mail, role and the claims you verify.</p>
            <h2>Retention</h2>
            <p>Records stay while the project is active and for five years after the last edition.</p>
            <h2>Your rights</h2>
            <p>You can ask for a copy or the deletion of your personal data at any time.</p>
          </LegalDocumentFrame>
        </Preview>
      </Section>

      <Section id={id('gate')} title="UpgradeGate, AmbientBackdrop">
        <Preview>
          <AmbientBackdrop />
          <p>The ambient glows sit behind this box.</p>
        </Preview>
        <Button onPress={() => setGate(true)}>Show the upgrade gate</Button>
        {gate ? <UpgradeGate onViewPlans={() => setGate(false)} onSignOut={() => setGate(false)} /> : null}
      </Section>
    </div>
  )
}
