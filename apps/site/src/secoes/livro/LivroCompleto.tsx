// The whole sample book (fictional: the Vila Aurora air-quality study) laid out by tympan-print: cover,
// reading guide, part opening with a timeline, the method spread and the map spread. A chapter rail,
// previous/next spread and the same style, chart and Cor/P&B as the Livro view (after the Estúdio's
// "Livro completo"). The book's text is a Portuguese sample; the interface around it is translated.
import { memo } from 'react'
import { PartOpener, Cover, HowToRead, Spread, Timeline, PrintBook, Page } from '@datatechsolutions/tympan-print'
import type { PrintPresetName } from '../../tokens'
import { DuplaEstudo, DuplaMapas } from '../../galerias'
import type { Grafico } from '../../rotas'
import { tipoDoGrafico } from './Spread'

export interface DuplaDoLivro {
  id: string
  /** Catalogue key of the spread's name in the chapter rail. */
  chave: 'completo.capa' | 'completo.comoLer' | 'completo.parte' | 'completo.metodo' | 'completo.mapas'
  render: (estilo: PrintPresetName, grafico: Grafico) => React.ReactNode
}

export const DUPLAS: DuplaDoLivro[] = [
  {
    id: 'capa',
    chave: 'completo.capa',
    render: () => (
      <Spread numero="capa">
        <Page lado="par" variante="capa" folio={false}>
          <Cover
            face="quarta"
            chamada="Uma cidade medida estação por estação."
            paragrafos={[
              'Em 2020, Vila Aurora criou uma zona de baixa emissão no centro. Este book pergunta o que os dados sustentam sobre o ar que se respira lá dentro, e o que ainda não dá para afirmar.',
              'Each number carries its source and its proof state. Data is fictional and serves as an example.',
            ]}
            destaque={{ eyebrow: 'Inverno de 2022', texto: '54 dias acima do limite logo dentro da zona, contra 127 logo fora.', fonte: 'Rede de monitoramento de Vila Aurora (fictícia)' }}
          />
        </Page>
        <Page lado="impar" variante="capa" folio={false}>
          <Cover
            face="primeira"
            eyebrow="Example Lab · Volume 1"
            titulo="O ar de Vila Aurora"
            subtitulo="Dez anos de uma zona de baixa emissão, medidos estação por estação"
            autora="Example Lab"
            cortes={[10, 25, 50, 100, 150]}
            legendaGrafismo="Os limites diários de PM2,5 usados no book (µg/m³)"
          />
        </Page>
      </Spread>
    ),
  },
  {
    id: 'como-ler',
    chave: 'completo.comoLer',
    render: () => (
      <Spread numero="6-7" parte="Como ler este book" capitulo="Como ler este book">
        <Page lado="par">
          <HowToRead
            secao="letras"
            titulo="As letras dos painéis"
            letras={[
              { letra: 'a', titulo: 'A promessa', texto: 'O que a regra prometeu, nas palavras dela.' },
              { letra: 'b', titulo: 'Os números', texto: 'As contas principais, cada uma com a sua fonte.' },
              { letra: 'c', titulo: 'O gráfico do método', texto: 'A comparação que sustenta, ou não, a promessa.' },
              { letra: 'd', titulo: 'Como ler o gráfico', texto: 'As chamadas numeradas do gráfico ao lado.' },
              { letra: 'e', titulo: 'O veredito', texto: 'O estado de prova de cada afirmação.' },
            ]}
            regra="Se um número não tem fonte, ele não está no livro."
          />
        </Page>
        <Page lado="impar">
          <HowToRead
            secao="estados"
            titulo="Os estados de prova"
            estados={[
              { estado: 'sustentada', texto: 'Os dados sustentam a afirmação com o método descrito.' },
              { estado: 'refutada', texto: 'Os dados contradizem a afirmação.' },
              { estado: 'nao-da-para-afirmar', texto: 'Os dados existem, mas não bastam para decidir.' },
              { estado: 'pendente', texto: 'O teste está desenhado e ainda não rodou.' },
              { estado: 'sem-dado', texto: 'Não há dado público para testar.' },
              { estado: 'nao-testada', texto: 'A afirmação está registrada, mas ninguém a testou.' },
            ]}
          />
        </Page>
      </Spread>
    ),
  },
  {
    id: 'parte',
    chave: 'completo.parte',
    render: () => (
      <Spread numero="8-9" parte="Parte I · Ar e cidade" capitulo="Parte I · Ar e cidade">
        <Page lado="par">
          <PartOpener
            numero="I"
            titulo="Ar e cidade"
            pergunta="Uma regra de trânsito pode mudar o ar de um bairro?"
            partes={[
              { numero: 'I', titulo: 'Ar e cidade' },
              { numero: 'II', titulo: 'Quem respira' },
              { numero: 'III', titulo: 'O que falta medir' },
            ]}
            nestaParte={[
              { cap: '1', titulo: 'A zona de baixa emissão' },
              { cap: '2', titulo: 'As estações da fronteira' },
              { cap: '3', titulo: 'O inverno e o verão' },
            ]}
            ondeIssoVolta="Na Parte III, quando as internações entrarem na conta."
          />
        </Page>
        <Page lado="impar">
          <Timeline
            titulo="As regras que o book mede"
            de={2014}
            ate={2026}
            alt="Linha do tempo de 2014 a 2026 com cinco regras municipais fictícias de Vila Aurora e o estado de cada uma no livro."
            eventos={[
              { ano: 2015, norma: 'Lei municipal 410 (rede de estações)', onde: 'cap. 2', status: 'medida-neste-volume' },
              { ano: 2018, norma: 'Decreto 877 (rodízio de caminhões)', onde: 'cap. 3', status: 'pendente' },
              { ano: 2020, norma: 'Decreto 1.234 (zona de baixa emissão)', onde: 'cap. 1', status: 'medida-neste-volume' },
              { ano: 2023, norma: 'Lei 2.051 (ônibus elétricos)', onde: 'vol. 2', status: 'outro-volume' },
              { ano: 2025, norma: 'Decreto 2.300 (ampliação da zona)', onde: 'cap. 1', status: 'quando-o-dado-chegar' },
            ]}
            nota="Todas as regras e números deste book são fictícios."
          />
        </Page>
      </Spread>
    ),
  },
  { id: 'metodo', chave: 'completo.metodo', render: (estilo, grafico) => <DuplaEstudo grafico={tipoDoGrafico(estilo, grafico)} /> },
  { id: 'mapas', chave: 'completo.mapas', render: () => <DuplaMapas /> },
]

export const DuplaDoLivroNoEstilo = memo(function DuplaDoLivroNoEstilo({ id, estilo, grafico, pb }: { id: string; estilo: PrintPresetName; grafico: Grafico; pb: boolean }) {
  const d = DUPLAS.find((x) => x.id === id) ?? DUPLAS[0]!
  return (
    <div dir="ltr" className="ty-site-livro-direcao">
      <PrintBook estilo={estilo} pb={pb} incluirCss={false} className="ty-site-livro">
        {d.render(estilo, grafico)}
      </PrintBook>
    </div>
  )
})
