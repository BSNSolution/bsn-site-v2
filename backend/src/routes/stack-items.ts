import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const itemSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function stackItemsRoutes(fastify: FastifyInstance) {
  fastify.get("/stack", async () => {
    return withCache(
      CacheKeys.stack,
      async () => {
        const items = await prisma.stackItem.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { items };
      },
      3600
    );
  });

  fastify.get("/admin/stack", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const items = await prisma.stackItem.findMany({ orderBy: { order: "asc" } });
    return { items };
  });

  fastify.post("/admin/stack", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = itemSchema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.stackItem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.stackItem.create({ data: data as any });
      await invalidateCache(CacheKeys.stack);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar item" });
    }
  });

  fastify.put("/admin/stack/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = itemSchema.partial().parse(request.body);
      const updated = await prisma.stackItem.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.stack);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar item" });
    }
  });

  fastify.delete("/admin/stack/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.stackItem.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.stack);
      return { message: "Item removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover item" });
    }
  });

  fastify.patch("/admin/stack/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.stackItem.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.code(404).send({ error: "Item não encontrado" });
    }
    const updated = await prisma.stackItem.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.stack);
    return updated;
  });

  fastify.patch("/admin/stack/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;
      for (const item of items) {
        await prisma.stackItem.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await invalidateCache(CacheKeys.stack);
      return { message: "Ordem atualizada" };
    } catch {
      reply.code(500).send({ error: "Erro ao reordenar" });
    }
  });
}
