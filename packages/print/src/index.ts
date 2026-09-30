// @datatechsolutions/tympan-print: static React components for data books (FSL-1.1-ALv2).
export { LivroPrint as PrintBook, type LivroPrintProps as PrintBookProps } from './livro/LivroPrint.tsx'
export { Dupla as Spread, type DuplaProps as SpreadProps } from './livro/Dupla.tsx'
export { Pagina as Page, type PaginaProps as PageProps } from './livro/Pagina.tsx'
export { Area as PrintArea, type AreaProps as PrintAreaProps } from './livro/Area.tsx'
export { ajustarPaginas, SCRIPT_AJUSTE_PAGINAS, type AjusteOpcoes, type AjustePagina } from './livro/ajuste.ts'
export { MOLDES, gradeDoMolde, linhasDoMolde, moldePorNome, type Molde, type LinhaMolde, type InfoArea } from './livro/moldes.ts'
export { Textura as Texture } from './livro/Textura.tsx'
export { Ornamento as Ornament } from './livro/Ornamento.tsx'
export { Painel as Panel, type PainelProps as PanelProps, type VariantePainel as PanelVariant } from './paineis/Painel.tsx'
export { Figuras as Figures, type FigurasProps as FiguresProps } from './paineis/Figuras.tsx'
export { Texto as Text, Margem as Margin, Anotacao as Annotation, type TextoProps as TextProps, type MargemProps as MarginProps, type AnotacaoProps as AnnotationProps, type VarianteTexto as TextVariant } from './paineis/Texto.tsx'
export {
  Promessa as PromiseText,
  Numeros as Numbers,
  TabelaDados as DataTable,
  Veredito as Verdict,
  Testes as Tests,
  NaoDaParaAfirmar as CannotClaim,
  QuandoODadoChegar as WhenDataArrives,
  Rastro as Trace,
  Fonte as Source,
  Ficha as SpecSheet,
  DesenhoPublicado as PublishedDesign,
  NaSuaCidade as InYourCity,
  ManchetaIlustrativa as IllustrativeHeadline,
  ProximoCapitulo as NextChapter,
  type PromessaProps as PromiseTextProps,
  type NumerosProps as NumbersProps,
  type NumeroItem as NumberItem,
  type TabelaDadosProps as DataTableProps,
  type ColunaTabela as TableColumn,
  type VereditoProps as VerdictProps,
  type VereditoItem as VerdictItem,
  type TestesProps as TestsProps,
  type NaoDaParaAfirmarProps as CannotClaimProps,
  type QuandoODadoChegarProps as WhenDataArrivesProps,
  type RastroProps as TraceProps,
  type FonteProps as SourceProps,
  type FichaProps as SpecSheetProps,
  type Termo as Term,
  type DesenhoPublicadoProps as PublishedDesignProps,
  type NaSuaCidadeProps as InYourCityProps,
  type ManchetaIlustrativaProps as IllustrativeHeadlineProps,
  type ProximoCapituloProps as NextChapterProps,
} from './paineis/Metodo.tsx'
export { MarcaProva as ProofMark, type MarcaProvaProps as ProofMarkProps } from './paineis/MarcaProva.tsx'
export {
  Capa as Cover,
  AberturaParte as PartOpener,
  ComoLer as HowToRead,
  LinhaDoTempo as Timeline,
  type CapaProps as CoverProps,
  type AberturaParteProps as PartOpenerProps,
  type ComoLerProps as HowToReadProps,
  type LinhaDoTempoProps as TimelineProps,
  type StatusLei,
} from './paineis/Aberturas.tsx'
export { Mapa as PrintMap, type MapaProps as PrintMapProps } from './mapa/Mapa.tsx'
export { ALBERS_BRASIL, REGIOES, projecaoBrasil, municipios, ufs, ufsDoRecorte, type NivelMapa, type Recorte, type Regiao } from './mapa/malha.ts'
export { quantis, classeDe, rotulosLimites } from './mapa/classes.ts'
export { LogoLakebrasil, SeloLakebrasil, type LogoLakebrasilProps, type SeloLakebrasilProps, type VarianteLogo } from './marca/LogoLakebrasil.tsx'
export { LogoDatatech, tintasDoEstilo, type LogoDatatechProps, type VarianteDatatech } from './marca/LogoDatatech.tsx'
export { GraficoMetodo as MethodChart, type GraficoMetodoProps as MethodChartProps } from './grafico/GraficoMetodo.tsx'
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
