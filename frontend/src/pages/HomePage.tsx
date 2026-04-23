import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Seo from '@/components/Seo'
import { useAnalytics } from '@/hooks/use-analytics'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'
import { homeExtrasApi, stackApi } from '@/lib/api'

import HeroOrbitSection from './home/HeroOrbitSection'
import KpisSection from './home/KpisSection'
import VitralSection from './home/VitralSection'
import TimelineSection from './home/TimelineSection'
import ClientsSection from './home/ClientsSection'
import BandSection from './home/BandSection'
import StackSection from './home/StackSection'

import type {
  Service,
  KPI,
  HomeBand,
  HomeClient,
  StackItem,
  ProcessStep,
} from './home/types'

// Keys default — mesma ordem do seed em backend/prisma/seed.ts
const HOME_SECTION_KEYS = [
  'hero-orbit',
  'kpis',
  'stack',
  'vitral',
  'timeline',
  'clients',
  'band',
] as const

export default function HomePage() {
  const { trackPageView, trackEvent } = useAnalytics()

  useEffect(() => {
    trackPageView('/')
    trackEvent('page_load', { page: 'home', timestamp: new Date().toISOString() })
  }, [trackPageView, trackEvent])

  // Queries com padrão (await api.get).data → useApiQuery
  const servicesQuery = useApiQuery<{ services: Service[] }>(['services-home'], '/services')
  const kpiQuery = useApiQuery<{ kpis: KPI[] }>(['kpis-home'], '/kpis')
  const stepsQuery = useApiQuery<{ steps: ProcessStep[] }>(['process-steps'], '/process-steps')
  const clientsQuery = useApiQuery<{ clients: HomeClient[] }>(['clients-home'], '/clients')

  // Queries com funções nomeadas (api client customizado) seguem com useQuery
  const bandQuery = useQuery<{ band: HomeBand | null }>({
    queryKey: ['home-band'],
    queryFn: homeExtrasApi.getBand,
    staleTime: 5 * 60 * 1000,
  })
  const stackQuery = useQuery<{ items: StackItem[] }>({
    queryKey: ['stack-items'],
    queryFn: stackApi.getItems,
    staleTime: 5 * 60 * 1000,
  })

  const services = (servicesQuery.data?.services ?? []).slice(0, 7)
  const kpis = kpiQuery.data?.kpis ?? []
  const band = bandQuery.data?.band
  const stack = stackQuery.data?.items ?? []
  const steps = stepsQuery.data?.steps ?? []
  const clients = clientsQuery.data?.clients ?? []

  const { effectiveKeys } = usePageSections('home', HOME_SECTION_KEYS)

  // Mapeia cada key de section do admin para o componente responsável
  // por renderizar o bloco correspondente.
  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    'hero-orbit': () => <HeroOrbitSection services={services} />,
    kpis: () => <KpisSection kpis={kpis} />,
    vitral: () => <VitralSection services={services} />,
    timeline: () => <TimelineSection steps={steps} />,
    clients: () => <ClientsSection clients={clients} />,
    band: () => <BandSection band={band} />,
    stack: () => <StackSection stack={stack} />,
  }

  return (
    <div className="page">
      <Seo
        title="BSN Solution — Desenvolvimento, IA e Tecnologia em Cuiabá"
        description="Fábrica de software com 7 capacidades sob o mesmo time: desenvolvimento sob medida, squads, automação, IA aplicada, infra, consultoria e suporte 24/7. Um ponto de contato, um SLA, um time que fala a sua língua."
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'BSN Solution',
            url: 'https://bsnsolution.com.br',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://bsnsolution.com.br/blog?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
