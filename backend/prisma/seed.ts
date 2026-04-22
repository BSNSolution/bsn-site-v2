import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (cuidado em produção!)
  const tablenames = await prisma.$queryRaw<Array<{tablename: string}>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  for (const {tablename} of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }

  // 1. Usuário admin
  const hashedPassword = await bcrypt.hash('bsn2024@admin', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bsnsolution.com.br',
      password: hashedPassword,
      name: 'Administrador BSN',
      role: 'ADMIN',
    },
  });

  // 2. Configurações do site
  await prisma.siteSettings.create({
    data: {
      siteName: 'BSN Solution',
      siteDescription: 'Soluções em tecnologia e desenvolvimento para o seu negócio',
      email: 'contato@bsnsolution.com.br',
      phone: '+55 (65) 99999-9999',
      address: 'Cuiabá, Mato Grosso, Brasil',
      linkedinUrl: 'https://linkedin.com/company/bsn-solution',
      instagramUrl: 'https://instagram.com/bsnsolution',
      metaTitle: 'BSN Solution - Desenvolvimento e Tecnologia',
      metaDescription: 'Especialistas em desenvolvimento web, mobile e soluções em tecnologia em Cuiabá-MT',
      metaKeywords: 'desenvolvimento web, aplicativo mobile, tecnologia, Cuiabá, BSN Solution',
    },
  });

  // 3. Seções da Home
  await prisma.homeSection.createMany({
    data: [
      {
        type: 'HERO',
        title: 'Transformamos suas ideias em soluções tecnológicas',
        subtitle: 'BSN Solution',
        content: 'Desenvolvimento web, mobile e consultoria em tecnologia para impulsionar o seu negócio.',
        ctaText: 'Conheça nossos serviços',
        ctaUrl: '/servicos',
        order: 1,
      },
      {
        type: 'ABOUT',
        title: 'Sobre a BSN Solution',
        content: 'Somos uma empresa de tecnologia localizada em Cuiabá-MT, especializada em desenvolvimento de software, consultoria e soluções digitais inovadoras.',
        order: 2,
      },
      {
        type: 'SERVICES_PREVIEW',
        title: 'Nossos Serviços',
        subtitle: 'Soluções completas em tecnologia',
        order: 3,
      },
      {
        type: 'SOLUTIONS_PREVIEW',
        title: 'Projetos Realizados',
        subtitle: 'Conheça alguns dos nossos trabalhos',
        order: 4,
      },
      {
        type: 'CALL_TO_ACTION',
        title: 'Pronto para começar seu projeto?',
        content: 'Entre em contato conosco e vamos transformar sua ideia em realidade.',
        ctaText: 'Entrar em contato',
        ctaUrl: '/contato',
        order: 5,
      },
    ],
  });

  // 4. Serviços — conteúdo do novo design (7 frentes)
  await prisma.service.createMany({
    data: [
      {
        title: 'Desenvolvimento de software sob medida',
        subtitle: 'Sistemas que refletem sua operação',
        description:
          'Sistemas construídos para a realidade da sua operação — de portais complexos a módulos de integração e dashboards executivos.',
        iconName: 'code',
        order: 1,
      },
      {
        title: 'Squads ágeis multidisciplinares',
        subtitle: 'Plug & play',
        description: 'Times plug-and-play que integram ao seu fluxo em até 5 dias úteis.',
        iconName: 'squad',
        order: 2,
      },
      {
        title: 'Automação de processos',
        subtitle: 'Horas de volta ao time',
        description: 'Integramos sistemas e orquestramos fluxos que devolvem horas à equipe.',
        iconName: 'auto',
        order: 3,
      },
      {
        title: 'Consultoria em tecnologia',
        subtitle: 'Diagnóstico & roadmap',
        description: 'Diagnóstico que alinha processos, infraestrutura e inovação.',
        iconName: 'box',
        order: 4,
      },
      {
        title: 'Infraestrutura & VPS gerenciada',
        subtitle: 'Observabilidade e backup',
        description: 'Servidores dimensionados para sua carga, com backups e monitoramento.',
        iconName: 'server',
        order: 5,
      },
      {
        title: 'Suporte técnico e evolução contínua',
        subtitle: 'SLA 24/7',
        description:
          'Planos que acompanham o crescimento — adicione funcionalidades a qualquer momento.',
        iconName: 'support',
        order: 6,
      },
      {
        title: 'Outsourcing de TI e alocação estratégica',
        subtitle: 'Dev · DevOps · QA · Data · Produto',
        description:
          'Mantenha o foco no core do seu negócio. Nossos especialistas assumem demandas específicas com previsibilidade de custo e prazo.',
        iconName: 'build',
        order: 7,
      },
    ],
  });

  // 5. Soluções verticais — 6 plataformas do novo design
  await prisma.solution.createMany({
    data: [
      {
        title: 'Portal do Cooperado & Assembleia Digital',
        subtitle: 'COOPERATIVISMO',
        description:
          'Governança participativa com votação auditada, engajamento de membros e transparência total.',
        technologies: ['Votação remota', 'Feed segmentado', 'Integração ERP'],
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Força de Vendas Externa',
        subtitle: 'CONSÓRCIOS',
        description:
          'App offline-first para equipes de rua com pipeline, comissionamento e integração ao back-office.',
        technologies: ['Offline-first', 'Gamificação', 'Dashboards em tempo real'],
        isFeatured: true,
        order: 2,
      },
      {
        title: 'Motor de Integração entre ERPs',
        subtitle: 'ADMINISTRADORAS',
        description:
          'Sincronização de dados em tempo real entre sistemas legados e modernos.',
        technologies: ['Conectores 20+', 'Fila resiliente', 'Observabilidade'],
        order: 3,
      },
      {
        title: 'Cantina Digital & Frente de Caixa',
        subtitle: 'VAREJO & PDV',
        description: 'PDV moderno com pagamento integrado, cashback e gestão multi-loja.',
        technologies: ['QR/Pix/Cartão', 'Fidelidade embutida', 'Relatórios em tempo real'],
        order: 4,
      },
      {
        title: 'Sistema de Frota & Multas',
        subtitle: 'FROTA & LOGÍSTICA',
        description:
          'Gestão de veículos, motoristas e autuações com prazos e recursos automatizados.',
        technologies: ['Alertas', 'OCR', 'Indicação de condutor'],
        order: 5,
      },
      {
        title: 'Assistente Jurídico via WhatsApp',
        subtitle: 'JURÍDICO & IA',
        description:
          'Atendimento 24/7 com triagem de casos, captação de clientes e integração a sistemas jurídicos.',
        technologies: ['Multi-tenant', 'Treinado no seu repositório', 'Handoff humano'],
        order: 6,
      },
    ],
  });

  // 6. Depoimentos
  await prisma.testimonial.createMany({
    data: [
      {
        clientName: 'Carolina Menezes',
        clientRole: 'Diretora de Operações',
        company: 'FinCo',
        content: 'Ritmo de entrega 3× superior ao esperado. Sentimos um parceiro de verdade, não um fornecedor.',
        rating: 5,
        order: 1,
      },
      {
        clientName: 'Ricardo Alves',
        clientRole: 'CTO',
        company: 'Admin Coop',
        content:
          'A BSN entregou a integração entre nossos ERPs em um trimestre — o que estimávamos em um ano. Transparência total no processo.',
        rating: 5,
        order: 2,
      },
      {
        clientName: 'Juliana Prado',
        clientRole: 'CEO',
        company: 'Varejo+',
        content:
          'O PDV customizado triplicou nossas vendas online e reduziu fila em 40%. Suporte impecável desde o go-live.',
        rating: 5,
        order: 3,
      },
    ],
  });

  // 7. Equipe — 3 lideranças do novo design
  await prisma.teamMember.createMany({
    data: [
      {
        name: 'Cristhyan Koch',
        role: 'CTO & Co-founder',
        bio: '15+ anos em sistemas distribuídos e produtos de missão crítica.',
        order: 1,
      },
      {
        name: 'Bruno Santos',
        role: 'Head de Engenharia',
        bio: 'Especialista em arquitetura escalável e times de alto desempenho.',
        order: 2,
      },
      {
        name: 'Natalia Reis',
        role: 'Head de Produto',
        bio: 'Traduz necessidades complexas em roadmaps executáveis.',
        order: 3,
      },
    ],
  });

  // 8. Clientes
  await prisma.client.createMany({
    data: [
      {
        name: 'Tech Corp',
        logoUrl: '/images/clients/tech-corp.png',
        order: 1,
      },
      {
        name: 'Digital Agency',
        logoUrl: '/images/clients/digital-agency.png',
        order: 2,
      },
      {
        name: 'Startup Innovation',
        logoUrl: '/images/clients/startup-innovation.png',
        order: 3,
      },
      {
        name: 'E-commerce Plus',
        logoUrl: '/images/clients/ecommerce-plus.png',
        order: 4,
      },
    ],
  });

  // 9. Vagas — 5 posições do novo design
  await prisma.job.createMany({
    data: [
      {
        title: 'Engenheiro(a) de Software Sênior',
        description: 'Construir sistemas críticos em TypeScript, Node e React para clientes enterprise.',
        requirements: 'TypeScript · Node · React',
        benefits: 'Remoto-first, stock options, R$ 5.000/ano em aprendizado.',
        location: 'REMOTO',
        type: 'FULL_TIME',
      },
      {
        title: 'SRE / DevOps Pleno',
        description: 'Operar e evoluir infraestrutura de alta disponibilidade em AWS + Kubernetes.',
        requirements: 'AWS · K8s · Terraform',
        benefits: 'Remoto-first, MacBook Pro, cadeira ergonômica.',
        location: 'REMOTO',
        type: 'FULL_TIME',
      },
      {
        title: 'Product Designer Sênior',
        description: 'Conduzir pesquisa, design e sistemas para produtos B2B complexos.',
        requirements: 'Figma · Pesquisa · Sistemas',
        benefits: 'Remoto-first, aprendizado contínuo, autonomia real.',
        location: 'REMOTO',
        type: 'FULL_TIME',
      },
      {
        title: 'QA Automation Pleno',
        description: 'Automatizar testes end-to-end e garantir confiabilidade dos nossos produtos.',
        requirements: 'Playwright · Cypress',
        benefits: 'Remoto-first, roadmap compartilhado.',
        location: 'REMOTO',
        type: 'FULL_TIME',
      },
      {
        title: 'Product Manager',
        description: 'Tocar produtos B2B em fintech e cooperativismo ao lado de squads sêniores.',
        requirements: 'B2B · Fintech · Coop',
        benefits: 'Stock options, plano de carreira, parceria de longo prazo.',
        location: 'SP · HÍBRIDO',
        type: 'FULL_TIME',
      },
    ],
  });

  // 10. Posts do blog — alinhados ao novo design
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Por que projetos sob medida superam SaaS genérico em operações complexas',
        slug: 'sob-medida-vs-saas-generico',
        excerpt:
          'Um estudo com 14 administradoras mostrou que o ROI de soluções customizadas supera o de SaaS em até 3× ao longo de 24 meses — e explicamos por quê.',
        content:
          'Operações complexas acumulam exceções que SaaS genérico não cobre. Este long read apresenta a metodologia que usamos para avaliar quando sob medida vence.',
        tags: ['Estratégia', 'Long read'],
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date('2026-04-21T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Quando microserviços param de fazer sentido',
        slug: 'microservicos-deixam-de-fazer-sentido',
        excerpt: 'A hora certa de consolidar serviços sem perder governança.',
        content: 'Nem todo sistema precisa ser distribuído. Apresentamos critérios objetivos.',
        tags: ['Arquitetura'],
        isPublished: true,
        publishedAt: new Date('2026-04-18T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Do briefing ao MVP em 6 semanas: roteiro',
        slug: 'briefing-mvp-6-semanas',
        excerpt: 'O passo-a-passo que usamos para validar produtos em ciclo curto.',
        content: 'Roteiro detalhado por semanas.',
        tags: ['Produto'],
        isPublished: true,
        publishedAt: new Date('2026-04-11T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Observabilidade pragmática em times pequenos',
        slug: 'observabilidade-pragmatica',
        excerpt: 'O mínimo que todo time deveria ter, sem custo proibitivo.',
        content: 'Logs, métricas e traces sem explodir a conta da cloud.',
        tags: ['Infra'],
        isPublished: true,
        publishedAt: new Date('2026-04-04T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Como dizer "não" a features sem perder o cliente',
        slug: 'nao-a-features-sem-perder-cliente',
        excerpt: 'Técnicas para negociar escopo e preservar o roadmap.',
        content: 'A arte de dizer não construtivamente.',
        tags: ['Liderança'],
        isPublished: true,
        publishedAt: new Date('2026-03-28T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Agentes úteis vs. agentes teatrais',
        slug: 'agentes-uteis-vs-teatrais',
        excerpt: 'Quando um agente de IA agrega valor real vs. apenas demonstra tecnologia.',
        content: 'Critérios para avaliar agentes.',
        tags: ['IA aplicada'],
        isPublished: true,
        publishedAt: new Date('2026-03-21T09:00:00.000Z'),
        authorId: adminUser.id,
      },
      {
        title: 'Assembleia digital auditada em cooperativa com 40k membros',
        slug: 'assembleia-digital-coop-40k',
        excerpt: 'Case detalhado da plataforma que entregamos.',
        content: 'Escala, auditoria e participação em uma assembleia digital.',
        tags: ['Case'],
        isPublished: true,
        publishedAt: new Date('2026-03-14T09:00:00.000Z'),
        authorId: adminUser.id,
      },
    ],
  });

  // 12. Valores / Princípios
  await prisma.value.createMany({
    data: [
      { number: '01', title: 'Clareza radical', description: 'Se não dá para explicar em uma frase, precisa ser simplificado.', order: 1 },
      { number: '02', title: 'Menos é mais', description: 'Mil "nãos" para cada "sim". Evitamos feature slop a todo custo.', order: 2 },
      { number: '03', title: 'Propriedade', description: 'Cada engenheiro trata o sistema como se fosse seu.', order: 3 },
      { number: '04', title: 'Evolução contínua', description: 'Entregar rápido é bom; manter entregando por anos é melhor.', order: 4 },
    ],
  });

  // 13. KPIs da Home
  await prisma.homeKPI.createMany({
    data: [
      { label: 'EXPERIÊNCIA', value: '12', suffix: '+', caption: 'anos entregando software de missão crítica', order: 1 },
      { label: 'PORTFÓLIO', value: '80', suffix: '+', caption: 'projetos entregues em 14 setores', order: 2 },
      { label: 'VELOCIDADE', value: '5', suffix: 'dias', caption: 'para integrar um squad ao seu time', order: 3 },
      { label: 'COBERTURA', value: '24', suffix: '/7', caption: 'suporte, monitoramento e evolução contínua', order: 4 },
    ],
  });

  // 14. Benefícios de carreira
  await prisma.perk.createMany({
    data: [
      { title: 'Remoto-first', description: 'Trabalhe de onde for mais produtivo. Encontros presenciais trimestrais opcionais.', order: 1 },
      { title: 'Aprendizado contínuo', description: 'R$ 5.000/ano para cursos, livros, conferências. Sem burocracia.', order: 2 },
      { title: 'Equipamento top', description: 'MacBook Pro, monitor, cadeira ergonômica. Tudo que precisa.', order: 3 },
      { title: 'Participação real', description: 'Plano de stock options para sêniores e lideranças após o ciclo.', order: 4 },
    ],
  });

  // 11. Menu do footer
  await prisma.footerMenu.createMany({
    data: [
      { title: 'Home', url: '/', order: 1 },
      { title: 'Serviços', url: '/servicos', order: 2 },
      { title: 'Soluções', url: '/solucoes', order: 3 },
      { title: 'Sobre', url: '/sobre', order: 4 },
      { title: 'Blog', url: '/blog', order: 5 },
      { title: 'Contato', url: '/contato', order: 6 },
      { title: 'Carreiras', url: '/carreiras', order: 7 },
      { title: 'Política de Privacidade', url: '/privacidade', order: 8 },
      { title: 'Termos de Uso', url: '/termos', order: 9 },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('👤 Admin criado:', {
    email: 'admin@bsnsolution.com.br',
    password: 'bsn2024@admin'
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });