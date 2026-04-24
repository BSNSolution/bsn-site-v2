import { useQuery } from '@tanstack/react-query'
import { aiConfigsApi } from '@/lib/api'

/**
 * Retorna se ao menos uma config de IA está ativa no admin.
 * Usado pra mostrar/esconder botões de "Gerar com IA" no editor/listagem.
 */
export function useAiEnabled() {
  const q = useQuery<{ hasActive: boolean; count: number }>({
    queryKey: ['ai-enabled'],
    queryFn: () => aiConfigsApi.checkActive(),
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
  return {
    enabled: q.data?.hasActive ?? false,
    count: q.data?.count ?? 0,
    loading: q.isLoading,
  }
}
