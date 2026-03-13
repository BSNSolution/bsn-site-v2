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

  // 4. Serviços
  await prisma.service.createMany({
    data: [
      {
        title: 'Desenvolvimento Web',
        subtitle: 'Sites e sistemas web modernos',
        description: 'Criamos sites responsivos, sistemas web e e-commerce com as tecnologias mais atuais do mercado.',
        iconName: 'Globe',
        order: 1,
      },
      {
        title: 'Aplicativos Mobile',
        subtitle: 'iOS e Android',
        description: 'Desenvolvimento de aplicativos nativos e híbridos para iOS e Android.',
        iconName: 'Smartphone',
        order: 2,
      },
      {
        title: 'Inteligência Artificial',
        subtitle: 'IA e Automação',
        description: 'Soluções em IA, chatbots, automação de processos e análise de dados.',
        iconName: 'Brain',
        order: 3,
      },
      {
        title: 'UI/UX Design',
        subtitle: 'Design centrado no usuário',
        description: 'Criação de interfaces intuitivas e experiências digitais marcantes.',
        iconName: 'Palette',
        order: 4,
      },
      {
        title: 'DevOps & Cloud',
        subtitle: 'Infraestrutura moderna',
        description: 'Configuração de servidores, CI/CD, monitoramento e serviços em nuvem.',
        iconName: 'Cloud',
        order: 5,
      },
      {
        title: 'Consultoria em TI',
        subtitle: 'Estratégia e planejamento',
        description: 'Consultoria especializada para otimizar processos e escolher as melhores tecnologias.',
        iconName: 'Users',
        order: 6,
      },
    ],
  });

  // 5. Soluções/Portfólio
  await prisma.solution.createMany({
    data: [
      {
        title: 'E-commerce Completo',
        subtitle: 'Loja virtual com gestão integrada',
        description: 'Desenvolvimento de plataforma de e-commerce com sistema de gestão completo.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        isFeatured: true,
        order: 1,
      },
      {
        title: 'App de Delivery',
        subtitle: 'Aplicativo para restaurantes',
        description: 'Aplicativo mobile para pedidos de delivery com painel administrativo.',
        technologies: ['React Native', 'Firebase', 'Node.js'],
        isFeatured: true,
        order: 2,
      },
      {
        title: 'Sistema de Gestão',
        subtitle: 'ERP customizado',
        description: 'Sistema web para gestão empresarial com módulos financeiro, estoque e vendas.',
        technologies: ['Vue.js', 'Laravel', 'MySQL'],
        order: 3,
      },
      {
        title: 'Chatbot Inteligente',
        subtitle: 'Atendimento automatizado',
        description: 'Bot conversacional com IA para atendimento ao cliente 24/7.',
        technologies: ['Python', 'OpenAI', 'WhatsApp API'],
        order: 4,
      },
    ],
  });

  // 6. Depoimentos
  await prisma.testimonial.createMany({
    data: [
      {
        clientName: 'Maria Silva',
        clientRole: 'CEO',
        company: 'Tech Startup',
        content: 'A BSN Solution transformou nossa visão em um produto incrível. Profissionais competentes e muito atenciosos.',
        rating: 5,
        order: 1,
      },
      {
        clientName: 'João Santos',
        clientRole: 'Diretor de TI',
        company: 'Empresa XYZ',
        content: 'Excelente trabalho na modernização do nosso sistema. Projeto entregue no prazo e com qualidade superior.',
        rating: 5,
        order: 2,
      },
      {
        clientName: 'Ana Costa',
        clientRole: 'Empreendedora',
        company: 'Loja Online',
        content: 'O e-commerce desenvolvido pela BSN superou nossas expectativas. Vendas aumentaram 300% no primeiro mês.',
        rating: 5,
        order: 3,
      },
    ],
  });

  // 7. Equipe
  await prisma.teamMember.createMany({
    data: [
      {
        name: 'Bruno Oliveira',
        role: 'CEO & Full Stack Developer',
        bio: 'Especialista em desenvolvimento full stack com mais de 8 anos de experiência em projetos web e mobile.',
        order: 1,
      },
      {
        name: 'Sarah Costa',
        role: 'UI/UX Designer',
        bio: 'Designer apaixonada por criar experiências digitais únicas e centradas no usuário.',
        order: 2,
      },
      {
        name: 'Carlos Mendes',
        role: 'DevOps Engineer',
        bio: 'Especialista em infraestrutura cloud, automação e otimização de performance.',
        order: 3,
      },
      {
        name: 'Lucia Ferreira',
        role: 'Mobile Developer',
        bio: 'Desenvolvedora mobile com expertise em React Native e desenvolvimento nativo.',
        order: 4,
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

  // 9. Vagas
  await prisma.job.createMany({
    data: [
      {
        title: 'Desenvolvedor Full Stack Sênior',
        description: 'Procuramos um desenvolvedor experiente em React, Node.js e bancos de dados.',
        requirements: 'Experiência com React, Node.js, TypeScript, PostgreSQL. Conhecimento em Docker é um plus.',
        benefits: 'Salário competitivo, plano de saúde, home office flexível, vale alimentação.',
        location: 'Cuiabá-MT (Híbrido)',
        type: 'FULL_TIME',
        salary: 'R$ 8.000 - R$ 12.000',
      },
      {
        title: 'UI/UX Designer Pleno',
        description: 'Buscamos designer criativo para criar interfaces incríveis.',
        requirements: 'Experiência em Figma, Adobe Creative Suite, prototipação e design systems.',
        benefits: 'Ambiente criativo, flexibilidade de horário, cursos e certificações pagas.',
        location: 'Cuiabá-MT (Presencial)',
        type: 'FULL_TIME',
        salary: 'R$ 5.000 - R$ 8.000',
      },
    ],
  });

  // 10. Posts do blog
  await prisma.blogPost.createMany({
    data: [
      {
        title: 'Tendências em Desenvolvimento Web para 2024',
        slug: 'tendencias-desenvolvimento-web-2024',
        excerpt: 'Descubra as principais tendências que vão moldar o desenvolvimento web neste ano.',
        content: 'O desenvolvimento web está em constante evolução...',
        tags: ['desenvolvimento', 'web', 'tendências', 'tecnologia'],
        isPublished: true,
        isFeatured: true,
        publishedAt: new Date(),
        authorId: adminUser.id,
      },
      {
        title: 'Como Escolher a Stack Ideal para seu Projeto',
        slug: 'escolher-stack-ideal-projeto',
        excerpt: 'Guia completo para tomar a decisão certa na escolha das tecnologias.',
        content: 'A escolha da stack tecnológica é crucial...',
        tags: ['stack', 'tecnologia', 'desenvolvimento', 'guia'],
        isPublished: true,
        publishedAt: new Date(),
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