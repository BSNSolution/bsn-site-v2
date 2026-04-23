# Tasks — Aplicação dos Refactors do Code Review (23/04/2026)

**Status Geral**: 🟢 Concluído
**Última Atualização**: 23/04/2026 03:10
**Objetivo**: Aplicar todos os 10 refactors prioritários do `AI/AUDITORIAS/23_04_2026-CODE_REVIEW.md` e rodar `prisma generate/migrate/seed`.

## Legenda
- ⚪ Não Iniciado
- 🟡 Em Progresso
- 🟢 Concluído
- 🔴 Bloqueado

---

## FASE 1: Preparação 🟢
- [x] Ler `AI/AUDITORIAS/23_04_2026-CODE_REVIEW.md`
- [x] Ler `AI/HISTORY/23_04_2026-00_03_SECTIONS_E_REVIEW.md`
- [x] Inventariar arquivos (Home 540, Blog 337, AdminServices 735, globals 5160, etc.)
- [x] Criar tasks.md

## FASE 2: Refactor #2 — Split `globals.css` 🟢
- [x] Criar pasta `frontend/src/styles/parts/`
- [x] Analisar e mapear seções (29 parts)
- [x] Criar arquivos `_tokens.css`, `_base.css`, `_nav.css`, `_shared.css`, `_footer.css`, `_transitions.css`, `_home-hero.css`, `_home-orbit.css`, `_home-strips.css`, `_home-meta.css`, `_home-timeline.css`, `_home-band.css`, `_page-hero.css`, `_services.css`, `_solutions.css`, `_about.css`, `_blog.css`, `_contact.css`, `_careers.css`, `_legal.css`, `_responsive-public.css`, `_admin.css`, `_shadcn.css`, `_motion-reveal.css`, `_spotlight.css`, `_motion-effects.css`, `_ai.css`, `_ai-v2.css`, `_service-detail.css`
- [x] Substituir `globals.css` por orquestrador com `@import`
- [x] Build frontend OK (2.72s — idêntico)

## FASE 3: Refactor #3 — Extrair `<style>` de `BlogPostPage.tsx` 🟢
- [x] Criar `styles/parts/_blog-post.css`
- [x] Adicionar `@import` em `globals.css`
- [x] Remover bloco `<style>` de `BlogPostPage.tsx`
- [x] Build OK

## FASE 4: Refactor #9 — `samplePlaceholder` util 🟢
- [x] Criar `frontend/src/lib/placeholders.ts` com `solutionPlaceholder()`
- [x] Mover e renomear a função de `SolutionsPage.tsx`
- [x] Build OK

## FASE 5: Refactor #10 — `useApiQuery` hook 🟢
- [x] Criar `frontend/src/hooks/use-api-query.ts`
- [x] Refatorar chamadas repetitivas em HomePage, ServicesPage, SolutionsPage, AboutPage, CareersPage, ContactPage
- [x] Build OK
- Nota: queries que já usam funções nomeadas (blogApi, teamApi, homeExtrasApi, stackApi, aiApi) foram mantidas como estão — o refactor só alcança o padrão `(await api.get('...')).data`

## FASE 6: Refactor #5 — `<PublicPageHero />` 🟢
- [x] Criar `frontend/src/components/layout/PublicPageHero.tsx`
- [x] Substituir hero em ServicesPage, SolutionsPage, AboutPage, CareersPage, BlogPage, ContactPage
- [x] Home mantém hero orbital especial (fora do escopo)
- [x] AIPage mantém `ai-hero` especial (fora do escopo)
- [x] Build OK

## FASE 7: Refactor #7 — `PROJECT_TYPES` via Services 🟢
- [x] ContactPage consumir `useApiQuery<Service[]>(['services-contact-chips'], '/services')`
- [x] Mapear primeira palavra do subtitle/title em chip
- [x] Fallback `FALLBACK_PROJECT_TYPES` quando API vazia
- [x] useEffect para ressincronizar seleção quando API responde
- [x] Build OK

## FASE 8: Refactor #8 — `DEFAULT_POSTS` → empty state 🟢
- [x] Remover array `DEFAULT_POSTS` em BlogPage
- [x] Renderizar empty state quando `posts.length === 0`
- [x] Build OK

## FASE 9: Refactor #1 — Split `HomePage.tsx` 🟢
- [x] Criar `frontend/src/pages/home/`
- [x] Criar `types.ts` + `icons.tsx`
- [x] Criar 9 sections: HeroOrbitSection, KpisSection, LiveStripSection, ScrollHintSection, VitralSection, TimelineSection, ClientsSection, BandSection, StackSection
- [x] HomePage.tsx como orquestrador fino (103 linhas vs 540 antes)
- [x] Build OK (bundle 11.98 kB vs 11.80 kB — +1.5%, marginal)

## FASE 10: Refactor #4 — Split `AdminServicesPage.tsx` 🟢
- [x] Criar `frontend/src/pages/admin/services/`
- [x] `types.ts`, `TabMain.tsx`, `TabDetail.tsx`, `TabBlocks.tsx`
- [x] `AdminServicesPage.tsx` vira shell modal + lista
- [x] Build OK (bundle 28.84 kB vs 28.45 kB — +1.4% pelos imports extras)

## FASE 11: Refactor #6 — Documentar `new-layout*` 🟢
- [x] Criar `AI/references/new-layouts/README.md`
- [x] Pastas mantidas na raiz (são referências úteis)

## FASE 12: Prisma 🟢
- [x] Identificar tsx-watch do backend via wmic (PIDs 197296, 86020, 203592)
- [x] Matar apenas os processos do bsn-site-v2
- [x] `npx prisma generate` OK
- [x] `npx prisma db push` OK (schema sincronizado — projeto não usa migrations)
- [x] `npx prisma db seed` OK (idempotente — upserts + admin criado)

## FASE 13: Validação final 🟢
- [x] `yarn build` frontend OK (11.38s, 0 erros)
- [x] `npm run build` backend — erro pré-existente de rootDir em seed.ts (aceito)
- [x] HISTORY final em `AI/HISTORY/23_04_2026-03_10_REFACTORS_APLICADOS.md`

---

## 📊 Métricas
- Total de tasks: 45
- Concluídas: 45
- Progresso: 100%
