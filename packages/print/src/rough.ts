// Hand-drawn contours through rough.js (MIT), used only through its
// generator: it returns path data and never touches the DOM, so rendering
// stays SSR-safe. Every call passes a fixed seed derived from a stable key,
// which makes the output deterministic.
import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'

const gerador = rough.generator()

/** Stable 31-bit seed (never 0: rough.js would fall back to Math.random). */
export function semente(chave: string): number {
  let h = 2166136261
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (Math.abs(h) % 2147483646) + 1
}

export interface Tracado {
  d: string
  stroke: string
  strokeWidth: number
  fill?: string
}

const arred = (d: string) => d.replace(/-?\d+\.\d+(e-?\d+)?/g, (n) => {
  const v = Math.round(Number(n) * 100) / 100
  return Object.is(v, -0) ? '0' : String(v)
})

type Forma =
  | { k: 'retangulo'; x: number; y: number; w: number; h: number }
  | { k: 'elipse'; cx: number; cy: number; w: number; h: number }
  | { k: 'linha'; x1: number; y1: number; x2: number; y2: number }
  | { k: 'caminho'; d: string }
  | { k: 'poligono'; pts: Array<[number, number]> }
  | { k: 'curva'; pts: Array<[number, number]> }

/** Rough path data for a shape. `chave` seeds the tremble. */
export function tracar(forma: Forma, chave: string, opcoes: Options = {}): Tracado[] {
  const o: Options = { seed: semente(chave), ...opcoes }
  let dr
  switch (forma.k) {
    case 'retangulo':
      dr = gerador.rectangle(forma.x, forma.y, forma.w, forma.h, o)
      break
    case 'elipse':
      dr = gerador.ellipse(forma.cx, forma.cy, forma.w, forma.h, o)
      break
    case 'linha':
      dr = gerador.line(forma.x1, forma.y1, forma.x2, forma.y2, o)
      break
    case 'caminho':
      dr = gerador.path(forma.d, o)
      break
    case 'poligono':
      dr = gerador.polygon(forma.pts, o)
      break
    case 'curva':
      dr = gerador.curve(forma.pts, o)
      break
  }
  return gerador.toPaths(dr).map((p) => ({ d: arred(p.d), stroke: p.stroke, strokeWidth: p.strokeWidth, fill: p.fill }))
}
