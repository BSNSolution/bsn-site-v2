import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Wrapper em cima do `useQuery` do TanStack para o padrão mais comum neste
 * site: buscar uma URL do `api` client e devolver `.data` tipado.
 *
 * Uso:
 *   const { data, isLoading } = useApiQuery<{ services: Service[] }>(
 *     ['services-public'],
 *     '/services'
 *   )
 *
 * Mantém as opções do `useQuery` expostas via 4º parâmetro para ajustes
 * finos (staleTime custom, enabled, refetchInterval, etc).
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error, T, readonly unknown[]>({
    queryKey: key,
    queryFn: async () => (await api.get(path)).data as T,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
