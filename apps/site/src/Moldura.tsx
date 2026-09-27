// The site shell: a top bar (brand, section tabs, ⌘K search, appearance and language in one popover), the
// section's own navigation in a sticky side column (a drawer on a phone) and, on a phone, the sections as
// fixed tabs at the bottom (after the Estúdio's shell).
import { BookOpen, Clapperboard, Download, History, House, Languages, LayoutGrid, Menu, Palette, Search, type LucideIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { presets, printThemePresets } from './tokens'
import { Button, Drawer, Popover, ProductMark, SkipLink, ThemePaletteTrigger, ThemeSwitcher, useMediaQuery, useTheme, type ThemeMode, type ThemePaletteGroup } from '@datatechsolutions/tympan'
import { useI18n, type Chave } from './i18n/I18n'
import { infoLocale, LOCALES } from './i18n/locales'
import { formatarRota, lerRota, TEMA_PADRAO, type Rota, type SecaoId } from './rotas'

export const SECOES: Array<{ id: SecaoId; icone: LucideIcon; rota: Rota }> = [
  { id: 'inicio', icone: House, rota: { secao: 'inicio' } },
  { id: 'historia', icone: History, rota: { secao: 'historia' } },
  { id: 'componentes', icone: LayoutGrid, rota: { secao: 'componentes' } },
  { id: 'temas', icone: Palette, rota: lerRota('#/temas') },
  { id: 'livro', icone: BookOpen, rota: lerRota('#/livro') },
  { id: 'video', icone: Clapperboard, rota: { secao: 'video', tema: TEMA_PADRAO } },
  { id: 'instalar', icone: Download, rota: { secao: 'instalar' } },
]

/** Hash of a route in the active locale. */
export function useHref(): (r: Rota) => string {
  const { locale } = useI18n()
  return (r) => formatarRota(r, locale)
}

/** Label of a UI theme or print theme in the active language. */
export function useNomeTema(): (nome: string) => string {
  const { td } = useI18n()
  return (nome) => {
    const p = [...presets, ...printThemePresets].find((x) => x.name === nome)
    return td(nome.startsWith('print-') ? `estilo.${nome.slice(6)}` : `tema.${nome}`, p?.label ?? nome)
  }
}

/** Opens the ⌘K search from anywhere in the shell. */
export const BuscaContext = createContext<() => void>(() => {})

export function MarcaTympan() {
  const href = useHref()
  const { t } = useI18n()
  return (
    <a className="ty-site-marca" href={href({ secao: 'inicio' })} aria-label={t('marca.rotulo')}>
      <ProductMark product="tympan" size={28} decorative className="ty-site-marca__placa" />
      <span>Tympan</span>
    </a>
  )
}

/** Theme groups of the palette with localised headings and names. */
export function useGruposTema(): ThemePaletteGroup[] {
  const { t } = useI18n()
  const nomeTema = useNomeTema()
  return useMemo(
    () => [
      { id: 'interface', heading: t('aparencia.grupoInterface'), themes: presets.map((p) => ({ id: p.name, label: nomeTema(p.name), keywords: [p.name, p.label ?? ''] })) },
      { id: 'print', heading: t('aparencia.grupoLivro'), themes: printThemePresets.map((p) => ({ id: p.name, label: nomeTema(p.name), keywords: [p.name, p.label ?? ''] })) },
    ],
    [t, nomeTema],
  )
}

/** The site's theme picker: Tympan's ThemePalette (live preview, Enter applies, Esc reverts). */
export function SeletorTema({ compacto }: { compacto?: boolean }) {
  const grupos = useGruposTema()
  const nomeTema = useNomeTema()
  return <ThemePaletteTrigger groups={grupos} labelFor={nomeTema} recentKey="ty-site:temas-recentes" compact={compacto} className="ty-site-topo__tema" />
}

/** Language of the site: native names, one press. */
export function Idioma() {
  const { t, locale, setLocale } = useI18n()
  const [aberto, setAberto] = useState(false)
  return (
    <Popover
      title={t('aparencia.idioma')}
      placement="bottom"
      align="end"
      open={aberto}
      onOpenChange={setAberto}
      trigger={
        <Button variant="quiet" size="compact" leadingIcon={<Languages aria-hidden="true" />} accessibleLabel={`${t('aparencia.idioma')}: ${infoLocale(locale).nativeName}`}>
          <span className="ty-site-topo__idioma">{locale}</span>
        </Button>
      }
    >
      <ul className="ty-site-idiomas">
        {LOCALES.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              className="ty-site-idiomas__item"
              lang={l.code}
              dir={l.rtl ? 'rtl' : 'ltr'}
              aria-pressed={l.code === locale}
              onClick={() => {
                setLocale(l.code)
                setAberto(false)
              }}
            >
              <span>{l.nativeName}</span>
              <code>{l.code}</code>
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  )
}

function Topo({ atual, aoAbrirLateral, rotuloLateral }: { atual: SecaoId; aoAbrirLateral?: () => void; rotuloLateral?: string }) {
  const { t } = useI18n()
  const th = useTheme()
  const href = useHref()
  const abrirBusca = useContext(BuscaContext)
  const estreitoTopo = useMediaQuery('(max-width: 1279.98px)')
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <header className="ty-site-topo">
      {aoAbrirLateral ? (
        <Button
          className="ty-site-topo__menu"
          variant="quiet"
          size="compact"
          iconOnly
          accessibleLabel={rotuloLateral ?? t('shell.abrirNavegacao')}
          leadingIcon={<Menu aria-hidden="true" />}
          onPress={aoAbrirLateral}
        />
      ) : null}
      <MarcaTympan />
      <nav className="ty-site-topo__secoes" aria-label={t('shell.secoes')}>
        {SECOES.map((s) => (
          <a key={s.id} href={href(s.rota)} className="ty-site-topo__secao" aria-current={s.id === atual ? 'page' : undefined}>
            {t(`secao.${s.id}` as Chave)}
          </a>
        ))}
      </nav>
      <div className="ty-site-topo__acoes">
        <button type="button" className="ty-site-busca" onClick={abrirBusca} aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}>
          <Search aria-hidden="true" className="ty-icon" />
          <span className="ty-site-busca__texto">{t('busca.botao')}</span>
          <kbd className="ty-site-busca__atalho" aria-hidden="true">
            {mac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <SeletorTema compacto={estreitoTopo} />
        <Idioma />
        <ThemeSwitcher
          mode={th.resolvedMode}
          onModeChange={(m) => th.setMode(m as ThemeMode)}
          variant="compact"
          toLightLabel={t('aparencia.paraClaro')}
          toDarkLabel={t('aparencia.paraEscuro')}
        />
      </div>
    </header>
  )
}

/** Phone: the sections as tabs fixed at the bottom. */
export function AbasRodape({ atual }: { atual: SecaoId }) {
  const { t } = useI18n()
  const href = useHref()
  return (
    <nav className="ty-site-abas" aria-label={t('shell.secoes')}>
      {SECOES.filter((s) => s.id !== 'historia').map((s) => {
        const I = s.icone
        return (
          <a key={s.id} href={href(s.rota)} className="ty-site-abas__item" aria-current={s.id === atual ? 'page' : undefined}>
            <I aria-hidden="true" className="ty-site-abas__icone" />
            <span>{t(`secao.${s.id}Curto` as Chave)}</span>
          </a>
        )
      })}
    </nav>
  )
}

export interface MolduraProps {
  secao: SecaoId
  /** The section's own navigation: a sticky column beside the page, a drawer on a phone. */
  lateral?: ReactNode
  /** Name of the side navigation (landmark and drawer title). */
  rotuloLateral?: string
  children: ReactNode
  /** Extra class on the page (e.g. the full-width book desk). */
  className?: string
}

export function Moldura({ secao, lateral, rotuloLateral, children, className }: MolduraProps) {
  const { t } = useI18n()
  const estreito = useMediaQuery('(max-width: 1023.98px)')
  const [aberta, setAberta] = useState(false)
  useEffect(() => {
    const fechar = () => setAberta(false)
    addEventListener('hashchange', fechar)
    return () => removeEventListener('hashchange', fechar)
  }, [])
  useEffect(() => {
    if (!estreito) setAberta(false)
  }, [estreito])
  const nome = rotuloLateral ?? t('shell.navegacaoDaSecao')
  return (
    <div className="ty-site" data-secao={secao} data-lateral={lateral ? '' : undefined}>
      <SkipLink targetId="conteudo" label={t('shell.pularParaConteudo')} />
      <Topo atual={secao} aoAbrirLateral={lateral && estreito ? () => setAberta(true) : undefined} rotuloLateral={nome} />
      <div className="ty-site-corpo">
        {lateral && !estreito ? (
          <nav className="ty-site-lateral" aria-label={nome}>
            {lateral}
          </nav>
        ) : null}
        <main id="conteudo" tabIndex={-1} className={className ? `ty-site-pagina ${className}` : 'ty-site-pagina'}>
          {children}
        </main>
      </div>
      {lateral && estreito ? (
        <Drawer open={aberta} onOpenChange={setAberta} title={nome} placement="bottom" maxHeight="85dvh" showHandle>
          <nav
            className="ty-site-lateral ty-site-lateral--gaveta"
            aria-label={nome}
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest('[data-fecha-gaveta]')) setAberta(false)
            }}
          >
            {lateral}
          </nav>
        </Drawer>
      ) : null}
      <AbasRodape atual={secao} />
    </div>
  )
}

export function Cabeca({ eyebrow, titulo, lead, acoes }: { eyebrow?: ReactNode; titulo: ReactNode; lead?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="ty-site-cabeca">
      <div className="ty-site-cabeca__textos">
        {eyebrow ? <p className="ty-site-eyebrow">{eyebrow}</p> : null}
        <h1 className="ty-site-titulo">{titulo}</h1>
        {lead ? <p className="ty-site-lead">{lead}</p> : null}
      </div>
      {acoes ? <div className="ty-site-cabeca__acoes">{acoes}</div> : null}
    </header>
  )
}
