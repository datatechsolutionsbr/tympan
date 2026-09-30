// Pictograms for counting charts, drawn for this package on a 10-unit-wide
// box (Isotype-like: flat, frontal, no perspective). `proporcao` = height / width.
export type FormaIcone = 'casa' | 'pessoa' | 'quadrado'

export const ICONES: Record<FormaIcone, { d: string; proporcao: number }> = {
  // House: pitched roof, chimney and a door cut out (even-odd).
  casa: {
    d: 'M5 0 L10 4.6 L10 13 L0 13 L0 4.6 Z M7.2 1.2 L8.6 1.2 L8.6 3.2 L7.2 2 Z M3.9 13 L3.9 8.6 L6.1 8.6 L6.1 13 Z',
    proporcao: 1.3,
  },
  // Person: round head, trapezoid body, two legs.
  pessoa: {
    d: 'M5 0 A2.3 2.3 0 1 1 4.99 0 Z M1.6 5.4 L8.4 5.4 L9.4 11.4 L7.4 11.4 L7.4 18 L5.6 18 L5.6 12.6 L4.4 12.6 L4.4 18 L2.6 18 L2.6 11.4 L0.6 11.4 Z',
    proporcao: 1.8,
  },
  quadrado: { d: 'M0.5 0.5 L9.5 0.5 L9.5 9.5 L0.5 9.5 Z', proporcao: 1 },
}
