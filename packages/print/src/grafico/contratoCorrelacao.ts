// Keys the content JSON may carry in the correlation specs (read by
// propsDesconhecidas in conteudo.tsx, which flags anything else).

const BASE = ['tipo', 'titulo', 'subtitulo', 'achado', 'anotacoes', 'dados', 'campos', 'altura']

export const SPEC_CORRELACAO: Record<string, string[]> = {
  dispersao: [...BASE, 'pontos', 'x', 'y', 'metodo', 'coeficiente', 'rotuloCoeficiente', 'tendencia', 'tamanhoPorPopulacao', 'destaques', 'destacarCapitais', 'densidade', 'rotuloZeroX'],
  simpson: [...BASE, 'pontos', 'x', 'y', 'rotuloGeral', 'rotuloDentro', 'rotuloGrupo', 'destaquesGrupo', 'medias', 'minimoPorGrupo', 'coeficienteGeral', 'coeficienteDentro', 'coeficienteEntre'],
  'matriz-correlacao': [...BASE, 'indicadores', 'valores', 'n', 'triangulo', 'metodo', 'casas', 'destaques'],
  'antes-depois-controle': [...BASE, 'linhas', 'rotuloBruto', 'rotuloControlado', 'escala', 'medida'],
}

const PONTO_MUNICIPIO = ['x', 'y', 'ibge', 'municipio', 'uf', 'grupo', 'pop', 'capital']

/** Item keys by list, per chart type (they override the shared list keys of the other charts). */
export const ITENS_SPEC_CORRELACAO: Record<string, Record<string, string[]>> = {
  dispersao: { pontos: PONTO_MUNICIPIO, destaques: ['ibge', 'municipio', 'rotulo'] },
  simpson: { pontos: PONTO_MUNICIPIO },
  'antes-depois-controle': { linhas: ['rotulo', 'nota', 'bruto', 'controlado', 'destaque'] },
}
