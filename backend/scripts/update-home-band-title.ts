import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const newTitle =
    'Software fácil de usar.<br><em>Difícil de ignorar.</em><br>Feito para durar.'
  const result = await prisma.homeBand.updateMany({ data: { title: newTitle } })
  console.log(`HomeBand title atualizado — ${result.count} linha(s)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
