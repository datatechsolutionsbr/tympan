import { Check, Code2, Copy, Eye, Link2, Monitor, Moon, Smartphone, Sun, Tablet } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'
import * as Tympan from '../../src'
import { Button, SegmentedControl, ThemeScope, useToast, type ThemeDensity } from '../../src'

/** What the gallery shell hands every card: the theme each preview starts in. */
export interface GalleryFrame {
  theme: string
  mode: 'light' | 'dark'
  density: ThemeDensity
}

/**
 * Present only inside the gallery shell. Without it (the RTL/axe tests
 * render the pages bare) a specimen is the plain captioned sheet.
 */
export const GalleryFrameContext = createContext<GalleryFrame | null>(null)

type View = 'preview' | 'code'
type Width = 'full' | 'tablet' | 'phone'

/** Library exports named in a specimen title ("Tag, StatusPill (compact)"). */
export function importedNames(title: string): string[] {
  return title
    .replace(/\([^)]*\)/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter((name) => /^[A-Z]\w*$/.test(name) && name in Tympan)
}

/** Scrolls to a specimen without touching the hash, which holds the route. */
export function scrollToSpecimen(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Gallery specimen: one glass sheet per component, captioned with its name.
 * `id` anchors the caption so the page can link to a specimen.
 */
export function Section(specimen: { id: string; title: string; children: ReactNode }) {
  const frame = useContext(GalleryFrameContext)
  if (frame) return <SpecimenCard {...specimen} frame={frame} />
  const { id: anchor, title: name, children: states } = specimen
  return (
    <section className="ty-gallery-section" data-component={name} aria-label={name}>
      <h2 className="ty-gallery-section__title" id={anchor}>
        {name}
      </h2>
      <div className="ty-gallery-section__body">{states}</div>
    </section>
  )
}

/**
 * The documentation example card: title and anchor on the left; Preview/Code,
 * light/dark and preview width on the right; the example below it.
 */
function SpecimenCard({ id: anchor, title: name, children: states, frame }: { id: string; title: string; children: ReactNode; frame: GalleryFrame }) {
  const toast = useToast()
  const [view, setView] = useState<View>('preview')
  const [modeOverride, setModeOverride] = useState<'light' | 'dark' | null>(null)
  const [width, setWidth] = useState<Width>('full')
  const [copied, setCopied] = useState(false)
  const mode = modeOverride ?? frame.mode
  const names = importedNames(name)
  const snippet = names.length
    ? `import { ${names.join(', ')} } from '@datatechsolutions/tympan'`
    : `// Composition example: see packages/ui/gallery/src for its source.`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.info('Copy failed: the browser blocked the clipboard.')
    }
  }

  return (
    <section className="ty-gallery-card" data-component={name} aria-labelledby={anchor}>
      <header className="ty-gallery-card__header">
        <h2 className="ty-gallery-card__title" id={anchor}>
          <a
            className="ty-gallery-card__anchor"
            href={`#${anchor}`}
            onClick={(event) => {
              event.preventDefault()
              scrollToSpecimen(anchor)
            }}
          >
            {name}
            <Link2 className="ty-icon ty-gallery-card__anchor-icon" aria-hidden="true" focusable="false" />
          </a>
        </h2>
        <div className="ty-gallery-card__controls">
          <SegmentedControl
            label={`View of ${name}`}
            size="compact"
            options={[
              { value: 'preview', label: 'Preview', icon: Eye },
              { value: 'code', label: 'Code', icon: Code2 },
            ]}
            value={view}
            onChange={(v) => setView(v as View)}
          />
          {view === 'preview' && (
            <>
              <SegmentedControl
                label={`Colour mode of ${name}`}
                size="compact"
                iconOnly
                options={[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                ]}
                value={mode}
                onChange={(m) => setModeOverride(m as 'light' | 'dark')}
              />
              <SegmentedControl
                label={`Preview width of ${name}`}
                size="compact"
                iconOnly
                options={[
                  { value: 'phone', label: 'Phone', icon: Smartphone },
                  { value: 'tablet', label: 'Tablet', icon: Tablet },
                  { value: 'full', label: 'Full width', icon: Monitor },
                ]}
                value={width}
                onChange={(w) => setWidth(w as Width)}
              />
            </>
          )}
        </div>
      </header>
      {view === 'preview' ? (
        <ThemeScope theme={frame.theme} mode={mode} density={frame.density} className="ty-gallery-card__preview" data-gallery-mode={mode}>
          <div className="ty-gallery-card__stage" data-width={width}>
            <div className="ty-gallery-section__body">{states}</div>
          </div>
        </ThemeScope>
      ) : (
        <div className="ty-gallery-card__code">
          <pre className="ty-gallery-card__pre">
            <code>{snippet}</code>
          </pre>
          <Button
            variant="quiet"
            size="compact"
            iconOnly
            accessibleLabel={copied ? 'Copied' : 'Copy import'}
            leadingIcon={copied ? <Check className="ty-icon" aria-hidden="true" /> : <Copy className="ty-icon" aria-hidden="true" />}
            onPress={copy}
          />
        </div>
      )}
    </section>
  )
}
