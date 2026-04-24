/**
 * Sincroniza as permissões do seed com o banco sem rodar o seed inteiro.
 * Idempotente: cria o que falta, atualiza label/category se mudou,
 * e re-atribui as permissões dos grupos de sistema.
 *
 * Executa:
 *   npx tsx scripts/sync-permissions.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PERMISSION_DEFS = [
  // Dashboard / sistema
  { category: 'Sistema', slug: 'dashboard.view', label: 'Ver dashboard' },
  { category: 'Sistema', slug: 'settings.read', label: 'Ver configurações' },
  { category: 'Sistema', slug: 'settings.write', label: 'Editar configurações' },
  { category: 'Sistema', slug: 'uploads.read', label: 'Ver uploads' },
  { category: 'Sistema', slug: 'uploads.write', label: 'Enviar e remover uploads' },
  { category: 'Sistema', slug: 'analytics.view', label: 'Ver analytics' },
  { category: 'Sistema', slug: 'api-tokens.read', label: 'Ver tokens de API' },
  { category: 'Sistema', slug: 'api-tokens.write', label: 'Criar/revogar tokens de API' },
  { category: 'Sistema', slug: 'page-sections.write', label: 'Editar visibilidade/ordem de seções das páginas' },
  // Usuários
  { category: 'Usuários', slug: 'users.read', label: 'Listar usuários' },
  { category: 'Usuários', slug: 'users.write', label: 'Criar/editar usuários' },
  { category: 'Usuários', slug: 'users.delete', label: 'Excluir usuários' },
  { category: 'Usuários', slug: 'groups.read', label: 'Listar grupos de permissões' },
  { category: 'Usuários', slug: 'groups.write', label: 'Criar/editar grupos' },
  { category: 'Usuários', slug: 'groups.delete', label: 'Excluir grupos' },
  // Home
  { category: 'Home', slug: 'home.read', label: 'Ver seções da home' },
  { category: 'Home', slug: 'home.write', label: 'Editar seções da home' },
  { category: 'Home', slug: 'home.kpis.write', label: 'Editar KPIs, live card, pill, band e stack' },
  // Serviços
  { category: 'Serviços', slug: 'services.read', label: 'Ver serviços' },
  { category: 'Serviços', slug: 'services.write', label: 'Criar/editar serviços' },
  { category: 'Serviços', slug: 'process-steps.write', label: 'Editar etapas do processo' },
  // Soluções
  { category: 'Soluções', slug: 'solutions.read', label: 'Ver soluções' },
  { category: 'Soluções', slug: 'solutions.write', label: 'Criar/editar soluções' },
  // Sobre
  { category: 'Sobre', slug: 'about.read', label: 'Ver página Sobre' },
  { category: 'Sobre', slug: 'about.write', label: 'Editar cards, valores e equipe' },
  { category: 'Sobre', slug: 'team.write', label: 'Editar equipe' },
  // Blog
  { category: 'Blog', slug: 'blog.read', label: 'Ver posts' },
  { category: 'Blog', slug: 'blog.write', label: 'Criar/editar posts' },
  { category: 'Blog', slug: 'blog.publish', label: 'Publicar / destacar posts' },
  { category: 'Blog', slug: 'blog.delete', label: 'Excluir posts' },
  // Carreiras
  { category: 'Carreiras', slug: 'jobs.read', label: 'Ver vagas' },
  { category: 'Carreiras', slug: 'jobs.write', label: 'Criar/editar vagas' },
  { category: 'Carreiras', slug: 'perks.write', label: 'Editar benefícios' },
  // Social proof
  { category: 'Social proof', slug: 'testimonials.write', label: 'Editar depoimentos' },
  { category: 'Social proof', slug: 'clients.write', label: 'Editar clientes' },
  // Inbox
  { category: 'Inbox', slug: 'inbox.read', label: 'Ver mensagens de contato' },
  { category: 'Inbox', slug: 'inbox.reply', label: 'Responder mensagens' },
  { category: 'Inbox', slug: 'inbox.delete', label: 'Excluir mensagens' },
  // Página IA
  { category: 'Página IA', slug: 'ai-blocks.read', label: 'Ver blocos da página IA' },
  { category: 'Página IA', slug: 'ai-blocks.write', label: 'Editar blocos da página IA' },
  // LLM
  { category: 'IA / LLM', slug: 'ai-configs.read', label: 'Ver configurações de IA' },
  { category: 'IA / LLM', slug: 'ai-configs.write', label: 'Criar/editar configurações de IA' },
  { category: 'IA / LLM', slug: 'ai-configs.delete', label: 'Excluir configurações de IA' },
  { category: 'IA / LLM', slug: 'ai.use', label: 'Usar IA (gerar/melhorar texto, gerar post via URL)' },
]

const EDITOR_SLUGS = [
  'dashboard.view',
  'home.read', 'home.write', 'home.kpis.write',
  'services.read', 'services.write',
  'solutions.read', 'solutions.write',
  'about.read', 'about.write', 'team.write',
  'process-steps.write',
  'blog.read', 'blog.write', 'blog.publish',
  'jobs.read', 'jobs.write', 'perks.write',
  'testimonials.write', 'clients.write',
  'inbox.read', 'inbox.reply',
  'uploads.read', 'uploads.write',
  'ai-blocks.read', 'ai-blocks.write',
  'ai.use',
]

const GUEST_SLUGS = [
  'dashboard.view',
  'home.read',
  'services.read', 'solutions.read',
  'about.read', 'blog.read', 'jobs.read',
  'uploads.read', 'settings.read',
  'inbox.read',
  'ai-blocks.read', 'ai-configs.read',
  'groups.read', 'users.read',
]

const DEVELOPER_EXCLUDE = ['users.delete', 'groups.delete', 'ai-configs.delete']

async function main() {
  console.log('Sincronizando permissões…\n')

  // 1. Upsert permissões (cria novas, atualiza label/category)
  let created = 0, updated = 0
  for (const def of PERMISSION_DEFS) {
    const existing = await prisma.permission.findUnique({ where: { slug: def.slug } })
    if (!existing) {
      await prisma.permission.create({ data: { ...def, description: null } })
      created++
      console.log(`  + criada:   ${def.slug}`)
    } else if (existing.label !== def.label || existing.category !== def.category) {
      await prisma.permission.update({
        where: { slug: def.slug },
        data: { label: def.label, category: def.category },
      })
      updated++
      console.log(`  ~ atualizada: ${def.slug}`)
    }
  }
  console.log(`\n${created} criadas, ${updated} atualizadas\n`)

  // 2. Remover permissões órfãs (slugs não mais no seed)
  const seedSlugs = new Set(PERMISSION_DEFS.map((p) => p.slug))
  const allInDb = await prisma.permission.findMany()
  const orphans = allInDb.filter((p) => !seedSlugs.has(p.slug))
  if (orphans.length > 0) {
    console.log(`Removendo ${orphans.length} permissões órfãs:`)
    for (const o of orphans) {
      console.log(`  - removida: ${o.slug}`)
      await prisma.permission.delete({ where: { id: o.id } })
    }
  }

  // 3. Re-sincronizar grupos de sistema
  const all = await prisma.permission.findMany()
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  const pick = (slugs: string[]) =>
    slugs.map((s) => bySlug.get(s)).filter(Boolean).map((p) => ({ id: p!.id }))

  async function setGroupPerms(name: string, permIds: { id: string }[]) {
    const g = await prisma.permissionGroup.findFirst({ where: { name } })
    if (!g) {
      console.log(`  ! grupo "${name}" não encontrado — pulando`)
      return
    }
    // Reset: desconecta tudo e conecta os novos
    await prisma.permissionGroup.update({
      where: { id: g.id },
      data: { permissions: { set: [] } },
    })
    await prisma.permissionGroup.update({
      where: { id: g.id },
      data: { permissions: { connect: permIds } },
    })
    console.log(`  ~ grupo "${name}": ${permIds.length} permissões`)
  }

  console.log('\nSincronizando grupos de sistema:')
  await setGroupPerms('Administrador', all.map((p) => ({ id: p.id })))
  await setGroupPerms(
    'Desenvolvedor',
    all.filter((p) => !DEVELOPER_EXCLUDE.includes(p.slug)).map((p) => ({ id: p.id }))
  )
  await setGroupPerms('Editor', pick(EDITOR_SLUGS))
  await setGroupPerms('Convidado', pick(GUEST_SLUGS))

  console.log('\n✓ Sincronização completa.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
