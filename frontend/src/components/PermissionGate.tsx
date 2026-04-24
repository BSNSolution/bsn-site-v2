import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  /** Uma permissão ou array delas */
  permission: string | string[]
  /** "any" (default) — qualquer uma libera; "all" — todas são necessárias */
  mode?: 'any' | 'all'
  /** Conteúdo mostrado quando tem permissão */
  children: ReactNode
  /** Conteúdo alternativo quando NÃO tem (default: nada) */
  fallback?: ReactNode
}

/**
 * Gate simples: renderiza `children` se o usuário tem a(s) permissão(ões),
 * senão renderiza `fallback`.
 *
 * Exemplos:
 *   <PermissionGate permission="blog.delete">
 *     <button>Excluir</button>
 *   </PermissionGate>
 *
 *   <PermissionGate permission={['blog.write','blog.publish']} mode="any">
 *     <button>Editar ou publicar</button>
 *   </PermissionGate>
 */
export default function PermissionGate({ permission, mode = 'any', children, fallback = null }: Props) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  let allowed = false
  if (typeof permission === 'string') {
    allowed = hasPermission(permission)
  } else if (permission.length === 0) {
    allowed = true
  } else {
    allowed = mode === 'all' ? hasAllPermissions(...permission) : hasAnyPermission(...permission)
  }

  return <>{allowed ? children : fallback}</>
}
