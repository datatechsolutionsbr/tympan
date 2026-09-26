import { createContext, useContext, type ReactNode } from 'react'
import type { ExpressionCatalog } from './model'

export interface ExpressionCatalogState {
  /** Undefined while the host is still loading the engine's vocabulary. */
  catalog?: ExpressionCatalog
  loading?: boolean
}

const Ctx = createContext<ExpressionCatalogState>({})

/** Supplies the engine's operation vocabulary to every builder below it. */
export function ExpressionCatalogProvider({ catalog, loading, children }: ExpressionCatalogState & { children: ReactNode }) {
  return <Ctx.Provider value={{ ...(catalog ? { catalog } : {}), ...(loading !== undefined ? { loading } : {}) }}>{children}</Ctx.Provider>
}

/** A prop catalog wins over the provider's. */
export function useExpressionCatalog(own?: ExpressionCatalog): ExpressionCatalogState {
  const ctx = useContext(Ctx)
  return own ? { catalog: own, loading: false } : ctx
}
