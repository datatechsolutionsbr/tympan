// @datatechsolutions/tympan-print: static React components for data books (FSL-1.1-ALv2).
export { LivroPrint, type LivroPrintProps } from './livro/LivroPrint.tsx'
export { Dupla, type DuplaProps } from './livro/Dupla.tsx'
export { Pagina, type PaginaProps } from './livro/Pagina.tsx'
export { Area, type AreaProps } from './livro/Area.tsx'
export { ajustarPaginas, SCRIPT_AJUSTE_PAGINAS, type AjusteOpcoes, type AjustePagina } from './livro/ajuste.ts'
export { MOLDES, gradeDoMolde, linhasDoMolde, moldePorNome, type Molde, type LinhaMolde, type InfoArea } from './livro/moldes.ts'
export { Textura } from './livro/Textura.tsx'
export { Ornamento } from './livro/Ornamento.tsx'
export { Painel, type PainelProps, type VariantePainel } from './paineis/Painel.tsx'
export { Figuras, type FigurasProps } from './paineis/Figuras.tsx'
export { Texto, Margem, Anotacao, type TextoProps, type MargemProps, type AnotacaoProps, type VarianteTexto } from './paineis/Texto.tsx'
export {
  Promessa,
  Numeros,
  TabelaDados,
  Veredito,
  Testes,
  NaoDaParaAfirmar,
  QuandoODadoChegar,
  Rastro,
  Fonte,
  Ficha,
  DesenhoPublicado,
  NaSuaCidade,
  ManchetaIlustrativa,
  ProximoCapitulo,
  type PromessaProps,
  type NumerosProps,
  type NumeroItem,
  type TabelaDadosProps,
  type ColunaTabela,
  type VereditoProps,
  type VereditoItem,
  type TestesProps,
  type NaoDaParaAfirmarProps,
  type QuandoODadoChegarProps,
  type RastroProps,
  type FonteProps,
  type FichaProps,
  type Termo,
  type DesenhoPublicadoProps,
  type NaSuaCidadeProps,
  type ManchetaIlustrativaProps,
  type ProximoCapituloProps,
} from './paineis/Metodo.tsx'
export { MarcaProva, type MarcaProvaProps } from './paineis/MarcaProva.tsx'
export {
  Capa,
  AberturaParte,
  ComoLer,
  LinhaDoTempo,
  type CapaProps,
  type AberturaParteProps,
  type ComoLerProps,
  type LinhaDoTempoProps,
  type StatusLei,
} from './paineis/Aberturas.tsx'
export { IlustracaoCapa, DESCRICAO_MOTIVO, type MotivoCapa } from './paineis/IlustracaoCapa.tsx'
export { Mapa, type MapaProps } from './mapa/Mapa.tsx'
export { ALBERS_BRASIL, REGIOES, projecaoBrasil, municipios, ufs, ufsDoRecorte, type NivelMapa, type Recorte, type Regiao } from './mapa/malha.ts'
export { quantis, classeDe, rotulosLimites } from './mapa/classes.ts'
export { LogoLakebrasil, SeloLakebrasil, type LogoLakebrasilProps, type SeloLakebrasilProps, type VarianteLogo } from './marca/LogoLakebrasil.tsx'
export { LogoDatatech, tintasDoEstilo, type LogoDatatechProps, type VarianteDatatech } from './marca/LogoDatatech.tsx'
export { GraficoMetodo, type GraficoMetodoProps } from './grafico/GraficoMetodo.tsx'
export type { GraficoSpec, SpecHalteres, SpecBarras, SpecSerie, SpecContagem, SpecEsquema, LinhaPar, AnotacaoGrafico } from './grafico/tipos.ts'
export type { SpecDispersao, SpecSimpson, SpecMatrizCorrelacao, SpecAntesDepoisControle, SpecCorrelacao, PontoMunicipio, EixoDispersao, DestaqueMunicipio } from './grafico/tipos.ts'
export { pearson, spearman, postos, minimosQuadrados, correlacaoDentro, centrarPorGrupo, hexbin, marcasLog, fmtCoef, fmtCompacto } from './grafico/estatistica.ts'
export { SPEC_CORRELACAO, ITENS_SPEC_CORRELACAO } from './grafico/contratoCorrelacao.ts'
export { layoutHalteres, layoutBarras, layoutColunas, layoutContagem, layoutSerie, escalaLinear, marcasEixo } from './grafico/geometria.ts'
export { PINCEIS, unidadeIsotype, gradePontos, type Pincel } from './grafico/pinceis.tsx'
export { usePrint, type PrintContexto } from './contexto.tsx'
export {
  COMPONENTES,
  NoConteudo,
  PaginaConteudo,
  agruparPorArea,
  CapituloConteudo,
  LivroConteudo,
  propsDesconhecidas,
  type NoJson,
  type PaginaJson,
  type DuplaJson,
  type CapituloJson,
  type LivroJson,
  type LivroConteudoProps,
} from './conteudo.tsx'
export { PRINT_CSS } from './estilos.generated.ts'
