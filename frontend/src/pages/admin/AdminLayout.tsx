import { useEffect, useState, Suspense } from 'react'
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
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

interface SidebarSection {
  label: string
  items: { name: string; href: string; icon: any }[]
}

const SECTIONS: SidebarSection[] = [
  {
    label: 'Visão geral',
    items: [
      { name: 'Dashboard', href: '/admin', icon: BarChart3 },
      { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
      { name: 'Seções das páginas', href: '/admin/pages', icon: Layers },
    ],
  },
  {
    label: 'Página: Home',
    items: [
      { name: '1. Hero & seções', href: '/admin/home', icon: Home },
      { name: '2. KPIs', href: '/admin/kpis', icon: TrendingUp },
      { name: '3. Stack (marquee)', href: '/admin/stack', icon: Cpu },
      { name: '7. Banda "Filosofia"', href: '/admin/home-band', icon: MessageSquareQuote },
    ],
  },
  {
    label: 'Página: Serviços',
    items: [
      { name: 'Serviços (mosaico + lista)', href: '/admin/services', icon: Briefcase },
    ],
  },
  {
    label: 'Página: Soluções',
    items: [
      { name: 'Soluções verticais', href: '/admin/solutions', icon: LayoutGrid },
    ],
  },
  {
    label: 'Página: IA',
    items: [
      { name: 'Blocos (Benefícios, Etapas, Destaques)', href: '/admin/ai', icon: Sparkles },
    ],
  },
  {
    label: 'Página: Sobre',
    items: [
      { name: 'Cards (Missão/Visão/…)', href: '/admin/about-cards', icon: Info },
      { name: 'Valores (4 princípios)', href: '/admin/values', icon: Award },
      { name: 'Equipe', href: '/admin/team', icon: Users },
    ],
  },
  {
    label: 'Página: Blog',
    items: [
      { name: 'Posts', href: '/admin/blog', icon: BookOpen },
    ],
  },
  {
    label: 'Página: Carreiras',
    items: [
      { name: 'Vagas', href: '/admin/jobs', icon: FileText },
      { name: 'Benefícios', href: '/admin/perks', icon: Gift },
    ],
  },
  {
    label: 'Elementos compartilhados',
    items: [
      { name: 'Depoimentos', href: '/admin/testimonials', icon: Star },
      { name: 'Clientes', href: '/admin/clients', icon: Handshake },
    ],
  },
  {
    label: 'Mídia & Sistema',
    items: [
      { name: 'Uploads de imagens', href: '/admin/uploads', icon: Upload },
      { name: 'Configurações do site', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    label: 'Acesso & usuários',
    items: [
      { name: 'Usuários', href: '/admin/users', icon: UserCog },
      { name: 'Grupos de permissões', href: '/admin/permission-groups', icon: Shield },
      { name: 'Tokens de API', href: '/admin/api-tokens', icon: KeyRound },
    ],
  },
]

export default function AdminLayout() {
  const [user, setUser] = useState<UserPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  const currentPage = SECTIONS.flatMap((s) => s.items).find((i) => {
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
            {SECTIONS.map((section) => (
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
