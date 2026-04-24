import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { authApi, usersAdminApi } from '@/lib/api'

interface MinimalUser {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: MinimalUser | null
  permissions: Set<string>
  loading: boolean
  isAdmin: boolean
  hasPermission: (slug: string) => boolean
  hasAnyPermission: (...slugs: string[]) => boolean
  hasAllPermissions: (...slugs: string[]) => boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MinimalUser | null>(null)
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('bsn-auth-token')
      if (!token) {
        setUser(null)
        setPermissions(new Set())
        setLoading(false)
        return
      }
      const me = await authApi.me()
      const u: MinimalUser = me?.user ?? me
      if (u && u.id) {
        setUser(u)
        // Busca permissões efetivas (inclui grupos + avulsas + role ADMIN bypass)
        try {
          const res = await usersAdminApi.getMyPermissions()
          const perms: string[] = res?.permissions ?? []
          setPermissions(new Set(perms))
        } catch {
          setPermissions(new Set())
        }
      } else {
        setUser(null)
        setPermissions(new Set())
      }
    } catch {
      setUser(null)
      setPermissions(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuth()
  }, [loadAuth])

  const isAdmin = user?.role === 'ADMIN'

  const hasPermission = useCallback(
    (slug: string) => {
      if (isAdmin) return true
      return permissions.has(slug)
    },
    [isAdmin, permissions]
  )

  const hasAnyPermission = useCallback(
    (...slugs: string[]) => {
      if (isAdmin) return true
      return slugs.some((s) => permissions.has(s))
    },
    [isAdmin, permissions]
  )

  const hasAllPermissions = useCallback(
    (...slugs: string[]) => {
      if (isAdmin) return true
      return slugs.every((s) => permissions.has(s))
    },
    [isAdmin, permissions]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('bsn-auth-token')
    setUser(null)
    setPermissions(new Set())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        isAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refresh: loadAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * Hook conveniente: checa uma única permissão.
 * Aceita múltiplas com mode "any" (default) ou "all".
 */
export function usePermission(
  slugOrSlugs: string | string[],
  mode: 'any' | 'all' = 'any'
): boolean {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  if (typeof slugOrSlugs === 'string') return hasPermission(slugOrSlugs)
  if (slugOrSlugs.length === 0) return true
  return mode === 'all' ? hasAllPermissions(...slugOrSlugs) : hasAnyPermission(...slugOrSlugs)
}
