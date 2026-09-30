// @datatechsolutions/tympan-print: static React components for data books (FSL-1.1-ALv2).
export { LivroPrint as PrintBook, type LivroPrintProps as PrintBookProps } from './book/PrintBook.tsx'
export { Dupla as Spread, type DuplaProps as SpreadProps } from './book/Spread.tsx'
export { Pagina as Page, type PaginaProps as PageProps } from './book/Page.tsx'
export { Area as PrintArea, type AreaProps as PrintAreaProps } from './book/Area.tsx'
export { ajustarPaginas, SCRIPT_AJUSTE_PAGINAS, type AjusteOpcoes, type AjustePagina } from './book/adjust.ts'
export { MOLDES, gradeDoMolde, linhasDoMolde, moldePorNome, type Molde, type LinhaMolde, type InfoArea } from './book/templates.ts'
export { Textura as Texture } from './book/Texture.tsx'
export { Ornamento as Ornament } from './book/Ornament.tsx'
export { Painel as Panel, type PainelProps as PanelProps, type VariantePainel as PanelVariant } from './panels/Panel.tsx'
export { Figuras as Figures, type FigurasProps as FiguresProps } from './panels/Figures.tsx'
export { Texto as Text, Margem as Margin, Anotacao as Annotation, type TextoProps as TextProps, type MargemProps as MarginProps, type AnotacaoProps as AnnotationProps, type VarianteTexto as TextVariant } from './panels/Text.tsx'
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
} from './panels/Method.tsx'
export { MarcaProva as ProofMark, type MarcaProvaProps as ProofMarkProps } from './panels/ProofMark.tsx'
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
} from './panels/Openers.tsx'
export { Mapa as PrintMap, type MapaProps as PrintMapProps } from './map/PrintMap.tsx'
export { ALBERS_BRASIL, REGIOES, projecaoBrasil, municipios, ufs, ufsDoRecorte, type NivelMapa, type Recorte, type Regiao } from './map/mesh.ts'
export { quantis, classeDe, rotulosLimites } from './map/classes.ts'
export { LogoLakebrasil, SeloLakebrasil, type LogoLakebrasilProps, type SeloLakebrasilProps, type VarianteLogo } from './brand/LogoLakebrasil.tsx'
export { LogoDatatech, tintasDoEstilo, type LogoDatatechProps, type VarianteDatatech } from './brand/LogoDatatech.tsx'
export { GraficoMetodo as MethodChart, type GraficoMetodoProps as MethodChartProps } from './chart/MethodChart.tsx'
export type { GraficoSpec, SpecHalteres, SpecBarras, SpecSerie, SpecContagem, SpecEsquema, LinhaPar, AnotacaoGrafico } from './chart/types.ts'
export type { SpecDispersao, SpecSimpson, SpecMatrizCorrelacao, SpecAntesDepoisControle, SpecCorrelacao, PontoMunicipio, EixoDispersao, DestaqueMunicipio } from './chart/types.ts'
export { pearson, spearman, postos, minimosQuadrados, correlacaoDentro, centrarPorGrupo, hexbin, marcasLog, fmtCoef, fmtCompacto } from './chart/statistics.ts'
export { SPEC_CORRELACAO, ITENS_SPEC_CORRELACAO } from './chart/correlationContract.ts'
export { layoutHalteres, layoutBarras, layoutColunas, layoutContagem, layoutSerie, escalaLinear, marcasEixo } from './chart/geometry.ts'
export { PINCEIS, unidadeIsotype, gradePontos, type Pincel } from './chart/brushes.tsx'
export { usePrint, type PrintContexto } from './context.tsx'
export { IlustracaoCapa, DESCRICAO_MOTIVO, type MotivoCapa } from './panels/IlustracaoCapa.tsx'
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
} from './content.tsx'
export { PRINT_CSS } from './styles.generated.ts'
