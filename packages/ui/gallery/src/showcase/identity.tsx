// Gallery page "Avatars and flags": generated avatars (/avatars) and flags
// (/flags). Every person, agent and organisation here is fictional.
import * as glass from '@dicebear/glass'
import * as icons from '@dicebear/icons'
import * as identicon from '@dicebear/identicon'
import * as initials from '@dicebear/initials'
import * as lorelei from '@dicebear/lorelei'
import * as loreleiNeutral from '@dicebear/lorelei-neutral'
import * as notionists from '@dicebear/notionists'
import * as notionistsNeutral from '@dicebear/notionists-neutral'
import * as openPeeps from '@dicebear/open-peeps'
import * as pixelArt from '@dicebear/pixel-art'
import * as pixelArtNeutral from '@dicebear/pixel-art-neutral'
import * as rings from '@dicebear/rings'
import * as shapes from '@dicebear/shapes'
import * as thumbs from '@dicebear/thumbs'
import { useMemo } from 'react'
import { useLocale } from 'react-aria-components'
import { ActorChip, Text, useTheme, useToast } from '../../../src'
import { ALLOWED_AVATAR_STYLES, GeneratedAvatar, avatarPalette, avatarSvg, type AvatarStyle } from '../../../src/avatars'
import { Flag, flagName, type FlagAspect } from '../../../src/flags'
import { Section } from '../Section'

const STYLES: Array<[string, AvatarStyle]> = [
  ['@dicebear/glass', glass],
  ['@dicebear/icons', icons],
  ['@dicebear/identicon', identicon],
  ['@dicebear/initials', initials],
  ['@dicebear/lorelei', lorelei],
  ['@dicebear/lorelei-neutral', loreleiNeutral],
  ['@dicebear/notionists', notionists],
  ['@dicebear/notionists-neutral', notionistsNeutral],
  ['@dicebear/open-peeps', openPeeps],
  ['@dicebear/pixel-art', pixelArt],
  ['@dicebear/pixel-art-neutral', pixelArtNeutral],
  ['@dicebear/rings', rings],
  ['@dicebear/shapes', shapes],
  ['@dicebear/thumbs', thumbs],
]

const PEOPLE = ['Iris Calder', 'Tomas Reyna', 'Mei Lindqvist', 'Ada Okafor', 'Rafael Moreau']
const AGENTS = [
  { key: 'intake-agent', name: 'Intake agent', style: identicon },
  { key: 'summary-agent', name: 'Summary agent', style: rings },
  { key: 'review-agent', name: 'Review agent', style: shapes },
]

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)

const FLAGS = ['jp', 'ca', 'ke', 'no', 'nz', 'gb-sct', 'es-ct', 'eu', 'un']
const REGIONS = ['pt', 'mx', 'in', 'za', 'kr', 'se']
/** Language picker sample: native names, no flags. */
const LANGUAGES = [
  { tag: 'en', name: 'English' },
  { tag: 'es', name: 'Español' },
  { tag: 'pt', name: 'Português' },
  { tag: 'ar', name: 'العربية' },
  { tag: 'hi', name: 'हिन्दी' },
  { tag: 'ja', name: '日本語' },
]

function FixedPaletteAvatar() {
  const t = useTheme()
  const src = useMemo(() => {
    let palette
    try {
      palette = avatarPalette(t.theme, t.resolvedMode)
    } catch {
      palette = avatarPalette('tympan', t.resolvedMode)
    }
    const svg = avatarSvg({ seed: 'Harbor & Pine Studio', style: shapes, size: 64, theme: palette })
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [t.theme, t.resolvedMode])
  return <img src={src} width={64} height={64} alt="Harbor & Pine Studio" />
}

export function IdentityShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const toast = useToast()
  const { locale } = useLocale()

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('styles')} title="GeneratedAvatar (allowed styles)">
        <Text size="meta" tone="muted">
          The fourteen DiceBear styles whose artwork is CC0 1.0 or MIT, all drawn from the seed “Iris Calder”. Colours follow the theme and mode.
        </Text>
        <div className="ty-gallery-tiles">
          {STYLES.map(([pkg, style]) => {
            const entry = ALLOWED_AVATAR_STYLES.find((e) => e.package === pkg)!
            return (
              <figure key={pkg} className="ty-gallery-tile">
                <GeneratedAvatar seed="Iris Calder" avatarStyle={style} size="large" decorative />
                <figcaption>
                  <span>{pkg.replace('@dicebear/', '')}</span>
                  <span className="ty-gallery-tile__meta">
                    {entry.designLicense} · {entry.designer}
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </Section>

      <Section id={id('people-agents')} title="GeneratedAvatar (people and agents)">
        <Text size="meta" tone="muted">
          People draw from the brand colour in round frames; agents draw from the neutral ink with abstract styles in rounded, dashed frames.
        </Text>
        <div className="ty-gallery-row">
          {PEOPLE.map((name) => (
            <GeneratedAvatar key={name} seed={name} avatarStyle={notionists} name={name} fallbackText={initialsOf(name)} />
          ))}
        </div>
        <div className="ty-gallery-row">
          {AGENTS.map((a) => (
            <GeneratedAvatar key={a.key} seed={a.key} avatarStyle={a.style} name={a.name} actorKind="agent" />
          ))}
        </div>
        <Text size="meta" tone="muted">
          ActorChip keeps its own agent mark and the visible kind word:
        </Text>
        <div className="ty-gallery-row">
          {AGENTS.slice(0, 2).map((a) => (
            <ActorChip key={a.key} kind="agent" name={a.name} agentKey={a.key} compact />
          ))}
        </div>
      </Section>

      <Section id={id('sizes')} title="GeneratedAvatar (sizes, press and fallback)">
        <div className="ty-gallery-row">
          {(['xsmall', 'small', 'regular', 'large'] as const).map((size) => (
            <GeneratedAvatar key={size} seed="Mei Lindqvist" avatarStyle={lorelei} name="Mei Lindqvist" size={size} />
          ))}
          <GeneratedAvatar seed="Ada Okafor" avatarStyle={pixelArt} name="Ada Okafor" onPress={() => toast.info('Profile of Ada Okafor')} />
          <GeneratedAvatar seed="Rafael Moreau" avatarStyle={thumbs} name="Rafael Moreau" src="/missing-photo.png" fallbackText="RM" />
        </div>
        <Text size="meta" tone="muted">
          The last avatar has a photo that fails to load, so the generated artwork shows.
        </Text>
      </Section>

      <Section id={id('fixed-palette')} title="avatarSvg (fixed palette)">
        <Text size="meta" tone="muted">
          `avatarSvg` with `avatarPalette(theme, mode)`: plain hex colours, for images, e-mail or files. Here it is an img, resolved for the current theme.
        </Text>
        <div className="ty-gallery-row">
          <FixedPaletteAvatar />
        </div>
      </Section>

      <Section id={id('flags')} title="Flag (aspects)">
        {(['4x3', '1x1', 'circle'] as FlagAspect[]).map((aspect) => (
          <div key={aspect} className="ty-gallery-row">
            <Text size="meta" tone="muted">
              {aspect}
            </Text>
            {FLAGS.map((code) => (
              <Flag key={code} code={code} aspect={aspect} />
            ))}
          </div>
        ))}
        <div className="ty-gallery-row">
          {(['xsmall', 'small', 'regular', 'large'] as const).map((size) => (
            <Flag key={size} code="ke" size={size} />
          ))}
        </div>
      </Section>

      <Section id={id('flag-list')} title="Flag (next to a name)">
        <Text size="meta" tone="muted">
          Offices of the fictional Harbor &amp; Pine Studio. The flag is decorative; the name, from Intl.DisplayNames, carries the meaning.
        </Text>
        <ul className="ty-gallery-stack ty-gallery-list">
          {REGIONS.map((code) => (
            <li key={code} className="ty-gallery-row">
              <Flag code={code} decorative size="small" />
              <span>{flagName(code, locale)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id={id('languages')} title="Language list (no flags)">
        <Text size="meta" tone="muted">
          Flags stand for countries and regions, never for languages: Spanish, Arabic or English are each spoken in many countries. A language picker shows each language in its own name.
        </Text>
        <ul className="ty-gallery-stack ty-gallery-list">
          {LANGUAGES.map((l) => (
            <li key={l.tag}>
              <span lang={l.tag} dir="auto">{l.name}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
