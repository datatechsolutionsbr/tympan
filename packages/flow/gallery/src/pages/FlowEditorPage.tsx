// Gallery: the analysis flow editor inside the research shell, in the states
// of the storyboards (#/editor?state=…): canvas (F2), picker (Q2), drag (Q3),
// search (Q4), mismatch (Q5), list (Q6). Known values only: the frozen
// edition 2026-09-20 with 582 records and the counts per phase 9 · 26 · 24 ·
// 18; everything else is a neutral placeholder.

import { useEffect, useMemo } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button, TympanProvider, Tag, messagesPtBR } from '@datatechsolutions/tympan'
import { FlowEditor } from '../../../src/editor/FlowEditor'
import { autoLayout } from '../../../src/layout/autoLayout'
import type { FlowConnector, FlowNode } from '../../../src/model/types'
import { STEP_MEDIA_TYPE, stepDragType } from '../../../src/steps/StepPalette'
import { createFlowEditorStore } from '../../../src/state/editorState'
import { useHashParams } from '../shell/params'
import { ResearchShell, useDockTools } from '../shell/ResearchShell'

type Words = Record<string, string>

const TEXT: Record<string, Words> = {
  'pt-BR': {
    crumbs: 'each-usp / censo-ia-gov / análises', title: 'Casos por fase e país', saved: 'salvo', run: 'Executar', sample: 'Dados de exemplo',
    group: 'Agrupar por país e fase', count: 'Contagem por fase', keys: 'país, fase', groups: '[n] grupos', table: 'hash [sha256]', chart: 'Vega-Lite · barras',
    version: 'v[n] · rascunho', runsOn: 'edição 2026-09-20', perField: 'α por campo', country: 'país', phase: 'fase', tools: 'Ferramentas do canvas',
    drag: 'Arraste da paleta, use + entre dois passos, ou A para adicionar onde está o foco.',
    list: 'Mesma informação do canvas, navegável por teclado: ↑↓ move, Alt+↑↓ reordena, A adiciona, Enter configura.',
  },
  en: {
    crumbs: 'each-usp / censo-ia-gov / analyses', title: 'Cases by phase and country', saved: 'saved', run: 'Run', sample: 'Sample data',
    group: 'Group by country and phase', count: 'Count per phase', keys: 'country, phase', groups: '[n] groups', table: 'hash [sha256]', chart: 'Vega-Lite · bars',
    version: 'v[n] · draft', runsOn: 'edition 2026-09-20', perField: 'α per field', country: 'country', phase: 'phase', tools: 'Canvas tools',
    drag: 'Drag from the palette, use + between two steps, or A to add where the focus is.',
    list: 'The same as the canvas, by keyboard: ↑↓ moves, Alt+↑↓ reorders, A adds, Enter configures.',
  },
}

const COUNTS = [9, 26, 24, 18]
const link = (id: string, source: string, target: string): FlowConnector => ({ id, source, target, sourcePort: 'out', targetPort: 'in-0' })

function buildFlow(t: Words, mismatch: boolean, rtl: boolean): { nodes: FlowNode[]; connectors: FlowConnector[] } {
  const at = { x: 0, y: 0 }
  const nodes: FlowNode[] = [
    { id: 'edition', kind: 'step', position: at, data: { stepId: 'frozen-edition', edition: '2026-09-20', count: 582 } },
    { id: 'filter', kind: 'step', position: at, data: { stepId: 'filter', before: 582, after: '[n]' } },
    { id: 'group', kind: 'step', position: at, data: { stepId: 'group', label: t.group, keys: t.keys, aggregate: 'count', line: t.groups } },
    mismatch
      ? { id: 'count', kind: 'step', position: at, data: { stepId: 'reliability', line: t.perField } }
      : { id: 'count', kind: 'step', position: at, data: { stepId: 'describe', label: t.count, counts: COUNTS.join(' · ') } },
    { id: 'table', kind: 'step', position: at, data: { stepId: 'citable-table', line: t.table } },
    { id: 'chart', kind: 'step', position: at, data: { stepId: 'citable-chart', line: t.chart } },
  ]
  const connectors = [link('l1', 'edition', 'filter'), link('l2', 'filter', 'group'), link('l3', 'group', 'count'), link('l4', 'count', 'table'), link('l5', 'count', 'chart')]
  return { nodes: autoLayout(nodes.map((n) => ({ ...n, size: { width: 250, height: 86 } })), connectors, 'top-down', { rankGap: 54, siblingGap: 24, alignment: 'start', rtl }), connectors }
}

/** Puts the page in a storyboard state once it has rendered. */
function useStoryState(state: string, key: string) {
  useEffect(() => {
    const later = (fn: () => void, ms = 350) => window.setTimeout(fn, ms)
    const timers: number[] = []
    if (state === 'picker') {
      timers.push(later(() => document.querySelector<HTMLElement>('[data-ty-add-after="group"]')?.click(), 600))
    }
    if (state === 'search') {
      timers.push(
        later(() => {
          const input = document.querySelector<HTMLInputElement>('.ty-step-palette__input')
          if (!input) return
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'conf')
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }),
      )
    }
    if (state === 'drag') {
      timers.push(
        later(() => {
          const canvas = document.querySelector<HTMLElement>('.ty-editor__canvas')
          if (!canvas) return
          const r = canvas.getBoundingClientRect()
          const data = new DataTransfer()
          data.setData(STEP_MEDIA_TYPE, JSON.stringify({ stepId: 'recode' }))
          data.setData(stepDragType('recode'), '')
          canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data, clientX: r.right - 80, clientY: r.top + 400 }))
        }, 700),
      )
    }
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [state, key])
}

export function FlowEditorPage() {
  const params = useHashParams()
  const locale = params.get('lang') ?? 'pt-BR'
  const state = params.get('state') ?? 'canvas'
  const t = TEXT[locale] ?? TEXT.en!
  const rtl = locale === 'ar'
  const [tools, renderTools] = useDockTools()
  const selectedAtStart = state === 'picker' || state === 'search' || state === 'list' || state === 'selected'
  const store = useMemo(() => {
    const g = buildFlow(t, state === 'mismatch', rtl)
    const s = createFlowEditorStore({ initial: { nodes: g.nodes, connectors: g.connectors, layoutDirection: 'down' } })
    for (const id of state === 'mismatch' ? ['edition', 'filter', 'group'] : ['edition', 'filter', 'group', 'count']) s.actions.setNodeResult(id, { status: 'success' })
    if (selectedAtStart) s.actions.select(['group'])
    return s
  }, [t, state, selectedAtStart, rtl])
  useStoryState(state, locale)

  const description = state === 'drag' ? t.drag : state === 'list' ? t.list : undefined
  return (
    <TympanProvider locale={locale} {...(locale === 'pt-BR' ? { baseMessages: messagesPtBR } : {})}>
      <div lang={locale} dir={rtl ? 'rtl' : 'ltr'} className="ty-gallery-story">
        <ResearchShell
          locale={locale}
          area="analyses"
          crumbs={t.crumbs!}
          title={t.title!}
          {...(description ? { description } : {})}
          actions={
            <>
              <Tag>{t.sample}</Tag>
              <span className="ty-flow-saved">
                <Check aria-hidden="true" />
                {t.saved}
              </span>
              <Button variant="primary" leadingIcon={<ArrowRight />}>
                {t.run}
              </Button>
            </>
          }
          tools={tools}
          toolsLabel={t.tools!}
        >
          <FlowEditor
            key={`${locale}-${state}`}
            flowId="sample-analysis"
            store={store}
            defaultListView={state === 'list'}
            flowFacts={{ name: t.title, version: t.version, runsOn: t.runsOn, deterministic: true, seed: '[seed]' }}
            onRunFlow={() => undefined}
            onTestStep={() => undefined}
            outputPreview={(id) =>
              id === 'group'
                ? { columns: [t.country!, t.phase!, 'n'], rows: [[`[${t.country}]`, `[${t.phase}]`, '[n]'], [`[${t.country}]`, `[${t.phase}]`, '[n]']] }
                : id === 'count'
                  ? { columns: [t.phase!, 'n'], rows: COUNTS.map((n, i) => [`[${t.phase} ${i + 1}]`, n]) }
                  : null
            }
            renderTools={renderTools}
          />
        </ResearchShell>
      </div>
    </TympanProvider>
  )
}
