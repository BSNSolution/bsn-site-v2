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

  // 4. Serviços — 11 frentes (7 originais do new-layout + IA + Dados + Product Concept + Design de Serviço)
  //    Inclui campos da página de detalhe /servicos/:slug (hero, CTA) + ServiceDetailBlocks abaixo.
  const serviceDefinitions = [
    {
      title: 'Desenvolvimento de software sob medida',
      subtitle: 'sob medida',
      description:
        'Sistemas construídos para a realidade da sua operação — portais de autoatendimento, módulos de integração complexos, dashboards executivos e qualquer ferramenta que resolva um problema específico do seu negócio.',
      iconName: 'code',
      anchor: 'sob-medida',
      slug: 'sob-medida',
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
      // Hero + CTA da página de detalhe
      heroEyebrow: 'Serviço · sob medida',
      heroDescription:
        'Software desenhado a partir do seu processo — não o contrário. Cada linha de código existe para resolver um problema claro da sua operação, com propriedade 100% sua.',
      heroLongText:
        'Em vez de adaptar um SaaS genérico a exceções infinitas, construímos a plataforma certa para como você realmente trabalha. Do diagnóstico ao go-live, sem zona cinzenta.',
      ctaTitle: 'Pronto para começar sob medida?',
      ctaText:
        'Em até 45 minutos de conversa definimos viabilidade, próximos passos e um primeiro escopo enxuto. Sem lengalenga comercial.',
      ctaButtonLabel: 'Agendar diagnóstico →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que começar sob medida',
          description:
            'Quando seu processo é diferencial competitivo, um SaaS genérico vira gargalo. Construir o software certo é mais barato no médio prazo e escala junto com o negócio.',
          iconName: 'trending-up',
          colorClass: 'a',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Discovery curto, escopo enxuto, sprints quinzenais com demo ao vivo. Você aprova cada entrega. Nenhum feature entra no roadmap sem métrica de valor.',
          iconName: 'workflow',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Produto rodando em produção, código e docs no seu repositório, pipeline de CI/CD, observabilidade configurada e um time pronto para evoluir o sistema ao longo do tempo.',
          iconName: 'shield',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Squads ágeis multidisciplinares',
      subtitle: 'multidisciplinares',
      description:
        'Times plug-and-play com devs, QAs, POs, designers e DevOps — montados no tamanho certo para o seu desafio e integrados em até 5 dias úteis.',
      iconName: 'users',
      anchor: 'squads',
      slug: 'squads',
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
      heroEyebrow: 'Serviço · squads ágeis',
      heroDescription:
        'Times sêniores que entram no seu fluxo como se já estivessem lá. Integração em dias, entregas em semanas — sem dor de contratação nem custo fixo sobrando.',
      heroLongText:
        'Você define o desafio, a gente monta o squad certo (dev, QA, PO, designer, DevOps). Cerimônias ágeis acontecem, métricas são públicas, o escopo se ajusta ao que o negócio precisa agora.',
      ctaTitle: 'Monte seu squad ideal em dias',
      ctaText:
        'Conte o desafio e o prazo — voltamos com proposta de time, rituais e métricas em até 48 horas úteis.',
      ctaButtonLabel: 'Quero montar um squad →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que começar com squads',
          description:
            'Contratação interna leva meses e trava em formação cultural. Um squad pronto entrega valor desde a primeira sprint e reduz risco de turnover no início do projeto.',
          iconName: 'zap',
          colorClass: 'b',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Time fixo dedicado, rituais ágeis semanais com seu PO/gestor, board compartilhado, métricas de entrega públicas. Você acompanha lead time, velocity e CSAT em tempo real.',
          iconName: 'cpu',
          colorClass: 'c',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Incrementos de produto a cada sprint, transferência contínua de conhecimento ao seu time interno e autonomia para aumentar, reduzir ou encerrar o squad com aviso de 30 dias.',
          iconName: 'bot',
          colorClass: 'd',
          order: 3,
        },
      ],
    },
    {
      title: 'Automação de processos',
      subtitle: 'de processos',
      description:
        'Mapeamos fluxos manuais, orquestramos integrações e entregamos horas de volta à sua equipe. Ideal para operações com alto custo de repetição.',
      iconName: 'workflow',
      anchor: 'automacao',
      slug: 'automacao',
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
      heroEyebrow: 'Serviço · automação',
      heroDescription:
        'Tire trabalho repetitivo do time e devolva horas ao que move o negócio. Automação com guardrails, logs auditáveis e pessoas no loop onde importa.',
      heroLongText:
        'Mapeamos o fluxo atual, identificamos o gargalo real e implementamos a automação na ordem certa — RPA, workflows, integrações, notificações. Nada de automatizar um processo errado.',
      ctaTitle: 'Quais processos devolveriam mais tempo?',
      ctaText:
        'Fazemos um diagnóstico rápido e apontamos até 3 automações com maior ROI na sua operação antes de qualquer contrato.',
      ctaButtonLabel: 'Mapear meus processos →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que automatizar agora',
          description:
            'Todo processo repetitivo custa horas que deveriam virar produto ou atendimento. Automação bem feita paga o investimento no primeiro trimestre e liberta o time para trabalho de maior valor.',
          iconName: 'scissors',
          colorClass: 'a',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Diagnóstico de fluxo em 1 semana, priorização por ROI, implementação incremental e revisão conjunta antes do go-live. Monitoramento ativo e pessoas no loop em decisões críticas.',
          iconName: 'file-search',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Automação rodando, logs auditáveis, alertas configurados e documentação acessível ao seu time. Você opera e audita; a gente mantém e evolui quando os sistemas mudam.',
          iconName: 'gauge',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Consultoria em tecnologia',
      subtitle: 'em tecnologia',
      description:
        'Diagnóstico preciso que alinha processos, infraestrutura e inovação. Ajudamos sua liderança a tomar decisões técnicas mais inteligentes — e mais baratas.',
      iconName: 'compass',
      anchor: 'consultoria',
      slug: 'consultoria',
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
      heroEyebrow: 'Serviço · consultoria',
      heroDescription:
        'Clareza sobre stack, time, débito técnico e roadmap. Diagnóstico honesto e recomendações priorizadas — sem jargão nem agenda de venda de mais horas.',
      heroLongText:
        'Mergulhamos na sua arquitetura, entrevistamos o time, analisamos métricas reais e entregamos um plano concreto com quick wins e apostas estratégicas. Você decide o que executar, com quem.',
      ctaTitle: 'Seu tech stack está ajudando ou atrapalhando?',
      ctaText:
        'Em 2 semanas entregamos um relatório executivo com diagnóstico, priorização e ROI esperado para cada decisão.',
      ctaButtonLabel: 'Solicitar diagnóstico →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que consultar',
          description:
            'Decisões técnicas tomadas sem diagnóstico independente acumulam dívida silenciosa. Uma revisão externa revela bottlenecks que o time interno já normalizou e economiza seis dígitos em retrabalho.',
          iconName: 'brain',
          colorClass: 'c',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Duas semanas imersos na sua realidade: code review, entrevistas com time, análise de métricas, benchmarks. Nenhuma recomendação sem evidência concreta no relatório final.',
          iconName: 'file-search',
          colorClass: 'a',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Relatório executivo + plano de ação priorizado por ROI + sessão de debrief com sua liderança. Sem amarra de continuidade — você pode executar com a gente, com seu time, ou com um terceiro.',
          iconName: 'line-chart',
          colorClass: 'd',
          order: 3,
        },
      ],
    },
    {
      title: 'Infraestrutura & VPS gerenciada',
      subtitle: '& VPS gerenciada',
      description:
        'Servidores dimensionados para sua carga real, com backups, segurança, observabilidade e atualizações inclusas. Você usa a ferramenta; a gente cuida do resto.',
      iconName: 'server',
      anchor: 'infra',
      slug: 'infra',
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
      heroEyebrow: 'Serviço · infra',
      heroDescription:
        'Infraestrutura dimensionada pro seu tráfego real, com SLA claro e observabilidade fim-a-fim. Cloud-agnostic, backup testado, sem amarra de fornecedor.',
      heroLongText:
        'Você opera o produto; a gente opera a infra. Dimensionamento honesto, migrações sem drama, backup testado semanalmente e alerta que só toca quando precisa.',
      ctaTitle: 'Sua infra atual está pronta para escalar?',
      ctaText:
        'Rodamos um health check gratuito de 48 horas com recomendações concretas antes de qualquer proposta.',
      ctaButtonLabel: 'Pedir health check →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que nos preocupar com infra',
          description:
            'Infra mal dimensionada é o custo invisível do crescimento: conta de cloud inflada, incidentes frequentes e deploy lento. Uma revisão enxuta recupera margem e confiabilidade.',
          iconName: 'shield',
          colorClass: 'e',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Auditoria de custo e arquitetura, IaC versionado, pipelines de deploy blue-green, observabilidade com SLOs acordados. Migração incremental com rollback pronto.',
          iconName: 'workflow',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Infra documentada, SLA mensal com métricas reais, backup testado e plantão 24/7 opcional. Sem lock-in — todo o IaC fica no seu repositório.',
          iconName: 'database',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Suporte e evolução contínua',
      subtitle: 'evolução contínua',
      description:
        'Planos que acompanham seu crescimento. Adicione funcionalidades, corrija rotas ou faça upgrades técnicos a qualquer momento — sem reiniciar o relacionamento.',
      iconName: 'life-buoy',
      anchor: 'suporte',
      slug: 'suporte',
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
      heroEyebrow: 'Serviço · suporte',
      heroDescription:
        'Relação contínua com o time que construiu (ou entendeu) seu sistema. Sem reabrir contrato a cada melhoria — roadmap compartilhado, entregas previsíveis.',
      heroLongText:
        'Além de apagar incêndio: cuidamos de dívida técnica, evolução funcional, upgrade de stack e onboarding de novos membros do seu time. SLA ajustado à criticidade real do produto.',
      ctaTitle: 'Quer um time de plantão que já conhece seu código?',
      ctaText:
        'Planos a partir de 20h/mês com roadmap compartilhado e priorização conjunta. Sem surpresas em fatura.',
      ctaButtonLabel: 'Conhecer planos de suporte →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que ter suporte contínuo',
          description:
            'Todo sistema em produção acumula dívida, requer ajustes regulatórios e ganha demanda nova. Ter o time certo à mão reduz MTTR e evita o ciclo "parar tudo para apagar incêndio".',
          iconName: 'zap',
          colorClass: 'a',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Plantão técnico com níveis de prioridade acordados, roadmap compartilhado em board público, planning mensal conjunto e relatório executivo de atividades ao fim de cada ciclo.',
          iconName: 'clock',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'SLAs honrados, dívida técnica tratada em esteira, features novas entregues a cada sprint e conhecimento transferido ao seu time continuamente. Sem reféns.',
          iconName: 'shield',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Outsourcing estratégico de TI',
      subtitle: 'estratégico de TI',
      description:
        'Mantenha o foco no core do seu negócio. Nossos especialistas assumem demandas específicas — com previsibilidade de custo, prazo e qualidade superior à contratação interna.',
      iconName: 'handshake',
      anchor: 'outsourcing',
      slug: 'outsourcing',
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
      heroEyebrow: 'Serviço · outsourcing',
      heroDescription:
        'Terceirize frentes específicas com previsibilidade de custo e qualidade superior à contratação interna. Você mantém o foco estratégico; a gente toca execução.',
      heroLongText:
        'Dev, QA, SRE, Data, Produto, Design — alocamos os perfis que seu negócio demanda, com contratos flexíveis e saída limpa sempre que você quiser internalizar.',
      ctaTitle: 'Onde terceirizar agora faz mais sentido?',
      ctaText:
        'Conte a demanda — avaliamos e respondemos com perfis, custos e SLA esperado em até 2 dias úteis.',
      ctaButtonLabel: 'Quero terceirizar →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que terceirizar estratégico',
          description:
            'Nem tudo precisa ser feito in-house. Terceirizar frentes bem delimitadas libera liderança interna para o core do negócio e traz maturidade que demoraria anos para construir.',
          iconName: 'trending-up',
          colorClass: 'd',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Perfis selecionados, contrato de SLA claro, integração ao seu processo (ferramentas, cerimônias, código) e governança de entrega auditável mês a mês.',
          iconName: 'cpu',
          colorClass: 'a',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Capacidade imediata, conhecimento transferível, documentação de tudo que é construído e opção real de internalizar o time com aviso prévio de 60 dias.',
          iconName: 'bot',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Inteligência Artificial aplicada',
      subtitle: 'aplicada',
      description:
        'Agentes, automações e modelos sob medida que resolvem problemas reais da sua operação — com dados, métricas e guardrails. Menos hype, mais integração profunda com seus sistemas.',
      iconName: 'brain',
      anchor: 'ia',
      slug: 'ia',
      numLabel: 'SVC · 08',
      shardColor: 'm',
      ctaLabel: 'Conhecer projetos de IA ↗',
      features: [
        { title: 'Agentes de IA', description: 'Triagem, atendimento e copilotos internos' },
        { title: 'RAG & busca semântica', description: 'Base de conhecimento com citação de fonte' },
        { title: 'Fine-tuning & LLMs', description: 'Modelos ajustados ao seu domínio' },
        { title: 'MLOps & observabilidade', description: 'Métricas, drift e custo por inferência' },
      ],
      tileClass: '',
      homePill: 'Novo',
      homePillTags: ['LLM', 'RAG', 'Agentes', 'MLOps'],
      order: 8,
      heroEyebrow: 'Serviço · IA aplicada',
      heroDescription:
        'IA que vira resultado no balanço — não promessa em keynote. Construímos agentes, automações e modelos com dados, métricas e plano claro.',
      heroLongText:
        'Discovery honesto para separar o que dá ROI do que é demo de conferência. Depois, engenharia pesada: LLMs, RAG, agentes, guardrails, observabilidade.',
      ctaTitle: 'Onde a IA faria diferença real no seu negócio?',
      ctaText:
        'Fazemos um discovery de 2 semanas e voltamos com casos priorizados por impacto, viabilidade técnica e prontidão dos seus dados.',
      ctaButtonLabel: 'Explorar casos com IA →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que IA agora',
          description:
            'LLMs derrubaram o custo de tarefas antes inviáveis: triagem, classificação, assistência. Usada com critério, vira vantagem competitiva — usada com hype, vira teatro caro.',
          iconName: 'sparkles',
          colorClass: 'a',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Discovery IA → prova de conceito em 2-4 semanas → construção com guardrails → operação com MLOps. Sempre ancorados em métrica de negócio, nunca em métrica de modelo.',
          iconName: 'workflow',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Agente ou modelo em produção, integrado aos seus sistemas, com observabilidade, guardrails éticos, logs auditáveis e rituais mensais de retraining baseados em uso real.',
          iconName: 'bot',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Discovery & Engenharia de Dados para IA',
      subtitle: 'Engenharia de Dados para IA',
      description:
        'Antes do modelo, a fundação: diagnóstico de maturidade, integração de fontes, pipelines confiáveis e governança. Sem dados bons, IA vira teatro caro.',
      iconName: 'database',
      anchor: 'dados-ia',
      slug: 'dados-ia',
      numLabel: 'SVC · 09',
      shardColor: 'a',
      ctaLabel: 'Diagnosticar minha base ↗',
      features: [
        { title: 'Diagnóstico de dados', description: 'Maturidade, qualidade e prontidão' },
        { title: 'Lakehouse / DW', description: 'Arquitetura versionada e auditável' },
        { title: 'Pipelines ETL/ELT', description: 'Confiáveis, monitorados e rastreáveis' },
        { title: 'Catálogo & linhagem', description: 'Governança com LGPD e compliance' },
      ],
      tileClass: '',
      homePill: '',
      homePillTags: ['Data', 'ETL', 'Governança', 'LGPD'],
      order: 9,
      heroEyebrow: 'Serviço · dados para IA',
      heroDescription:
        'Antes de qualquer modelo, a base. Integramos fontes, organizamos qualidade e colocamos governança — a fundação sem a qual IA nunca sai do PowerPoint.',
      heroLongText:
        'Lakehouse ou DW com arquitetura versionada, pipelines ETL/ELT auditáveis, catálogo e linhagem documentados, conformidade com LGPD. Dados como ativo, não como aglomerado.',
      ctaTitle: 'Sua base está pronta para IA?',
      ctaText:
        'Em 2 semanas entregamos um diagnóstico de maturidade de dados + plano incremental de engenharia para destravar casos com mais impacto.',
      ctaButtonLabel: 'Diagnosticar base →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que começar por dados',
          description:
            'IA é tão boa quanto os dados que a alimentam. Pular a fundação acelera o fracasso — um diagnóstico honesto evita investir em modelo antes de ter o insumo básico pronto.',
          iconName: 'database',
          colorClass: 'e',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Mapa de fontes, qualidade e volume → arquitetura de lakehouse ou DW → pipelines versionados com testes → catálogo e políticas de acesso. Passo a passo, com quick wins pelo caminho.',
          iconName: 'workflow',
          colorClass: 'b',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Arquitetura de dados documentada, pipelines rodando em produção, governança clara (quem acessa o quê, por quê, com que auditoria) e prontidão real para os próximos casos de IA.',
          iconName: 'shield',
          colorClass: 'c',
          order: 3,
        },
      ],
    },
    {
      title: 'Product Concept',
      subtitle: 'concept',
      description:
        'Transformamos ideia em hipótese validada. Problema redondo, persona clara, proposta de valor afiada e um MVP enxuto — tudo em semanas, antes de escrever código caro.',
      iconName: 'rocket',
      anchor: 'product-concept',
      slug: 'product-concept',
      numLabel: 'SVC · 10',
      shardColor: 'v',
      ctaLabel: 'Validar minha ideia ↗',
      features: [
        { title: 'Descoberta focada', description: 'Entrevistas com usuário real, não opinião' },
        { title: 'Prototipação rápida', description: 'Figma e mock navegável em dias' },
        { title: 'Critério de kill', description: 'Você sai com go ou no-go, sem ambiguidade' },
        { title: 'Backlog enxuto', description: 'O que é MVP, o que é v2, o que não é produto' },
      ],
      tileClass: '',
      homePill: 'Discovery',
      homePillTags: ['Produto', 'Discovery', 'MVP'],
      order: 10,
      heroEyebrow: 'Serviço · product concept',
      heroDescription:
        'Da ideia à hipótese validada. Em vez de construir e torcer, descobrimos o que merece virar produto antes de gastar a primeira linha de código.',
      heroLongText:
        'Combinação de pesquisa, design e arquitetura para sair com uma hipótese afiada: problema redondo, persona clara, proposta de valor, MVP minimamente útil e um critério honesto de go / no-go.',
      ctaTitle: 'Sua ideia está pronta para virar produto?',
      ctaText:
        'Em 3 semanas validamos proposta, usuário e viabilidade técnica. Você sai com um plano — ou com um "não invista nisso".',
      ctaButtonLabel: 'Começar discovery →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que começar por discovery',
          description:
            'A maioria dos produtos morre não por má execução, mas por ter resolvido o problema errado. Um discovery curto e honesto economiza 6 meses de engenharia que iria pra gaveta.',
          iconName: 'file-search',
          colorClass: 'a',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Entrevistas com usuários reais, mapa de jornadas, protótipo navegável, testes de desejabilidade e viabilidade técnica. Reports públicos a cada semana — nada escondido pra justificar honorário.',
          iconName: 'brain',
          colorClass: 'c',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Hipótese escrita, protótipo testado, backlog priorizado pra MVP e uma recomendação clara: prossiga, ajuste ou descarte. Tudo no seu repositório, sem lock-in.',
          iconName: 'sparkles',
          colorClass: 'b',
          order: 3,
        },
      ],
    },
    {
      title: 'Design de Serviço',
      subtitle: 'de serviço',
      description:
        'Mapeamos a jornada completa — do primeiro contato ao pós-venda — e redesenhamos touchpoints, processos e papéis. Menos atrito, mais experiência memorável.',
      iconName: 'palette',
      anchor: 'design-servico',
      slug: 'design-servico',
      numLabel: 'SVC · 11',
      shardColor: 'a',
      ctaLabel: 'Redesenhar minha operação ↗',
      features: [
        { title: 'Blueprint do serviço', description: 'Frontstage, backstage e suporte' },
        { title: 'Jornada do usuário', description: 'Momentos de dor e de encantamento' },
        { title: 'Redesign de processos', description: 'Do atendimento ao financeiro' },
        { title: 'Métricas de experiência', description: 'NPS, CSAT, CES com plano de ação' },
      ],
      tileClass: '',
      homePill: '',
      homePillTags: ['Serviço', 'CX', 'Operação'],
      order: 11,
      heroEyebrow: 'Serviço · design de serviço',
      heroDescription:
        'Produto bom em operação ruim não escala. Redesenhamos a jornada completa do seu cliente — com atrito reduzido, processos claros e papéis afinados.',
      heroLongText:
        'Blueprint completo de frontstage e backstage, mapeamento de dor e de encantamento, reescrita de processos críticos e métricas de experiência com plano de ação.',
      ctaTitle: 'Onde o seu serviço perde clientes hoje?',
      ctaText:
        'Fazemos uma imersão de 2 semanas, mapeamos a jornada real e voltamos com as 3 intervenções de maior impacto em CX e operação.',
      ctaButtonLabel: 'Mapear jornada →',
      ctaButtonUrl: '/contato',
      blocks: [
        {
          title: 'Por que redesenhar o serviço',
          description:
            'Produto digital é só parte da experiência. Onboarding lento, suporte confuso ou cobrança opaca destroem percepção de valor mesmo quando o software é excelente.',
          iconName: 'scissors',
          colorClass: 'c',
          order: 1,
        },
        {
          title: 'Como trabalhamos',
          description:
            'Entrevistas com clientes reais, observação de operação, workshops com times internos (atendimento, vendas, sucesso). Blueprint do serviço versionado e priorização conjunta.',
          iconName: 'workflow',
          colorClass: 'a',
          order: 2,
        },
        {
          title: 'O que entregamos',
          description:
            'Blueprint detalhado, redesign dos processos mais críticos, playbooks para times operacionais e métricas de experiência com baseline + metas mensuráveis.',
          iconName: 'line-chart',
          colorClass: 'd',
          order: 3,
        },
      ],
    },
  ];

  for (const def of serviceDefinitions) {
    const { blocks, ...serviceData } = def;
    const created = await prisma.service.create({ data: serviceData });
    if (blocks && blocks.length > 0) {
      await prisma.serviceDetailBlock.createMany({
        data: blocks.map((b) => ({ ...b, serviceId: created.id })),
      });
    }
  }

  // 5. Soluções — aceleradores genéricos da BSN (não nomear produtos específicos)
  await prisma.solution.createMany({
    data: [
      {
        title: 'Portal do Cliente & Autoatendimento',
        tag: 'SAAS · B2B',
        description:
          'Área logada completa onde seus clientes consultam status, abrem chamados e acessam documentos sem depender do suporte.',
        bullets: [
          'SSO com Microsoft, Google e credenciais próprias',
          'Dashboards configuráveis por perfil',
          'Integração com ERPs e CRMs existentes',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL', 'SSO/SAML'],
        colorClass: 'a',
        ctaLabel: 'Falar com um especialista →',
        isFeatured: true,
        order: 1,
      },
      {
        title: 'Atendimento via WhatsApp com IA',
        tag: 'IA · MESSAGING',
        description:
          'Centralize conversas, distribua atendimentos e automatize respostas com IA treinada na sua base de conhecimento.',
        bullets: [
          'Multi-atendente com distribuição inteligente',
          'Bot com IA treinada no seu repositório',
          'Integração com CRM, e-commerce e ERP',
        ],
        technologies: ['Node.js', 'React', 'WhatsApp API', 'LLM'],
        colorClass: 'b',
        ctaLabel: 'Falar com um especialista →',
        order: 2,
      },
      {
        title: 'PDV & Frente de Caixa Moderno',
        tag: 'VAREJO · PDV',
        description:
          'Frente de caixa rápida, offline-ready, com emissão fiscal, pagamento integrado e relatórios em tempo real.',
        bullets: [
          'Pagamento por QR, Pix, TEF e cartão',
          'NFC-e / SAT e certificado digital',
          'Dashboards por loja, produto e operador',
        ],
        technologies: ['React', 'Electron', 'Node.js', 'SAT/TEF'],
        colorClass: 'c',
        ctaLabel: 'Falar com um especialista →',
        order: 3,
      },
      {
        title: 'Força de Vendas & Checklists em Campo',
        tag: 'MOBILIDADE',
        description:
          'App offline-first pra times externos: pipeline de vendas, checklists, fotos, assinaturas e sync quando voltar ao sinal.',
        bullets: [
          'Funciona sem internet e sincroniza depois',
          'Captura de fotos, GPS e assinatura digital',
          'Dashboards de gestor em tempo real',
        ],
        technologies: ['React Native', 'Node.js', 'PostgreSQL', 'S3'],
        colorClass: 'd',
        ctaLabel: 'Falar com um especialista →',
        order: 4,
      },
      {
        title: 'Motor de Integração entre Sistemas',
        tag: 'INTEGRAÇÃO · ETL',
        description:
          'Sincronização resiliente entre ERPs, e-commerces, marketplaces e sistemas legados — com fila, retry e observabilidade.',
        bullets: [
          'Conectores prontos para 20+ plataformas',
          'Fila com retry automático e dead letter',
          'Observabilidade ponta-a-ponta',
        ],
        technologies: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Kafka'],
        colorClass: 'e',
        ctaLabel: 'Falar com um especialista →',
        order: 5,
      },
      {
        title: 'Plataforma de Gestão Interna',
        tag: 'ERP · WORKFLOW',
        description:
          'Sistema interno sob medida pra centralizar processos, aprovações e indicadores da sua operação — sem planilhas compartilhadas.',
        bullets: [
          'Workflows configuráveis sem código',
          'Aprovações com trilha de auditoria',
          'Relatórios e BI integrados',
        ],
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        colorClass: 'f',
        ctaLabel: 'Falar com um especialista →',
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

  // 21. Clientes — placeholders genéricos por setor (admin substitui pelos reais da BSN)
  await prisma.client.createMany({
    data: [
      { name: 'Cliente Construção 01', logoUrl: '', sector: 'Construção', order: 1 },
      { name: 'Cliente Mobilidade 01', logoUrl: '', sector: 'Mobilidade', order: 2 },
      { name: 'Cliente Jurídico 01', logoUrl: '', sector: 'Jurídico', order: 3 },
      { name: 'Cliente Fintech 01', logoUrl: '', sector: 'Fintech', order: 4 },
      { name: 'Cliente Educação 01', logoUrl: '', sector: 'Educação', order: 5 },
      { name: 'Cliente Educação 02', logoUrl: '', sector: 'Educação', order: 6 },
      { name: 'Cliente Saúde 01', logoUrl: '', sector: 'Saúde', order: 7 },
      { name: 'Cliente Indústria 01', logoUrl: '', sector: 'Indústria', order: 8 },
      { name: 'Cliente Varejo 01', logoUrl: '', sector: 'Varejo', order: 9 },
      { name: 'Cliente Serviços 01', logoUrl: '', sector: 'Serviços', order: 10 },
    ],
  });

  // 22. Blocos da página Inteligência Artificial
  await prisma.aIBlock.createMany({
    data: [
      // ─── HERO BENEFITS (4 cards) ───
      {
        type: 'HERO_BENEFIT',
        tag: 'RECEITA',
        title: 'Novas frentes de receita',
        description:
          'Produtos inteligentes que desbloqueiam ofertas personalizadas, cobrança dinâmica e canais antes inviáveis.',
        bullets: [],
        colorClass: 'a',
        iconName: 'trending-up',
        order: 1,
      },
      {
        type: 'HERO_BENEFIT',
        tag: 'CUSTO',
        title: 'Operação 10x mais enxuta',
        description:
          'Automação real de fluxos repetitivos — back-office, atendimento, triagem — sem substituir o julgamento humano nas decisões críticas.',
        bullets: [],
        colorClass: 'b',
        iconName: 'scissors',
        order: 2,
      },
      {
        type: 'HERO_BENEFIT',
        tag: 'EFICIÊNCIA',
        title: 'Time focado no que importa',
        description:
          'Agentes de IA liberam analistas, devs e gestores do trabalho mecânico e devolvem horas para o que move o negócio.',
        bullets: [],
        colorClass: 'c',
        iconName: 'zap',
        order: 3,
      },
      {
        type: 'HERO_BENEFIT',
        tag: 'DECISÃO',
        title: 'Insight na hora certa',
        description:
          'Modelos que leem sinais fracos e entregam recomendações onde a decisão acontece — não num relatório que ninguém abre.',
        bullets: [],
        colorClass: 'd',
        iconName: 'brain',
        order: 4,
      },

      // ─── STAGES (3 etapas) ───
      {
        type: 'STAGE',
        tag: 'VALIDAR & PLANEJAR',
        title: 'Discovery IA',
        description:
          'Diagnóstico técnico e de negócio para separar ideias vendidas em keynote do que realmente move o ponteiro na sua operação.',
        bullets: [
          'Mapeamento de casos de uso priorizados por ROI real',
          'Auditoria de dados, qualidade e prontidão da base',
          'Prova de conceito em 2 a 4 semanas',
          'Roadmap faseado com entregas mensuráveis',
        ],
        colorClass: 'a',
        number: '01',
        order: 1,
      },
      {
        type: 'STAGE',
        tag: 'CONSTRUIR & INTEGRAR',
        title: 'Desenvolvimento IA',
        description:
          'Engenharia de produto pesada: LLMs, RAG, fine-tuning, agentes autônomos e modelos sob medida — integrados aos seus sistemas existentes.',
        bullets: [
          'Integração com ERPs, CRMs e bancos legados',
          'Pipelines de dados versionados e reproduzíveis',
          'Guardrails, observabilidade e mitigação de alucinação',
          'Deploy em nuvem privada ou infraestrutura própria',
        ],
        colorClass: 'b',
        number: '02',
        order: 2,
      },
      {
        type: 'STAGE',
        tag: 'EVOLUIR & ESCALAR',
        title: 'Squads Especializados em IA',
        description:
          'Times sêniores dedicados que evoluem o produto mês a mês: MLOps, avaliação contínua, fine-tuning dirigido por feedback real de usuários.',
        bullets: [
          'Squad fixo (ML Eng, Data, Backend, Produto)',
          'SLA de modelos com métricas de negócio',
          'Ciclos mensais de retraining e avaliação',
          'Transferência de conhecimento contínua ao seu time',
        ],
        colorClass: 'c',
        number: '03',
        order: 3,
      },

      // ─── EDU_HIGHLIGHT (2 destaques) ───
      {
        type: 'EDU_HIGHLIGHT',
        tag: 'FUNDAÇÃO',
        title: 'Dados são o fator mais importante — IA não cria informação que você não tem.',
        description:
          'Antes de qualquer modelo, a gente organiza a casa: integração de fontes, qualidade, rotulagem e governança. Sem isso, IA vira teatro caro.',
        bullets: [
          'Diagnóstico de maturidade de dados',
          'Arquitetura de lakehouse ou data warehouse',
          'Pipelines ETL/ELT confiáveis',
          'Catálogo e linhagem versionados',
        ],
        colorClass: 'e',
        iconName: 'database',
        order: 1,
      },
      {
        type: 'EDU_HIGHLIGHT',
        tag: 'RESPONSABILIDADE',
        title: 'Guardrails, ética e auditoria — IA que o seu compliance aprova.',
        description:
          'Modelos em produção precisam explicar decisões, respeitar LGPD e ter limites claros. A gente constrói isso como parte do produto, não como remendo.',
        bullets: [
          'Políticas de uso e limites do modelo',
          'Logs auditáveis de prompts e respostas',
          'Avaliação contínua contra casos adversariais',
          'Conformidade com LGPD e setor regulado',
        ],
        colorClass: 'f',
        iconName: 'shield',
        order: 2,
      },
    ],
  });

  // ─────────────────────────────────────────────
  // 🧩 Page Sections — controla ordem / visibilidade
  // das seções de cada página pública via admin.
  // Idempotente: upsert por (page, sectionKey).
  // ─────────────────────────────────────────────
  const pageSectionsSeed: Array<{
    page: string
    sectionKey: string
    label: string
    order: number
  }> = [
    // Home
    { page: 'home', sectionKey: 'hero-orbit', label: 'Hero + Orbit de Serviços', order: 0 },
    { page: 'home', sectionKey: 'kpis', label: 'KPIs Strip', order: 1 },
    { page: 'home', sectionKey: 'stack', label: 'Stack Marquee', order: 2 },
    { page: 'home', sectionKey: 'vitral', label: 'Vitral de Serviços', order: 3 },
    { page: 'home', sectionKey: 'timeline', label: 'Timeline do Processo', order: 4 },
    { page: 'home', sectionKey: 'clients', label: 'Clientes (Marquee)', order: 5 },
    { page: 'home', sectionKey: 'band', label: 'Band (Filosofia + CTA)', order: 6 },
    // Services
    { page: 'services', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'services', sectionKey: 'grid', label: 'Grid de Serviços', order: 1 },
    // Solutions
    { page: 'solutions', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'solutions', sectionKey: 'grid', label: 'Grid de Soluções', order: 1 },
    // About
    { page: 'about', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'about', sectionKey: 'cards', label: 'Cards (Missão / Visão / …)', order: 1 },
    { page: 'about', sectionKey: 'values', label: 'Valores / Princípios', order: 2 },
    { page: 'about', sectionKey: 'team', label: 'Time', order: 3 },
    // Blog
    { page: 'blog', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'blog', sectionKey: 'featured', label: 'Post em Destaque', order: 1 },
    { page: 'blog', sectionKey: 'posts', label: 'Grid de Posts', order: 2 },
    // Careers
    { page: 'careers', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'careers', sectionKey: 'perks', label: 'Perks / Benefícios', order: 1 },
    { page: 'careers', sectionKey: 'jobs', label: 'Lista de Vagas', order: 2 },
    // Contact
    { page: 'contact', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'contact', sectionKey: 'wrap', label: 'Canais + Formulário', order: 1 },
    // AI
    { page: 'ai', sectionKey: 'hero', label: 'Hero', order: 0 },
    { page: 'ai', sectionKey: 'benefits', label: 'Benefícios (strip)', order: 1 },
    { page: 'ai', sectionKey: 'cases', label: 'Cases com IA', order: 2 },
    { page: 'ai', sectionKey: 'data', label: 'Dados Orbital', order: 3 },
    { page: 'ai', sectionKey: 'stages', label: 'Etapas / Escopo', order: 4 },
    { page: 'ai', sectionKey: 'cta-band', label: 'CTA Band final', order: 5 },
  ]

  for (const sec of pageSectionsSeed) {
    await prisma.pageSection.upsert({
      where: { page_sectionKey: { page: sec.page, sectionKey: sec.sectionKey } },
      update: { label: sec.label, order: sec.order },
      create: {
        page: sec.page,
        sectionKey: sec.sectionKey,
        label: sec.label,
        order: sec.order,
        isVisible: true,
      },
    })
  }

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
