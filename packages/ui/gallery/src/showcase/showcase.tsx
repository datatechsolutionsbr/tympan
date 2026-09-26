// Gallery section for the "showcase" group: wave-4 pieces for public pages.
import { BadgeCheck, Bot, Map } from 'lucide-react'
import {
  AccentBand,
  FeatureShowcaseCard,
  FeatureShowcaseMosaic,
  FeatureTile,
  FeatureTileGrid,
  HighlightStat,
  Kicker,
  Lead,
  RevealNumber,
  RuledGrid,
  RuledGridCell,
  RuledGridRow,
  ShowcaseBackdrop,
  ShowcaseHeading,
} from '../../../src'
import { Section } from '../Section'

function Capture({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 320 160" role="presentation" style={{ display: "block", inlineSize: "100%", blockSize: "auto", color: "var(--fk-ink-3)" }}>
      <rect x="16" y="16" width="288" height="128" rx="12" fill="none" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="32" y="36" width="120" height="10" rx="5" fill="currentColor" fillOpacity="0.35" />
      <rect x="32" y="58" width="200" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
      <rect x="32" y="76" width="170" height="8" rx="4" fill="currentColor" fillOpacity="0.2" />
      <text x="32" y="124" fontSize="12" fill="currentColor" fillOpacity="0.6">
        {label}
      </text>
    </svg>
  )
}

export function ShowcaseShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  return (
    <div className="fk-gallery-showcase">
      <Section id={id('showcase-heading')} title="ShowcaseHeading, Kicker, Lead, ShowcaseBackdrop, AccentBand">
        <div style={{ position: 'relative', padding: 'var(--fk-space-6)', borderRadius: 'var(--fk-radius-card)', overflow: 'hidden' }}>
          <ShowcaseBackdrop />
          <AccentBand />
          <div style={{ position: 'relative' }}>
            <ShowcaseHeading level={2} kicker="Public research" lead="A world census of government AI assistants, with evidence cited for every property.">
              Census of government AI
            </ShowcaseHeading>
          </div>
        </div>
        <ShowcaseHeading level={3} align="center" kicker="Centred" lead="Kicker, title and lead share one axis.">
          Evidence first
        </ShowcaseHeading>
        <Kicker>Standalone kicker</Kicker>
        <Lead>Standalone lead paragraph on the reading measure.</Lead>
      </Section>

      <Section id={id('reveal')} title="RevealNumber, HighlightStat, RuledGrid">
        <RuledGrid marks>
          <RuledGridRow as="ul" columns={3}>
            <RuledGridCell as="li">
              <HighlightStat value={94} label="documented cases" reveal source={{ text: 'Edition 2026-09-20', href: '#/g/showcase' }} />
            </RuledGridCell>
            <RuledGridCell as="li">
              <HighlightStat value={512} label="proved assertions" />
            </RuledGridCell>
            <RuledGridCell as="li">
              <HighlightStat value="31" label="countries" />
            </RuledGridCell>
          </RuledGridRow>
          <RuledGridRow columns="2fr 1fr">
            <RuledGridCell>
              Plain count: <RevealNumber to={1234} format={(n) => Math.round(n).toLocaleString('en-US')} />
            </RuledGridCell>
            <RuledGridCell>
              <HighlightStat value={3} label="editions" surface="raised" />
            </RuledGridCell>
          </RuledGridRow>
        </RuledGrid>
      </Section>

      <Section id={id('feature-cards')} title="FeatureShowcaseCard (mosaic)">
        <FeatureShowcaseMosaic>
          <FeatureShowcaseCard
            span="wide"
            media={<Capture label="Evidence panel" />}
            mediaAlt="Capture of the evidence panel beside a record"
            fade={['bottom']}
            kicker="Evidence"
            title="Every value has a source"
            description="Select a value to see who proved it, when, and the passage that proves it."
            href="#/g/showcase"
          />
          <FeatureShowcaseCard
            media={<Capture label="Editions" />}
            kicker="Editions"
            title="Frozen and verifiable"
            description="Freeze the base in a citable state and check it never changed."
          />
        </FeatureShowcaseMosaic>
      </Section>

      <Section id={id('feature-tiles')} title="FeatureTile">
        <FeatureTileGrid>
          <FeatureTile icon={BadgeCheck} title="Proof states" description="Proved, pending, refuted or not disclosed, always with a word." href="#/g/showcase" />
          <FeatureTile icon={Bot} title="People and agents" description="Agents code, people verify and freeze." />
          <FeatureTile icon={Map} title="Atlas" description="Every case on the map, by region." surface="raised" />
        </FeatureTileGrid>
      </Section>
    </div>
  )
}
