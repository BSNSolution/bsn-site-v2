import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const homeSectionSchema = z.object({
  type: z.enum(['HERO', 'ABOUT', 'SERVICES_PREVIEW', 'SOLUTIONS_PREVIEW', 'TESTIMONIALS_PREVIEW', 'CALL_TO_ACTION', 'STATS']),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function homeRoutes(fastify: FastifyInstance) {
  // Public route - obter todas as seções visíveis da home
  fastify.get("/home", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.home,
      async () => {
        const sections = await prisma.homeSection.findMany({
          where: { isVisible: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            type: true,
            title: true,
            subtitle: true,
            content: true,
            imageUrl: true,
            ctaText: true,
            ctaUrl: true,
            order: true,
          },
        });
        return { sections };
      },
      1800 // 30 minutos de cache
    );

    return result;
  });

  // Admin routes
  fastify.get("/admin/home", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const sections = await prisma.homeSection.findMany({
      orderBy: { order: "asc" },
    });

    return { sections };
  });

  fastify.get("/admin/home/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const section = await prisma.homeSection.findUnique({
      where: { id: request.params.id },
    });

    if (!section) {
      reply.code(404).send({ error: "Seção não encontrada" });
      return;
    }

    return section;
  });

  fastify.post("/admin/home", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = homeSectionSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.homeSection.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const section = await prisma.homeSection.create({
        data,
      });

      await invalidateCache(CacheKeys.home);

      return section;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar seção" });
    }
  });

  fastify.put("/admin/home/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = homeSectionSchema.partial().parse(request.body);

      const section = await prisma.homeSection.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.home);
      await invalidateCache(CacheKeys.homeSection(request.params.id));

      return section;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar seção" });
    }
  });

  fastify.delete("/admin/home/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.homeSection.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.home);
      await invalidateCache(CacheKeys.homeSection(request.params.id));

      return { message: "Seção deletada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar seção" });
    }
  });

  fastify.patch("/admin/home/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const section = await prisma.homeSection.findUnique({
      where: { id: request.params.id },
    });

    if (!section) {
      reply.code(404).send({ error: "Seção não encontrada" });
      return;
    }

    const updated = await prisma.homeSection.update({
      where: { id: request.params.id },
      data: { isVisible: !section.isVisible },
    });

    await invalidateCache(CacheKeys.home);
    await invalidateCache(CacheKeys.homeSection(request.params.id));

    return updated;
  });

  // Reordenar seções
  fastify.patch("/admin/home/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      for (const item of items) {
        await prisma.homeSection.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      await invalidateCache(CacheKeys.home);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar seções" });
    }
  });
}