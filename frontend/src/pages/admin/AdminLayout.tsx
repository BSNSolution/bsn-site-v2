import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronLeft,
  User
} from 'lucide-react'
import { authApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface SidebarItem {
  name: string
  href: string
  icon: any
  badge?: number
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Seções Home', href: '/admin/home', icon: Home },
  { name: 'Serviços', href: '/admin/services', icon: Briefcase },
  { name: 'Soluções', href: '/admin/solutions', icon: Settings },
  { name: 'Depoimentos', href: '/admin/testimonials', icon: Star },
  { name: 'Equipe', href: '/admin/team', icon: Users },
  { name: 'Clientes', href: '/admin/clients', icon: Building2 },
  { name: 'Vagas', href: '/admin/jobs', icon: FileText },
  { name: 'Blog', href: '/admin/blog', icon: MessageCircle },
  { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
  { name: 'Uploads', href: '/admin/uploads', icon: Upload },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('bsn-auth-token')
        if (!token) {
          throw new Error('No token found')
        }

        const userData = await authApi.me()
        if (userData) {
          setUser(userData)
        } else {
          throw new Error('Invalid user data')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('bsn-auth-token')
        return <Navigate to="/admin/login" replace />
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('bsn-auth-token')
      navigate('/admin/login')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!sidebarCollapsed && (
              <h1 className="font-display font-bold gradient-text text-xl">
                BSN Admin
              </h1>
            )}
            
            {/* Mobile close / Desktop collapse */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-1 hover:bg-muted rounded-md transition-colors"
              >
                <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href))
                
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => {
                        navigate(item.href)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 hover:bg-muted ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="truncate">
                          {item.name}
                        </span>
                      )}
                      {item.badge && !sidebarCollapsed && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User / Logout */}
          <div className="border-t border-border p-4">
            {!sidebarCollapsed && (
              <div className="mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className={`lg:ml-64 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Top bar */}
        <header className="glass-header">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Page title */}
              <h2 className="text-lg font-semibold">
                {sidebarItems.find(item => 
                  location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href))
                )?.name || 'Admin'}
              </h2>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open('/', '_blank')}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Ver Site
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}