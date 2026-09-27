// The site shell: a top bar (brand, section tabs, ⌘K search, appearance and language in one popover), the
// section's own navigation in a sticky side column (a drawer on a phone) and, on a phone, the sections as
// fixed tabs at the bottom (after the Estúdio's shell).
import { BookOpen, Clapperboard, Download, House, LayoutGrid, Menu, Palette, Search, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { presets, printThemePresets } from '@datatechsolutions/tympan-tokens'
import {
  Button,
  Drawer,
  ListboxSelect,
  Popover,
  SegmentedControl,
  SkipLink,
  ThemeSwitcher,
  useMediaQuery,
  useTheme,
  type ThemeDensity,
  type ThemeMode,
} from '@datatechsolutions/tympan'
import { useI18n, type Chave } from './i18n/I18n'
import { LOCALES } from './i18n/locales'
import { formatarRota, lerRota, TEMA_PADRAO, type Rota, type SecaoId } from './rotas'

export const SECOES: Array<{ id: SecaoId; icone: LucideIcon; rota: Rota }> = [
  { id: 'inicio', icone: House, rota: { secao: 'inicio' } },
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
      <svg viewBox="0 0 32 32" aria-hidden="true" className="ty-site-marca__placa">
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="20" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="16" cy="22.5" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span>Tympan</span>
    </a>
  )
}

/** Theme, mode, density and language of the whole site, in one popover. */
export function Aparencia() {
  const th = useTheme()
  const { t, locale, setLocale } = useI18n()
  const nomeTema = useNomeTema()
  const secoesTema = [
    { title: t('aparencia.grupoInterface'), options: presets.map((p) => ({ value: p.name, label: nomeTema(p.name) })) },
    { title: t('aparencia.grupoLivro'), options: printThemePresets.map((p) => ({ value: p.name, label: nomeTema(p.name) })) },
  ]
  return (
    <Popover
      title={t('aparencia.titulo')}
      placement="bottom"
      align="end"
      trigger={
        <Button variant="quiet" size="compact" leadingIcon={<SlidersHorizontal aria-hidden="true" />} className="ty-site-topo__aparencia">
          <span className="ty-site-topo__rotulo-largo">{t('aparencia.botao')}</span>
        </Button>
      }
    >
      <div className="ty-site-aparencia">
        <ListboxSelect label={t('aparencia.idioma')} options={LOCALES.map((l) => ({ value: l.code, label: l.nativeName }))} value={locale} onChange={setLocale} />
        <ListboxSelect label={t('aparencia.tema')} sections={secoesTema} value={th.theme} onChange={th.setTheme} />
        <SegmentedControl
          label={t('aparencia.modo')}
          size="compact"
          fullWidth
          value={th.mode}
          onChange={(m) => th.setMode(m as ThemeMode)}
          options={[
            { value: 'system', label: t('aparencia.modoSistema') },
            { value: 'light', label: t('aparencia.modoClaro') },
            { value: 'dark', label: t('aparencia.modoEscuro') },
          ]}
        />
        <SegmentedControl
          label={t('aparencia.densidade')}
          size="compact"
          fullWidth
          value={th.density}
          onChange={(d) => th.setDensity(d as ThemeDensity)}
          options={[
            { value: 'compact', label: t('aparencia.densidadeCompacta') },
            { value: 'default', label: t('aparencia.densidadePadrao') },
            { value: 'comfortable', label: t('aparencia.densidadeConfortavel') },
          ]}
        />
      </div>
    </Popover>
  )
}

function Topo({ atual, aoAbrirLateral, rotuloLateral }: { atual: SecaoId; aoAbrirLateral?: () => void; rotuloLateral?: string }) {
  const { t } = useI18n()
  const th = useTheme()
  const href = useHref()
  const abrirBusca = useContext(BuscaContext)
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
        <Aparencia />
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
      {SECOES.map((s) => {
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
