# BSN Solution Site v2

Site institucional da BSN Solution - Monorepo com frontend (site público + admin) e backend API.

## Stack

### Backend
- Node.js + TypeScript
- Fastify (API framework)
- Prisma ORM + PostgreSQL
- JWT Authentication
- Cloudflare R2 (uploads)
- Redis (cache)
- Zod (validação)

### Frontend
- React + Vite + TypeScript
- Tailwind CSS + Shadcn/ui
- TanStack Query
- Tema escuro com glassmorphism

## Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- Git

### Setup
```bash
# Clone o repositório
git clone <repo-url>
cd bsn-site-v2

# Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# Configurar variáveis de ambiente
cp backend/src/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Subir banco de dados
docker-compose up -d postgres redis

# Backend
cd backend
npm run db:push      # Aplicar schema
npm run prisma:seed  # Dados iniciais
npm run dev          # Iniciar dev server (porta 3001)

# Frontend (nova aba)
cd frontend
npm run dev          # Iniciar dev server (porta 5173)
```

### Produção com Docker
```bash
# Descomentar serviços no docker-compose.yml
docker-compose up -d
```

## Credenciais Admin
- **Email**: admin@bsnsolution.com.br
- **Senha**: bsn2024@admin

## Estrutura
```
bsn-site-v2/
├── backend/           # API Fastify
├── frontend/          # Site React
├── AI/TASKS/          # Documentação de desenvolvimento
└── docker-compose.yml # Banco e serviços
```

## Comandos Úteis

### Backend
```bash
cd backend
npm run dev              # Desenvolvimento
npm run build            # Build para produção
npm run start            # Produção
npm run prisma:studio    # Interface do banco
npm run prisma:migrate   # Nova migration
npm run db:reset         # Reset completo do banco
```

### Frontend
```bash
cd frontend
npm run dev     # Desenvolvimento
npm run build   # Build para produção
npm run preview # Preview da build
```

## Design
- **Tema**: Escuro (#080808)
- **Estilo**: Glassmorphism com gradientes sutis
- **Inspiração**: ateliware.com/pt-br/servicos/
- **Fonte**: Inter/Poppins

## Páginas
### Site Público
- Home, Serviços, Soluções, Sobre, Blog, Contato, Carreiras
- Política de Privacidade, Termos de Uso

### Admin
- Dashboard, CRUD completo, Inbox, Upload, Settings

---

© 2024 BSN Solution - Desenvolvido com ❤️ em Cuiabá-MT