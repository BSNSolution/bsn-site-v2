/**
 * Placeholders visuais (SVG inline em data URI) para cards sem imagem real.
 */

const solutionPalettes: Record<string, [string, string]> = {
  a: ['#7a5bff', '#26d9ff'], // violet → cyan
  b: ['#26d9ff', '#3de0a8'], // cyan → emerald
  c: ['#ff4fb8', '#ffb547'], // magenta → amber
  d: ['#ffb547', '#ff4fb8'], // amber → magenta
  e: ['#3de0a8', '#26d9ff'], // emerald → cyan
  f: ['#7a5bff', '#ff4fb8'], // violet → magenta
}

/**
 * Retorna data URI de um SVG gerado dinamicamente — usado como cover
 * fallback dos cards de Solutions quando `imageUrl` está vazio. Cada
 * `colorClass` (a|b|c|d|e|f) gera uma paleta distinta.
 */
export function solutionPlaceholder(colorClass: string, title: string): string {
  const [c1, c2] = solutionPalettes[colorClass] || solutionPalettes.a
  const initial = (title || '?').trim().charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${c2}" stop-opacity="0.35"/>
      </linearGradient>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="200" fill="#0c0c14"/>
    <rect width="400" height="200" fill="url(#g)"/>
    <rect width="400" height="200" fill="url(#grid)"/>
    <circle cx="330" cy="50" r="80" fill="${c1}" opacity="0.35" filter="blur(40px)"/>
    <circle cx="70" cy="170" r="90" fill="${c2}" opacity="0.3" filter="blur(50px)"/>
    <text x="30" y="120" font-family="Inter, sans-serif" font-size="82" font-weight="500" fill="rgba(255,255,255,0.92)" letter-spacing="-4">${initial}</text>
    <text x="30" y="160" font-family="JetBrains Mono, monospace" font-size="11" font-weight="400" fill="rgba(255,255,255,0.5)" letter-spacing="2">PREVIEW · SAMPLE</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
