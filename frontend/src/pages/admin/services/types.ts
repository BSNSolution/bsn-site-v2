/**
 * Tipos compartilhados entre o shell `AdminServicesPage` e as tabs
 * (`TabMain`, `TabDetail`, `TabBlocks`).
 */

export interface Feature {
  title: string
  description: string
}

export interface ServiceDetailBlock {
  id: string
  title: string
  description: string
  iconName?: string | null
  colorClass?: string | null
  order: number
  isActive: boolean
}

export interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
  anchor?: string | null
  slug?: string | null
  numLabel?: string | null
  shardColor?: string | null
  ctaLabel?: string | null
  features?: Feature[] | null
  tileClass?: string | null
  homePill?: string | null
  homePillTags?: string[]
  heroEyebrow?: string | null
  heroDescription?: string | null
  heroLongText?: string | null
  ctaTitle?: string | null
  ctaText?: string | null
  ctaButtonLabel?: string | null
  ctaButtonUrl?: string | null
  detailBlocks?: ServiceDetailBlock[]
  isActive: boolean
  order: number
}

export interface ServiceFormData {
  title: string
  subtitle: string
  description: string
  iconName: string
  anchor: string
  slug: string
  numLabel: string
  shardColor: string
  ctaLabel: string
  features: Feature[]
  tileClass: string
  homePill: string
  homePillTags: string
  heroEyebrow: string
  heroDescription: string
  heroLongText: string
  ctaTitle: string
  ctaText: string
  ctaButtonLabel: string
  ctaButtonUrl: string
  isActive: boolean
  order?: number
}

export const SHARD_OPTIONS = ['v', 'c', 'm', 'a', 'e']
export const TILE_OPTIONS = ['', 't1', 't2', 't3', 't4', 't5', 't6', 't7']
export const BLOCK_COLOR_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f']

export const EMPTY_FORM: ServiceFormData = {
  title: '',
  subtitle: '',
  description: '',
  iconName: 'code',
  anchor: '',
  slug: '',
  numLabel: '',
  shardColor: 'v',
  ctaLabel: 'Falar sobre um projeto ↗',
  features: [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ],
  tileClass: 't1',
  homePill: '',
  homePillTags: '',
  heroEyebrow: '',
  heroDescription: '',
  heroLongText: '',
  ctaTitle: '',
  ctaText: '',
  ctaButtonLabel: '',
  ctaButtonUrl: '/contato',
  isActive: true,
}

/** Slug válido: lowercase, letras/números/hífen, sem iniciar em hífen */
export function isValidSlug(slug: string): boolean {
  if (!slug) return true // opcional
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
