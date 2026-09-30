// ⌘K search over sections, component pages, UI themes and book styles, on Tympan's CommandPalette.
import { BookOpen, LayoutGrid, Palette } from 'lucide-react'
import { useMemo } from 'react'
import { presets, printThemePresets, type PrintPresetName } from './tokens'
import { CommandPalette, type CommandGroup } from '@datatechsolutions/tympan'
import type { Navegar } from './App'
import { GALLERY_PAGES } from './galleries'
import { useI18n, type Chave } from './i18n/I18n'
import { SECOES, useNomeTema } from './Layout'
import { lerRota, TODOS_ESTILOS } from './routes'

export function Search({ aberta, aoFechar, navegar }: { aberta: boolean; aoFechar: () => void; navegar: Navegar }) {
  const { t, td } = useI18n()
  const nomeTema = useNomeTema()
  const grupos = useMemo<CommandGroup[]>(() => {
    const ir = (r: Parameters<Navegar>[0]) => () => {
      navegar(r)
      aoFechar()
    }
    return [
      {
        id: 'sections',
        heading: t('busca.grupoSecoes'),
        items: SECOES.map((s) => {
          const I = s.icone
          return { id: `s-${s.id}`, label: t(`secao.${s.id}` as Chave), icon: <I aria-hidden="true" className="ty-icon" />, onSelect: ir(s.rota) }
        }),
      },
      {
        id: 'components',
        heading: t('busca.grupoComponentes'),
        items: GALLERY_PAGES.map((p) => ({
          id: `c-${p.id}`,
          label: td(`pagina.${p.id}`, p.title),
          description: td(`pagina.${p.id}.descricao`, p.description),
          keywords: [p.title, p.id],
          icon: <LayoutGrid aria-hidden="true" className="ty-icon" />,
          onSelect: ir({ secao: 'components', pagina: p.id }),
        })),
      },
      {
        id: 'themes',
        heading: t('busca.grupoThemes'),
        items: presets.map((p) => ({
          id: `t-${p.name}`,
          label: nomeTema(p.name),
          keywords: [p.name],
          icon: <Palette aria-hidden="true" className="ty-icon" />,
          onSelect: ir({ ...lerRota('#/themes'), secao: 'themes', tema: p.name } as Parameters<Navegar>[0]),
        })),
      },
      {
        id: 'styles',
        heading: t('busca.grupoEstilos'),
        items: TODOS_ESTILOS.map((id: PrintPresetName) => ({
          id: `e-${id}`,
          label: nomeTema(`print-${id}`),
          hint: `print-${id}`,
          keywords: [id, printThemePresets.find((p) => p.name === `print-${id}`)?.label ?? id],
          icon: <BookOpen aria-hidden="true" className="ty-icon" />,
          onSelect: ir({ ...lerRota('#/book'), secao: 'book', estilo: id } as Parameters<Navegar>[0]),
        })),
      },
    ]
  }, [t, td, nomeTema, navegar, aoFechar])
  return (
    <CommandPalette
      open={aberta}
      onClose={aoFechar}
      groups={grupos}
      label={t('busca.titulo')}
      recent={{ storageKey: 'ty-site:busca-recentes' }}
      labels={{
        label: t('busca.titulo'),
        placeholder: t('busca.placeholder'),
        empty: t('busca.vazio'),
        noResults: (q: string) => t('busca.semResultado', { q }),
        results: (n: number) => t('busca.resultados', { n }),
        recent: t('busca.recentes'),
        hints: { navigate: t('busca.dicaMover'), select: t('busca.dicaAbrir'), close: t('busca.dicaFechar') },
      }}
    />
  )
}
