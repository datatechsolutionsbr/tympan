import { createContext, useContext } from 'react'
import { printPresets, type PrintStyle } from '@datatechsolutions/tympan-tokens'

export interface PrintContexto {
  /** The style as it prints: overrides applied and, for P&B, grey colours. */
  estilo: PrintStyle
  pb: boolean
}

const Contexto = createContext<PrintContexto>({ estilo: printPresets.jornal, pb: false })

/** Provided by LivroPrint; components outside a book fall back to the `jornal` preset. */
export const PrintContextoProvider = Contexto.Provider

export function usePrint(): PrintContexto {
  return useContext(Contexto)
}

export interface DuplaContexto {
  folios: [string, string]
  parte?: string
  capitulo?: string
}

const DuplaCtx = createContext<DuplaContexto | null>(null)
export const DuplaContextoProvider = DuplaCtx.Provider

export function useDupla(): DuplaContexto | null {
  return useContext(DuplaCtx)
}

const FundoCtx = createContext<boolean | null>(null)
/** Overrides "is the background dark?" for what is inside (the cover page prints on the ink colour). */
export const FundoEscuroProvider = FundoCtx.Provider

export function useFundoEscuroForcado(): boolean | null {
  return useContext(FundoCtx)
}

const LarguraCtx = createContext<number | null>(null)
/** Width (mm) available to a figure inside a panel; set by Painel from its column span. */
export const LarguraProvider = LarguraCtx.Provider

export function useLarguraDisponivel(): number | null {
  return useContext(LarguraCtx)
}
