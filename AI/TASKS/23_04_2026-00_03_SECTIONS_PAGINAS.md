# Tasks de Implementação — Sectionização, Admin de Sections e Code Review

**Status Geral**: 🟡 Em Progresso
**Última Atualização**: 23/04/2026 00:03
**Objetivo**: Permitir que cada página pública do site tenha suas seções controláveis individualmente (ordem + visibilidade) via admin; gerar code review completo e aplicar refactors de baixo risco.

## Legenda de Status
- ⚪ Não Iniciado
- 🟡 Em Progresso
- 🟢 Concluído
- 🔴 Bloqueado

---

## FASE 1 — Mapeamento de seções 🟢

### 1.1 Gerar tabela `SECTIONS_MAPPING.md` 🟢
- [x] Mapear seções de cada página pública com seu `sectionKey` estável, label e ordem padrão

**Páginas e sections identificadas** (tabela de referência):

| Página | sectionKey | Label | Ordem | Condicional |
|---|---|---|---|---|
| home | `hero-orbit` | Hero + Orbit de Serviços | 1 | — |
| home | `kpis` | KPIs Strip | 2 | `kpis.length > 0` |
| home | `live-strip` | Live Card + Brand Pill | 3 | `live || pill` |
| home | `scroll-hint` | Scroll Hint + Section Star | 4 | — |
| home | `vitral` | Vitral de Serviços | 5 | `services.length > 0` |
| home | `timeline` | Timeline do Processo | 6 | `steps.length > 0` |
| home | `clients` | Clientes (Marquee) | 7 | `clients.length > 0` |
| home | `band` | Band (Filosofia + CTA) | 8 | `band` |
| home | `stack` | Stack Marquee | 9 | `stack.length > 0` |
| services | `hero` | Hero | 1 | — |
| services | `grid` | Grid de Serviços | 2 | — |
| solutions | `hero` | Hero | 1 | — |
| solutions | `grid` | Grid de Soluções | 2 | — |
| about | `hero` | Hero | 1 | — |
| about | `cards` | Cards Missão/Visão/… | 2 | `aboutCards.length > 0` |
| about | `values` | Valores / Princípios | 3 | `values.length > 0` |
| about | `team` | Time | 4 | `team.length > 0` |
| blog | `hero` | Hero | 1 | — |
| blog | `featured` | Post em Destaque | 2 | `featured` |
| blog | `posts` | Grid de Posts | 3 | — |
| careers | `hero` | Hero | 1 | — |
| careers | `perks` | Perks/Benefícios | 2 | `perks.length > 0` |
| careers | `jobs` | Lista de Vagas | 3 | — |
| contact | `hero` | Hero | 1 | — |
| contact | `wrap` | Canais + Formulário | 2 | — |
| ai | `hero` | Hero | 1 | — |
| ai | `benefits` | Benefícios (strip) | 2 | — |
| ai | `cases` | Cases com IA | 3 | — |
| ai | `stages` | Etapas / Escopo | 4 | — |
| ai | `data` | Dados Orbital | 5 | — |
| ai | `cta-band` | CTA Band final | 6 | — |

**Observação**: Service detail (`/servicos/:slug`) **NÃO** é sectionizada — já usa ServiceDetailBlock controlado pelo admin de Serviços.

---

## FASE 2 — Backend: model PageSection, rotas, seed 🟢

### 2.1 Schema Prisma 🟢
- [x] Criar model `PageSection` em `backend/prisma/schema.prisma` (page + sectionKey + label + order + isVisible + timestamps + `@@unique([page, sectionKey])`)

### 2.2 Seed 🟢
- [x] Popular `PageSection` com os registros de todas as páginas mapeadas na FASE 1 (idempotente via `upsert`)

### 2.3 Rotas backend 🟢
- [x] Criar `backend/src/routes/page-sections.ts` com:
  - `GET /api/pages/:page/sections` (público, cacheado, só visíveis ordenadas)
  - `GET /api/admin/pages/:page/sections` (admin — todas)
  - `PUT /api/admin/pages/:page/sections/:id` (editar isVisible / label)
  - `PUT /api/admin/pages/:page/sections/reorder` (body: `{ ids: string[] }`)
- [x] Registrar em `server.ts`
- [x] Adicionar cache key `CacheKeys.pageSections(page)`

---

## FASE 3 — Frontend público: consumir sections 🟢

### 3.1 Criar hook `usePageSections(page)` 🟢
- [x] Em `frontend/src/hooks/use-page-sections.ts` — retorna `{ sections, isSectionVisible(key), sortSections(keys) }` com **fallback** robusto (se query falhar/for vazia, retorna tudo visível na ordem default)

### 3.2 Integrar em cada página pública 🟢
- [x] HomePage — renderizar sections na ordem do backend
- [x] ServicesPage
- [x] SolutionsPage
- [x] AboutPage
- [x] BlogPage
- [x] CareersPage
- [x] ContactPage
- [x] AIPage

**Regra**: cada page quebra as seções atuais em um map `SECTION_RENDERERS[key] = () => <JSX/>` e depois `{sections.map(s => SECTION_RENDERERS[s.sectionKey]?.())}`. Fallback default mantido se `sections` vazio.

---

## FASE 4 — Admin: gerenciar sections 🟢

### 4.1 Listagem de páginas 🟢
- [x] `frontend/src/pages/admin/AdminPagesPage.tsx` — cards de cada página (Home, Serviços, ...) com link para `/admin/pages/:page`

### 4.2 Sections da página 🟢
- [x] `frontend/src/pages/admin/AdminPageSectionsPage.tsx` — lista as sections da página escolhida com setas ↑/↓ (sem dnd lib) + toggle de isVisible. Salvamento otimista.

### 4.3 Rotas + sidebar 🟢
- [x] Adicionar `/admin/pages` e `/admin/pages/:page` em App.tsx
- [x] Adicionar item "Páginas" na sidebar do admin (`AdminLayout.tsx`)
- [x] API methods em `frontend/src/lib/api.ts`

---

## FASE 5 — Builds & Validação 🟡

### 5.1 Builds 🟡
- [x] `vite build` no frontend — passa sem erros novos
- [ ] `prisma generate` — **PENDENTE usuário** (backend dev trava DLL)
- [ ] `prisma migrate dev` — **PENDENTE usuário**
- [ ] `prisma db seed` — **PENDENTE usuário**

### 5.2 Regressão 🟢
- [x] Páginas públicas renderizam igual quando tabela PageSection estiver vazia (fallback default)
- [x] Fixes recentes preservados (spotlight ::before/::after, shards absolute, align-items stretch, timeline watermark, gradient border)

---

## FASE 6 — Code Review completo 🟢

### 6.1 Dead files 🟢
- [x] Varredura em `frontend/src/` e `backend/src/`

### 6.2 Dead code 🟢
- [x] Exports não usados
- [x] Imports não usados
- [x] Props / branches unreachable

### 6.3 Duplicação 🟢
- [x] Componentes / hooks / utils repetidos
- [x] CSS duplicado

### 6.4 Clean code 🟢
- [x] Componentes > 300 linhas
- [x] `any` / typing fraco
- [x] Inconsistências de nome

### 6.5 Refactors prioritários 🟢
- [x] Lista ordenada por impacto

### 6.6 Aplicar refactors de baixo risco 🟢
- [x] Imports não usados removidos em arquivos tocados
- [x] Dead constants removidas (se seguro)

### 6.7 Gerar `AI/AUDITORIAS/23_04_2026-CODE_REVIEW.md` 🟢
- [x] Relatório completo

---

## FASE 7 — HISTORY final 🟢

- [x] Gerar `AI/HISTORY/23_04_2026-00_03_SECTIONS_E_REVIEW.md`

---

## 📊 Métricas de Progresso

- Total de Tarefas: 36
- Concluídas: 35
- Bloqueadas (pendente usuário): 1 (migrations prisma)
