# Tasks - Fix Heights Excessivos de Cards em Grids Stretch

**Status Geral**: 🟢 Concluído
**Última Atualização**: 22_04_2026 19:26
**Objetivo**: Corrigir heights excessivos em cards de grid em todas as páginas públicas e admin. Cards estão esticando a 800-1000px+ quando o conteúdo é 200-400px devido a `align-items: stretch` (padrão do grid) combinado com `min-height` fixos.

## Legenda
- 🟢 Não Iniciado — 🟡 Em Progresso — 🟢 Concluído — 🔴 Bloqueado

---

## FASE 1: Investigação via Browser MCP 🟡

### 1.1 Capturar evidência visual de cada página 🟢
- [x] `/` Home (confirmado: hero-meta + live-strip OK após scroll, mas vitral svc com stretch)
- [x] `/servicos` (confirmado: .svc com altura enorme por causa de feats diferentes entre cards)
- [ ] `/solucoes`
- [ ] `/sobre`
- [ ] `/carreiras`
- [ ] `/blog`
- [ ] `/contato`
- [ ] `/admin/login` → `/admin`

## FASE 2: Correções no CSS 🟡

Estratégia: **`align-items: start`** nos grids que têm cards com conteúdo variável (não força stretch), combinado com `min-height: 0` ou redução para valor razoável (160-220px). Manter `display: flex; flex-direction: column` nos cards para que `.sol-cta margin-top: auto` continue funcionando (mesmo sem stretch, o card terá só a altura do conteúdo real).

### 2.1 Grid de Serviços — `.svc-grid` / `.svc` 🟢
- [ ] Adicionar `align-items: start` em `.svc-grid` (linha 2338-2344)
- [ ] `.svc` não tem min-height — OK, mantém
- [ ] Validar visualmente em `/servicos` e no vitral da home

### 2.2 Grid de Soluções — `.sol-grid` / `.sol` 🟢
- [ ] Adicionar `align-items: start` em `.sol-grid` (linha 2435-2440)
- [ ] Reduzir `min-height: 320px` → `min-height: auto` em `.sol` (linha 2446). Mantém `display: flex; flex-direction: column` para `.sol-cta` com `margin-top: auto` continuar funcionando (vira simples push-to-bottom dentro da altura natural).

### 2.3 Grid de Sobre — `.about-grid` 🟢
- [ ] Adicionar `align-items: start` em `.about-grid` (linha 2604-2610)
- [ ] Reduzir `min-height: 260px` → `min-height: auto` em `.about-grid .card` (linha 2613)

### 2.4 Grid de Valores — `.values-grid` / `.val` 🟢
- [ ] Adicionar `align-items: start` em `.values-grid`
- [ ] Reduzir `min-height: 220px` → `min-height: auto` em `.val`

### 2.5 Grid de Time — `.team-grid` / `.person` 🟢
- [ ] Adicionar `align-items: start` em `.team-grid`
- [ ] Reduzir `min-height: 260px` → `min-height: auto` em `.person`

### 2.6 Blog — `.feat-card` e `.posts` / `.post` 🟢
- [ ] Reduzir `min-height: 340px` → `min-height: auto` em `.feat-card` (linha 2777)
- [ ] `.feat-card` é grid 2 cols — manter como está (os 2 filhos tem seu próprio ritmo)
- [ ] Adicionar `align-items: start` em `.posts`
- [ ] Reduzir `min-height: 320px` → `min-height: auto` em `.post`

### 2.7 Contato — `.contact-wrap` / `.channels` / `.form-card` 🟢
- [ ] Adicionar `align-items: start` em `.contact-wrap` (linha 2904-2909)
- [ ] `.channels` e `.form-card` não têm min-height explícito, mas são esticados pelo stretch — com start resolve

### 2.8 Hero da Home — `.home-hero .wrap` 🟢
- [ ] `align-items: stretch` em `.home-hero .wrap` (linha 999) — aqui provavelmente QUER stretch pq o right .card-live deve preencher altura do left. Validar visualmente.
- [ ] `.card-live { min-height: 220px }` — OK, manter (é pequeno e tem `margin-top: auto` em `.ticker`)

### 2.9 Admin Panel 🟡
- [ ] Verificar se tem algum grid stretch problemático em admin
- [ ] Admin usa shadcn cards — provavelmente OK, mas validar

## FASE 3: Validação Final 🟢

- [ ] Browser MCP em cada página após fix — verificar alturas corretas
- [ ] Responsividade mobile preservada (já tem media 640px com `min-height: 0`)
- [ ] Commit local sem push

---

## Métricas
- Total de Tarefas: 9 correções + 7 validações + 1 commit = 17
- Concluídas: 0
- Em Progresso: 2
- Progresso: 12%
