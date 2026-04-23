import { useQuery } from '@tanstack/react-query'
import { pageSectionsApi, type PageSection } from '@/lib/api'

/**
 * Hook que consulta as sections de uma página pública e expõe helpers para
 * renderização condicional. Mantém fallback seguro: se a query falhar ou
 * vier vazia, TODAS as sections default (passadas em `defaultKeys`) são
 * tratadas como visíveis, na ordem original — garantindo que a página não
 * quebre quando a tabela `page_sections` estiver vazia ou a API indisponível.
 */
export function usePageSections(page: string, defaultKeys: readonly string[]) {
  const query = useQuery<{ sections: PageSection[] }>({
    queryKey: ['page-sections', page],
    queryFn: () => pageSectionsApi.getSections(page),
    staleTime: 5 * 60 * 1000,
    // Não queremos que um 5xx derrube a página — fallback cuida disso
    retry: 1,
  })

  const remote = query.data?.sections ?? []
  const hasRemote = remote.length > 0

  // Ordered keys: se tiver dados remotos, usa a ordem do backend; caso contrário, defaults.
  const orderedKeys: string[] = hasRemote
    ? remote.map((s) => s.sectionKey)
    : [...defaultKeys]

  // Visibilidade por sectionKey (O(1))
  const visibleSet = new Set<string>(
    hasRemote
      ? remote.filter((s) => s.isVisible).map((s) => s.sectionKey)
      : defaultKeys
  )

  return {
    isLoading: query.isLoading,
    hasRemote,
    orderedKeys,
    isVisible: (key: string) => visibleSet.has(key),
    /**
     * Retorna as keys efetivas para renderizar, respeitando ordem remota ou default
     * e filtrando as invisíveis. Útil para um simples `.map`.
     */
    effectiveKeys: orderedKeys.filter((k) => visibleSet.has(k)),
  }
}
