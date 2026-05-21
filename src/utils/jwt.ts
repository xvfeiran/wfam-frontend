/**
 * Parse JWT token payload (base64 decode, no dependencies)
 */
export function parseJwtToken<T = Record<string, unknown>>(token: string | undefined | null): T | null {
  const base64Url = token?.split('.')[1]
  if (!base64Url) {
    return null
  }

  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const payload = JSON.parse(window.atob(base64))
    return payload as T
  } catch {
    return null
  }
}
