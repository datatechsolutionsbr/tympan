// The component catalogue: the ui gallery's pages grouped for the site, plus the research screens (full
// applications, shown in a frame), the print views (links to Livro) and the tools. Example counts are read
// from the gallery sources at build time (one Section per example).
import { GALLERY_CATEGORIES, GALLERY_PAGES } from '../../galleries'

const fontes = import.meta.glob<string>(['../../../../../packages/ui/gallery/src/Showcase.tsx', '../../../../../packages/ui/gallery/src/showcase/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

export type GrupoId = 'Foundations' | 'Application UI' | 'Data display' | 'Marketing' | 'Research' | 'Print' | 'Tools'
export const GRUPOS: readonly GrupoId[] = [...(GALLERY_CATEGORIES as GrupoId[]), 'Research', 'Print', 'Tools']

export interface ItemCatalogo {
  id: string
  grupo: GrupoId
  titulo: string
  descricao: string
  /** 'gallery' renders a gallery page; 'tela' a full screen in a frame; 'link' goes elsewhere in the site. */
  tipo: 'gallery' | 'tela' | 'link'
  exemplos?: number
}

/** Number of examples (Section elements) in a gallery page's source. */
export function contarExemplos(fonte: string | undefined): number {
  return fonte ? (fonte.match(/<Section\b/g) ?? []).length : 0
}

const fonteDaPagina = (id: string) => {
  const nome = id === 'core' ? '/Showcase.tsx' : `/showcase/${id}.tsx`
  return Object.entries(fontes).find(([k]) => k.endsWith(nome))?.[1]
}

export const CATALOGO: ItemCatalogo[] = [
  ...GALLERY_PAGES.map((p) => ({ id: p.id, grupo: p.category as GrupoId, titulo: p.title, descricao: p.description, tipo: 'gallery' as const, exemplos: contarExemplos(fonteDaPagina(p.id)) })),
  { id: 'research-shell', grupo: 'Research', titulo: 'Research shell', descricao: 'The research workspace: rail, sheet, dock, evidence panel.', tipo: 'tela' },
  { id: 'flow-provenance', grupo: 'Research', titulo: 'Provenance graph', descricao: 'W3C PROV graph with a synced tree, from reading to claim.', tipo: 'tela' },
  { id: 'flow-editor', grupo: 'Research', titulo: 'Analysis workflow (DAG)', descricao: 'Workflow editor and run inspection on the flow canvas.', tipo: 'tela' },

  { id: 'print-estilos', grupo: 'Print', titulo: 'Book styles', descricao: 'The 39 book styles on the sample spread.', tipo: 'link' },
  { id: 'print-livro', grupo: 'Print', titulo: 'Whole sample book', descricao: 'Cover, reading guide, part opening, method and maps.', tipo: 'link' },
  { id: 'customizer', grupo: 'Tools', titulo: 'Theme customizer', descricao: 'Build a theme from seeds and check its contrast.', tipo: 'tela' },
]

export const itemDoCatalogo = (id: string | undefined) => CATALOGO.find((i) => i.id === id)
