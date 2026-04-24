import { useEffect, useState, Suspense } from 'react'
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home,
  Settings,
  FileText,
  Users,
  Briefcase,
  Star,
  MessageCircle,
  Inbox,
  Upload,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Award,
  TrendingUp,
  Gift,
  MessageSquareQuote,
  Cpu,
  Sparkles,
  Info,
  ExternalLink,
  LayoutGrid,
  Rocket,
  BookOpen,
  Handshake,
  UserCog,
  Shield,
  Layers,
  KeyRound,
} from 'lucide-react'
import { authApi } from '@/lib/api'

interface UserPayload {
  id: string
  name: string
  email: string
  role: string
}

interface SidebarItem {
  name: string
  href: string
  icon: any
  /** Permissão(ões) necessárias — se undefined, todos autenticados veem */
  permission?: string | string[]
  /** Modo de checagem quando permission é array */
  permissionMode?: 'any' | 'all'
}

interface SidebarSection {
  label: string
  items: SidebarItem[]
}

const SECTIONS: SidebarSection[] = [
  {
    label: 'Visão geral',
    items: [
      { name: 'Dashboard', href: '/admin', icon: BarChart3, permission: 'dashboard.view' },
      { name: 'Inbox', href: '/admin/inbox', icon: Inbox, permission: 'inbox.read' },
      { name: 'Seções das páginas', href: '/admin/pages', icon: Layers, permission: 'page-sections.write' },
    ],
  },
  {
    label: 'Página: Home',
    items: [
      { name: '1. Hero & seções', href: '/admin/home', icon: Home, permission: ['home.read', 'home.write'] },
      { name: '2. KPIs', href: '/admin/kpis', icon: TrendingUp, permission: 'home.kpis.write' },
      { name: '3. Stack (marquee)', href: '/admin/stack', icon: Cpu, permission: 'home.kpis.write' },
      { name: '7. Banda "Filosofia"', href: '/admin/home-band', icon: MessageSquareQuote, permission: 'home.write' },
    ],
  },
  {
    label: 'Página: Serviços',
    items: [
      { name: 'Serviços (mosaico + lista)', href: '/admin/services', icon: Briefcase, permission: ['services.read', 'services.write'] },
    ],
  },
  {
    label: 'Página: Soluções',
    items: [
      { name: 'Soluções verticais', href: '/admin/solutions', icon: LayoutGrid, permission: ['solutions.read', 'solutions.write'] },
    ],
  },
  {
    label: 'Página: IA',
    items: [
      { name: 'Blocos (Benefícios, Etapas, Destaques)', href: '/admin/ai', icon: Sparkles, permission: ['ai-blocks.read', 'ai-blocks.write'] },
    ],
  },
  {
    label: 'Página: Sobre',
    items: [
      { name: 'Cards (Missão/Visão/…)', href: '/admin/about-cards', icon: Info, permission: ['about.read', 'about.write'] },
      { name: 'Valores (4 princípios)', href: '/admin/values', icon: Award, permission: ['about.read', 'about.write'] },
      { name: 'Equipe', href: '/admin/team', icon: Users, permission: ['about.read', 'team.write'] },
    ],
  },
  {
    label: 'Página: Blog',
    items: [
      { name: 'Posts', href: '/admin/blog', icon: BookOpen, permission: ['blog.read', 'blog.write'] },
    ],
  },
  {
    label: 'Página: Carreiras',
    items: [
      { name: 'Vagas', href: '/admin/jobs', icon: FileText, permission: ['jobs.read', 'jobs.write'] },
      { name: 'Benefícios', href: '/admin/perks', icon: Gift, permission: 'perks.write' },
    ],
  },
  {
    label: 'Elementos compartilhados',
    items: [
      { name: 'Depoimentos', href: '/admin/testimonials', icon: Star, permission: 'testimonials.write' },
      { name: 'Clientes', href: '/admin/clients', icon: Handshake, permission: 'clients.write' },
    ],
  },
  {
    label: 'Mídia & Sistema',
    items: [
      { name: 'Uploads de imagens', href: '/admin/uploads', icon: Upload, permission: ['uploads.read', 'uploads.write'] },
      { name: 'Configurações do site', href: '/admin/settings', icon: Settings, permission: ['settings.read', 'settings.write'] },
    ],
  },
  {
    label: 'Acesso & usuários',
    items: [
      { name: 'Usuários', href: '/admin/users', icon: UserCog, permission: ['users.read', 'users.write'] },
      { name: 'Grupos de permissões', href: '/admin/permission-groups', icon: Shield, permission: ['groups.read', 'groups.write'] },
      { name: 'Tokens de API', href: '/admin/api-tokens', icon: KeyRound, permission: ['api-tokens.read', 'api-tokens.write'] },
      { name: 'Configurações de IA', href: '/admin/ai-configs', icon: Sparkles, permission: ['ai-configs.read', 'ai-configs.write'] },
    ],
  },
]

export default function AdminLayout() {
  const [user, setUser] = useState<UserPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = useAuth()

  // Filtra seções/itens pelas permissões do usuário logado
  const visibleSections: SidebarSection[] = SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => {
      if (isAdmin) return true
      if (!item.permission) return true
      if (typeof item.permission === 'string') return hasPermission(item.permission)
      if (item.permission.length === 0) return true
      return item.permissionMode === 'all'
        ? hasAllPermissions(...item.permission)
        : hasAnyPermission(...item.permission)
    }),
  })).filter((sec) => sec.items.length > 0)

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('bsn-auth-token')
        if (!token) throw new Error('No token')
        const data = await authApi.me()
        if (data) setUser(data)
      } catch {
        localStorage.removeItem('bsn-auth-token')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('bsn-auth-token')
    navigate('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="admin-shell">
        <SiteBgLayers />
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />

  const currentPage = visibleSections.flatMap((s) => s.items).find((i) => {
    if (i.href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(i.href)
  })

  return (
    <div className="admin-shell">
      <SiteBgLayers />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        <div className="admin-sidebar-inner">
          <div className="flex items-center justify-between px-4 py-5">
            <a href="/" className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="BSN" style={{ height: 32, width: 'auto' }} />
            </a>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            {visibleSections.map((section) => (
              <div key={section.label} className="mb-4">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {section.label}
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      item.href === '/admin'
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.href)
                    return (
                      <li key={item.href}>
                        <button
                          onClick={() => navigate(item.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user.name}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <header className="admin-topbar glass">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold">{currentPage?.name ?? 'Admin'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver site
            </a>
          </div>
        </header>

        <main className="admin-content">
          <Suspense fallback={<AdminContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function AdminContentLoader() {
  return (
    <div className="flex items-center justify-center w-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white" />
    </div>
  )
}

function SiteBgLayers() {
  return (
    <>
      <div className="bg-glass" />
      <div className="bg-aurora" />
      <div className="page-shards">
        <div className="shard s1" />
        <div className="shard s2" />
        <div className="shard s3" />
      </div>
      <div className="bg-grid" />
      <div className="bg-noise" />
    </>
  )
}
