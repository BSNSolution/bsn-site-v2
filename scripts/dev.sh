#!/bin/bash

# BSN Solution Site v2 - Development Script
# Este script facilita o desenvolvimento local

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_deps() {
    print_info "Verificando dependências..."
    
    if ! command_exists node; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm não está disponível"
        exit 1
    fi
    
    if ! command_exists docker; then
        print_warning "Docker não está instalado - algumas funcionalidades podem não funcionar"
    fi
    
    print_success "Dependências verificadas"
}

# Setup environment
setup_env() {
    print_info "Configurando ambiente..."
    
    # Backend env
    if [ ! -f backend/.env ]; then
        cp backend/src/.env.example backend/.env
        print_success "Arquivo backend/.env criado"
    fi
    
    # Frontend env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001/api
EOF
        print_success "Arquivo frontend/.env criado"
    fi
    
    # Root env
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Arquivo .env criado"
    fi
}

# Install dependencies
install_deps() {
    print_info "Instalando dependências..."
    
    # Backend
    print_info "Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
    print_success "Backend dependencies instaladas"
    
    # Frontend
    print_info "Instalando dependências do frontend..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies instaladas"
}

# Start database
start_db() {
    print_info "Iniciando banco de dados..."
    
    if command_exists docker; then
        docker-compose up -d postgres redis
        print_success "PostgreSQL e Redis iniciados"
    else
        print_error "Docker não está disponível - inicie o banco manualmente"
        exit 1
    fi
}

# Setup database
setup_db() {
    print_info "Configurando banco de dados..."
    
    cd backend
    
    # Wait for database
    print_info "Aguardando banco de dados..."
    sleep 5
    
    # Push schema
    print_info "Aplicando schema..."
    npm run db:push
    
    # Seed data
    print_info "Inserindo dados iniciais..."
    npm run prisma:seed
    
    cd ..
    print_success "Banco configurado com dados iniciais"
}

# Start development servers
start_dev() {
    print_info "Iniciando servidores de desenvolvimento..."
    
    # Start backend in background
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend in background  
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Servidores iniciados!"
    print_info "Backend: http://localhost:3001"
    print_info "Frontend: http://localhost:3000"
    print_info "Admin: http://localhost:3000/admin"
    print_info ""
    print_info "Credenciais admin:"
    print_info "Email: admin@bsnsolution.com.br"
    print_info "Senha: bsn2024@admin"
    print_info ""
    print_warning "Pressione Ctrl+C para parar os servidores"
    
    # Trap to kill background processes
    trap "print_info 'Parando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    
    # Wait for processes
    wait
}

# Main menu
show_menu() {
    echo ""
    echo "🚀 BSN Solution Site v2 - Script de Desenvolvimento"
    echo ""
    echo "Opções:"
    echo "1) setup     - Configuração inicial completa"
    echo "2) deps      - Instalar apenas dependências"
    echo "3) db        - Iniciar e configurar banco"
    echo "4) dev       - Iniciar servidores de desenvolvimento"
    echo "5) build     - Build de produção"
    echo "6) docker    - Iniciar com Docker"
    echo "7) clean     - Limpar node_modules e builds"
    echo "8) help      - Ajuda"
    echo ""
}

# Command handlers
case "$1" in
    "setup")
        check_deps
        setup_env
        install_deps
        start_db
        setup_db
        print_success "Setup completo! Execute './scripts/dev.sh dev' para iniciar"
        ;;
    "deps")
        check_deps
        install_deps
        ;;
    "db")
        start_db
        setup_db
        ;;
    "dev")
        check_deps
        start_dev
        ;;
    "build")
        print_info "Building para produção..."
        cd backend && npm run build && cd ..
        cd frontend && npm run build && cd ..
        print_success "Build concluído!"
        ;;
    "docker")
        print_info "Iniciando com Docker..."
        docker-compose up --build
        ;;
    "clean")
        print_info "Limpando arquivos temporários..."
        rm -rf backend/node_modules backend/dist
        rm -rf frontend/node_modules frontend/dist
        docker-compose down -v 2>/dev/null || true
        print_success "Limpeza concluída!"
        ;;
    "help"|"")
        show_menu
        echo "Uso: ./scripts/dev.sh [comando]"
        echo ""
        echo "Para desenvolvimento:"
        echo "1. ./scripts/dev.sh setup    (primeira vez)"
        echo "2. ./scripts/dev.sh dev      (iniciar desenvolvimento)"
        echo ""
        ;;
    *)
        print_error "Comando desconhecido: $1"
        show_menu
        exit 1
        ;;
esac