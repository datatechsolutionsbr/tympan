// @vitest-environment node
// Every component renders on the server (no window, no document) in every
// preset, in colour and in black and white.
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ESTADOS_PROVA, PRINT_PRESET_NAMES, printPresets } from '@datatechsolutions/tympan-tokens'
import {
  PartOpener,
  Annotation,
  Cover,
  HowToRead,
  PublishedDesign,
  SpecSheet,
  Source,
  MethodChart,
  Timeline,
  PrintBook,
  LogoDatatech,
  LogoLakebrasil,
  IllustrativeHeadline,
  PrintMap,
  ProofMark,
  Margin,
  CannotClaim,
  InYourCity,
  Numbers,
  Page,
  Panel,
  NextChapter,
  PromiseText,
  WhenDataArrives,
  Trace,
  DataTable,
  Tests,
  Text,
  Verdict,
  Spread,
  tintasDoEstilo,
} from '../src/index.ts'
import { Emblema } from '../src/marca/Emblema.tsx'
import { DuplaEstudo, specsEstudo } from '../gallery/src/estudo.tsx'

const AMOSTRAS: Record<string, ReactElement> = {
  Spread: <DuplaEstudo />,
  Page: (
    <Spread numero="24-25" parte="Parte I">
      <Page lado="par" variante="prancha" />
      <Page lado="impar" cabeco="Capítulo 1" folio={false} />
    </Spread>
  ),
  Panel: <Panel letra="a" titulo="A promessa" eyebrow="Capítulo 1" largura={3} variante="cidade" />,
  Text: <Text eyebrow="E" titulo="T" nivel={1} variante="codigo" paragrafos={['SELECT 1']} lista={{ ordenada: true, itens: ['um'] }} />,
  Margin: <Margin titulo="Onde isso volta" texto="Volume I" />,
  Annotation: <Annotation alvo="1" texto="nota" />,
  PromiseText: <PromiseText citacao="c" norma="n" data="2020-03-03" resumo="r" urn="urn:lex" detalhes={[{ termo: 't', definicao: 'd' }]} genealogia={[{ ano: '2012', texto: 'Plano de mobilidade' }, { ano: '2020', texto: 'Decreto', atual: true }]} />,
  Numbers: <Numbers exemplo itens={[{ valor: '1.843', unidade: 'R$', comparado: 'abaixo: R$ 1.724', rotulo: 'custo por estação', meta: '2024', ref: '#k3' }, { valor: 12374, unidade: 'km²', rotulo: 'x', ref: '#k1' }]} />,
  DataTable: <DataTable titulo="t" colunas={['a', { rotulo: 'b', numerica: true }, { rotulo: 'c', mono: true }]} linhas={[['x', 1, 'y']]} nota="n" />,
  Verdict: <Verdict promessa="p" texto="t" estado="pendente" medicaoMarcada="[data]" proposto itens={ESTADOS_PROVA.map((e) => ({ afirmacao: e, base: 'b', estado: e }))} />,
  ProofMark: <>{ESTADOS_PROVA.map((e) => <ProofMark key={e} estado={e} grande />)}</>,
  Tests: <Tests titulo="t" itens={[{ pergunta: 'p', estado: 'refutada', texto: 't', proposto: true }]} />,
  CannotClaim: <CannotClaim itens={[{ titulo: 't', texto: 'x', remete: 'dupla 5' }]} />,
  WhenDataArrives: <WhenDataArrives texto="t" itens={[{ titulo: 't', texto: 'x', estado: 'sem-dado' }]} />,
  Trace: <Trace referencia="#k5" numero="127" consulta="q.sql" sha256="3f1c0a9b7e2d4c6a8b0e1f2a3b4c5d6e" tabela="medicoes" fonteOficial="Rede de monitoramento de Vila Aurora (dados fictícios)" versao="edição 2026-09-25" />,
  Source: <Source texto="Rede de monitoramento de Vila Aurora (dados fictícios)" versaoLake="2026-09-25" rodape />,
  SpecSheet: <SpecSheet titulo="Créditos" itens={[{ termo: 'ISBN', definicao: '[ISBN]' }]} />,
  PublishedDesign: <PublishedDesign titulo="t" itens={[{ rotulo: 'PromiseText', texto: 'x' }]} />,
  InYourCity: <InYourCity titulo="t" campos={['Bairro']} nota="n" url="exemplo.org/vila-aurora" versaoLake="2026-09-25" />,
  IllustrativeHeadline: <IllustrativeHeadline texto="[Manchete ilustrativa: x]" />,
  NextChapter: <NextChapter titulo="O ar nos bairros vizinhos" texto="x" />,
  LogoLakebrasil: (
    <>
      {(['cor', 'cor-fundo-escuro', 'mono-escuro', 'mono-claro', 'simbolo'] as const).map((v) => (
        <LogoLakebrasil key={v} variante={v} protecao />
      ))}
    </>
  ),
  LogoDatatech: (
    <>
      {(['cor', 'cor-fundo-escuro', 'mono-escuro', 'mono-claro', 'badge', 'tinta', 'duotom', 'estilo'] as const).map((v) => (
        <LogoDatatech key={v} variante={v} cor="#8a1c7c" cor2="#333333" />
      ))}
    </>
  ),
  PartOpener: <PartOpener numero="I" titulo="Ar e cidade" pergunta="?" partes={[{ numero: 'I', titulo: 'a' }, { numero: 'II', titulo: 'b' }]} nestaParte={[{ cap: 'cap. 1', titulo: 't' }]} ondeIssoVolta="x" />,
  Cover: (
    <Spread numero="capa">
      <Page lado="par" variante="capa">
        <Cover face="quarta" chamada="c" paragrafos={['p']} destaque={{ eyebrow: 'e', texto: 't', fonte: 'f' }} selo={['s']} isbn="[ISBN]" />
      </Page>
      <Page lado="impar" variante="capa">
        <Cover face="primeira" eyebrow="Laboratório Exemplo" titulo="Como medir" subtitulo="s" autora="[AUTORA]" cortes={[15, 25, 50]} legendaGrafismo="As linhas" />
      </Page>
    </Spread>
  ),
  HowToRead: <HowToRead secao="letras" titulo="t" letras={[{ letra: 'a', titulo: 'A promessa.', texto: 't', miniatura: 'm' }]} estados={ESTADOS_PROVA.map((e) => ({ estado: e, texto: e }))} itens={['um', 'dois']} regra="r" />,
  Timeline: (
    <Timeline
      de={2010}
      ate={2026}
      alt="Linha do tempo"
      volumes={[{ volume: 'III', titulo: 'A virada', de: 2011, ate: 2016 }]}
      eventos={[
        { ano: 2020, norma: 'Decreto 1.234/2020 (fictício)', fio: 'II', onde: 'Vol. 0', status: 'medida-neste-volume' },
        { ano: 2023, norma: 'Plano de ar limpo', fio: null, onde: 'x', status: 'a-confirmar' },
      ]}
      herdadas="h"
      nota="n"
    />
  ),
  PrintMap: <PrintMap titulo="PrintMap" alt="PrintMap esquemático" exemplo legenda={['baixa', 'média', 'alta']} comoLer="c" naoMostra="n" sangria />,
  MethodChart: (
    <>
      {(['halteres', 'barras', 'contagem'] as const).flatMap((t) => specsEstudo(t)).map((s, i) => (
        <MethodChart key={i} spec={s} />
      ))}
      <MethodChart
        spec={{
          tipo: 'serie',
          titulo: 's',
          escala: [0, 13000],
          eixoX: [2008, 2025],
          unidade: 'km²',
          interpolar: true,
          pontos: [
            { x: 2008, y: 12374, rotulo: '12.374', chamada: 1 },
            { x: 2011, y: 5393 },
          ],
          eventos: [{ x: 2012, rotulo: 'Decreto', nota: '03/03/2012' }],
          faixas: [{ de: 2008, ate: 2011, rotulo: 'antes' }],
        }}
      />
      <MethodChart spec={{ tipo: 'barras', titulo: 'b', escala: [0, 100], unidade: '%', barras: [{ rotulo: 'x', valor: 22.8 }, { rotulo: 'y', valor: 58.2, destaque: true }] }} />
      <MethodChart spec={{ tipo: 'contagem', titulo: 'c', unidade: 5, grupos: [{ rotulo: 'x', valor: 23 }] }} />
      {(['descontinuidade', 'densidade-no-corte', 'linhas-de-corte'] as const).map((n) => (
        <MethodChart key={n} spec={{ tipo: 'esquema', titulo: n, nome: n, rotulos: ['a', 'b', 'c', 'd', 'e'] }} alt={n} />
      ))}
    </>
  ),
}

describe('every component in every preset', () => {
  for (const estilo of PRINT_PRESET_NAMES) {
    it(`${estilo}: renders all components on the server, in colour and P&B`, () => {
      for (const pb of [false, true]) {
        for (const [nome, el] of Object.entries(AMOSTRAS)) {
          const html = renderToStaticMarkup(
            <PrintBook estilo={estilo} pb={pb}>
              {el}
            </PrintBook>,
          )
          expect(html, nome).toContain(`data-ty-print-style="${estilo}"`)
          expect(html.length, nome).toBeGreaterThan(200)
        }
      }
    })
  }

  it('renders a deprecated style id as its renamed style (one development warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const antigo = renderToStaticMarkup(<PrintBook estilo="economist" />)
      expect(antigo).toContain('data-ty-print-style="semanario"')
      expect(antigo).toContain('data-ty-print-figura="barra-topo"')
      renderToStaticMarkup(<PrintBook estilo="economist" />)
      expect(warn.mock.calls.filter((c) => String(c[0]).includes('"economist"'))).toHaveLength(1)
    } finally {
      warn.mockRestore()
    }
  })

  it("draws the deprecated emblem 'modulor' as 'figura-modular'", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const novo = renderToStaticMarkup(<PrintBook estilo="proporcao-modular"><Emblema /></PrintBook>)
      expect(novo).toContain('data-emblema="figura-modular"')
      const antigo = renderToStaticMarkup(<PrintBook estilo="proporcao-modular" tokens={{ estrutura: { emblema: 'modulor' } }}><Emblema /></PrintBook>)
      expect(antigo).toContain('data-emblema="figura-modular"')
      expect(warn).toHaveBeenCalledTimes(1)
    } finally {
      warn.mockRestore()
    }
  })

  it('injects the component CSS, the preset tokens and the page size', () => {
    const html = renderToStaticMarkup(<PrintBook estilo="minimo-de-tinta" tokens={{ cor: { destaque: '#8a1c7c' } }} />)
    expect(html).toContain('@layer tympan-print')
    expect(html).toContain('size: 170mm 240mm')
    expect(html).toContain('--ty-print-destaque: #8a1c7c;')
    expect(html).toContain('fonts.googleapis.com/css2?family=EB+Garamond')
  })

  it('P&B turns the logo into its mono version and the colours into greys', () => {
    const cor = renderToStaticMarkup(
      <PrintBook estilo="jornal">
        <LogoLakebrasil />
      </PrintBook>,
    )
    const pb = renderToStaticMarkup(
      <PrintBook estilo="jornal" pb>
        <LogoLakebrasil />
      </PrintBook>,
    )
    expect(cor).toContain('data-versao="cor"')
    expect(pb).toContain('data-versao="mono-escuro"')
    expect(pb).toMatch(/--ty-print-destaque: #([0-9a-f]{2})\1\1;/)
  })

  it('one-ink styles print the official mono marks; dark paper switches to the dark versions', () => {
    const riso = renderToStaticMarkup(
      <PrintBook estilo="riso">
        <LogoLakebrasil />
        <LogoDatatech />
      </PrintBook>,
    )
    expect(riso).toContain('data-versao="mono-escuro"')
    const prancheta = renderToStaticMarkup(
      <PrintBook estilo="prancheta">
        <LogoLakebrasil />
      </PrintBook>,
    )
    expect(prancheta).toContain('data-versao="mono-claro"')
    const capa = renderToStaticMarkup(
      <PrintBook estilo="jornal">
        <Page lado="impar" variante="capa">
          <LogoLakebrasil />
        </Page>
      </PrintBook>,
    )
    expect(capa).toContain('data-versao="cor-fundo-escuro"')
  })

  it('the Datatech mark is never inked in a lakebrasil colour', () => {
    const html = renderToStaticMarkup(
      <PrintBook estilo="jornal">
        <LogoDatatech variante="tinta" cor="#0a8754" />
      </PrintBook>,
    )
    expect(html).not.toContain('#0a8754')
    expect(html).toContain('fill="#121212"')
  })

  it('per-style Datatech colours follow the approved rule (duotone, ink, or mono)', () => {
    const jornal = renderToStaticMarkup(
      <PrintBook estilo="jornal">
        <LogoDatatech variante="estilo" />
      </PrintBook>,
    )
    expect(jornal).toContain('fill="#c8431f"')
    expect(jornal).toContain('fill="#121212" fill-opacity="0.6"')
    expect(tintasDoEstilo(printPresets.cordel)).toEqual({ badge: '#15110d', texto: '#15110d', solOp: 0.6 })
    expect(tintasDoEstilo(printPresets['prancheta-clara'])).toEqual({ badge: '#000000', texto: '#000000', solOp: 1 })
  })
})
