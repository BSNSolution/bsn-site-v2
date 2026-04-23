# Histórico de Desenvolvimento — 23/04/2026 00:03
## Sectionização das páginas + Admin de sections + Code Review

## 📊 Status Atual
- **Fase Atual**: Finalizado (pendente migrations locais)
- **Progresso Geral**: 97% (35 de 36 tasks — última depende do usuário rodar prisma)
- **Última Task Concluída**: Code Review + AI/HISTORY

---

## ✅ O Que Foi Feito

### FRENTE 1 — Sectionização das páginas públicas

- Mapeamento completo de seções por página em `AI/TASKS/23_04_2026-00_03_SECTIONS_PAGINAS.md` (tabela com `page`, `sectionKey`, `label`, ordem default, condicional original).
- Novo model `PageSection` em `backend/prisma/schema.prisma` (unique em `[page, sectionKey]`, index em `page`).
- Seed em `backend/prisma/seed.ts` popula 30+ sections (home 9, services 2, solutions 2, about 4, blog 3, careers 3, contact 2, ai 6) via `upsert` — idempotente.
- Nova rota pública e admin em `backend/src/routes/page-sections.ts`:
  - `GET /api/pages/:page/sections` (cacheada 1h, só visíveis)
  - `GET /api/admin/pages/:page/sections` (admin — todas)
  - `PUT /api/admin/pages/:page/sections/:id` (update isVisible/label)
  - `PUT /api/admin/pages/:page/sections/reorder` (transação atômica)
- Cache key `CacheKeys.pageSections(page)` em `backend/src/lib/cache.ts`.
- Hook `frontend/src/hooks/use-page-sections.ts` com fallback robusto: se API falhar ou tabela vazia, retorna todas as keys default visíveis.
- Todas as 8 páginas públicas refatoradas para consumir sections via `effectiveKeys` + dicionário `sectionRenderers`:
  - `HomePage.tsx`, `ServicesPage.tsx`, `SolutionsPage.tsx`, `AboutPage.tsx`, `BlogPage.tsx`, `CareersPage.tsx`, `ContactPage.tsx`, `AIPage.tsx`.
- **Página `/servicos/:slug` NÃO é sectionizada** — já tem CRUD próprio de `ServiceDetailBlock`.

### FRENTE 2 — Admin para gerenciar sections

- `frontend/src/pages/admin/AdminPagesPage.tsx`: grid de cards (Home, Serviços, Soluções, Sobre, Blog, Carreiras, Contato, IA) com link "Abrir página pública" e descrição.
- `frontend/src/pages/admin/AdminPageSectionsPage.tsx`: lista de sections com setas ↑/↓ para reordenar e toggle olho/olho-riscado para isVisible. Salvamento otimista com rollback em erro. Feedback visual claro.
- Rotas `/admin/pages` e `/admin/pages/:page` em `frontend/src/App.tsx`.
- Item "Seções das páginas" no sidebar (`AdminLayout.tsx`) com ícone `Layers` (lucide).
- `pageSectionsApi` em `frontend/src/lib/api.ts` com tipo `PageSection` exportado.

### FRENTE 3 — Code Review

- Relatório completo em `AI/AUDITORIAS/23_04_2026-CODE_REVIEW.md` com:
  - 10 dead files identificados (7 em `components/sections/` + 2 hooks + 1 falso positivo revertido)
  - Duplicação CSS (`.svc .content`/`.svc .feats`) consolidada
  - Top 10 refactors priorizados com risco (componentes grandes, CSS monolítico, inline styles, etc.)
- Refactors de baixo risco aplicados:
  - Removida pasta inteira `frontend/src/components/sections/` (7 arquivos)
  - Removidos `use-scroll-animation.ts` e `use-cursor.tsx`
  - Consolidado duplicação em `globals.css`

---

## 🔧 Decisões Técnicas

1. **Model único `PageSection`** em vez de tabela por página — admin fica uniforme, endpoints compartilhados. Unique composta garante idempotência do seed.
2. **Fallback forte no hook** — se API falhar ou tabela vazia, página renderiza exatamente como antes. Zero risco de quebra em produção enquanto migration não roda.
3. **Dicionário `sectionRenderers`** (vs switch ou array de componentes) — melhor para paginas com condicionais internas (`kpis.length > 0` etc.) que ficam dentro de cada renderer.
4. **Página `ServiceDetailPage` intencionalmente fora** — ela já tem sistema de blocks próprio (mais granular). Sectionizar seria over-engineering.
5. **Setas ↑/↓ em vez de dnd-kit** — zero deps novas, comportamento acessível por teclado, admin simples.
6. **Salvamento otimista** — UX rápida. Rollback em erro garante consistência sem loading-states irritantes.
7. **Dead file `service-icons.tsx` mantido** — o grep inicial não pegou o import relativo `./service-icons` de `icon-picker.tsx`. Revertido via `git checkout` quando build falhou. Lição: confiar no build antes de concluir remoção.
8. **CSS duplicado** mesclado preservando regras de cada bloco (o segundo `.svc .content` tem `position: relative; z-index: 1` que o primeiro não tinha — merge mantém os dois).

---

## 🐛 Problemas Encontrados e Soluções

- **Problema**: `prisma generate` falha com `EPERM: operation not permitted, rename query_engine-windows.dll.node`.
  **Solução**: Não matei processos automaticamente (regra do projeto). Documentei que o usuário precisa parar o backend dev (`tsx watch`) antes. Nada mais no backend foi buildado.

- **Problema**: Remoção de `service-icons.tsx` quebrou build (importado via path relativo pelo `icon-picker.tsx`).
  **Solução**: `git checkout -- frontend/src/components/ui/service-icons.tsx` restaurou. Build voltou a passar.

- **Problema**: HomePage tem 9 sections com condicionais internas (`kpis.length > 0`, `live || pill`, etc.) — não posso só filtrar por `isVisible`. 
  **Solução**: Cada renderer retorna `null` quando sua condição interna de conteúdo falhar. Gerenciamento via admin toggle controla apenas **isVisible**; se não houver conteúdo, section some mesmo se visible.

---

## 📋 Próximos Passos — comandos manuais

### ⚠️ Pré-requisito: parar o backend dev
```powershell
# Se `tsx watch src/server.ts` estiver rodando em outra janela, parar (Ctrl+C)
```

### Passos de release local
```powershell
cd D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend

# 1. Regerar cliente Prisma
npx prisma generate

# 2. Criar migration nova
npx prisma migrate dev --name add_page_sections

# 3. Rodar seed (idempotente — só upserts)
npx prisma db seed

# 4. Subir backend de volta
npm run dev
```

### URLs para validar
- Site público (fallback funciona mesmo sem tabela populada):
  - http://localhost:5173/
  - http://localhost:5173/servicos
  - http://localhost:5173/solucoes
  - http://localhost:5173/sobre
  - http://localhost:5173/blog
  - http://localhost:5173/carreiras
  - http://localhost:5173/contato
  - http://localhost:5173/inteligencia-artificial
- Admin: http://localhost:5173/admin/pages
  - Login: `admin@bsnsolution.com.br` / `bsn2024@admin`
  - Clicar em "Home" → reordenar/ocultar sections
  - Abrir /admin/pages/home e testar as setas + toggle

---

## 🔗 Referências

### Arquivos criados (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\TASKS\23_04_2026-00_03_SECTIONS_PAGINAS.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\AUDITORIAS\23_04_2026-CODE_REVIEW.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\HISTORY\23_04_2026-00_03_SECTIONS_E_REVIEW.md` (este arquivo)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\routes\page-sections.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\hooks\use-page-sections.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminPagesPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminPageSectionsPage.tsx`

### Arquivos alterados (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\schema.prisma`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\seed.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\server.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\lib\cache.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\App.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\lib\api.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\styles\globals.css`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\HomePage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServicesPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\SolutionsPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\AboutPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\BlogPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\CareersPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ContactPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\AIPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminLayout.tsx`

### Arquivos removidos (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\components\sections\*.tsx` (7 arquivos + pasta)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\hooks\use-scroll-animation.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\hooks\use-cursor.tsx`

### Commits / Branches
Nenhum commit ou push automático — conforme regra do projeto.

---

## ✅ Critérios de conclusão
- [x] Tasks 35/36 marcadas 🟢 (última é o `prisma migrate` que depende do usuário)
- [x] `vite build` frontend passa em 2.88s sem erros
- [x] Fallback garantido: páginas públicas renderizam igual se tabela vazia
- [x] Fixes recentes preservados (spotlight ::before/::after, shards absolute, align-items stretch, timeline watermark, gradient border)
- [x] Admin segue padrão shadcn-dark (sem `.glass` em lugar novo)
- [x] Conteúdo PT-BR mantido em todos os textos
- [x] Code review entregue com 10+ findings priorizados
- [ ] **Pendente usuário**: `prisma generate` + `prisma migrate dev --name add_page_sections` + `prisma db seed` após parar backend dev
