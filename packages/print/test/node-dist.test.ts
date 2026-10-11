// @vitest-environment node
// The published build must load in plain Node ESM (JSON imports need import attributes).
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('dist in plain Node', () => {
  it('imports dist/index.js and renders a book with fontes="locais"', () => {
    const pkg = join(__dirname, '..')
    execFileSync('npx', ['tsdown', '--log-level', 'silent'], { cwd: pkg, stdio: 'ignore' })
    const script = `
      const P = await import(${JSON.stringify(join(pkg, 'dist', 'index.js'))});
      const { createElement: h } = await import('react');
      const { renderToStaticMarkup } = await import('react-dom/server');
      const html = renderToStaticMarkup(h(P.PrintBook, { estilo: 'semanario', fontes: 'locais', incluirCss: false }));
      console.log(html.includes('@font-face') ? 'ok' : 'sem-fontes');`
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: pkg, encoding: 'utf8' })
    expect(out.trim()).toBe('ok')
  }, 60000)
})
