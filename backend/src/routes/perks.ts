import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const perkSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function perksRoutes(fastify: FastifyInstance) {
  fastify.get("/perks", async () => {
    return withCache(
      CacheKeys.perks,
      async () => {
        const perks = await prisma.perk.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { perks };
      },
      3600
    );
  });

  fastify.get("/admin/perks", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const perks = await prisma.perk.findMany({ orderBy: { order: "asc" } });
    return { perks };
  });

  fastify.post("/admin/perks", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = perkSchema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.perk.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.perk.create({ data: data as any });
      await invalidateCache(CacheKeys.perks);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar benefício" });
    }
  });

  fastify.put("/admin/perks/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = perkSchema.partial().parse(request.body);
      const updated = await prisma.perk.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.perks);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar benefício" });
    }
  });

  fastify.delete("/admin/perks/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.perk.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.perks);
      return { message: "Benefício removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover benefício" });
    }
  });

  fastify.patch("/admin/perks/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.perk.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.code(404).send({ error: "Benefício não encontrado" });
    }
    const updated = await prisma.perk.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.perks);
    return updated;
  });
}
