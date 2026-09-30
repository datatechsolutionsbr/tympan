// Install: install and usage snippets (React, the flash-free theme script, ThemePalette, book styles in
// print, and the tokens for non-React hosts), with an "on this page" list.
import { Download } from 'lucide-react'
import { Code } from '../../comum/Code'
import { useI18n, type Chave } from '../../i18n/I18n'
import { Cabeca, Layout } from '../../Layout'
import { SNIPPET_INSTALAR } from '../home/Home'

const PASSOS: Array<{ id: string; titulo: Chave; texto: Chave; codigo: string }> = [
  { id: 'npm', titulo: 'instalar.npmTitulo', texto: 'instalar.npmTexto', codigo: SNIPPET_INSTALAR },
  {
    id: 'react',
    titulo: 'instalar.reactTitulo',
    texto: 'instalar.reactTexto',
    codigo: `import '@datatechsolutions/tympan/styles.css'
import { TympanProvider, ThemeProvider, Button } from '@datatechsolutions/tympan'

export function App() {
  return (
    <TympanProvider locale="en">
      <ThemeProvider storageKey="app-theme">
        <Button variant="primary">Save</Button>
      </ThemeProvider>
    </TympanProvider>
  )
}`,
  },
  {
    id: 'sem-piscar',
    titulo: 'instalar.semPiscarTitulo',
    texto: 'instalar.semPiscarTexto',
    codigo: `import { themeInitScript } from '@datatechsolutions/tympan'

// in the HTML <head>, before the stylesheet:
const script = \`<script>\${themeInitScript('app-theme')}</script>\``,
  },
  {
    id: 'paleta',
    titulo: 'instalar.paletaTitulo',
    texto: 'instalar.paletaTexto',
    codigo: `import '@datatechsolutions/tympan-tokens/print-themes.css'
import { ThemePaletteTrigger } from '@datatechsolutions/tympan'

// ⌘/Ctrl+Shift+P or T opens it; ↑↓ preview, Enter applies, Esc reverts
<ThemePaletteTrigger />`,
  },
  {
    id: 'book',
    titulo: 'instalar.livroTitulo',
    texto: 'instalar.livroTexto',
    codigo: `import { renderToStaticMarkup } from 'react-dom/server'
import { PrintBook, Spread, Page, Panel, Text } from '@datatechsolutions/tympan-print'

const html = renderToStaticMarkup(
  <PrintBook estilo="jornal" pb={false}>
    <Spread numero="22-23" capitulo="Air quality">
      <Page lado="par">
        <Panel letra="a" titulo="The method">…</Panel>
      </Page>
      <Page lado="impar">…</Page>
    </Spread>
  </PrintBook>,
)`,
  },
  {
    id: 'tokens',
    titulo: 'instalar.tokensTitulo',
    texto: 'instalar.tokensTexto',
    codigo: `/* any stack: CSS custom properties */
@import '@datatechsolutions/tympan-tokens/tokens.css';

.card {
  background: var(--ty-surface-solid);
  color: var(--ty-ink);
  border-radius: var(--ty-radius-card);
}

<html data-ty-theme="tympan" data-ty-mode="dark" data-ty-density="compact">`,
  },
]

export function Install() {
  const { t } = useI18n()
  return (
    <Layout
      secao="install"
      rotuloLateral={t('instalar.nestaPagina')}
      lateral={
        <div className="ty-site-lista">
          <h2 className="ty-site-lista__titulo">{t('instalar.nestaPagina')}</h2>
          <ul className="ty-site-lista__itens">
            {PASSOS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="ty-site-estilo ty-site-estilo--texto"
                  data-fecha-gaveta=""
                  onClick={() => document.getElementById(`passo-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <span className="ty-site-estilo__nome">{t(p.titulo)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="ty-site-leitura">
        <Cabeca
          eyebrow={
            <>
              <Download aria-hidden="true" className="ty-icon" /> {t('instalar.eyebrow')}
            </>
          }
          titulo={t('instalar.titulo')}
          lead={t('instalar.lead')}
        />
        {PASSOS.map((p, i) => (
          <section key={p.id} className="ty-site-passo" aria-labelledby={`passo-${p.id}`}>
            <h2 className="ty-site-passo__titulo" id={`passo-${p.id}`}>
              <span className="ty-site-passo__numero" aria-hidden="true">
                {i + 1}
              </span>
              {t(p.titulo)}
            </h2>
            <p className="ty-site-lead">{t(p.texto)}</p>
            <Code titulo={t(p.titulo)} codigo={p.codigo} />
          </section>
        ))}
      </div>
    </Layout>
  )
}
