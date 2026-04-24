import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const cardSchema = z.object({
  tag: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  colorClass: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function aboutCardsRoutes(fastify: FastifyInstance) {
  fastify.get("/about-cards", async () => {
    return withCache(
      CacheKeys.aboutCards,
      async () => {
        const cards = await prisma.aboutCard.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { cards };
      },
      3600
    );
  });

  fastify.get("/admin/about-cards", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.read")],
  }, async () => {
    const cards = await prisma.aboutCard.findMany({ orderBy: { order: "asc" } });
    return { cards };
  });

  fastify.post("/admin/about-cards", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = cardSchema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.aboutCard.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.aboutCard.create({ data: data as any });
      await invalidateCache(CacheKeys.aboutCards);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar card" });
    }
  });

  fastify.put("/admin/about-cards/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = cardSchema.partial().parse(request.body);
      const updated = await prisma.aboutCard.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.aboutCards);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar card" });
    }
  });

  fastify.delete("/admin/about-cards/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.aboutCard.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.aboutCards);
      return { message: "Card removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover card" });
    }
  });

  fastify.patch("/admin/about-cards/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.aboutCard.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.code(404).send({ error: "Card não encontrado" });
    }
    const updated = await prisma.aboutCard.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.aboutCards);
    return updated;
  });

  fastify.patch("/admin/about-cards/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;
      for (const item of items) {
        await prisma.aboutCard.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await invalidateCache(CacheKeys.aboutCards);
      return { message: "Ordem atualizada" };
    } catch {
      reply.code(500).send({ error: "Erro ao reordenar" });
    }
  });
}
