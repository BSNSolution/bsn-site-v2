/**
 * Helpers para construir objetos JSON-LD (Schema.org) consumidos pelo
 * componente <Seo /> via prop `jsonLd`. Mantém o código das páginas limpo.
 */

const SITE_URL = 'https://bsnsolution.com.br'

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  }
}

export function serviceSchema(params: {
  name: string
  description: string
  slug: string
  imageUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/servicos/${params.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'BSN Solution',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    ...(params.imageUrl ? { image: params.imageUrl } : {}),
  }
}

export function articleSchema(params: {
  title: string
  description: string
  slug: string
  author?: string
  datePublished?: string
  dateModified?: string
  imageUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: `${SITE_URL}/blog/${params.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'BSN Solution',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(params.author ? { author: { '@type': 'Person', name: params.author } } : {}),
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
    ...(params.imageUrl ? { image: params.imageUrl } : {}),
  }
}

export function webPage(params: { title: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.title,
    description: params.description,
    url: `${SITE_URL}${params.path.startsWith('/') ? params.path : `/${params.path}`}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'BSN Solution',
      url: SITE_URL,
    },
  }
}

export function localBusiness() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'BSN Solution',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'Fábrica de software com 11 capacidades sob o mesmo time — desenvolvimento sob medida, IA, squads, automação, infra e suporte 24/7.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cuiabá',
      addressRegion: 'MT',
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    priceRange: '$$',
  }
}
