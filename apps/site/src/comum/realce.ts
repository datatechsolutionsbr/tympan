// A tiny syntax highlighter for the snippets (TS/TSX, CSS, shell): comments, strings, keywords, tags,
// numbers. Returns tokens; the view maps them to classes. Pure, tested in test/realce.test.ts.
export type Tipo = 'comentario' | 'texto' | 'palavra' | 'tag' | 'numero' | 'atributo' | 'plano'
export interface Pedaco {
  tipo: Tipo
  texto: string
}

const PALAVRAS = new Set(['import', 'from', 'export', 'const', 'let', 'function', 'return', 'default', 'type', 'interface', 'new', 'await', 'async', 'if', 'else', 'true', 'false', 'null', 'npm', 'install', 'run'])
const REGRA =
  /(\/\/ [^\n]*|\/\*[\s\S]*?\*\/|#[^\n{]*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.-]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w-]*(?==))|([A-Za-z_$][\w$-]*)/gm

export function realcar(codigo: string): Pedaco[] {
  const out: Pedaco[] = []
  let i = 0
  for (const m of codigo.matchAll(REGRA)) {
    const at = m.index ?? 0
    if (at > i) out.push({ tipo: 'plano', texto: codigo.slice(i, at) })
    const [texto, com, str, tag, num, attr, palavra] = m
    const tipo: Tipo = com ? 'comentario' : str ? 'texto' : tag ? 'tag' : num ? 'numero' : attr ? 'atributo' : palavra && PALAVRAS.has(palavra) ? 'palavra' : 'plano'
    out.push({ tipo, texto })
    i = at + texto.length
  }
  if (i < codigo.length) out.push({ tipo: 'plano', texto: codigo.slice(i) })
  return out
}
