/**
 * Catálogo dos ícones usados pelos Serviços (tanto no mosaico da home quanto na
 * página de serviços). Cada key é o valor armazenado em Service.iconName.
 */
export const SERVICE_ICONS: Record<string, { label: string; svg: JSX.Element }> = {
  code: {
    label: 'Código',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 6 3 12l5 6M16 6l5 6-5 6M14 4l-4 16" />
      </svg>
    ),
  },
  squad: {
    label: 'Squad',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="8" r="3" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5M13 20c0-3 3-5 6-5" />
      </svg>
    ),
  },
  auto: {
    label: 'Automação',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  box: {
    label: 'Consultoria',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l9 4.5v9L12 21 3 16.5v-9L12 3zM12 12l9-4.5M12 12v9M12 12L3 7.5" />
      </svg>
    ),
  },
  server: {
    label: 'Servidor',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <rect x="3" y="15" width="18" height="5" rx="1" />
        <path d="M7 6.5v.01M7 17.5v.01" />
      </svg>
    ),
  },
  support: {
    label: 'Suporte',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 10c0-1.66 1.34-3 3-3s3 1.34 3 3-3 2-3 4M12 17v.01" />
      </svg>
    ),
  },
  build: {
    label: 'Construção',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 20V10l8-6 8 6v10H4zM10 20v-6h4v6" />
      </svg>
    ),
  },
  rocket: {
    label: 'Foguete',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
  chart: {
    label: 'Gráfico',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 3v18h18" />
        <path d="M7 12l3-3 4 4 5-5" />
      </svg>
    ),
  },
  cloud: {
    label: 'Cloud',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M17.5 19H9a6 6 0 1 1 4-11.65A4.5 4.5 0 0 1 20 11.5 4 4 0 0 1 17.5 19z" />
      </svg>
    ),
  },
  shield: {
    label: 'Segurança',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  zap: {
    label: 'Raio',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  brain: {
    label: 'IA / Cérebro',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 5a3 3 0 0 0-3-3 3 3 0 0 0-3 3v1a3 3 0 0 0-3 3 3 3 0 0 0 2 2.83V13a3 3 0 0 0 3 3 3 3 0 0 0 1 .17V19a3 3 0 1 0 6 0v-2.83a3 3 0 0 0 1-.17 3 3 0 0 0 3-3v-1.17A3 3 0 0 0 21 9a3 3 0 0 0-3-3V5a3 3 0 0 0-6 0z" />
        <path d="M9 13v-2M15 13v-2" />
      </svg>
    ),
  },
  database: {
    label: 'Dados',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
      </svg>
    ),
  },
}

export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICONS)

export function renderServiceIcon(name?: string | null, fallback = 'code') {
  const key = name && SERVICE_ICONS[name] ? name : fallback
  return SERVICE_ICONS[key]?.svg ?? SERVICE_ICONS[fallback].svg
}
