import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import Seo from '@/components/Seo'
import { jobsApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'

const CAREERS_SECTION_KEYS = ['hero', 'perks', 'jobs'] as const

interface Perk {
  id: string
  title: string
  description: string
  order: number
}

interface Job {
  id: string
  title: string
  description: string
  location?: string | null
  type: string
  isActive: boolean
  requirements?: string | null
  order?: number
}

export default function CareersPage() {
  const jobsQuery = useQuery<{ jobs?: Job[] }>({
    queryKey: ['jobs-public'],
    queryFn: jobsApi.getJobs,
    staleTime: 5 * 60 * 1000,
  })

  const perksQuery = useApiQuery<{ perks: Perk[] }>(['perks-public'], '/perks')

  const jobs = (jobsQuery.data?.jobs ?? []).filter((j) => j.isActive)
  const perks = perksQuery.data?.perks ?? []
  const { effectiveKeys } = usePageSections('careers', CAREERS_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Carreiras · vagas abertas"
        title={
          <>
            Venha construir
            <br />
            software que <em>importa</em>.
          </>
        }
        lede="Times sêniores, projetos com propósito, autonomia real. Remoto-first no Brasil, presencial opcional em São Paulo."
      />
    ),

    perks: () =>
      perks.length === 0 ? null : (
        <section key="perks" className="perks shell">
          {perks.map((perk) => (
            <div key={perk.id} className="perk glass">
              <h4>{perk.title}</h4>
              <p>{perk.description}</p>
            </div>
          ))}
        </section>
      ),

    jobs: () => (
      <section key="jobs" className="jobs shell">
        <h2>Vagas abertas · {jobs.length}</h2>
        {jobs.map((job) => (
          <div key={job.id} className="job glass">
            <h3>{job.title}</h3>
            <div className="m">{job.requirements ?? ''}</div>
            <div className="m">{job.location ?? 'REMOTO'}</div>
            <div className="arr">↗</div>
          </div>
        ))}
      </section>
    ),
  }

  return (
    <div className="page">
      <Seo
        title="Carreiras — Vagas Abertas na BSN Solution"
        description="Vagas abertas para devs, QAs, designers e product people. Venha construir produtos que rodam em produção e resolvem problemas reais de negócio — com autonomia, clareza de escopo e time sênior ao lado."
        path="/carreiras"
      />
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
