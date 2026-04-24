import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const valueSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function valuesRoutes(fastify: FastifyInstance) {
  fastify.get("/values", async () => {
    return withCache(
      CacheKeys.values,
      async () => {
        const values = await prisma.value.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { values };
      },
      3600
    );
  });

  fastify.get("/admin/values", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.read")],
  }, async () => {
    const values = await prisma.value.findMany({ orderBy: { order: "asc" } });
    return { values };
  });

  fastify.post("/admin/values", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = valueSchema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.value.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.value.create({ data: data as any });
      await invalidateCache(CacheKeys.values);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar valor" });
    }
  });

  fastify.put("/admin/values/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = valueSchema.partial().parse(request.body);
      const updated = await prisma.value.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.values);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar valor" });
    }
  });

  fastify.delete("/admin/values/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.value.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.values);
      return { message: "Valor removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover valor" });
    }
  });

  fastify.patch("/admin/values/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.value.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.code(404).send({ error: "Valor não encontrado" });
    }
    const updated = await prisma.value.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.values);
    return updated;
  });

  fastify.patch("/admin/values/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.write")],
  }, async (request: FastifyRequest<{ Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;
      for (const item of items) {
        await prisma.value.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await invalidateCache(CacheKeys.values);
      return { message: "Ordem atualizada" };
    } catch {
      reply.code(500).send({ error: "Erro ao reordenar" });
    }
  });
}
