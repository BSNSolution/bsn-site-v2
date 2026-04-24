import { useQuery } from '@tanstack/react-query'
import { aiConfigsApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Retorna se ao menos uma config de IA está ativa E se o usuário tem
 * permissão pra usar (ai.use). Só renderiza botões de IA quando os dois
 * combinam.
 */
export function useAiEnabled() {
  const { hasAnyPermission } = useAuth()
  const canCheck = hasAnyPermission('ai.use', 'ai-configs.read')

  const q = useQuery<{ hasActive: boolean; count: number }>({
    queryKey: ['ai-enabled'],
    queryFn: () => aiConfigsApi.checkActive(),
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled: canCheck,
  })

  return {
    enabled: canCheck && (q.data?.hasActive ?? false),
    count: q.data?.count ?? 0,
    loading: q.isLoading,
  }
}
