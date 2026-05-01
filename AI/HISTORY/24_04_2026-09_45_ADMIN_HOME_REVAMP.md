# Histórico de Desenvolvimento — 24/04/2026 09:45

## 📊 Status Atual

- **Fase atual**: 🟢 Concluído — pendente apenas smoke test manual no navegador (a cargo do usuário)
- **Progresso geral**: 95% (38/40 tarefas; os 2 restantes dependem de `npm run dev` do usuário)
- **Última task concluída**: FASE 5 — build frontend passou em 12.9s sem erros novos, schema aplicado no PG remoto

## ✅ O Que Foi Feito

### Backend (Fase 1)
- **Schema Prisma** (`backend/prisma/schema.prisma`): adicionado model `HomeHero` como singleton, com 13 campos (eyebrowTemplate, title, subtitle, ctaPrimary x3, ctaSecondary x2, badge1 + pulse flag, badge2, showFloatingNodes, isActive, timestamps). Mapeado para tabela `home_heroes`.
- **Migration**: schema aplicado via `npx prisma db push --skip-generate` — tabela criada no PostgreSQL remoto (93.127.210.192). Projeto não usa `prisma migrate dev` (sem pasta `migrations/`).
- **Seed** (`backend/prisma/seed.ts`): adicionado item `17b. Home Hero` com valores idênticos ao hardcoded do `HeroOrbitSection` — zero regressão ao rodar seed em banco novo.
- **Rotas** (`backend/src/routes/home-extras.ts`): 3 rotas novas seguindo exatamente o padrão das outras seções singleton (LiveCard, BrandPill, Band):
  - `GET /home/hero` (público, cacheado com TTL 3600s)
  - `GET /admin/home/hero` (permissão `home.read`)
  - `PUT /admin/home/hero` (permissão `home.write`, padrão findFirst → update/create, invalida cache)
- **Cache** (`backend/src/lib/cache.ts`): adicionada `CacheKeys.homeHero = "home-hero"`.
- **Bônus — Reorder de process steps** (`backend/src/routes/process-steps.ts`): adicionada `PATCH /admin/process-steps/reorder` que faltava. Usa `prisma.$transaction` com array de updates, igual ao padrão de stack/kpis/about-cards. Sem isso, o DragList da timeline admin não teria backend.

### Frontend home pública (Fase 2)
- **`frontend/src/lib/api.ts`**:
  - `homeExtrasApi.getHero()` (público) e `homeExtrasApi.admin.getHero/saveHero()` adicionados.
  - `processStepsApi` criado do zero (não existia).
- **Tipo `HomeHero`** adicionado em `frontend/src/pages/home/types.ts`.
- **`HeroOrbitSection.tsx`** refatorado:
  - Aceita prop opcional `hero?: HomeHero | null`.
  - Tem `FALLBACK_HERO` com valores idênticos ao código antigo → zero regressão se banco não tiver registro OU se endpoint falhar.
  - Eyebrow usa `h.eyebrowTemplate.replace('{count}', ...)`.
  - H1 usa `dangerouslySetInnerHTML` (aceita `<em>` e `<br>`).
  - CTA secundária, badges e orbit-nodes todos com renderização condicional.
- **`HomePage.tsx`**:
  - Nova `useQuery(['home-hero'])` com staleTime 5min.
  - Passa `hero={hero}` pro `<HeroOrbitSection />`.

### Frontend admin (Fase 3)
- **`AdminHomeHeroPage.tsx`** (novo): tela singleton que segue o padrão de `AdminHomeBandPage`. Form dividido em 7 cards glass (`bg-black/30 border border-white/10 rounded p-5`):
  1. Eyebrow (com hint sobre `{count}`)
  2. Título & subtítulo (textarea + hint sobre `<em>`/`<br>`)
  3. CTA primária (grid 3-col: label/url/ícone)
  4. CTA secundária (com toggle "Mostrar" e grid 2-col)
  5. Badges (texto + checkbox de pulse; badge 2 sem pulse)
  6. Cards flutuantes em órbita (checkbox + hint informativo)
  7. Visibilidade geral (isActive)
- **`AdminHomeServicesMosaicPage.tsx`** (novo): reaproveita `servicesApi` (read+update+toggle+reorder), `DragList`, `ServiceIconSelect`, `Select` com `TILE_OPTIONS`. Banner primary/5 no topo orientando que essa tela edita SÓ campos de mosaico; título/descrição/slug ficam em "Página: Serviços". Modal focado nos 7 campos: tileClass, numLabel, iconName, anchor, homePill, homePillTags (csv), isActive. Lista mostra cards com num label, título, badges de (tile · ícone · ordem) e preview visual do home pill + tags.
- **`AdminHomeTimelinePage.tsx`** (novo): CRUD completo com `processStepsApi` + `DragList`. Usa `sonner` pra toasts. Modal com number (mono center 120px) + title + description (textarea 3 rows) + duration (opcional) + isActive. Cards mostram número grande + título + duration badge + line-clamp-2.

### Roteamento & sidebar (Fase 4)
- **`AdminLayout.tsx`**:
  - Import de `Clock` adicionado (icon da timeline).
  - Seção "Página: Home" agora com 6 itens:
    1. Hero (`/admin/home`, renomeado de "Hero & seções")
    2. KPIs (inalterado)
    3. Stack (marquee) (inalterado)
    4. **Mosaico de serviços** (`/admin/home-mosaic`, novo, perm `services.write`)
    5. **Timeline (ritmo)** (`/admin/home-timeline`, novo, perm `process-steps.write`)
    6. Banda "Filosofia" (renumerado de 7. → 6.)
- **`App.tsx`**:
  - Removido import `HomeSectionsPage`.
  - Adicionados 3 imports lazy (AdminHomeHeroPage, AdminHomeServicesMosaicPage, AdminHomeTimelinePage).
  - `<Route path="home">` agora aponta pra `AdminHomeHeroPage` (substituindo `HomeSectionsPage`).
  - Adicionadas rotas `home-mosaic` e `home-timeline`.
- `HomeSectionsPage.tsx` **permanece no repo** (sem rota nem link no sidebar) — decisão consciente pra não perder o arquivo caso futuramente queiramos reviver a UI de HomeSection.

### QA (Fase 5)
- **Backend**: schema aplicado com sucesso (`prisma db push`). TS check filtrado aos arquivos tocados: 0 erros novos. `npm run build` do backend usa `tsc || exit 0` intencionalmente (tolerante a erros pré-existentes de config, ex: TS6059 em `prisma/seed.ts`).
- **Frontend**: `npm run build` passou em **12.9s sem erros**. Todos os 3 novos chunks gerados: AdminHomeHeroPage (8.24kB), AdminHomeServicesMosaicPage (8.80kB), AdminHomeTimelinePage (6.58kB).
- **Frontend typecheck**: `npx tsc --noEmit` retornou apenas erros pré-existentes (gtag no Window, import.meta.env, NodeJS namespace, process, toggleJob do AdminJobsPage, unused imports no AdminLayout/AdminUsersPage, ImageInput no HomeSectionsPage) — nenhum dos arquivos novos ou modificados aparece nos erros.
- **Smoke test no navegador**: não executado automaticamente; depende do usuário subir dev env (backend e frontend).

## 🔧 Decisões Técnicas

1. **`HomeHero` como singleton, não como item de lista**: segue o padrão já consolidado no projeto (`HomeBand`, `HomeLiveCard`, `HomeBrandPill`). Rota usa `findFirst + update/create`. Fica muito mais simples que transformar `HomeSection` em lista de seções editáveis.

2. **Fallback hardcoded no `HeroOrbitSection`**: garante que a home **nunca quebra** mesmo sem registro no banco ou se a API cair. Os valores do fallback são cópia exata do que havia antes, então o comportamento é idêntico pro usuário final. Essa é a forma mais segura de migrar um componente hardcoded para data-driven.

3. **Mosaico reaproveita `Service` em vez de criar entidade nova**: evita duplicar dados. A tela foca nos campos já existentes (`tileClass`, `numLabel`, `iconName`, `homePill`, `homePillTags`, `anchor`, `order`, `isActive`). Banner informativo orienta o usuário a não tentar editar `title`/`description` nessa tela (isso fica em "Página: Serviços").

4. **Timeline reaproveita `ProcessStep` (não cria model novo)**: backend, rotas e permissão `process-steps.write` já existiam; só faltava a UI admin + endpoint de reorder. Foi só adicionar 1 endpoint (reorder) + 1 tela admin + 1 entry no sidebar + 1 rota no App.

5. **HomeSection legado NÃO removido**: schema, tabela e rotas backend permanecem. `HomeSectionsPage.tsx` fica órfão (sem rota e sem link) mas não é deletado. Isso é um cinto de segurança pra caso precisarmos reviver. Remoção definitiva fica pra outro PR.

6. **Reorder de process steps adicionado**: endpoint `PATCH /admin/process-steps/reorder` não existia. Adicionado seguindo padrão idêntico ao de outros resources (transação com múltiplos updates + invalidação de cache). Registrado em DECISIONS.

7. **Fastify route priority**: `/admin/process-steps/reorder` (estática) tem prioridade sobre `/admin/process-steps/:id` (param) em Fastify/find-my-way. Verificado antes de commitar.

## 🐛 Problemas Encontrados e Soluções

- **Problema**: `npx prisma generate` falhando com EPERM ao tentar renomear `query_engine-windows.dll.node.tmp*` → `.dll.node`.
  **Causa raiz**: processo `tsx watch src/server.ts` (PID 98892, iniciado pelo usuário às 04:03 do dia 24/04/2026) seguraria o arquivo .dll.node carregado em memória. Identificado via `Get-Process | Where-Object Modules ...` no PowerShell.
  **Solução**: os arquivos `.js` e `.d.ts` do client FORAM regenerados com sucesso antes do erro (o TypeScript enxerga `HomeHero` normalmente). Usado `prisma db push --skip-generate` pra aplicar o schema no banco sem reprocessar o engine binário. Documentado em `AI/DECISIONS.md` pra referência futura.

- **Problema**: typecheck global do backend retorna erro TS6059 em `prisma/seed.ts` (fora do rootDir).
  **Solução**: é **pré-existente** e intencional — o script `build` do backend usa `tsc || exit 0` pra tolerar esse e outros erros de config. Não foi introduzido pela minha mudança.

- **Problema**: como enviar um PATCH parcial (só campos de mosaico) para `PUT /admin/services/:id` sem perder os outros dados?
  **Solução**: o schema Zod do backend aceita body parcial (ex: `services.ts` usa `.partial()` no update). Mandamos só os campos relevantes e o Prisma faz merge. Confirmado vendo o `AdminServicesPage` que também envia payload incompleto em certos fluxos.

## 📋 Próximos Passos

1. [ ] **Usuário rodar smoke test**: `cd backend && npm run dev` + `cd frontend && npm run dev`, fazer login admin, validar sidebar, editar hero/mosaico/timeline e conferir mudanças na home pública.
2. [ ] **Usuário commitar**: mudanças estão em 11 arquivos (ver Referências). Nenhum commit foi feito automaticamente.
3. [ ] **Opcional — rodar seed**: se quiser popular o `HomeHero` no banco de dev (a home já funciona sem, via fallback), rodar `cd backend && npm run prisma:seed`. ⚠ Lembrando que o seed faz TRUNCATE total; só rodar em banco de dev.
4. [ ] **Opcional — refactor futuro**: remover `HomeSection` (schema + tabela + rotas backend + `HomeSectionsPage.tsx`) em outro PR quando tiver certeza que não há mais nada dependendo.
5. [ ] **Opcional — preview em tempo real** na `AdminHomeHeroPage` (renderizar um mini-hero ao lado do form). Deixado pra futuro.

## 🔗 Referências

### Arquivos criados
- `backend/AI/TASKS/24_04_2026-09_21_ADMIN_HOME_REVAMP.md` (pré-existente, atualizado para 95%)
- `AI/HISTORY/24_04_2026-09_45_ADMIN_HOME_REVAMP.md` (este arquivo)
- `frontend/src/pages/admin/AdminHomeHeroPage.tsx`
- `frontend/src/pages/admin/AdminHomeServicesMosaicPage.tsx`
- `frontend/src/pages/admin/AdminHomeTimelinePage.tsx`

### Arquivos modificados
- `backend/prisma/schema.prisma` — +model HomeHero
- `backend/prisma/seed.ts` — +item 17b (home hero seed)
- `backend/src/routes/home-extras.ts` — +schema Zod + 3 rotas
- `backend/src/routes/process-steps.ts` — +reorder endpoint
- `backend/src/lib/cache.ts` — +CacheKeys.homeHero
- `frontend/src/lib/api.ts` — +homeExtrasApi.getHero/admin.getHero/admin.saveHero + processStepsApi novo
- `frontend/src/pages/home/types.ts` — +interface HomeHero
- `frontend/src/pages/home/HeroOrbitSection.tsx` — reescrito (dinâmico com fallback)
- `frontend/src/pages/HomePage.tsx` — +useQuery hero, passa hero pro HeroOrbit
- `frontend/src/pages/admin/AdminLayout.tsx` — +import Clock, sidebar reorganizada
- `frontend/src/App.tsx` — imports lazy atualizados, 2 rotas novas + 1 trocada
- `AI/DECISIONS.md` — +2 registros (reorder + prisma EPERM)

### Não commitados
- Nada. **Nenhum git commit/push foi executado** nesta sessão (regra absoluta do usuário). Tudo permanece no working tree.

### Banco de dados
- PostgreSQL `bsn_site_v2` (prod remoto 93.127.210.192:5432) — tabela `home_heroes` criada, vazia (aguardando seed ou primeiro save via admin).
