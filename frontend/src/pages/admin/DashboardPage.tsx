import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Briefcase,
  Settings,
  Star,
  MessageCircle,
  FileText,
  Inbox,
  Building2,
  TrendingUp,
  Activity,
  Clock,
  Calendar
} from 'lucide-react'
import {
  servicesApi,
  solutionsApi,
  teamApi,
  blogApi,
  inboxApi,
  testimonialsApi,
  clientsApi,
  jobsApi,
  analyticsApi
} from '@/lib/api'

interface DashboardStats {
  services: number
  solutions: number
  team: number
  blog: number
  inbox: number
  testimonials: number
  clients: number
  jobs: number
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: string
  user?: string
}

const statsCards = [
  {
    key: 'services' as keyof DashboardStats,
    title: 'Serviços',
    icon: Briefcase,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  {
    key: 'solutions' as keyof DashboardStats,
    title: 'Soluções',
    icon: Settings,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  {
    key: 'blog' as keyof DashboardStats,
    title: 'Posts Blog',
    icon: MessageCircle,
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  {
    key: 'team' as keyof DashboardStats,
    title: 'Equipe',
    icon: Users,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  },
  {
    key: 'testimonials' as keyof DashboardStats,
    title: 'Depoimentos',
    icon: Star,
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  {
    key: 'clients' as keyof DashboardStats,
    title: 'Clientes',
    icon: Building2,
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
  },
  {
    key: 'jobs' as keyof DashboardStats,
    title: 'Vagas',
    icon: FileText,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20'
  },
  {
    key: 'inbox' as keyof DashboardStats,
    title: 'Mensagens',
    icon: Inbox,
    color: 'bg-red-500/10 text-red-500 border-red-500/20'
  }
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    services: 0,
    solutions: 0,
    team: 0,
    blog: 0,
    inbox: 0,
    testimonials: 0,
    clients: 0,
    jobs: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Load stats in parallel
        const [
          servicesRes,
          solutionsRes,
          teamRes,
          blogRes,
          inboxRes,
          testimonialsRes,
          clientsRes,
          jobsRes,
          activityRes
        ] = await Promise.allSettled([
          servicesApi.admin.getServices(),
          solutionsApi.admin.getSolutions(),
          teamApi.admin.getTeam(),
          blogApi.admin.getPosts({ limit: 1 }),
          inboxApi.admin.getMessages({ limit: 1 }),
          testimonialsApi.admin.getTestimonials(),
          clientsApi.admin.getClients(),
          jobsApi.admin.getJobs(),
          analyticsApi.admin.getRecent().catch(() => ({ data: [] })) // Fallback if no analytics
        ])

        // Extract counts from responses
        const newStats: DashboardStats = {
          services: servicesRes.status === 'fulfilled' ? servicesRes.value.data?.length || 0 : 0,
          solutions: solutionsRes.status === 'fulfilled' ? solutionsRes.value.data?.length || 0 : 0,
          team: teamRes.status === 'fulfilled' ? teamRes.value.data?.length || 0 : 0,
          blog: blogRes.status === 'fulfilled' ? blogRes.value.data?.pagination?.total || 0 : 0,
          inbox: inboxRes.status === 'fulfilled' ? inboxRes.value.data?.pagination?.total || 0 : 0,
          testimonials: testimonialsRes.status === 'fulfilled' ? testimonialsRes.value.data?.length || 0 : 0,
          clients: clientsRes.status === 'fulfilled' ? clientsRes.value.data?.length || 0 : 0,
          jobs: jobsRes.status === 'fulfilled' ? jobsRes.value.data?.length || 0 : 0
        }

        setStats(newStats)

        // Process recent activity
        if (activityRes.status === 'fulfilled' && activityRes.value.data) {
          setRecentActivity(activityRes.value.data)
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do seu painel administrativo
        </p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => {
              const Icon = card.icon
              const value = stats[card.key]

              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold">
                        {value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl border ${card.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Atividade Recente</h3>
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground mb-1">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(activity.timestamp)}
                          {activity.user && (
                            <>
                              <span>•</span>
                              <span>{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Resumo Rápido</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">Última atualização</span>
                  </div>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-lg font-bold text-green-500">
                      {stats.services + stats.solutions}
                    </div>
                    <div className="text-xs text-muted-foreground">Produtos</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-lg font-bold text-blue-500">
                      {stats.blog}
                    </div>
                    <div className="text-xs text-muted-foreground">Conteúdo</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="text-lg font-bold text-purple-500">
                      {stats.team}
                    </div>
                    <div className="text-xs text-muted-foreground">Pessoas</div>
                  </div>

                  <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="text-lg font-bold text-orange-500">
                      {stats.inbox}
                    </div>
                    <div className="text-xs text-muted-foreground">Mensagens</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}