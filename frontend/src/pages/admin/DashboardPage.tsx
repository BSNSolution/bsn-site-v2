import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox,
  Briefcase,
  LayoutGrid,
  Users,
  FileText,
  BookOpen,
  ArrowRight,
  Activity,
  Eye,
  TrendingUp,
  Globe,
  ExternalLink,
  Radio,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { api, inboxApi, analyticsApi } from '@/lib/api'

type Period = 'today' | '7d' | '30d' | '90d' | '1y'

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '1y', label: '1 ano' },
]

interface ContentStat {
  label: string
  value: number | string
  href: string
  icon: any
  hint?: string
}

function formatChartDate(iso: string, period: Period): string {
  const d = new Date(iso)
  if (period === 'today') {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatPagePath(p: string): string {
  if (!p) return '—'
  if (p === '/') return '/ (home)'
  return p.length > 40 ? p.slice(0, 37) + '…' : p
}

function formatReferrer(r: string): string {
  try {
    const u = new URL(r)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return r.length > 30 ? r.slice(0, 27) + '…' : r
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [contentStats, setContentStats] = useState<ContentStat[]>([])
  const [loadingContent, setLoadingContent] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)

  // ── Analytics: summary com filtro de período ────────────────
  const summaryQuery = useQuery({
    queryKey: ['admin-analytics-summary', period],
    queryFn: () => analyticsApi.admin.getSummary(period),
    staleTime: 30 * 1000,
  })

  // ── Analytics: realtime com polling de 30s ────────────────
  const realtimeQuery = useQuery({
    queryKey: ['admin-analytics-realtime'],
    queryFn: () => analyticsApi.admin.getRealtime(),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  })

  useEffect(() => {
    loadContent({ silent: false })
  }, [])

  async function loadContent({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoadingContent(true)
      const results = await Promise.allSettled([
        api.get('/admin/services').then((r) => r.data.services?.length ?? 0).catch(() => 0),
        api.get('/admin/solutions').then((r) => r.data.solutions?.length ?? 0).catch(() => 0),
        api.get('/admin/team').then((r) => (r.data.team ?? r.data.members ?? []).length).catch(() => 0),
        api.get('/admin/jobs').then((r) => r.data.jobs?.length ?? 0).catch(() => 0),
        api.get('/admin/blog').then((r) => r.data.posts?.length ?? 0).catch(() => 0),
        inboxApi.admin.getStats().catch(() => null),
      ])
      const [services, solutions, team, jobs, blog, inboxStats] = results.map(
        (r) => (r.status === 'fulfilled' ? r.value : 0),
      ) as any[]

      setContentStats([
        { label: 'Serviços', value: services, href: '/admin/services', icon: Briefcase },
        { label: 'Soluções', value: solutions, href: '/admin/solutions', icon: LayoutGrid },
        { label: 'Equipe', value: team, href: '/admin/team', icon: Users },
        { label: 'Vagas', value: jobs, href: '/admin/jobs', icon: FileText },
        { label: 'Posts no blog', value: blog, href: '/admin/blog', icon: BookOpen },
        { label: 'Mensagens não lidas', value: inboxStats?.unread ?? 0, href: '/admin/inbox', icon: Inbox, hint: `${inboxStats?.total ?? 0} total` },
      ])
      setUnreadMessages(inboxStats?.unread ?? 0)
    } finally {
      if (!silent) setLoadingContent(false)
    }
  }

  const summary = summaryQuery.data
  const realtime = realtimeQuery.data

  // Dados formatados pra Recharts
  const chartData = useMemo(() => {
    if (!summary?.byDay) return []
    return summary.byDay.map((d) => ({
      date: formatChartDate(d.date, period),
      visits: d.count,
      raw: d.date,
    }))
  }, [summary, period])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do tráfego e conteúdo do site.
            {unreadMessages > 0 && (
              <span className="ml-2 text-primary">
                Você tem {unreadMessages} mensagem
                {unreadMessages > 1 ? 'ns' : ''} não lida
                {unreadMessages > 1 ? 's' : ''}.
              </span>
            )}
          </p>
        </div>

        {/* Filtro de período */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded text-xs transition-colors ${
                period === opt.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Linha 1: 4 cards de métricas grandes de visitas ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Hoje"
          value={summary?.totals.today ?? '—'}
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={Eye}
          label="Últimos 7 dias"
          value={summary?.totals.week ?? '—'}
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Últimos 30 dias"
          value={summary?.totals.month ?? '—'}
          loading={summaryQuery.isLoading}
        />
        <MetricCard
          icon={Globe}
          label="Total acumulado"
          value={summary?.totals.allTime ?? '—'}
          loading={summaryQuery.isLoading}
        />
      </div>

      {/* ── Linha 2: Online agora (col esq) + métricas extras (col dir) ── */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Radio
              className={`h-4 w-4 ${realtime && realtime.online > 0 ? 'text-emerald-400' : 'text-white/40'}`}
            />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Online agora
            </span>
            {realtime && realtime.online > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="text-4xl font-medium" style={{ letterSpacing: '-0.03em' }}>
            {realtime?.online ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {realtime && realtime.online === 1
              ? 'visitante ativo no momento'
              : 'visitantes ativos no momento'}
          </div>

          {realtime && realtime.recentEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Últimas ações
              </div>
              <div className="space-y-1.5 max-h-44 overflow-auto">
                {realtime.recentEvents.slice(0, 6).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-mono text-white/40 shrink-0">
                      {ev.event}
                    </span>
                    <span className="truncate text-white/70 flex-1">
                      {ev.page ?? '—'}
                    </span>
                    <span className="font-mono text-[10px] text-white/30 shrink-0">
                      {new Date(ev.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bounce / Sessions / Top single column shared */}
        <div className="glass p-5 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Sessões
              </div>
              <div className="text-2xl font-medium mt-1">
                {summary?.totalSessions ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Bounces
              </div>
              <div className="text-2xl font-medium mt-1">
                {summary?.bouncedCount ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Bounce rate
              </div>
              <div className="text-2xl font-medium mt-1">
                {summary?.bounceRate != null
                  ? `${summary.bounceRate.toFixed(1)}%`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Gráfico Recharts */}
          <div className="h-48 -mx-2">
            {summaryQuery.isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Carregando gráfico…
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    stroke="rgba(255,255,255,0.1)"
                    tickLine={false}
                    width={32}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 15, 20, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 12,
                    }}
                    labelStyle={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 11,
                    }}
                    cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#visitsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados no período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Linha 3: Top pages + Top referrers ── */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        <div className="glass p-5">
          <h2 className="text-base font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Top páginas
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground ml-1">
              ({period})
            </span>
          </h2>
          {summaryQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (summary?.topPages.length ?? 0) > 0 ? (
            <ol className="space-y-2">
              {summary!.topPages.map((p, idx) => {
                const max = summary!.topPages[0]?.views || 1
                const pct = (p.views / max) * 100
                return (
                  <li key={p.page} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-white/40 font-mono text-[10px] shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 truncate font-mono text-xs text-white/85">
                        {formatPagePath(p.page)}
                      </span>
                      <span className="font-medium tabular-nums">{p.views}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-400 to-cyan-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhuma visita registrada no período.
            </div>
          )}
        </div>

        <div className="glass p-5">
          <h2 className="text-base font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Top referrers
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground ml-1">
              ({period})
            </span>
          </h2>
          {summaryQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (summary?.topReferrers.length ?? 0) > 0 ? (
            <ul className="space-y-2">
              {summary!.topReferrers.map((r, idx) => (
                <li
                  key={r.referrer + idx}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-white/85">
                    {formatReferrer(r.referrer)}
                  </span>
                  <span className="font-medium tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">
              Nenhum referrer registrado no período.
            </div>
          )}
        </div>
      </div>

      {/* ── Linha 4: Conteúdo geral (cards antigos) ── */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-muted-foreground">
          Conteúdo gerenciado
        </h2>
        {loadingContent ? (
          <div className="p-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {contentStats.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.label}
                  to={s.href}
                  className="glass p-5 group hover:border-white/20 transition flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div
                      className="text-3xl font-medium mt-2"
                      style={{ letterSpacing: '-0.03em' }}
                    >
                      {s.value}
                    </div>
                    {s.hint && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {s.hint}
                      </div>
                    )}
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
      </div>

      {/* ── Atalhos rápidos ── */}
      <div className="glass p-5">
        <h2 className="text-base font-medium mb-3">Atalhos rápidos</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/blog/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            Novo post no blog
          </Link>
          <Link
            to="/admin/jobs"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            Criar vaga
          </Link>
          <Link
            to="/admin/services"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            Editar serviços
          </Link>
          <Link
            to="/admin/contact-config"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            Configurar contato
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            Configurações
          </Link>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: any
  label: string
  value: number | string
  loading?: boolean
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-white/50" />
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className="text-3xl font-medium tabular-nums"
        style={{ letterSpacing: '-0.03em' }}
      >
        {loading ? '—' : value}
      </div>
    </div>
  )
}
