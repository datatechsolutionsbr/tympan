// Clipboard write that never throws: resolves true when the platform accepted it.
export async function writeClipboard(text: string): Promise<boolean> {
  const api = typeof navigator === 'undefined' ? undefined : navigator.clipboard
  if (!api || typeof api.writeText !== 'function') return false
  try {
    await api.writeText(text)
    return true
  } catch {
    return false
  }
}
