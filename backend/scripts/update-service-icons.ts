import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const iconsBySlug: Record<string, string> = {
  'sob-medida': 'code',
  'squads': 'users',
  'automacao': 'workflow',
  'consultoria': 'compass',
  'infra': 'server',
  'suporte': 'life-buoy',
  'outsourcing': 'handshake',
  'ia': 'brain',
  'dados-ia': 'database',
  'product-concept': 'rocket',
  'design-servico': 'palette',
}

async function main() {
  for (const [slug, iconName] of Object.entries(iconsBySlug)) {
    const result = await prisma.service.updateMany({
      where: { slug },
      data: { iconName },
    })
    console.log(`[${slug}] iconName=${iconName} — ${result.count} linha(s) atualizada(s)`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
