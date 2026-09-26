// Content strings keep their own direction inside a frame of the other one
// (Latin punctuation stays at the end of a Portuguese sentence in an Arabic UI).
import { render, screen } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { RailContextButton, RailNavItem, RailNavSection } from '../src/components/app-frame/RailNav'
import { ActivityFeed } from '../src/components/activity-feed/ActivityFeed'
import { AttentionList } from '../src/components/attention-list/AttentionList'
import { EvidencePanel } from '../src/components/evidence-panel/EvidencePanel'
import { PageHeader } from '../src/components/page-header/PageHeader'
import { PhaseBar } from '../src/components/phase-bar/PhaseBar'
import { StageStrip } from '../src/components/stage-strip/StageStrip'
import { StatStrip } from '../src/components/stat-strip/StatStrip'
import { cssOf } from './css'
import { renderWithProvider } from './render'

const pt = 'Registro mundial de assistentes, com evidência citada por propriedade.'

function isolated(text: string) {
  const el = screen.getByText(text)
  expect(el.closest('[dir="auto"]'), text).not.toBeNull()
}

describe('bidi isolation of content text in a right-to-left frame', () => {
  it('isolates titles, leads, labels, details and captions of the research shell', () => {
    renderWithProvider(
      <I18nProvider locale="ar">
        <div dir="rtl" lang="ar">
          <PageHeader variant="editorial" title="Visão geral." trail={[{ label: 'EACH/USP', href: '/o' }, { label: 'Censo.' }]} lead={pt} />
          <RailContextButton scope="EACH/USP" name="Censo de assistentes de IA governamentais" />
          <ul>
            <RailNavSection label="Coletar.">
              <RailNavItem label="Fontes e trilha." href="/f" />
            </RailNavSection>
          </ul>
          <StatStrip label="s" items={[{ id: 'a', value: 1, label: 'registros.', detail: 'edição 2026-09-20.' }]} />
          <StageStrip label="e" title="Da busca ao manuscrito." stages={[{ id: 'b', label: 'Busca.', status: 'done', figures: ['14 fontes.'] }]} />
          <AttentionList label="a" items={[{ id: 'x', proof: 'pending', title: 'Caso A.', detail: 'Sem fonte aberta.' }]} />
          <ActivityFeed label="f" entries={[{ id: '1', actor: { kind: 'person', name: 'N' }, text: 'verificou o caso A.', at: new Date() }]} />
          <PhaseBar label="p" segments={[{ id: 'p', label: 'provadas.', value: 1, tone: 'proved' }]} caption="Legenda em português." />
          <EvidencePanel title="Situação." subtitle="Caso A." open onOpenChange={() => {}} placement="docked">
            <p>x</p>
          </EvidencePanel>
        </div>
      </I18nProvider>,
      { navigate: vi.fn() },
    )
    for (const text of ['Visão geral.', pt, 'Censo.', 'EACH/USP', 'Censo de assistentes de IA governamentais', 'Coletar.', 'Fontes e trilha.', 'registros.', 'edição 2026-09-20.', 'Da busca ao manuscrito.', 'Busca.', '14 fontes.', 'Caso A.', 'Sem fonte aberta.', 'verificou o caso A.', 'provadas.', 'Legenda em português.', 'Situação.']) {
      for (const el of screen.getAllByText(text)) expect(el.closest('[dir="auto"]'), text).not.toBeNull()
    }
    isolated('Censo de assistentes de IA governamentais')
  })

  it('truncates the context name at the inline end of its own direction', () => {
    render(<RailContextButton scope="EACH/USP" name="Censo de assistentes de IA governamentais" />)
    expect(screen.getByText('Censo de assistentes de IA governamentais')).toHaveAttribute('dir', 'auto')
    expect(cssOf('components/app-frame/AppFrameRail.css')).toMatch(/\.fk-rail-context__name\s*\{[^}]*text-overflow:\s*ellipsis/)
  })
})
