/**
 * Paleta compartilhada pelos cards/elementos admin que usam `colorClass`
 * ou `shardColor`. Centraliza o mapa slug→cor/label pra exibição nos
 * selects do admin e evita o usuário ter que decorar "a, b, c, d, e, f".
 */

export interface PaletteOption {
  slug: string
  label: string
  // cor hex pro swatch no select
  hex: string
  // CSS variable equivalente (se existir no globals.css)
  cssVar?: string
}

/**
 * Usada em campos `colorClass` (a, b, c, d, e, f) dos admins de:
 * Serviços (blocks de detalhe), Soluções, IA blocks, etc.
 */
export const COLOR_CLASS_OPTIONS: PaletteOption[] = [
  { slug: 'a', label: 'Violeta', hex: '#a78bfa', cssVar: '--violet' },
  { slug: 'b', label: 'Ciano', hex: '#22d3ee', cssVar: '--cyan' },
  { slug: 'c', label: 'Magenta / Rosa', hex: '#ec4899', cssVar: '--magenta' },
  { slug: 'd', label: 'Âmbar / Amarelo', hex: '#f59e0b', cssVar: '--amber' },
  { slug: 'e', label: 'Esmeralda / Verde', hex: '#34d399', cssVar: '--emerald' },
  { slug: 'f', label: 'Violeta (alt.)', hex: '#a78bfa', cssVar: '--violet' },
]

/**
 * Usada em campos `shardColor` (v, c, m, a, e) de Serviços/Cards glass
 * — diferente do colorClass! Apenas 5 cores.
 */
export const SHARD_COLOR_OPTIONS: PaletteOption[] = [
  { slug: 'v', label: 'Violeta', hex: '#a78bfa', cssVar: '--violet' },
  { slug: 'c', label: 'Ciano', hex: '#22d3ee', cssVar: '--cyan' },
  { slug: 'm', label: 'Magenta / Rosa', hex: '#ec4899', cssVar: '--magenta' },
  { slug: 'a', label: 'Âmbar / Amarelo', hex: '#f59e0b', cssVar: '--amber' },
  { slug: 'e', label: 'Esmeralda / Verde', hex: '#34d399', cssVar: '--emerald' },
]

export function findColorOption(
  options: PaletteOption[],
  slug?: string | null
): PaletteOption | undefined {
  if (!slug) return undefined
  return options.find((o) => o.slug === slug)
}
