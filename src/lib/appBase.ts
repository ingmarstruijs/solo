/** App root path, e.g. "" locally or "/solo" on GitHub Pages. */
export function appBasePath(): string {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return ''
  return base.replace(/\/$/, '')
}

export function appUrl(path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${appBasePath()}${normalized}`
}
