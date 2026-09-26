// Provenance gallery page, inside the research shell at the storyboard size.
// The hash picks the view: #/provenance?view=graph|tree|timeline|certificate|
// compare|number and the language (&lang=pt-BR|en|es|ar|ja). Sample data
// only (see provenance/sampleData.ts); a "Dados de exemplo" tag stays visible.

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, FileDown, FileText, Lock } from 'lucide-react'
import { Button, FakhirProvider, Tag } from '@fakhir/design-system'
import { CanvasToolbar, NumberTrace, ProvenanceGraph, ProvenanceQuestion, ProvenanceViewSwitch, type ProvenanceViewMode } from '../../../src'
import { AppDock } from '../shell/AppDock'
import { nextLocale, setHashParam, useHashParams } from '../shell/params'
import { ResearchShell } from '../shell/ResearchShell'
import { certificates, comparison, passage, REAL_TIMES, trail, WORDS, type Lang } from './provenance/sampleData'
import './provenance/provenance-page.css'

type PageView = ProvenanceViewMode | 'number'
const VIEWS: readonly PageView[] = ['graph', 'tree', 'timeline', 'certificate', 'compare', 'number']

/** Where each view opens: the item in focus, the selection and the steps. */
const START: Record<ProvenanceViewMode, { focus: string; selected: string; back: number; forward: number }> = {
  graph: { focus: 'as-reg', selected: 'as-reg', back: 3, forward: 4 },
  tree: { focus: 'ms', selected: 'as-reg', back: 8, forward: 0 },
  timeline: { focus: 'ae-tamm-4-0', selected: 'ver', back: 8, forward: 8 },
  certificate: { focus: 'as-2', selected: 'as-2', back: 3, forward: 1 },
  compare: { focus: 'ed', selected: 'ed', back: 3, forward: 1 },
}

export function ProvenancePage() {
  const params = useHashParams()
  const lang = (params.get('lang') as Lang | null) ?? 'pt-BR'
  const rawView = params.get('view') as PageView | null
  const view: PageView = rawView && VIEWS.includes(rawView) ? rawView : 'graph'
  const rtl = lang === 'ar'
  return (
    <FakhirProvider locale={lang}>
      <div className="fk-prov-page" data-view={view} dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        {view === 'number' ? <NumberPage lang={lang} /> : <ViewPage key={`${view}-${lang}`} lang={lang} view={view} />}
      </div>
    </FakhirProvider>
  )
}

function EditionButton({ lang }: { lang: Lang }) {
  const w = WORDS[lang]
  return (
    <Button variant="secondary" leadingIcon={<Lock />} trailingIcon={<ChevronDown />} className="fk-prov-page__edition">
      {w.edition} <span className="fk-prov-page__mono">2026-09-20</span> · {w.frozen}
    </Button>
  )
}

function ViewPage({ lang, view }: { lang: Lang; view: ProvenanceViewMode }) {
  const w = WORDS[lang]
  const data = useMemo(() => trail(w), [w])
  const start = START[view]
  const [focus, setFocus] = useState<string | null>(start.focus)
  const [selected, setSelected] = useState<string | null>(start.selected)
  const [dock, setDock] = useState<HTMLDivElement | null>(null)
  const badge = <Tag size="small">{w.badge}</Tag>
  const changeView = (v: ProvenanceViewMode) => setHashParam('view', v)
  const question = <ProvenanceQuestion items={data.items} value={focus} onChange={(id) => (setFocus(id), setSelected(id))} hint={view !== 'graph'} />
  const switcher = <ProvenanceViewSwitch value={view} onChange={changeView} />
  const actions =
    view === 'graph' ? (
      <>
        {question}
        {switcher}
      </>
    ) : view === 'tree' ? (
      <>
        {badge}
        <EditionButton lang={lang} />
        <Button variant="secondary" leadingIcon={<FileDown />}>
          {w.export}
        </Button>
      </>
    ) : view === 'compare' ? (
      <>
        {badge}
        <Button variant="secondary">{w.pickEditions}</Button>
      </>
    ) : (
      <>
        {badge}
        <EditionButton lang={lang} />
      </>
    )
  const formatTime = (t: number, use: 'tick' | 'detail') => (REAL_TIMES.has(t) ? '2026-09-20' : use === 'tick' ? '[data]' : '[data hora]')
  return (
    <ResearchShell
      locale={lang}
      area="provenance"
      crumbs={view === 'graph' ? 'each-usp / censo-ia-gov' : 'each-usp / censo-ia-gov / proveniência'}
      title={w.title}
      {...(view === 'certificate' ? { description: w.certText } : {})}
      actions={actions}
      {...(view === 'graph'
        ? {}
        : {
            subheader: (
              <div className="fk-prov-page__query">
                {question}
                {switcher}
              </div>
            ),
          })}
      dockSlot={setDock}
      {...(view === 'graph' ? {} : { dock: <AppDock locale={lang} onNextLocale={() => setHashParam('lang', nextLocale(lang))} /> })}
    >
      <ProvenanceGraph
        items={data.items}
        statements={data.statements}
        actors={data.actors}
        showQuestionBar={false}
        view={view}
        onViewChange={changeView}
        focusId={focus}
        onFocusChange={setFocus}
        selectedId={selected}
        onSelect={setSelected}
        defaultBack={start.back}
        defaultForward={start.forward}
        certificates={certificates(w)}
        comparison={comparison(w)}
        defaultCompareItemId="c1"
        formatTime={formatTime}
        timelineActions={() => (
          <Button variant="secondary" fullWidth leadingIcon={<FileText />}>
            {w.seeAnswer}
          </Button>
        )}
        renderTools={(items) => (dock && view === 'graph' ? createPortal(<CanvasToolbar items={items} label={w.title} placement="dock" />, dock) : null)}
        toolRowEnd={badge}
        onExport={() => undefined}
        onReread={() => undefined}
        onRequestVerification={() => undefined}
        onRerunCertificate={() => undefined}
        onDownloadCertificate={() => undefined}
        onRequestReview={() => undefined}
      />
    </ResearchShell>
  )
}

function NumberPage({ lang }: { lang: Lang }) {
  const w = WORDS[lang]
  return (
    <ResearchShell
      locale={lang}
      area="provenance"
      crumbs="each-usp / censo-ia-gov / manuscrito"
      title={w.numberTitle}
      description={w.numberText}
      actions={
        <>
          <Tag size="small">{w.badge}</Tag>
          <Button variant="secondary" leadingIcon={<Check />}>
            {w.lint}
          </Button>
        </>
      }
      dock={<AppDock locale={lang} onNextLocale={() => setHashParam('lang', nextLocale(lang))} />}
    >
      <NumberTrace passage={passage(w)} source={w.file} after={<p>{w.next}</p>} defaultOpenId="n-[n]" onOpenInGraph={() => setHashParam('view', 'graph')} onRerun={() => undefined} />
    </ResearchShell>
  )
}
