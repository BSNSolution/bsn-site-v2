import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Briefcase,
  LayoutGrid,
  Users,
  FileText,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { api, inboxApi } from '@/lib/api'

interface Stat {
  label: string
  value: number | string
  href: string
  icon: any
  hint?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        api.get('/admin/services').then((r) => r.data.services?.length ?? 0).catch(() => 0),
        api.get('/admin/solutions').then((r) => r.data.solutions?.length ?? 0).catch(() => 0),
        api.get('/admin/team').then((r) => (r.data.team ?? r.data.members ?? []).length).catch(() => 0),
        api.get('/admin/jobs').then((r) => r.data.jobs?.length ?? 0).catch(() => 0),
        api.get('/admin/blog').then((r) => r.data.posts?.length ?? 0).catch(() => 0),
        inboxApi.admin.getStats().catch(() => null),
      ])
      const [services, solutions, team, jobs, blog, inboxStats] = results.map((r) => r.status === 'fulfilled' ? r.value : 0) as any[]

      setStats([
        { label: 'Serviços', value: services, href: '/admin/services', icon: Briefcase },
        { label: 'Soluções', value: solutions, href: '/admin/solutions', icon: LayoutGrid },
        { label: 'Equipe', value: team, href: '/admin/team', icon: Users },
        { label: 'Vagas', value: jobs, href: '/admin/jobs', icon: FileText },
        { label: 'Posts no blog', value: blog, href: '/admin/blog', icon: BookOpen },
        { label: 'Mensagens não lidas', value: inboxStats?.unread ?? 0, href: '/admin/inbox', icon: Inbox, hint: `${inboxStats?.total ?? 0} total` },
      ])
      setUnreadMessages(inboxStats?.unread ?? 0)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do conteúdo gerenciado.
          {unreadMessages > 0 && (
            <span className="ml-2 text-primary">Você tem {unreadMessages} mensagem{unreadMessages > 1 ? 'ns' : ''} não lida{unreadMessages > 1 ? 's' : ''}.</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.label}
                to={s.href}
                className="glass p-5 group hover:border-white/20 transition flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-medium mt-2" style={{ letterSpacing: '-0.03em' }}>{s.value}</div>
                  {s.hint && <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="glass p-5">
        <h2 className="text-base font-medium mb-3">Atalhos rápidos</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/blog/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
            Novo post no blog
          </Link>
          <Link to="/admin/jobs" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
            Criar vaga
          </Link>
          <Link to="/admin/services" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
            Editar serviços
          </Link>
          <Link to="/admin/settings" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
            Configurações
          </Link>
        </div>
      </div>
    </div>
  )
}
