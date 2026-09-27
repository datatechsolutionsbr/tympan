// Full-screen research applications from the gallery, shown inside a frame. The frame's transform makes it
// the containing block of the screens' fixed-position parts, so they stay inside it.
import { Customizer } from '../../../../../packages/ui/gallery/src/Customizer.tsx'
import { ResearchShellDemo } from '../../../../../packages/ui/gallery/src/ResearchShell.tsx'
import { FLOW_PAGES } from '../../../../../packages/ui/gallery/src/flow/FlowGallery.tsx'

export function Telas({ id, miniatura }: { id: string; miniatura?: boolean }) {
  const tela =
    id === 'research-shell' ? (
      <ResearchShellDemo />
    ) : id === 'customizer' ? (
      <Customizer />
    ) : (
      (FLOW_PAGES.find((p) => p.hash === `#/flow/${id.replace('flow-', '')}`)?.render() ?? null)
    )
  return (
    <div className="ty-site-moldura-tela" data-miniatura={miniatura ? '' : undefined}>
      {tela}
    </div>
  )
}
