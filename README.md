# BSN Solution Site v2 🚀

Site institucional da BSN Solution com design AWWWARDS-level - Monorepo com frontend premium e backend API completo.

## ✨ Stack Premium

### 🎨 Frontend (AWWWARDS-Level)
- **React 18** + **Vite** + **TypeScript**
- **Framer Motion** (animações cinematográficas)
- **Tailwind CSS** + **shadcn/ui** (design system)
- **TanStack Query** (state management)
- **Tema escuro** (#080808) com **glassmorphism pesado**
- **Typography**: Clash Display + Inter (anti-AI-slop)

### ⚡ Backend (Enterprise-Grade)
- **Node.js** + **TypeScript** + **Fastify**
- **Prisma ORM** + **PostgreSQL** + **Redis**
- **JWT Authentication** + **Zod validation**
- **Cloudflare R2** (uploads) + **SMTP** (emails)
- **Cache layers** + **Analytics tracking**

## 🎯 Características AWWWARDS

### ✨ Experiência Visual
- **Scroll-triggered animations** com stagger timing
- **Glassmorphism cards**: `bg-white/5 backdrop-blur-xl border border-white/10`
- **Custom cursor** com magnetic effects
- **Parallax layers** e floating elements
- **Text reveal** character-by-character
- **Counter animations** para estatísticas
- **Grain texture overlay** + ambient gradients

### 🎭 Micro-Interactions
- **Magnetic buttons** que "puxam" o cursor
- **Hover glow effects** em todos elementos
- **Page transitions** com AnimatePresence
- **Loading states** com múltiplos variants
- **Smooth scroll** + scroll progress indicator

### 📱 Performance
- **Lazy loading** + **code splitting**
- **Error boundaries** dev/prod
- **Service worker** ready
- **Core Web Vitals** otimizado
- **Reduced motion** support

## 🚀 Quick Start

### Método 1: Script Automatizado (Recomendado)
```bash
git clone https://github.com/BSNSolution/bsn-site-v2.git
cd bsn-site-v2

# Setup completo (primeira vez)
./scripts/dev.sh setup

# Iniciar desenvolvimento
./scripts/dev.sh dev
```

### Método 2: Manual
```bash
# Pré-requisitos
# Node.js 18+, Docker & Docker Compose

# 1. Dependências
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Ambiente
cp backend/src/.env.example backend/.env
echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env
cp .env.example .env

# 3. Banco de dados
docker-compose up -d postgres redis
cd backend
npm run db:push && npm run prisma:seed
cd ..

# 4. Desenvolvimento
cd backend && npm run dev &    # Porta 3001
cd frontend && npm run dev     # Porta 3000
```

## 🌍 Acessos

- **Site**: http://localhost:3000
- **API**: http://localhost:3001  
- **Admin**: http://localhost:3000/admin
- **Prisma Studio**: `npm run prisma:studio` (backend/)

### 🔐 Credenciais Admin
- **Email**: `admin@bsnsolution.com.br`
- **Senha**: `bsn2024@admin`

## 📦 Produção com Docker

```bash
# Desenvolvimento
docker-compose up -d postgres redis

# Produção completa
docker-compose up --build
```

## 📁 Arquitetura

```
bsn-site-v2/
├── 🎨 frontend/              # Site React AWWWARDS-level
│   ├── src/
│   │   ├── components/       # UI components + sections
│   │   ├── hooks/           # AWWWARDS hooks (cursor, scroll, analytics)
│   │   ├── pages/           # Todas as páginas + admin stubs
│   │   └── lib/             # Utils + API client completo
│   ├── Dockerfile           # Nginx multi-stage
│   └── nginx.conf           # Config otimizado
├── ⚡ backend/               # API Fastify completa
│   ├── src/
│   │   ├── routes/          # 14 rotas completas
│   │   ├── lib/             # Prisma, Redis, R2, SMTP, Cache
│   │   └── middleware/      # Auth JWT
│   ├── prisma/              # Schema + seed BSN Solution
│   └── Dockerfile           # Node.js otimizado
├── 📊 AI/                   # Documentação + tasks
├── 🐳 docker-compose.yml    # PostgreSQL + Redis + App
└── 🛠️ scripts/dev.sh       # Script de desenvolvimento
```

## 🎨 Design System

### 🌙 Tema Escuro BSN
```css
/* Cores principais */
--background: #080808      /* Quase preto */
--primary: #3b82f6        /* Azul BSN */
--accent: #8b5cf6         /* Roxo accent */

/* Glassmorphism */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 🔤 Typography
- **Headlines**: Clash Display (distintivo, anti-AI-slop)
- **Body**: Inter (legibilidade)
- **Sizes**: Jumps de 3x+ (não incrementos tímidos)

## 🛠️ Comandos de Desenvolvimento

### Frontend
```bash
cd frontend
npm run dev      # Vite dev server
npm run build    # Build produção
npm run preview  # Preview build
```

### Backend  
```bash
cd backend
npm run dev              # Fastify dev
npm run build            # Build produção
npm run prisma:studio    # Database UI
npm run db:reset         # Reset + seed
```

### Docker
```bash
./scripts/dev.sh docker  # Full stack
./scripts/dev.sh clean   # Limpar tudo
```

## 📊 API Endpoints

### 🔐 Públicos
- `GET /api/home` - Seções da home
- `GET /api/services` - Serviços  
- `GET /api/solutions` - Portfólio
- `GET /api/testimonials` - Depoimentos
- `GET /api/blog` - Posts do blog
- `GET /api/team` - Equipe
- `POST /api/contact` - Enviar mensagem
- `POST /api/jobs/:id/apply` - Candidatura

### 🔒 Admin (JWT required)
- `POST /api/auth/login` - Login admin
- `GET /api/admin/*` - CRUD completo de todo conteúdo
- `POST /api/admin/upload` - Upload R2
- `GET /api/admin/inbox` - Inbox de mensagens  
- `GET /api/admin/analytics` - Métricas

## 🎯 Features Implementadas

### ✅ Site Público
- [x] **Homepage AWWWARDS**: Hero + About + Services + Solutions + Testimonials + CTA
- [x] **Header glassmorphism**: Sticky, hide-on-scroll, magnetic CTAs
- [x] **Footer premium**: Newsletter, social links, gradientes
- [x] **Páginas**: Services, Solutions, About, Blog, Contact, Careers, Privacy, Terms
- [x] **404 premium**: Design consistente com o tema

### ✅ Funcionalidades Premium  
- [x] **Custom cursor**: Magnetic, context-aware
- [x] **Scroll animations**: Reveal, stagger, parallax, counter
- [x] **Analytics tracking**: Scroll depth, time spent, interactions
- [x] **Performance**: Lazy loading, error boundaries, service worker
- [x] **Glassmorphism**: Cards, modals, headers com backdrop-blur

### ⏳ Em Desenvolvimento
- [ ] **Admin panel completo**: Dashboard + CRUD real
- [ ] **Blog funcional**: CMS completo  
- [ ] **Portfolio**: Showcase de projetos
- [ ] **Contact form**: Integração com API

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Verificar banco
docker-compose logs postgres

# Reset banco
cd backend && npm run db:reset
```

### Frontend build falha
```bash
# Limpar cache
cd frontend && rm -rf node_modules dist && npm install
```

### Docker issues
```bash
./scripts/dev.sh clean
docker-compose down -v
./scripts/dev.sh setup
```

## 🤝 Contribuindo

1. Fork do repositório
2. Branch feature: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m "feat: nova feature incrível"`  
4. Push: `git push origin feature/nova-feature`
5. Pull Request

## 📄 Licença

© 2024 BSN Solution. Todos os direitos reservados.

---

**Desenvolvido com 💙 em Cuiabá-MT usando tecnologias premium e design AWWWARDS-level.**