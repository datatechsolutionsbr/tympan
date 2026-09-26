// @vitest-environment node
// Every component renders on the server (no window, no document) in every
// preset, in colour and in black and white.
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { ESTADOS_PROVA, PRINT_PRESET_NAMES, printPresets } from '@datatechsolutions/tympan-tokens'
import {
  AberturaParte,
  Anotacao,
  Capa,
  ComoLer,
  DesenhoPublicado,
  Ficha,
  Fonte,
  GraficoMetodo,
  LinhaDoTempo,
  LivroPrint,
  LogoDatatech,
  LogoLakebrasil,
  ManchetaIlustrativa,
  Mapa,
  MarcaProva,
  Margem,
  NaoDaParaAfirmar,
  NaSuaCidade,
  Numeros,
  Pagina,
  Painel,
  ProximoCapitulo,
  Promessa,
  QuandoODadoChegar,
  Rastro,
  TabelaDados,
  Testes,
  Texto,
  Veredito,
  Dupla,
  tintasDoEstilo,
} from '../src/index.ts'
import { DuplaFpm, specsFpm } from '../gallery/src/fpm.tsx'

const AMOSTRAS: Record<string, ReactElement> = {
  Dupla: <DuplaFpm />,
  Pagina: (
    <Dupla numero="24-25" parte="Parte I">
      <Pagina lado="par" variante="prancha" />
      <Pagina lado="impar" cabeco="Capítulo 1" folio={false} />
    </Dupla>
  ),
  Painel: <Painel letra="a" titulo="A promessa" eyebrow="Capítulo 1" largura={3} variante="cidade" />,
  Texto: <Texto eyebrow="E" titulo="T" nivel={1} variante="codigo" paragrafos={['SELECT 1']} lista={{ ordenada: true, itens: ['um'] }} />,
  Margem: <Margem titulo="Onde isso volta" texto="Volume I" />,
  Anotacao: <Anotacao alvo="1" texto="nota" />,
  Promessa: <Promessa citacao="c" norma="n" data="1981-08-27" resumo="r" urn="urn:lex" detalhes={[{ termo: 't', definicao: 'd' }]} genealogia={[{ ano: '1966', texto: 'CTN' }, { ano: '1981', texto: 'DL', atual: true }]} />,
  Numeros: <Numeros exemplo itens={[{ valor: '1.843', unidade: 'R$', comparado: 'abaixo: R$ 1.724', rotulo: 'FPM', meta: '2024', ref: '#k3' }, { valor: 12374, unidade: 'km²', rotulo: 'x', ref: '#k1' }]} />,
  TabelaDados: <TabelaDados titulo="t" colunas={['a', { rotulo: 'b', numerica: true }, { rotulo: 'c', mono: true }]} linhas={[['x', 1, 'y']]} nota="n" />,
  Veredito: <Veredito promessa="p" texto="t" estado="pendente" medicaoMarcada="[data]" proposto itens={ESTADOS_PROVA.map((e) => ({ afirmacao: e, base: 'b', estado: e }))} />,
  MarcaProva: <>{ESTADOS_PROVA.map((e) => <MarcaProva key={e} estado={e} grande />)}</>,
  Testes: <Testes titulo="t" itens={[{ pergunta: 'p', estado: 'refutada', texto: 't', proposto: true }]} />,
  NaoDaParaAfirmar: <NaoDaParaAfirmar itens={[{ titulo: 't', texto: 'x', remete: 'dupla 5' }]} />,
  QuandoODadoChegar: <QuandoODadoChegar texto="t" itens={[{ titulo: 't', texto: 'x', estado: 'sem-dado' }]} />,
  Rastro: <Rastro referencia="#k5" numero="132" consulta="q.sql" sha256="d6e9215232af7991e752270d123ab974" tabela="municipios" fonteOficial="IBGE" versao="lake 2026-09-25" />,
  Fonte: <Fonte texto="IBGE" versaoLake="2026-09-25" rodape />,
  Ficha: <Ficha titulo="Créditos" itens={[{ termo: 'ISBN', definicao: '[ISBN]' }]} />,
  DesenhoPublicado: <DesenhoPublicado titulo="t" itens={[{ rotulo: 'Promessa', texto: 'x' }]} />,
  NaSuaCidade: <NaSuaCidade titulo="t" campos={['Município']} nota="n" url="lakebrasil.dev/livros" versaoLake="2026-09-25" />,
  ManchetaIlustrativa: <ManchetaIlustrativa texto="[Manchete ilustrativa: x]" />,
  ProximoCapitulo: <ProximoCapitulo titulo="Lei Kandir" texto="x" />,
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
  AberturaParte: <AberturaParte numero="I" titulo="Dinheiro e regra" pergunta="?" partes={[{ numero: 'I', titulo: 'a' }, { numero: 'II', titulo: 'b' }]} nestaParte={[{ cap: 'cap. 1', titulo: 't' }]} ondeIssoVolta="x" />,
  Capa: (
    <Dupla numero="capa">
      <Pagina lado="par" variante="capa">
        <Capa face="quarta" chamada="c" paragrafos={['p']} destaque={{ eyebrow: 'e', texto: 't', fonte: 'f' }} selo={['s']} isbn="[ISBN]" />
      </Pagina>
      <Pagina lado="impar" variante="capa">
        <Capa face="primeira" eyebrow="Brasil Real" titulo="Como medir" subtitulo="s" autora="[AUTORA]" cortes={[10188, 13584, 156216]} legendaGrafismo="As linhas" />
      </Pagina>
    </Dupla>
  ),
  ComoLer: <ComoLer secao="letras" titulo="t" letras={[{ letra: 'a', titulo: 'A promessa.', texto: 't', miniatura: 'm' }]} estados={ESTADOS_PROVA.map((e) => ({ estado: e, texto: e }))} itens={['um', 'dois']} regra="r" />,
  LinhaDoTempo: (
    <LinhaDoTempo
      de={2010}
      ate={2026}
      alt="Linha do tempo"
      volumes={[{ volume: 'III', titulo: 'A virada', de: 2011, ate: 2016 }]}
      eventos={[
        { ano: 2012, norma: 'Lei 12.651/2012', fio: 'II', onde: 'Vol. 0', status: 'medida-neste-volume' },
        { ano: 2023, norma: 'LC 200', fio: null, onde: 'x', status: 'a-confirmar' },
      ]}
      herdadas="h"
      nota="n"
    />
  ),
  Mapa: <Mapa titulo="Mapa" alt="Mapa esquemático" exemplo legenda={['baixa', 'média', 'alta']} comoLer="c" naoMostra="n" sangria />,
  GraficoMetodo: (
    <>
      {(['halteres', 'barras', 'contagem'] as const).flatMap((t) => specsFpm(t)).map((s, i) => (
        <GraficoMetodo key={i} spec={s} />
      ))}
      <GraficoMetodo
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
          eventos: [{ x: 2012, rotulo: 'Lei', nota: '25/05/2012' }],
          faixas: [{ de: 2008, ate: 2011, rotulo: 'antes' }],
        }}
      />
      <GraficoMetodo spec={{ tipo: 'barras', titulo: 'b', escala: [0, 100], unidade: '%', barras: [{ rotulo: 'x', valor: 22.8 }, { rotulo: 'y', valor: 58.2, destaque: true }] }} />
      <GraficoMetodo spec={{ tipo: 'contagem', titulo: 'c', unidade: 5, grupos: [{ rotulo: 'x', valor: 23 }] }} />
      {(['descontinuidade', 'densidade-no-corte', 'linhas-de-corte'] as const).map((n) => (
        <GraficoMetodo key={n} spec={{ tipo: 'esquema', titulo: n, nome: n, rotulos: ['a', 'b', 'c', 'd', 'e'] }} alt={n} />
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
            <LivroPrint estilo={estilo} pb={pb}>
              {el}
            </LivroPrint>,
          )
          expect(html, nome).toContain(`data-ty-print-style="${estilo}"`)
          expect(html.length, nome).toBeGreaterThan(200)
        }
      }
    })
  }

  it('injects the component CSS, the preset tokens and the page size', () => {
    const html = renderToStaticMarkup(<LivroPrint estilo="tufte" tokens={{ cor: { destaque: '#8a1c7c' } }} />)
    expect(html).toContain('@layer tympan-print')
    expect(html).toContain('size: 170mm 240mm')
    expect(html).toContain('--ty-print-destaque: #8a1c7c;')
    expect(html).toContain('fonts.googleapis.com/css2?family=EB+Garamond')
  })

  it('P&B turns the logo into its mono version and the colours into greys', () => {
    const cor = renderToStaticMarkup(
      <LivroPrint estilo="jornal">
        <LogoLakebrasil />
      </LivroPrint>,
    )
    const pb = renderToStaticMarkup(
      <LivroPrint estilo="jornal" pb>
        <LogoLakebrasil />
      </LivroPrint>,
    )
    expect(cor).toContain('data-versao="cor"')
    expect(pb).toContain('data-versao="mono-escuro"')
    expect(pb).toMatch(/--ty-print-destaque: #([0-9a-f]{2})\1\1;/)
  })

  it('one-ink styles print the official mono marks; dark paper switches to the dark versions', () => {
    const riso = renderToStaticMarkup(
      <LivroPrint estilo="riso">
        <LogoLakebrasil />
        <LogoDatatech />
      </LivroPrint>,
    )
    expect(riso).toContain('data-versao="mono-escuro"')
    const prancheta = renderToStaticMarkup(
      <LivroPrint estilo="prancheta">
        <LogoLakebrasil />
      </LivroPrint>,
    )
    expect(prancheta).toContain('data-versao="mono-claro"')
    const capa = renderToStaticMarkup(
      <LivroPrint estilo="jornal">
        <Pagina lado="impar" variante="capa">
          <LogoLakebrasil />
        </Pagina>
      </LivroPrint>,
    )
    expect(capa).toContain('data-versao="cor-fundo-escuro"')
  })

  it('the Datatech mark is never inked in a lakebrasil colour', () => {
    const html = renderToStaticMarkup(
      <LivroPrint estilo="jornal">
        <LogoDatatech variante="tinta" cor="#0a8754" />
      </LivroPrint>,
    )
    expect(html).not.toContain('#0a8754')
    expect(html).toContain('fill="#121212"')
  })

  it('per-style Datatech colours follow the approved rule (duotone, ink, or mono)', () => {
    const jornal = renderToStaticMarkup(
      <LivroPrint estilo="jornal">
        <LogoDatatech variante="estilo" />
      </LivroPrint>,
    )
    expect(jornal).toContain('fill="#c8431f"')
    expect(jornal).toContain('fill="#121212" fill-opacity="0.6"')
    expect(tintasDoEstilo(printPresets.cordel)).toEqual({ badge: '#15110d', texto: '#15110d', solOp: 0.6 })
    expect(tintasDoEstilo(printPresets['prancheta-clara'])).toEqual({ badge: '#000000', texto: '#000000', solOp: 1 })
  })
})
