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
}

const DEFAULT_PERKS: Perk[] = [
  { id: '1', title: 'Remoto-first', description: 'Trabalhe de onde for mais produtivo. Encontros presenciais trimestrais opcionais.', order: 1 },
  { id: '2', title: 'Aprendizado contínuo', description: 'R$ 5.000/ano para cursos, livros, conferências. Sem burocracia.', order: 2 },
  { id: '3', title: 'Equipamento top', description: 'MacBook Pro, monitor, cadeira ergonômica. Tudo que precisa.', order: 3 },
  { id: '4', title: 'Participação real', description: 'Plano de stock options para sêniores e lideranças após o ciclo.', order: 4 },
]

const DEFAULT_JOBS: Job[] = [
  { id: '1', title: 'Engenheiro(a) de Software Sênior', description: '', type: 'FULL_TIME', isActive: true, location: 'REMOTO', requirements: 'TypeScript · Node · React' },
  { id: '2', title: 'SRE / DevOps Pleno', description: '', type: 'FULL_TIME', isActive: true, location: 'REMOTO', requirements: 'AWS · K8s · Terraform' },
  { id: '3', title: 'Product Designer Sênior', description: '', type: 'FULL_TIME', isActive: true, location: 'REMOTO', requirements: 'Figma · Pesquisa · Sistemas' },
  { id: '4', title: 'QA Automation Pleno', description: '', type: 'FULL_TIME', isActive: true, location: 'REMOTO', requirements: 'Playwright · Cypress' },
  { id: '5', title: 'Product Manager', description: '', type: 'FULL_TIME', isActive: true, location: 'SP · HÍBRIDO', requirements: 'B2B · Fintech · Coop' },
]

export default function CareersPage() {
  const jobsQuery = useQuery<{ jobs?: Job[] }>({
    queryKey: ['jobs-public'],
    queryFn: jobsApi.getJobs,
    staleTime: 5 * 60 * 1000,
  })

  const perksQuery = useQuery<{ perks: Perk[] }>({
    queryKey: ['perks-public'],
    queryFn: async () => {
      const res = await api.get('/perks')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const jobs = (jobsQuery.data?.jobs?.length ? jobsQuery.data.jobs : DEFAULT_JOBS).filter((j) => j.isActive)
  const perks = (perksQuery.data?.perks?.length ? perksQuery.data.perks : DEFAULT_PERKS).slice(0, 4)

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

      <section className="perks shell">
        {perks.map((perk) => (
          <div key={perk.id} className="perk glass">
            <h4>{perk.title}</h4>
            <p>{perk.description}</p>
          </div>
        ))}
      </section>

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
