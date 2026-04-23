import type { ReactNode } from 'react'

interface Props {
  /** Texto pequeno (eyebrow mono) que aparece sobre o H1. */
  eyebrow: string
  /**
   * Conteúdo do H1. Aceita string ou ReactNode (para combinar `<em>`,
   * `<br />`, etc — como os heros atuais das páginas públicas).
   */
  title: ReactNode
  /** Parágrafo descritivo (`.lede`) abaixo do H1. */
  lede?: ReactNode
  /** Slot para conteúdo extra (badges, CTAs) dentro da section. */
  children?: ReactNode
}

/**
 * Hero compartilhado das páginas públicas (services, solutions, about,
 * blog, careers, contact, ai). Usa o mesmo CSS `.hero-s .shell` já
 * existente em `styles/parts/_page-hero.css` — mantém a UX 1:1.
 *
 * A Home tem hero especial (orbit) e não usa este componente.
 */
export default function PublicPageHero({ eyebrow, title, lede, children }: Props) {
  return (
    <section key="hero" className="hero-s shell">
      <div className="eyebrow mono">
        <span className="dot" />
        <span>{eyebrow}</span>
      </div>
      <h1>{title}</h1>
      {lede && <p>{lede}</p>}
      {children}
    </section>
  )
}
