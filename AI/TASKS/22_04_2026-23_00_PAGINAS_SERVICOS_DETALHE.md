# Tasks de Implementação — Páginas de Detalhe dos Serviços + Admin + Auditoria CMS

**Status Geral**: 🟢 Concluído (pendente apenas `prisma generate/migrate/seed` manual — ver HISTORY)
**Última Atualização**: 22/04/2026 23:50
**Objetivo**: Criar páginas individuais `/servicos/<slug>` inspiradas na estrutura da ateliware (com conteúdo 100% original no tom BSN), ampliar o admin para gerenciar todo o conteúdo novo e gerar um relatório de auditoria do CMS.

## Legenda
- 🟢 Não Iniciado · 🟡 Em Progresso · 🟢 Concluído · 🔴 Bloqueado

---

## FASE 1 — Schema Prisma 🟢

### 1.1 Estender model `Service`
- [x] Adicionar campo `slug String? @unique`
- [x] Adicionar `heroEyebrow String?`
- [x] Adicionar `heroDescription String?` (lede do hero da página de detalhe)
- [x] Adicionar `heroLongText String?` (parágrafo extra abaixo do h1)
- [x] Adicionar `ctaTitle String?`
- [x] Adicionar `ctaText String?`
- [x] Adicionar `ctaButtonLabel String?`
- [x] Adicionar `ctaButtonUrl String?` (default `/contato`, mas admin pode sobrescrever)

### 1.2 Criar model `ServiceDetailBlock`
- [x] id, serviceId (FK), title, description, iconName, colorClass, order, isActive, createdAt, updatedAt
- [x] Relação `Service.detailBlocks ServiceDetailBlock[]`
- [x] `@@map("service_detail_blocks")`

### 1.3 Observações
- NÃO gerar migration automaticamente — usuário pode estar com backend dev rodando (EPERM). Apenas ajustar o schema e documentar comando manual.

---

## FASE 2 — Seed 🟢

### 2.1 Popular slugs nos 9 serviços existentes
- [x] Mapear `anchor` → `slug` (ex: `sob-medida`, `squads`, `automacao`, `consultoria`, `infra`, `suporte`, `outsourcing`, `ia`, `dados-ia`)

### 2.2 Adicionar 2 novos serviços faltantes (tom BSN)
- [x] Product Concept (slug: `product-concept`)
- [x] Design de Serviço (slug: `design-servico`)

### 2.3 Para cada um dos 11 serviços, popular hero + CTA + 3 blocks originais
- [x] heroEyebrow / heroDescription / heroLongText (tom BSN, parceria técnica, antifeature-slop, entregas mensuráveis)
- [x] ctaTitle / ctaText / ctaButtonLabel (não copiar ateliware)
- [x] 3 ServiceDetailBlock com title / description / iconName / colorClass / order (temas tipo: "Por que começar", "Como trabalhamos", "O que entregamos")

---

## FASE 3 — Rotas Backend 🟢

### 3.1 Público
- [x] `GET /api/services/:slug` → Service + detailBlocks ordenados + campos de detalhe (usar withCache)
- [x] Manter `GET /api/services/:id` para compat (aceitar tanto UUID quanto slug? → adicionar nova rota separada por slug é mais seguro)

### 3.2 Admin
- [x] Atualizar `serviceSchema` do Zod com os novos campos (slug único, hero*, cta*)
- [x] `GET /api/admin/services/:id/blocks` — lista blocks de um serviço
- [x] `POST /api/admin/services/:id/blocks` — cria block
- [x] `PUT /api/admin/services/:id/blocks/:blockId` — atualiza block
- [x] `DELETE /api/admin/services/:id/blocks/:blockId` — remove block
- [x] `PATCH /api/admin/services/:id/blocks/:blockId/toggle` — ativa/desativa
- [x] `PATCH /api/admin/services/:id/blocks/reorder` — reordena

### 3.3 Invalidação de cache
- [x] Invalidar cache de `services` e por `slug` em toda mutation

---

## FASE 4 — Frontend público 🟢

### 4.1 ServiceDetailPage.tsx
- [x] Novo componente em `frontend/src/pages/ServiceDetailPage.tsx`
- [x] Lê `slug` via `useParams`
- [x] Query `['service-detail', slug]` chamando `GET /services/:slug`
- [x] Render: Header + hero + 3 blocks + CTA band + Footer
- [x] Usar classes `.glass`, `.shell`, `.shard`, `.bsn-spot`, reveal animations, spotlight (vem do `MotionLayer` global)
- [x] `align-items: stretch` + `height: 100%` nos cards dos blocks
- [x] 404 elegante se slug não existir

### 4.2 Rota dinâmica `/servicos/:slug`
- [x] Adicionar em `App.tsx` depois da `/servicos` (para não conflitar)
- [x] Lazy load

### 4.3 Card da lista /servicos vira link
- [x] Envolver `<article class="svc">` em `<Link to={'/servicos/'+slug}>` (ou wrapper externo para não quebrar estilo)
- [x] Manter CTA interna apontando pra /contato

### 4.4 Estilos novos no globals.css
- [x] Adicionar classes `.svc-detail-hero`, `.svc-detail-blocks`, `.svc-detail-block`, `.svc-detail-cta` (seguindo padrão `ai-hero`, `ai-stage`, `ai-cta-band`)

---

## FASE 5 — Admin 🟢

### 5.1 Estender AdminServicesPage.tsx
- [x] Adicionar campo `slug` no form com validação client-side (lowercase, sem espaço)
- [x] Adicionar campos de hero: heroEyebrow, heroDescription, heroLongText
- [x] Adicionar campos de CTA: ctaTitle, ctaText, ctaButtonLabel, ctaButtonUrl
- [x] Link "Editar detalhes" que abre modal dedicado ou navega pra rota filha

### 5.2 Gerenciar Blocks
- [x] Dentro do modal de edição (após salvar o serviço), exibir seção "Blocos de detalhe"
- [x] Lista com 3 slots (criar se não existirem)
- [x] Cada block: title, description, iconName (IconPicker), colorClass (select a/b/c/d/e/f), order, isActive
- [x] Botão "Adicionar bloco", "Remover", "Mover cima/baixo"

### 5.3 Extensão de api.ts
- [x] `servicesApi.getServiceBySlug(slug)`
- [x] `servicesApi.admin.getBlocks(serviceId)`
- [x] `servicesApi.admin.createBlock(serviceId, data)`
- [x] `servicesApi.admin.updateBlock(serviceId, blockId, data)`
- [x] `servicesApi.admin.deleteBlock(serviceId, blockId)`
- [x] `servicesApi.admin.toggleBlock(serviceId, blockId)`
- [x] `servicesApi.admin.reorderBlocks(serviceId, items)`

### 5.4 Preview
- [x] Botão "Ver página" no admin abrindo `/servicos/:slug` em nova aba

---

## FASE 6 — Build + validação 🟢
- [x] `tsc --noEmit` backend
- [x] `vite build` frontend (ou pelo menos `tsc --noEmit`)
- [x] Se `prisma generate` falhar com EPERM → avisar usuário no relatório final e NÃO tentar matar processos

---

## FASE 7 — Auditoria CMS 🟢
- [x] Criar `AI/AUDITORIAS/22_04_2026-23_00_CMS_AUDITORIA.md`
- [x] Para cada página pública, inventariar textos/imagens/ícones e apontar se é editável no admin ou GAP
- [x] Priorizar (ALTA/MÉDIA/BAIXA) e sugerir modelo de dados
- [x] NÃO corrigir os gaps — apenas relatar

---

## FASE 8 — AI/HISTORY final 🟢
- [x] Criar `AI/HISTORY/22_04_2026-23_00_PAGINAS_SERVICOS_DETALHE.md`
- [x] Listar arquivos alterados (paths absolutos)
- [x] Decisões técnicas
- [x] Comandos manuais pendentes (prisma generate, migrate, seed)
- [x] Avisos (EPERM, backend dev)

---

## Métricas
- Total de tarefas: ~55
- Concluídas: ~55
- Em progresso: 0
- Bloqueadas: 0
- Progresso: 100% (implementação); comando manual `prisma generate/migrate/seed` pendente do usuário (EPERM — ver HISTORY).

## Notas críticas
- Backend dev pode travar `prisma generate` (EPERM). Documentar comandos manuais e parar se bater no erro.
- Não fazer `git commit/push`.
- Conteúdo PT-BR ORIGINAL, não copiar texto da ateliware.
- Reusar componentes/classes existentes.
- Admin mantém padrão shadcn (não adicionar `.glass` em admin sem necessidade).
