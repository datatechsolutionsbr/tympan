import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Button, Disclosure, DisclosurePanel, Heading } from 'react-aria-components'
import { breakpoints, prefersReducedMotion, useMinWidth } from '../../internal/media'
import { useMessages } from '../../internal/provider'

export interface ContentsEntry {
  id: string
  text: string
}

// Latin letters NFD cannot split into base + mark.
const TRANSLIT: Record<string, string> = { ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' }

/**
 * Stable slug for a heading text in any script. Latin accents are folded
 * ("Ação" → "acao"); letters, marks and digits of other scripts are kept as
 * they are (Arabic, Devanagari, CJK… are valid fragment identifiers); runs of
 * anything else become one dash. `fallback` only when nothing is left.
 */
export function slugForHeading(text: string, fallback: string): string {
  const folded = text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .replace(/[ßæøœłđðþı]/g, (ch) => TRANSLIT[ch] ?? ch)
    .normalize('NFC')
  const slug = folded.replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
  return slug || fallback
}

/** Gives every second-level heading of `root` a unique id and returns the contents. */
function indexHeadings(root: HTMLElement): ContentsEntry[] {
  const taken = new Set<string>()
  root.querySelectorAll('[id]').forEach((el) => {
    if (!(el instanceof HTMLHeadingElement && el.tagName === 'H2')) taken.add(el.id)
  })
  const out: ContentsEntry[] = []
  root.querySelectorAll('h2').forEach((h, n) => {
    let id = h.id || slugForHeading(h.textContent ?? '', `section-${n + 1}`)
    if (taken.has(id)) {
      let k = 2
      while (taken.has(`${id}-${k}`)) k++
      id = `${id}-${k}`
    }
    taken.add(id)
    h.id = id
    out.push({ id, text: (h.textContent ?? '').trim() })
  })
  return out
}

function useCurrentSection(entries: ContentsEntry[]): string | undefined {
  const [current, setCurrent] = useState<string | undefined>(entries[0]?.id)
  useEffect(() => {
    setCurrent(entries[0]?.id)
    if (typeof IntersectionObserver === 'undefined' || entries.length === 0) return undefined
    const seen = new IntersectionObserver(
      (records) => {
        const hit = records.filter((r) => r.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setCurrent(hit.target.id)
      },
      { rootMargin: '0px 0px -70% 0px' },
    )
    for (const e of entries) {
      const el = document.getElementById(e.id)
      if (el) seen.observe(el)
    }
    return () => seen.disconnect()
  }, [entries])
  return current
}

function ContentsList({ entries, current, onFollow }: { entries: ContentsEntry[]; current?: string; onFollow: (id: string) => (e: MouseEvent) => void }) {
  return (
    <ol className="ty-legal__contents-list">
      {entries.map((e) => (
        <li key={e.id}>
          <a className="ty-legal__contents-link" href={`#${e.id}`} aria-current={e.id === current ? 'location' : undefined} onClick={onFollow(e.id)}>
            {e.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

export interface LegalDocumentFrameProps {
  title: string
  /** Pre-formatted "last updated" line. */
  updatedAt: string
  children: ReactNode
  topBar?: ReactNode
  footer?: ReactNode
  contentsLabel?: string
  className?: string
}

/** Reading layout for policies with a generated table of contents (spec: wave-2/legal-document-frame.md). */
export function LegalDocumentFrame({ title, updatedAt, children, topBar, footer, contentsLabel, className }: LegalDocumentFrameProps) {
  const copy = useMessages().legalDocument
  const label = contentsLabel ?? copy.contents
  const wide = useMinWidth(breakpoints.lg)
  const article = useRef<HTMLElement>(null)
  const navTitleId = `ty-legal-nav-${useId().replace(/:/g, '')}`
  const [entries, setEntries] = useState<ContentsEntry[]>([])
  const current = useCurrentSection(entries)

  useEffect(() => {
    if (article.current) setEntries(indexHeadings(article.current))
  }, [children])

  const follow = (id: string) => (event: MouseEvent) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
    if (typeof history !== 'undefined') history.replaceState(null, '', `#${id}`)
  }

  let contents: ReactNode = null
  if (entries.length > 0) {
    contents = wide ? (
      <nav className="ty-legal__contents" aria-labelledby={navTitleId} data-placement="rail">
        <p id={navTitleId} className="ty-legal__contents-title">
          {label}
        </p>
        <ContentsList entries={entries} current={current} onFollow={follow} />
      </nav>
    ) : (
      <nav className="ty-legal__contents" aria-label={label} data-placement="inline">
        <Disclosure className="ty-legal__disclosure">
          <Heading level={2} className="ty-legal__disclosure-heading">
            <Button slot="trigger" className="ty-legal__disclosure-trigger">
              {label}
              <ChevronDown className="ty-legal__chevron" aria-hidden="true" focusable="false" />
            </Button>
          </Heading>
          <DisclosurePanel className="ty-legal__disclosure-panel">
            <ContentsList entries={entries} current={current} onFollow={follow} />
          </DisclosurePanel>
        </Disclosure>
      </nav>
    )
  }

  return (
    <div className={className ? `ty-legal ${className}` : 'ty-legal'} data-layout={wide ? 'columns' : 'single'}>
      {topBar ? <header className="ty-legal__top">{topBar}</header> : null}
      <main className="ty-legal__main">
        <div className="ty-legal__head">
          <h1 className="ty-legal__title">{title}</h1>
          <p className="ty-legal__updated">{updatedAt}</p>
        </div>
        <div className="ty-legal__body">
          {contents}
          <article ref={article} className="ty-legal__prose">
            {children}
          </article>
        </div>
      </main>
      {footer ? <footer className="ty-legal__footer">{footer}</footer> : null}
    </div>
  )
}
