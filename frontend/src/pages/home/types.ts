/**
 * Tipos compartilhados entre HomePage orquestrador e os subcomponentes
 * em `pages/home/*Section.tsx`.
 */

export interface ProcessStep {
  id: string
  number: string
  title: string
  description: string
  duration?: string | null
}

export interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
  anchor?: string | null
  numLabel?: string | null
  tileClass?: string | null
  homePill?: string | null
  homePillTags?: string[]
  order: number
}

export interface KPI {
  id: string
  label: string
  value: string
  suffix?: string | null
  caption?: string | null
  order: number
}

export interface LiveCardRow {
  label: string
  value: string
  highlight?: string | null
}

export interface LiveCard {
  id: string
  label: string
  title: string
  rows: LiveCardRow[]
}

export interface BrandPill {
  id: string
  personName: string
  company?: string | null
  quote: string
  avatarUrl?: string | null
}

export interface HomeBand {
  id: string
  eyebrow: string
  title: string
  ctaLabel: string
  ctaUrl: string
  mono: string
}

export interface HomeClient {
  id: string
  name: string
  logoUrl: string
  sector?: string | null
  websiteUrl?: string | null
}

export interface StackItem {
  id: string
  name: string
}
