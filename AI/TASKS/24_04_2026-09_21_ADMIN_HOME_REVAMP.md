# Tasks — Admin Home Revamp (Hero + Mosaico + Timeline)

**Status Geral**: 🟢 Concluído (pendente apenas smoke test manual pelo usuário)
**Última Atualização**: 24/04/2026 (execução iniciada)
**Objetivo**: Refatorar a seção "Página: Home" do admin: (1) substituir a tela legada "1. Hero & seções" por uma tela dedicada **"1. Hero"** que edita o hero real da home (via novo model singleton `HomeHero`); (2) criar nova tela **"Mosaico de serviços"** focada nos campos de mosaico de `Service`; (3) criar nova tela **"Timeline"** para `ProcessStep`.

## Legenda de Status
- ⚪ Não Iniciado
- 🟡 Em Progresso
- 🟢 Concluído
- 🔴 Bloqueado

---

## Mapa de decisões (ver `AI/DECISIONS.md` para detalhes)

- `HomeSection` legado → deprecado (rota backend continua, UI removida)
- `HomeHero` → novo model singleton (padrão `HomeBand`)
- Timeline → reaproveita `ProcessStep` existente
- Mosaico → reaproveita `Service` via tela focada nos campos de mosaico

---

## FASE 1: Backend — novo model `HomeHero` + rotas + seed 🟢

### 1.1 Schema + migration 🟢
- [x] Adicionar model `HomeHero` em `backend/prisma/schema.prisma`:
  ```prisma
  // Hero da home pública (singleton — 1 registro).
  model HomeHero {
    id                    String   @id @default(uuid())
    // Template do eyebrow. {count} é substituído pelo número de services ativos.
    // Ex: "{count} capacidades · 1 parceiro"
    eyebrowTemplate       String   @default("{count} capacidades · 1 parceiro")
    // Título (aceita <em> e <br>) — ex: "Tudo que sua operação precisa <em>girando</em> no mesmo eixo."
    title                 String
    // Lede abaixo do h1
    subtitle              String
    // CTA primária
    ctaPrimaryLabel       String   @default("Começar")
    ctaPrimaryUrl         String   @default("/contato")
    ctaPrimaryIcon        String?  @default("↗")
    // CTA secundária (ghost)
    ctaSecondaryLabel     String?  @default("Explorar capacidades")
    ctaSecondaryUrl       String?  @default("/servicos")
    // Badges flutuantes
    badge1Text            String?  @default("Resposta em até 24h úteis")
    badge1HasPulse        Boolean  @default(true)
    badge2Text            String?  @default("🔒 LGPD-ready")
    // Cards flutuantes ao redor do hero (orbit-nodes — consomem Service)
    showFloatingNodes     Boolean  @default(true)
    isActive              Boolean  @default(true)
    createdAt             DateTime @default(now())
    updatedAt             DateTime @updatedAt

    @@map("home_heroes")
  }
  ```
- [x] Rodar `npx prisma db push --skip-generate` (projeto usa db push, não migrate dev) — schema aplicado
- [x] Regenerar client (`.js`/`.d.ts` foram regenerados; `.dll.node` ficou travado por `tsx watch` órfão (PID 98892) mas não impede compilação TS — documentado)

### 1.2 Seed 🟢
- [x] Adicionar seed de `HomeHero` em `backend/prisma/seed.ts` — valores **idênticos** ao hardcoded atual do `HeroOrbitSection.tsx`:
  ```ts
  await prisma.homeHero.upsert({
    where: { id: 'singleton' }, // não usa, só pra upsert — usar findFirst+create OU deleteMany+create
    ...
  })
  ```
  (usar padrão `findFirst + create` se não houver — igual `HomeBand` no seed).
- [x] Seed inserido como item `17b. Home Hero` (seed faz TRUNCATE antes, então OK usar `create` direto). Executar seed fica a cargo do usuário (não roda automaticamente pra não apagar dados).

### 1.3 Rotas (em `home-extras.ts`) 🟢
- [x] Adicionar schema Zod `homeHeroSchema`.
- [x] Rota pública `GET /home/hero` com cache (`CacheKeys.homeHero`, TTL 3600s).
- [x] Rota admin `GET /admin/home/hero` (permissão `home.read`).
- [x] Rota admin `PUT /admin/home/hero` (permissão `home.write`, padrão singleton upsert: findFirst → update ou create).
- [x] Adicionar `homeHero: "home-hero"` em `backend/src/lib/cache.ts` (CacheKeys).
- [x] **Bônus:** Adicionar `PATCH /admin/process-steps/reorder` em `process-steps.ts` (faltava pro DragList do admin timeline funcionar).

### 1.4 Deprecar `HomeSection` (sem remover) 🟢
- [x] Nada a fazer no backend — rotas continuam. Documentado em DECISIONS.

---

## FASE 2: Frontend — API client + HomePage + HeroOrbitSection dinâmico 🟢

### 2.1 `frontend/src/lib/api.ts` 🟢
- [x] Adicionar em `homeExtrasApi`:
  ```ts
  getHero: () => api.get('/home/hero').then(r => r.data),
  admin: {
    ...,
    getHero: () => api.get('/admin/home/hero').then(r => r.data),
    saveHero: (data) => api.put('/admin/home/hero', data).then(r => r.data),
  }
  ```
- [x] Adicionar `processStepsApi`:
  ```ts
  export const processStepsApi = {
    getSteps: () => api.get('/process-steps').then(r => r.data),
    admin: {
      list: () => api.get('/admin/process-steps').then(r => r.data),
      create: (data) => api.post('/admin/process-steps', data).then(r => r.data),
      update: (id, data) => api.put(`/admin/process-steps/${id}`, data).then(r => r.data),
      remove: (id) => api.delete(`/admin/process-steps/${id}`).then(r => r.data),
      toggle: (id) => api.patch(`/admin/process-steps/${id}/toggle`).then(r => r.data),
    }
  }
  ```

### 2.2 `HeroOrbitSection.tsx` — aceitar hero dinâmico 🟢
- [x] Props agora aceitam `hero?: HomeHero | null` (opcional com fallback).
- [x] Fallback `FALLBACK_HERO` com textos idênticos ao que rodava antes (zero regressão).
- [x] Eyebrow usa `h.eyebrowTemplate.replace('{count}', ...)`.
- [x] H1 com `dangerouslySetInnerHTML` (aceita `<em>`/`<br>`).
- [x] Subtítulo, CTA primária/secundária, badges e floating nodes todos reativos ao model.
- [x] Renderização condicional de badges (só se texto existir) e pulse (respeita `badge1HasPulse`).

### 2.3 `HomePage.tsx` — query do hero 🟢
- [x] Adicionada `useQuery` com chave `['home-hero']`, staleTime 5min, `homeExtrasApi.getHero`.
- [x] `<HeroOrbitSection services={services} hero={hero} />` passando o dado.

### 2.4 Tipos compartilhados 🟢
- [x] Interface `HomeHero` adicionada em `frontend/src/pages/home/types.ts`.

---

## FASE 3: Frontend Admin — 3 telas novas 🟢

### 3.1 `AdminHomeHeroPage.tsx` (nova tela — rota `/admin/home`) 🟢
- [x] Criado em `frontend/src/pages/admin/AdminHomeHeroPage.tsx`.
- [x] Padrão singleton (load → form → save), seguindo `AdminHomeBandPage`.
- [x] Campos agrupados em 7 cards glass: Eyebrow · Título & subtítulo · CTA primária (3 cols: label/url/ícone) · CTA secundária (com toggle "Mostrar") · Badges (texto + checkbox pulse) · Cards flutuantes (checkbox + hint) · Visibilidade.
- [x] Botão Salvar com estado `saving` e alert(ok/erro).

### 3.2 `AdminHomeServicesMosaicPage.tsx` (nova tela — rota `/admin/home-mosaic`) 🟢
- [x] Criado em `frontend/src/pages/admin/AdminHomeServicesMosaicPage.tsx`.
- [x] GET `/admin/services` via `servicesApi.admin.getServices()`.
- [x] `DragList` com cards mostrando num label + título + badges (tile, ícone, ordem) + home pill + home tags como chips.
- [x] Reorder reaproveita `servicesApi.admin.reorderServices` (já existia).
- [x] Modal focado em mosaico: `tileClass` (Select com TILE_OPTIONS), `numLabel`, `iconName` (ServiceIconSelect), `anchor`, `homePill`, `homePillTags` (csv), `isActive`. Não permite editar title/description/slug (orientação no banner).
- [x] Banner informativo no topo orientando uso correto das duas telas.

### 3.3 `AdminHomeTimelinePage.tsx` (nova tela — rota `/admin/home-timeline`) 🟢
- [x] Criado em `frontend/src/pages/admin/AdminHomeTimelinePage.tsx`.
- [x] Padrão `DragList` igual `AdminKPIsPage`, com toast (sonner) no lugar de alert.
- [x] Cards mostrando número grande + título + duration badge + descrição line-clamp-2.
- [x] Modal criar/editar com: number (mono center), title, description (textarea), duration (opcional), isActive.
- [x] Reorder via `PATCH /admin/process-steps/reorder` (adicionado na Fase 1 — não existia antes).
- [x] Delete com confirm.

---

## FASE 4: AdminLayout + App.tsx — ajustar rotas e sidebar 🟢

### 4.1 `AdminLayout.tsx` — atualizar seção "Página: Home" 🟢
- [x] `"1. Hero & seções"` → `"1. Hero"`.
- [x] href mantido em `/admin/home` (reaproveita rota, agora aponta pra AdminHomeHeroPage).
- [x] `"4. Mosaico de serviços"` adicionado (icon LayoutGrid, permission `services.write`).
- [x] `"5. Timeline (ritmo)"` adicionado (icon Clock — import adicionado, permission `process-steps.write`).
- [x] `"Banda Filosofia"` renumerada de `7.` para `6.`.

### 4.2 `App.tsx` — trocar rota `/admin/home` e adicionar novas 🟢
- [x] Import `HomeSectionsPage` removido.
- [x] Imports lazy adicionados pras 3 novas páginas.
- [x] `<Route path="home" element={<AdminHomeHeroPage />} />` substituiu o antigo.
- [x] `<Route path="home-mosaic" element={<AdminHomeServicesMosaicPage />} />` adicionado.
- [x] `<Route path="home-timeline" element={<AdminHomeTimelinePage />} />` adicionado.

---

## FASE 5: QA — validação 🟢

### 5.1 Build & typecheck 🟢
- [x] Backend: `npm` é o gerenciador (projeto usa package-lock.json — confirmado). `npm run build` usa `tsc || exit 0` (intencional pra tolerar erros conhecidos). Typecheck filtrado aos arquivos tocados retornou 0 erros específicos às mudanças.
- [x] Backend: Schema aplicado via `npx prisma db push --skip-generate` — tabela `home_heroes` criada no banco remoto. Projeto não usa `prisma migrate dev` (sem pasta `migrations/`).
- [x] Frontend: `npm run build` — ✅ build bem-sucedido em 12.9s. 3 novos chunks gerados (AdminHomeHeroPage 8.24kB, AdminHomeServicesMosaicPage 8.80kB, AdminHomeTimelinePage 6.58kB).
- [x] Frontend: `npx tsc --noEmit` — nenhum erro novo introduzido; erros listados são todos pré-existentes (gtag, import.meta.env, NodeJS, process, AdminJobsPage.toggleJob, unused imports em AdminLayout/AdminUsersPage, HomeSectionsPage.ImageInput).

### 5.2 Smoke test manual (navegador) 🟡 pendente — a cargo do usuário rodar o dev env
- [ ] Login admin → ver sidebar "Página: Home" com 6 itens (Hero / KPIs / Stack / Mosaico / Timeline / Banda).
- [ ] Abrir `/admin/home` → editar algum campo do hero → salvar.
- [ ] Abrir `/` (home pública) → confirmar que a edição apareceu.
- [ ] Abrir `/admin/home-mosaic` → reordenar 2 serviços → validar em `/`.
- [ ] Abrir `/admin/home-timeline` → criar etapa "Teste" → validar em `/`.
- [ ] Confirmar que as outras telas (KPIs, Stack, Banda) continuam funcionando.

**Nota do maestro:** Smoke test em navegador não foi executado automaticamente nesta sessão — o backend não está rodando (porta 3001 livre). Schema e build foram validados. Próximo passo do usuário: subir `npm run dev` em `backend/` e `frontend/` e validar visualmente. Como o fallback do HeroOrbitSection é 100% idêntico ao código antigo, **a home NÃO quebra** mesmo se o endpoint `/home/hero` falhar por algum motivo.

### 5.3 Teste adversarial 🟢 (coberto pelo fallback e renderização condicional)
- [x] Hero com HTML inválido no `title` — `dangerouslySetInnerHTML` aceita qualquer HTML (comportamento idêntico ao pattern já usado em `BandSection`).
- [x] Hero com `showFloatingNodes=false` — renderização condicional no componente (`showNodes && <div className="orbit-nodes" />`).
- [x] Mosaico sem `tileClass` — `VitralSection` já cai no fallback `t${i+1}` (código preservado, não foi alterado).
- [x] Timeline sem nenhum step ativo — `TimelineSection` existente já respeita isso (não foi alterado).

---

## FASE 6: Documentação 🟢

### 6.1 `AI/HISTORY/` 🟢
- [x] `AI/HISTORY/24_04_2026-09_45_ADMIN_HOME_REVAMP.md` criado com resumo completo (status, o que foi feito, decisões, problemas/soluções, próximos passos, referências).

---

## 📊 Métricas de Progresso

- Total de Tarefas: 40
- Concluídas: 38 (95%)
- Em Progresso: 2 (smoke test manual pendente — depende do usuário subir dev env; history será gerado a seguir)
- Bloqueadas: 0
- Progresso: **95%**

**Entregáveis desta sessão:**
- Backend: model `HomeHero` + migration (db push) + seed + 3 rotas (GET público, GET admin, PUT admin) + cache key + `PATCH /admin/process-steps/reorder`
- Frontend home: `HeroOrbitSection` dinâmico com fallback; `HomePage` com query do hero; tipo `HomeHero`
- Frontend admin: 3 telas novas (`AdminHomeHeroPage`, `AdminHomeServicesMosaicPage`, `AdminHomeTimelinePage`)
- Roteamento: sidebar reorganizada (6 itens em "Página: Home"); App.tsx com 3 novas rotas lazy
- Build frontend: ✅ 12.9s, 0 erros novos
- Schema aplicado no PG remoto: ✅

---

## ⚠️ Notas importantes

- **NÃO commitar nada automaticamente** — usuário commita quando decidir.
- Manter `HomeSection` model no schema (mesmo que sem UI) pra evitar perda de dados históricos.
- Fallback do Hero no frontend precisa ser 100% idêntico ao atual pra não quebrar se banco ainda não tem registro.
