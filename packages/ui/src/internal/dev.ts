const isDev = (() => {
  try {
    return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV !== 'production'
  } catch {
    return true
  }
})()

/** Logs a development-only warning with the library prefix. */
export function devWarning(condition: boolean, message: string): void {
  if (isDev && condition) console.warn(`[@fakhir/ui] ${message}`)
}
