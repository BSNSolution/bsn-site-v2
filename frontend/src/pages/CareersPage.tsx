import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { jobsApi, api } from '@/lib/api'

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

  const perksQuery = useQuery<{ perks: Perk[] }>({
    queryKey: ['perks-public'],
    queryFn: async () => (await api.get('/perks')).data,
    staleTime: 5 * 60 * 1000,
  })

  const jobs = (jobsQuery.data?.jobs ?? []).filter((j) => j.isActive)
  const perks = perksQuery.data?.perks ?? []

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Carreiras · vagas abertas</span>
        </div>
        <h1>
          Venha construir
          <br />
          software que <em>importa</em>.
        </h1>
        <p>
          Times sêniores, projetos com propósito, autonomia real. Remoto-first no Brasil, presencial opcional em São
          Paulo.
        </p>
      </section>

      {perks.length > 0 && (
        <section className="perks shell">
          {perks.map((perk) => (
            <div key={perk.id} className="perk glass">
              <h4>{perk.title}</h4>
              <p>{perk.description}</p>
            </div>
          ))}
        </section>
      )}

      <section className="jobs shell">
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

      <Footer />
    </div>
  )
}
