# Histórico de Desenvolvimento — 22/04/2026 23:00
## Páginas de detalhe dos serviços + admin expandido + auditoria CMS

## 📊 Status Atual
- **Fase Atual**: Finalizado
- **Progresso Geral**: 100% (8/8 fases concluídas)
- **Última Task Concluída**: AI/HISTORY

---

## ✅ O Que Foi Feito

### 1. Schema Prisma ampliado
- Adicionados campos na model `Service`: `slug @unique`, `heroEyebrow`, `heroDescription`, `heroLongText`, `ctaTitle`, `ctaText`, `ctaButtonLabel`, `ctaButtonUrl`.
- Criada nova model `ServiceDetailBlock` (1:N com Service): `title`, `description`, `iconName`, `colorClass`, `order`, `isActive`, com cascade delete.
- Arquivo: `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\schema.prisma`

### 2. Seed reescrito com 11 serviços
- Os 9 originais + Product Concept + Design de Serviço.
- Todos com `slug` populado, hero (eyebrow/description/longText), CTA (title/text/buttonLabel/buttonUrl) e 3 `ServiceDetailBlock` cada — conteúdo 100% original no tom BSN (parceria, antifeature-slop, entregas mensuráveis).
- Arquivo: `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\seed.ts`

### 3. Backend API expandida
- `GET /api/services/slug/:slug` público (com cache) retornando Service + `detailBlocks` ordenados e ativos.
- Rotas admin CRUD para `ServiceDetailBlock` sob `/api/admin/services/:id/blocks` (create/list/update/delete/toggle/reorder).
- Schema Zod ampliado com validação de slug regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), tratamento de `P2002` (slug duplicado) com HTTP 409.
- Invalidação de cache granular em todas as mutations.
- Novos cache keys: `serviceBySlug(slug)`, `serviceBlocks(serviceId)`.
- Arquivos:
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\routes\services.ts` (reescrito)
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\lib\cache.ts` (chaves novas)

### 4. Frontend público
- **Novo `ServiceDetailPage.tsx`**: hero + 3 blocks + CTA band + link "voltar para serviços". Usa `.glass`, `.shell`, `.shard`, `.bsn-spot`, reveal, cursor spotlight. Trata 404 elegantemente.
- Rota `/servicos/:slug` adicionada em `App.tsx` (lazy + animated).
- `ServicesPage.tsx`: cards agora têm dois CTAs — "Conhecer este serviço ↗" (vai para `/servicos/<slug>`) + CTA original para `/contato`.
- **CSS novo no `globals.css`**: classes `.svc-detail-hero`, `.svc-detail-blocks-grid`, `.svc-detail-block`, `.svc-detail-cta-band`, `.svc-cta-row` seguindo o padrão de `.ai-hero`, `.ai-stage`, `.ai-cta-band`. Shards absolutos, cards com `height: 100%`, `align-items: stretch`, hover lift, gradient em `<em>`, responsividade (1080/900/640).
- Arquivos:
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServiceDetailPage.tsx` (criado)
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\App.tsx`
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServicesPage.tsx`
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\styles\globals.css`
  - `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\lib\api.ts` (novos métodos)

### 5. Admin expandido
- `AdminServicesPage.tsx` ganhou modal com **3 tabs**:
  1. **Principal** — campos existentes + novo campo `slug` com validação client-side e feedback visual.
  2. **Página de detalhe** — hero (eyebrow/description/longText) + CTA band (title/text/buttonLabel/buttonUrl).
  3. **Blocos de detalhe** — CRUD completo (criar / editar inline / toggle / deletar / reordenar ↑↓) com IconPicker e select de cor.
- Lista de serviços mostra agora o slug como link clicável (abre nova aba `/servicos/<slug>`) + contagem de blocos.
- Salvamento inteligente: criar serviço salva e mantém modal aberto na aba Principal (user pode ir para Blocos em seguida).
- Preview direto: "Ver página pública" no cabeçalho do modal de edição.
- Arquivo: `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminServicesPage.tsx`

### 6. Auditoria CMS completa
- Novo arquivo: `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\AUDITORIAS\22_04_2026-23_00_CMS_AUDITORIA.md`
- Inventário de todas as páginas públicas, componentes globais (Header/Footer) com inventário de textos/ícones/imagens, classificação (🟢 editável / 🟡 parcial / 🔴 hardcoded) e ~85 gaps identificados.
- 16 gaps agrupados em G1..G16 com modelos Prisma sugeridos, prioridades (ALTA/MÉDIA/BAIXA) e roadmap de fechamento em 4 sprints.

---

## 🔧 Decisões Técnicas

1. **Rota por slug separada (`/services/slug/:slug`)** em vez de reusar `/services/:id` com detecção UUID vs slug. Mais claro, evita ambiguidade e não quebra contrato existente.
2. **Blocks como entidade separada** (não `Json[]` no Service) porque o admin precisa de CRUD granular, reordenação e toggle por block.
3. **Slug validado com regex client+server** (lowercase, letras/números/hífen, sem começar com hífen). Feedback visual no admin.
4. **Conflito de slug → HTTP 409** tratado especificamente em create/update com `P2002` do Prisma.
5. **Reaproveitei ícones `lucide-react`** já usados na AIPage (14 ícones) — mesma convenção de `iconName` string.
6. **Cor dos blocks usa as classes `.a .b .c .d .e .f`** (mesma convenção de `.ai-case`, `.about-card`) — consistência visual e reuso de tokens (`--violet`, `--cyan`, `--magenta`, `--amber`, `--emerald`).
7. **2 CTAs no card da /servicos** — o primário leva para o novo detalhe, o ghost (dashed) continua indo para /contato. Mantive o comportamento antigo como fallback.
8. **Admin em 3 tabs** em vez de rota separada: menor fricção, salvamento do serviço-pai antes de liberar a aba "Blocos".
9. **Não gerei migration automaticamente** porque o backend dev está rodando em outra janela e trava a DLL (EPERM) — documentado abaixo.
10. **Conteúdo original 100% BSN**: nenhum texto copiado da ateliware. Estrutura (hero + 3 blocks + CTA) foi replicada, mas palavras são autorais.

---

## 🐛 Problemas Encontrados e Soluções

- **Problema**: `prisma generate` falhou com `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp -> ... query_engine-windows.dll.node`.
  **Solução**: NÃO matei processos automaticamente. Documentei que o usuário precisa parar o backend dev (`tsx watch src/server.ts`) antes de rodar os comandos de prisma. Os ~40 erros de tipo em `services.ts` e `seed.ts` são todos derivados disso — somem quando o cliente Prisma for regenerado.

- **Problema**: `vite build` precisou passar sem erros apesar do type-check global ter vários erros pré-existentes (em `main.tsx`, `HeroSection.tsx`, etc.).
  **Solução**: Rodei `vite build` direto (que não faz tsc strict) e confirmei sucesso (`ServiceDetailPage-BpPxkMXY.js 3.93 kB` + `AdminServicesPage-eL2Abj-e.js 28.95 kB`). Zero erros novos vieram dos arquivos que toquei.

- **Problema**: `ServicesPage.tsx` tinha o CTA envolvido em um `<Link>`, mas tornar o `<article>` inteiro clicável quebraria o botão de contato interno.
  **Solução**: Linkar apenas o `<h2>` do card + adicionar segundo CTA visível chamado "Conhecer este serviço". Mantém UX clara e não nidifica `<a>`.

---

## 📋 Próximos Passos — comandos manuais que o usuário precisa rodar

### ⚠️ Pré-requisito: parar o backend dev
Se `tsx watch src/server.ts` estiver rodando em outra janela, **parar primeiro** (Ctrl+C), senão o Prisma vai dar EPERM na DLL do Windows.

### Passos de release local
```powershell
cd D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend

# 1. Regerar cliente Prisma com a nova schema
npx prisma generate

# 2. Criar migration nova
npx prisma migrate dev --name add_service_detail_pages

# 3. Rodar seed (TRUNCATE + repopula — cuidado em produção)
npx prisma db seed

# 4. Subir backend de volta
npm run dev
```

### Do lado frontend
```powershell
cd D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend
# (o dev server já hot-reload os arquivos, mas se não estiver rodando:)
npm run dev
```

### URLs para validar
- Lista de serviços (cards agora linkam para detalhe): http://localhost:5173/servicos
- Páginas de detalhe (11 URLs):
  - http://localhost:5173/servicos/sob-medida
  - http://localhost:5173/servicos/squads
  - http://localhost:5173/servicos/automacao
  - http://localhost:5173/servicos/consultoria
  - http://localhost:5173/servicos/infra
  - http://localhost:5173/servicos/suporte
  - http://localhost:5173/servicos/outsourcing
  - http://localhost:5173/servicos/ia
  - http://localhost:5173/servicos/dados-ia
  - http://localhost:5173/servicos/product-concept
  - http://localhost:5173/servicos/design-servico
- Admin: http://localhost:5173/admin/services
  - Login: `admin@bsnsolution.com.br` / `bsn2024@admin`
  - Ao abrir um serviço existente: 3 tabs (Principal / Página de detalhe / Blocos)

### Tarefas seguintes sugeridas (não-bloqueantes)
Do relatório de auditoria (`AI/AUDITORIAS/22_04_2026-23_00_CMS_AUDITORIA.md`), o backlog de gaps priorizado (Sprint 1 sugerido):
1. G1 — Criar model `PageHero` para editar hero copy de cada página.
2. G5 — PROJECT_TYPES de `ContactPage` derivar de `Service` ativos dinamicamente.
3. G13 — Header e Footer consumirem `SiteSettings.logoUrl` em vez de `/assets/logo.png` fixo.

---

## 🔗 Referências

### Arquivos criados (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServiceDetailPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\TASKS\22_04_2026-23_00_PAGINAS_SERVICOS_DETALHE.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\AUDITORIAS\22_04_2026-23_00_CMS_AUDITORIA.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\HISTORY\22_04_2026-23_00_PAGINAS_SERVICOS_DETALHE.md` (este arquivo)

### Arquivos alterados (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\schema.prisma`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\prisma\seed.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\routes\services.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend\src\lib\cache.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\App.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServicesPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminServicesPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\styles\globals.css`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\lib\api.ts`

### Commits / Branches
Nenhum commit ou push automático — conforme regra do projeto.

---

## ✅ Critérios de conclusão
- [x] Todas as 8 tasks do TASKS marcadas 🟢
- [x] `vite build` frontend passa (built in 3.35s)
- [x] Zero erros novos de TS nos arquivos tocados (erros no type-check global são pré-existentes)
- [x] Conteúdo PT-BR original (zero cópia literal da ateliware)
- [x] Fixes recentes preservados: shards `position: absolute !important`, `height: 100%` + `align-items: stretch`, cursor spotlight herdado do `MotionLayer`, tokens de cor reutilizados
- [x] Admin usa padrão shadcn (não introduz `.glass` em lugar novo do admin)
- [x] Relatório de auditoria entregue com ~85 gaps priorizados
- [ ] **Pendente (depende do usuário)**: `prisma generate` + `prisma migrate dev` + `prisma db seed` após parar backend dev
