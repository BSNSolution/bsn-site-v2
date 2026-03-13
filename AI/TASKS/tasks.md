# BSN Solution Site v2 - Tasks

## Status Geral: 🚧 EM DESENVOLVIMENTO

### ✅ Concluídas
- [x] Estrutura inicial do monorepo criada
- [x] Leitura das referências e padrões do ATM
- [x] Docker Compose configurado (PostgreSQL + Redis)
- [x] Configurações base (.gitignore, README.md, .env.example)
- [x] Schema Prisma completo com todas as entidades
- [x] Seed com dados iniciais da BSN Solution
- [x] Biblioteca de utilitários (prisma, redis, cache, r2, smtp)
- [x] Middleware de autenticação JWT
- [x] Servidor Fastify configurado
- [x] **TODAS AS ROTAS DO BACKEND**: auth, home, services, solutions, testimonials, contact, upload, site-settings, analytics, jobs, clients, inbox, blog, team
- [x] Backend Dockerfile
- [x] **SKILLS PREMIUM LIDAS**: awwwards-design, frontend-design-ultimate, superdesign, lb-motion, shadcn-ui

### 🔄 Em Andamento
- [x] **Estrutura Frontend PREMIUM**:
  - [x] Vite + React + TypeScript + Framer Motion + shadcn/ui
  - [x] Tema escuro BSN (#080808) com glassmorphism CSS variables
  - [x] Typography: Clash Display (headlines) + Inter (body)
  - [x] Tailwind config com animações custom e grain texture
  - [x] Hooks AWWWARDS: custom cursor, scroll animations, analytics
  - [x] API client completo com todas as rotas do backend
  - [x] App routing com page transitions e lazy loading
- [ ] **Páginas do site**: Home hero + seções + componentes
- [ ] **Admin panel**: Dashboard + CRUD interfaces
- [ ] Dockerfiles frontend e containerização final

### 🎯 Próximos Passos
1. Criar docker-compose.yml adaptado do ATM
2. Configurar backend com Prisma schema completo
3. Implementar todas as rotas da API
4. Seed inicial com dados da BSN Solution
5. Frontend com tema escuro glassmorphism
6. Admin panel completo
7. Verificações finais e commit

### 📋 Checklist Final
- [ ] `npm install` funciona em backend/ e frontend/
- [ ] `npx prisma validate` passa
- [ ] `npm run build` no frontend funciona
- [ ] Commit semântico feito
- [ ] NUNCA fazer git push

### 🎨 Design Guidelines
- **Background**: #080808 (quase preto)
- **Glassmorphism**: bg-white/5 backdrop-blur-xl border border-white/10
- **Font**: Inter ou Poppins
- **Inspiração**: ateliware.com/pt-br/servicos/
- **Credenciais admin**: admin@bsnsolution.com.br / bsn2024@admin

---
*Última atualização: 2026-03-13 05:09*