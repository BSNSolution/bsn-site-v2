import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://bsnsolution.com.br'
const SITE_NAME = 'BSN Solution'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`

export interface SeoProps {
  /** Título específico da página (será sufixado com "| BSN Solution"). */
  title: string
  /** Descrição meta (150-160 caracteres recomendado). */
  description: string
  /** Caminho relativo ao domínio (ex: "/servicos"). Sem trailing slash. */
  path: string
  /** URL absoluta da imagem OG (1200x630). Opcional. */
  image?: string
  /** Tipo do conteúdo (og:type). Default: "website". Use "article" para blog posts. */
  type?: 'website' | 'article' | 'profile'
  /** JSON-LD adicional (Schema.org) — array de objetos. */
  jsonLd?: Record<string, unknown>[]
  /** Se true, impede indexação da página. */
  noIndex?: boolean
}

export default function Seo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  jsonLd,
  noIndex,
}: SeoProps) {
  const fullTitle = title.endsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={absoluteImage} />

      {/* JSON-LD (Schema.org) */}
      {jsonLd?.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}
