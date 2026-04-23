import type { JSX } from 'react'

/**
 * Ícones SVG inline usados nos cards de serviço da HomePage (orbit + vitral).
 * Mantidos como SVG nativo para performance (evita bundle extra do lucide
 * para ícones customizados).
 */
export const HOME_ICONS: Record<string, JSX.Element> = {
  code: (
    <svg viewBox="0 0 24 24">
      <path d="M8 6 3 12l5 6M16 6l5 6-5 6M14 4l-4 16" />
    </svg>
  ),
  squad: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M13 20c0-3 3-5 6-5" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l9 4.5v9L12 21 3 16.5v-9L12 3zM12 12l9-4.5M12 12v9M12 12L3 7.5" />
    </svg>
  ),
  server: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="15" width="18" height="5" rx="1" />
      <path d="M7 6.5v.01M7 17.5v.01" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10c0-1.66 1.34-3 3-3s3 1.34 3 3-3 2-3 4M12 17v.01" />
    </svg>
  ),
  build: (
    <svg viewBox="0 0 24 24">
      <path d="M4 20V10l8-6 8 6v10H4zM10 20v-6h4v6" />
    </svg>
  ),
}

export function iconFor(iconName?: string | null) {
  if (iconName && HOME_ICONS[iconName]) return HOME_ICONS[iconName]
  return HOME_ICONS.code
}
