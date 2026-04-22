import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed 100% alinhada ao layout oficial do site (new-layout/).
 * Todo texto, número, tag, lista etc. vem do HTML do design.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados (conteúdo do new-layout)...');

  // Limpeza completa
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }

  // 0. Permissões do sistema
  const permissionDefs = [
    // Dashboard / sistema
    { category: 'Sistema', slug: 'dashboard.view', label: 'Ver dashboard' },
    { category: 'Sistema', slug: 'settings.read', label: 'Ver configurações' },
    { category: 'Sistema', slug: 'settings.write', label: 'Editar configurações' },
    { category: 'Sistema', slug: 'uploads.read', label: 'Ver uploads' },
    { category: 'Sistema', slug: 'uploads.write', label: 'Enviar e remover uploads' },
    { category: 'Sistema', slug: 'analytics.view', label: 'Ver analytics' },
    // Usuários & permissões
    { category: 'Usuários', slug: 'users.read', label: 'Listar usuários' },
    { category: 'Usuários', slug: 'users.write', label: 'Criar/editar usuários' },
    { category: 'Usuários', slug: 'users.delete', label: 'Excluir usuários' },
    { category: 'Usuários', slug: 'groups.read', label: 'Listar grupos de permissões' },
    { category: 'Usuários', slug: 'groups.write', label: 'Criar/editar grupos' },
    { category: 'Usuários', slug: 'groups.delete', label: 'Excluir grupos' },
    // Conteúdo — Home
    { category: 'Home', slug: 'home.read', label: 'Ver seções da home' },
    { category: 'Home', slug: 'home.write', label: 'Editar seções da home' },
    { category: 'Home', slug: 'home.kpis.write', label: 'Editar KPIs, live card, pill, band e stack' },
    // Conteúdo — Serviços
    { category: 'Serviços', slug: 'services.read', label: 'Ver serviços' },
    { category: 'Serviços', slug: 'services.write', label: 'Criar/editar serviços' },
    // Conteúdo — Soluções
    { category: 'Soluções', slug: 'solutions.read', label: 'Ver soluções' },
    { category: 'Soluções', slug: 'solutions.write', label: 'Criar/editar soluções' },
    // Conteúdo — Sobre
    { category: 'Sobre', slug: 'about.read', label: 'Ver página Sobre' },
    { category: 'Sobre', slug: 'about.write', label: 'Editar cards, valores e equipe' },
    // Blog
    { category: 'Blog', slug: 'blog.read', label: 'Ver posts' },
    { category: 'Blog', slug: 'blog.write', label: 'Criar/editar posts' },
    { category: 'Blog', slug: 'blog.publish', label: 'Publicar / destacar posts' },
    { category: 'Blog', slug: 'blog.delete', label: 'Excluir posts' },
    // Carreiras
    { category: 'Carreiras', slug: 'jobs.read', label: 'Ver vagas' },
    { category: 'Carreiras', slug: 'jobs.write', label: 'Criar/editar vagas' },
    { category: 'Carreiras', slug: 'perks.write', label: 'Editar benefícios' },
    // Testemunhos & clientes
    { category: 'Social proof', slug: 'testimonials.write', label: 'Editar depoimentos' },
    { category: 'Social proof', slug: 'clients.write', label: 'Editar clientes' },
    // Inbox
    { category: 'Inbox', slug: 'inbox.read', label: 'Ver mensagens de contato' },
    { category: 'Inbox', slug: 'inbox.reply', label: 'Responder mensagens' },
    { category: 'Inbox', slug: 'inbox.delete', label: 'Excluir mensagens' },
  ];

  await prisma.permission.createMany({
    data: permissionDefs.map((p) => ({ ...p, description: null })),
  });

  const allPermissions = await prisma.permission.findMany();
  const permBySlug = new Map(allPermissions.map((p) => [p.slug, p]));
  const pick = (slugs: string[]) => slugs.map((s) => ({ id: permBySlug.get(s)!.id })).filter((x) => x.id);

  // Grupos de permissões default
  const adminGroup = await prisma.permissionGroup.create({
    data: {
      name: 'Administrador',
      description: 'Acesso total ao painel e todos os recursos.',
      isSystem: true,
      permissions: { connect: allPermissions.map((p) => ({ id: p.id })) },
    },
  });

  const developerPerms = allPermissions
    .filter((p) => !['users.delete', 'groups.delete'].includes(p.slug))
    .map((p) => ({ id: p.id }));
  const developerGroup = await prisma.permissionGroup.create({
    data: {
      name: 'Desenvolvedor',
      description: 'Pode editar todo o conteúdo e configurações, exceto excluir usuários/grupos.',
      isSystem: true,
      permissions: { connect: developerPerms },
    },
  });

  const editorGroup = await prisma.permissionGroup.create({
    data: {
      name: 'Editor',
      description: 'Gerencia conteúdo público sem acessar configurações, uploads globais ou usuários.',
      isSystem: true,
      permissions: {
        connect: pick([
          'dashboard.view',
          'home.read', 'home.write', 'home.kpis.write',
          'services.read', 'services.write',
          'solutions.read', 'solutions.write',
          'about.read', 'about.write',
          'blog.read', 'blog.write', 'blog.publish',
          'jobs.read', 'jobs.write', 'perks.write',
          'testimonials.write', 'clients.write',
          'inbox.read', 'inbox.reply',
          'uploads.read', 'uploads.write',
        ]),
      },
    },
  });

  const guestGroup = await prisma.permissionGroup.create({
    data: {
      name: 'Convidado',
      description: 'Apenas leitura — útil para visitas ou revisores externos.',
      isSystem: true,
      permissions: {
        connect: pick([
          'dashboard.view',
          'home.read',
          'services.read', 'solutions.read',
          'about.read', 'blog.read', 'jobs.read',
          'uploads.read', 'settings.read',
          'inbox.read',
        ]),
      },
    },
  });

  // 1. Usuário admin inicial
  const hashedPassword = await bcrypt.hash('bsn2024@admin', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bsnsolution.com.br',
      password: hashedPassword,
      name: 'Administrador BSN',
      role: 'ADMIN',
      groups: { connect: { id: adminGroup.id } },
    },
  });

  // Guarda referências pra não dar unused
  void developerGroup; void editorGroup; void guestGroup;

  // 2. SiteSettings (new-layout footer + contato)
  await prisma.siteSettings.create({
    data: {
      siteName: 'BSN Solution',
      siteDescription:
        'Transformamos ideias em soluções tecnológicas inovadoras. Especialistas em desenvolvimento sob medida, squads ágeis e consultoria estratégica em TI.',
      email: 'contato@bsnsolution.com.br',
      phone: '+55 11 99000-0000',
      address: 'São Paulo · SP · Brasil',
      linkedinUrl: 'https://linkedin.com/company/bsnsolution',
      instagramUrl: 'https://instagram.com/bsnsolution',
      metaTitle: 'BSN Solution — Tecnologia que transforma negócios',
      metaDescription:
        'Engenharia de software que transforma operações em vantagem competitiva. Desenvolvemos software sob medida, automatizamos processos e construímos squads ágeis.',
      metaKeywords: 'desenvolvimento sob medida, squads ágeis, automação, consultoria de TI, BSN Solution',
    },
  });

  // 3. Seções da Home (usadas para hero copy dinâmico)
  await prisma.homeSection.createMany({
    data: [
      {
        type: 'HERO',
        title: 'Engenharia de software que <em>transforma</em> operações em vantagem competitiva.',
        subtitle: 'Abr 2026 · aceitando novos projetos para Q3',
        content:
          'A BSN Solution é a parceira estratégica de empresas que não aceitam soluções engessadas. Desenvolvemos software sob medida, automatizamos processos e construímos squads ágeis para acelerar sua transformação digital.',
        ctaText: 'Agendar diagnóstico',
        ctaUrl: '/contato',
        order: 1,
      },
      {
        type: 'SERVICES_PREVIEW',
        title: 'Um mosaico de capacidades técnicas, uma única entrega de valor.',
        subtitle:
          'Cada vidraça do nosso vitral é uma competência afiada — montadas juntas, viram soluções sob medida para o seu problema de negócio.',
        order: 2,
      },
    ],
  });

  // 4. Serviços — 7 frentes exatas do new-layout (servicos.html)
  await prisma.service.createMany({
    data: [
      {
        title: 'Desenvolvimento de software sob medida',
        subtitle: 'sob medida',
        description:
          'Sistemas construídos para a realidade da sua operação — portais de autoatendimento, módulos de integração complexos, dashboards executivos e qualquer ferramenta que resolva um problema específico do seu negócio.',
        iconName: 'code',
        anchor: 'sob-medida',
        numLabel: 'SVC · 01',
        shardColor: 'v',
        ctaLabel: 'Falar sobre um projeto ↗',
        features: [
          { title: 'Arquitetura escalável', description: 'Pronta para crescer sem retrabalho' },
          { title: 'ROI mensurável', description: 'Foco em valor real, não em feature slop' },
          { title: 'Integrações nativas', description: 'ERPs, CRMs, APIs públicas e legadas' },
          { title: 'Código proprietário', description: 'Propriedade 100% sua, sem lock-in' },
        ],
        tileClass: 't1',
        homePill: 'Ver detalhes →',
        homePillTags: [],
        order: 1,
      },
      {
        title: 'Squads ágeis multidisciplinares',
        subtitle: 'multidisciplinares',
        description:
          'Times plug-and-play com devs, QAs, POs, designers e DevOps — montados no tamanho certo para o seu desafio e integrados em até 5 dias úteis.',
        iconName: 'squad',
        anchor: 'squads',
        numLabel: 'SVC · 02',
        shardColor: 'c',
        ctaLabel: 'Montar meu squad ↗',
        features: [
          { title: 'Integração em 5 dias', description: 'Do handshake ao primeiro PR' },
          { title: 'Cerimônias ágeis', description: 'Daily, planning, review, retro' },
          { title: 'Escala elástica', description: 'Aumente ou reduza sem burocracia' },
          { title: 'Métricas claras', description: 'Velocity, CSAT, lead time' },
        ],
        tileClass: 't2',
        homePill: 'Plug & play',
        homePillTags: [],
        order: 2,
      },
      {
        title: 'Automação de processos',
        subtitle: 'de processos',
        description:
          'Mapeamos fluxos manuais, orquestramos integrações e entregamos horas de volta à sua equipe. Ideal para operações com alto custo de repetição.',
        iconName: 'auto',
        anchor: 'automacao',
        numLabel: 'SVC · 03',
        shardColor: 'm',
        ctaLabel: 'Automatizar um processo ↗',
        features: [
          { title: 'RPA & workflows', description: 'Processos multi-sistema sem dor' },
          { title: 'ETL e pipelines', description: 'Dados no lugar certo, na hora certa' },
          { title: 'Notificações', description: 'WhatsApp, e-mail, webhooks' },
          { title: 'Monitoramento', description: 'Alertas quando algo sai do trilho' },
        ],
        tileClass: 't3',
        homePill: '',
        homePillTags: [],
        order: 3,
      },
      {
        title: 'Consultoria em tecnologia',
        subtitle: 'em tecnologia',
        description:
          'Diagnóstico preciso que alinha processos, infraestrutura e inovação. Ajudamos sua liderança a tomar decisões técnicas mais inteligentes — e mais baratas.',
        iconName: 'box',
        anchor: 'consultoria',
        numLabel: 'SVC · 04',
        shardColor: 'a',
        ctaLabel: 'Solicitar diagnóstico ↗',
        features: [
          { title: 'Tech assessment', description: 'Radiografia de stack, time e débito' },
          { title: 'Roadmap técnico', description: 'Priorização orientada a valor' },
          { title: 'Arquitetura', description: 'Revisão e redesenho de sistemas' },
          { title: 'Due diligence', description: 'Suporte a M&A e investimentos' },
        ],
        tileClass: 't4',
        homePill: '',
        homePillTags: [],
        order: 4,
      },
      {
        title: 'Infraestrutura & VPS gerenciada',
        subtitle: '& VPS gerenciada',
        description:
          'Servidores dimensionados para sua carga real, com backups, segurança, observabilidade e atualizações inclusas. Você usa a ferramenta; a gente cuida do resto.',
        iconName: 'server',
        anchor: 'infra',
        numLabel: 'SVC · 05',
        shardColor: 'e',
        ctaLabel: 'Dimensionar infra ↗',
        features: [
          { title: 'Cloud-agnostic', description: 'AWS, GCP, Azure ou on-premise' },
          { title: 'Backups auditáveis', description: '3-2-1, testados e criptografados' },
          { title: 'SLA escalonado', description: 'De 99.9% a 99.99%' },
          { title: 'Observabilidade', description: 'Logs, métricas, traces, alertas' },
        ],
        tileClass: 't5',
        homePill: '',
        homePillTags: [],
        order: 5,
      },
      {
        title: 'Suporte e evolução contínua',
        subtitle: 'evolução contínua',
        description:
          'Planos que acompanham seu crescimento. Adicione funcionalidades, corrija rotas ou faça upgrades técnicos a qualquer momento — sem reiniciar o relacionamento.',
        iconName: 'support',
        anchor: 'suporte',
        numLabel: 'SVC · 06',
        shardColor: 'v',
        ctaLabel: 'Contratar suporte ↗',
        features: [
          { title: 'SLA 24/7', description: 'Plantão técnico com priorização' },
          { title: 'Roadmap compartilhado', description: 'Você vê cada sprint' },
          { title: 'Dívida técnica', description: 'Refactors programados' },
          { title: 'Onboarding contínuo', description: 'De novos membros do seu time' },
        ],
        tileClass: 't6',
        homePill: 'SLA 24/7',
        homePillTags: [],
        order: 6,
      },
      {
        title: 'Outsourcing estratégico de TI',
        subtitle: 'estratégico de TI',
        description:
          'Mantenha o foco no core do seu negócio. Nossos especialistas assumem demandas específicas — com previsibilidade de custo, prazo e qualidade superior à contratação interna.',
        iconName: 'build',
        anchor: 'outsourcing',
        numLabel: 'SVC · 07',
        shardColor: 'c',
        ctaLabel: 'Terceirizar com a BSN ↗',
        features: [
          { title: 'Dev & DevOps', description: 'Backend, frontend, mobile, infra' },
          { title: 'QA & SRE', description: 'Automação de testes e confiabilidade' },
          { title: 'Data & Produto', description: 'Analytics, BI, PMs e designers' },
          { title: 'Contratos flex', description: 'Mensal, trimestral ou por projeto' },
        ],
        tileClass: 't7',
        homePill: '',
        homePillTags: ['Dev', 'DevOps', 'QA', 'Data', 'Produto'],
        order: 7,
      },
    ],
  });

  // 5. Soluções — vitrine dos produtos reais BSN
  await prisma.solution.createMany({
    data: [
      {
        title: 'Dom Snack — Cantina Digital',
        tag: 'EDU · FINTECH',
        description:
          'Sistema de cantina digital para escolas: cartões pré-pagos, app para pais, PDV e relatórios.',
        bullets: [
          'Cartão de crédito pré-pago para o aluno',
          'Recarga por pais via app/Pix',
          'PDV veloz e gestão multi-unidade',
        ],
        technologies: ['React', 'React Native', 'Node.js', 'PostgreSQL'],
        projectUrl: 'https://domsnack.com.br',
        colorClass: 'a',
        ctaLabel: 'Ver solução ao vivo →',
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Me Avisa Aí — Atendimento WhatsApp',
        tag: 'IA · MESSAGING',
        description:
          'Plataforma para gerenciar atendimentos pelo WhatsApp em escala, com IA, filas e integrações.',
        bullets: [
          'Multi-atendente com distribuição inteligente',
          'Bot com IA treinada na sua base',
          'Integração com CRM e automações',
        ],
        technologies: ['Node.js', 'React', 'WhatsApp API', 'OpenAI'],
        projectUrl: 'https://meavisaai.com.br',
        colorClass: 'b',
        ctaLabel: 'Ver solução ao vivo →',
        order: 2,
      },
      {
        title: 'Carlinhos Manager',
        tag: 'PDV · VAREJO',
        description:
          'Frente de caixa moderna com pagamento integrado, NFC-e, múltiplas lojas e relatórios em tempo real.',
        bullets: [
          'Pagamento por QR, Pix, TEF e cartão',
          'NFC-e e certificado digital',
          'Dashboards por loja / produto / operador',
        ],
        technologies: ['React', 'Electron', 'Node.js', 'SAT/TEF'],
        colorClass: 'c',
        ctaLabel: 'Ver detalhes →',
        order: 3,
      },
      {
        title: 'Inspeciona+',
        tag: 'MOBILIDADE',
        description:
          'App de checklist para inspeção veicular, com fotos, assinatura digital e laudo em PDF.',
        bullets: [
          'Checklist configurável por tipo de veículo',
          'Captura de fotos e assinatura offline',
          'Laudo em PDF automático + histórico',
        ],
        technologies: ['React Native', 'Node.js', 'PostgreSQL', 'S3'],
        colorClass: 'd',
        ctaLabel: 'Ver detalhes →',
        order: 4,
      },
      {
        title: 'Alpha Gateway',
        tag: 'FINTECH · PAGAMENTOS',
        description:
          'Gateway de pagamento seguro com split de recebíveis, antifraude e conciliação automática.',
        bullets: [
          'Split automático entre contas',
          'Antifraude com machine learning',
          'API REST + webhooks + painel completo',
        ],
        technologies: ['Node.js', 'Go', 'PostgreSQL', 'Redis'],
        colorClass: 'e',
        ctaLabel: 'Ver detalhes →',
        order: 5,
      },
      {
        title: 'Tribunal Eclesiástico',
        tag: 'JURÍDICO',
        description:
          'Sistema de processos de nulidade matrimonial com fluxo de decisões, documentos e notificações.',
        bullets: [
          'Fluxo configurável por diocese',
          'Assinatura digital e ICP-Brasil',
          'Handoff suave para humano em dúvidas',
        ],
        technologies: [],
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        colorClass: 'f',
        ctaLabel: 'Ver detalhes →',
        order: 6,
      },
    ],
  });

  // 6. Depoimentos — ao vivo card + card pill da home
  await prisma.testimonial.createMany({
    data: [
      {
        clientName: 'Carolina Menezes',
        clientRole: 'Diretora de Operações',
        company: 'FinCo',
        content: '"Ritmo de entrega 3× superior ao esperado."',
        rating: 5,
        order: 1,
      },
    ],
  });

  // 7. Equipe — 3 lideranças do new-layout (sobre.html)
  await prisma.teamMember.createMany({
    data: [
      {
        name: 'Cristhyan Koch',
        role: 'CTO & Co-founder',
        bio: '15+ anos em sistemas distribuídos e produtos de missão crítica.',
        avatarVariant: 'default',
        order: 1,
      },
      {
        name: 'Bruno Santos',
        role: 'Head de Engenharia',
        bio: 'Especialista em arquitetura escalável e times de alto desempenho.',
        avatarVariant: 'b',
        order: 2,
      },
      {
        name: 'Natalia Reis',
        role: 'Head de Produto',
        bio: 'Traduz necessidades complexas em roadmaps executáveis.',
        avatarVariant: 'c',
        order: 3,
      },
    ],
  });

  // 8. Clientes (placeholders) — o design não lista clientes explicitamente,
  // mantemos vazio por padrão; o admin pode popular depois.

  // 9. Vagas — 5 do new-layout (carreiras.html)
  await prisma.job.createMany({
    data: [
      {
        title: 'Engenheiro(a) de Software Sênior',
        description:
          'Construir sistemas críticos em TypeScript, Node e React para clientes enterprise.',
        requirements: 'TypeScript · Node · React',
        benefits: 'Remoto-first, stock options, R$ 5.000/ano em aprendizado.',
        location: 'REMOTO',
        type: 'FULL_TIME',
        order: 1,
      },
      {
        title: 'SRE / DevOps Pleno',
        description:
          'Operar e evoluir infraestrutura de alta disponibilidade em AWS + Kubernetes.',
        requirements: 'AWS · K8s · Terraform',
        benefits: 'Remoto-first, MacBook Pro, cadeira ergonômica.',
        location: 'REMOTO',
        type: 'FULL_TIME',
        order: 2,
      },
      {
        title: 'Product Designer Sênior',
        description:
          'Conduzir pesquisa, design e sistemas para produtos B2B complexos.',
        requirements: 'Figma · Pesquisa · Sistemas',
        benefits: 'Remoto-first, aprendizado contínuo, autonomia real.',
        location: 'REMOTO',
        type: 'FULL_TIME',
        order: 3,
      },
      {
        title: 'QA Automation Pleno',
        description:
          'Automatizar testes end-to-end e garantir confiabilidade dos nossos produtos.',
        requirements: 'Playwright · Cypress',
        benefits: 'Remoto-first, roadmap compartilhado.',
        location: 'REMOTO',
        type: 'FULL_TIME',
        order: 4,
      },
      {
        title: 'Product Manager',
        description:
          'Tocar produtos B2B em fintech e cooperativismo ao lado de squads sêniores.',
        requirements: 'B2B · Fintech · Coop',
        benefits: 'Stock options, plano de carreira, parceria de longo prazo.',
        location: 'SP · HÍBRIDO',
        type: 'FULL_TIME',
        order: 5,
      },
    ],
  });

  // 10. Blog — 7 posts (feat + 6) do new-layout (blog.html)
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Por que projetos sob medida superam SaaS genérico em operações complexas.',
        slug: 'sob-medida-vs-saas-generico',
        excerpt:
          'Um estudo com 14 administradoras mostrou que o ROI de soluções customizadas supera o de SaaS em até 3× ao longo de 24 meses — e explicamos por quê.',
        content:
          'Operações complexas acumulam exceções que SaaS genérico não cobre. Este long read apresenta a metodologia que usamos para avaliar quando sob medida vence — e os casos em que SaaS ainda faz sentido.',
        tags: ['Estratégia', 'Long read'],
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date('2026-04-22T09:00:00.000Z'),
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

  // 12. Valores — 4 princípios (sobre.html)
  await prisma.value.createMany({
    data: [
      { number: '01', title: 'Clareza radical', description: 'Se não dá para explicar em uma frase, precisa ser simplificado.', order: 1 },
      { number: '02', title: 'Menos é mais', description: 'Mil "nãos" para cada "sim". Evitamos feature slop a todo custo.', order: 2 },
      { number: '03', title: 'Propriedade', description: 'Cada engenheiro trata o sistema como se fosse seu.', order: 3 },
      { number: '04', title: 'Evolução contínua', description: 'Entregar rápido é bom; manter entregando por anos é melhor.', order: 4 },
    ],
  });

  // 13. KPIs — 4 colunas (index.html)
  await prisma.homeKPI.createMany({
    data: [
      { label: 'EXPERIÊNCIA', value: '12', suffix: '+', caption: 'anos entregando software de missão crítica', order: 1 },
      { label: 'PORTFÓLIO', value: '80', suffix: '+', caption: 'projetos entregues em 14 setores', order: 2 },
      { label: 'VELOCIDADE', value: '5', suffix: 'dias', caption: 'para integrar um squad ao seu time', order: 3 },
      { label: 'COBERTURA', value: '24', suffix: '/7', caption: 'suporte, monitoramento e evolução contínua', order: 4 },
    ],
  });

  // 14. Benefícios de carreira (carreiras.html)
  await prisma.perk.createMany({
    data: [
      { title: 'Remoto-first', description: 'Trabalhe de onde for mais produtivo. Encontros presenciais trimestrais opcionais.', order: 1 },
      { title: 'Aprendizado contínuo', description: 'R$ 5.000/ano para cursos, livros, conferências. Sem burocracia.', order: 2 },
      { title: 'Equipamento top', description: 'MacBook Pro, monitor, cadeira ergonômica. Tudo que precisa.', order: 3 },
      { title: 'Participação real', description: 'Plano de stock options para sêniores e lideranças após o ciclo.', order: 4 },
    ],
  });

  // 15. Hero Live Card (index.html — card-live)
  await prisma.homeLiveCard.create({
    data: {
      label: 'Ao vivo · operação 24/7',
      title: 'Monitoramos 32 projetos em produção agora mesmo.',
      rows: [
        { label: 'Uptime · ano', value: '99.97%', highlight: 'up' },
        { label: 'Deploys · semana', value: '147', highlight: null },
        { label: 'Tickets resolvidos', value: '↑ 12%', highlight: 'up' },
      ],
      isActive: true,
    },
  });

  // 16. Home Brand Pill (index.html — card-pill)
  await prisma.homeBrandPill.create({
    data: {
      personName: 'Carolina Menezes',
      company: 'FinCo',
      quote: '"Ritmo de entrega 3× superior ao esperado."',
      isActive: true,
    },
  });

  // 17. Home Band / Filosofia
  await prisma.homeBand.create({
    data: {
      eyebrow: 'FILOSOFIA',
      title:
        'Software fácil de usar. <em>Difícil de ignorar.</em><br>Feito para durar tanto quanto sua empresa.',
      ctaLabel: 'Conversar com um especialista ↗',
      ctaUrl: '/contato',
      mono: 'Diagnóstico inicial gratuito · 45 min',
      isActive: true,
    },
  });

  // 18. Stack items (marquee)
  await prisma.stackItem.createMany({
    data: [
      { name: 'TypeScript', order: 1 },
      { name: 'Node.js', order: 2 },
      { name: 'React', order: 3 },
      { name: 'Next.js', order: 4 },
      { name: 'Python', order: 5 },
      { name: 'Django', order: 6 },
      { name: 'PostgreSQL', order: 7 },
      { name: 'Redis', order: 8 },
      { name: 'AWS', order: 9 },
      { name: 'Kubernetes', order: 10 },
      { name: 'Terraform', order: 11 },
      { name: 'Kafka', order: 12 },
    ],
  });

  // 19. About Cards (sobre.html — .about-grid)
  await prisma.aboutCard.createMany({
    data: [
      {
        tag: 'MISSÃO',
        title: 'Eliminar o gap entre a estratégia e a execução técnica.',
        description:
          'Queremos que líderes vejam tecnologia como alavanca — não como gargalo. Traduzimos visão de negócio em sistemas que escalam.',
        colorClass: 'c1',
        order: 1,
      },
      {
        tag: 'VISÃO',
        title: 'Ser a parceira técnica default de operações complexas no Brasil.',
        description: 'Em setores onde o software tradicional não dá conta, queremos ser a primeira ligação.',
        colorClass: 'c2',
        order: 2,
      },
      {
        tag: 'FORMA DE TRABALHAR',
        title: 'Parceria de longo prazo, com transparência desconfortável.',
        description:
          'Nossos relatórios mostram o que funcionou e o que não — porque essa é a única forma de evoluir de verdade.',
        colorClass: 'c3',
        order: 3,
      },
      {
        tag: 'O QUE EVITAMOS',
        title: 'Feature slop, burocracia e soluções engessadas.',
        description: 'Se uma funcionalidade não gera valor mensurável, ela não entra no roadmap.',
        colorClass: 'c4',
        order: 4,
      },
    ],
  });

  // 20. Etapas do processo (Como trabalhamos — home)
  await prisma.processStep.createMany({
    data: [
      {
        number: '01',
        title: 'Diagnóstico',
        description:
          'Mergulhamos na sua operação para entender contexto, dor real e restrições. Sem tecniquês.',
        duration: '1 semana',
        order: 1,
      },
      {
        number: '02',
        title: 'Proposta',
        description:
          'Escopo claro com entregas, prazos e preço fixo. Você decide o que entra no MVP.',
        duration: '3-5 dias',
        order: 2,
      },
      {
        number: '03',
        title: 'Sprint & Entregas',
        description:
          'Squad montado em 5 dias. Demos semanais, sem surpresas — você acompanha cada sprint.',
        duration: '2 semanas/sprint',
        order: 3,
      },
      {
        number: '04',
        title: 'Go-live & Evolução',
        description:
          'Deploy monitorado 24/7 + roadmap contínuo. A parceria não acaba no lançamento.',
        duration: 'contínuo',
        order: 4,
      },
    ],
  });

  // 21. Clientes reais por setor (substitui lista vazia)
  await prisma.client.createMany({
    data: [
      { name: 'Casa do Construtor', logoUrl: '', sector: 'Construção', order: 1 },
      { name: 'Velz Rent a Car', logoUrl: '', sector: 'Mobilidade', order: 2 },
      { name: 'Tribunal Eclesiástico', logoUrl: '', sector: 'Jurídico', order: 3 },
      { name: 'Empresta Capital', logoUrl: '', sector: 'Fintech', order: 4 },
      { name: 'Colégio Salesiano', logoUrl: '', sector: 'Educação', order: 5 },
      { name: 'Colégio São Judas Tadeu', logoUrl: '', sector: 'Educação', order: 6 },
      { name: 'Colégio São Gonçalo', logoUrl: '', sector: 'Educação', order: 7 },
      { name: 'Colégio Santo Antônio', logoUrl: '', sector: 'Educação', order: 8 },
      { name: 'Passaleti', logoUrl: '', sector: 'Varejo', order: 9 },
      { name: 'Musiva', logoUrl: '', sector: 'Entretenimento', order: 10 },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('👤 Admin criado:', {
    email: 'admin@bsnsolution.com.br',
    password: 'bsn2024@admin',
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
