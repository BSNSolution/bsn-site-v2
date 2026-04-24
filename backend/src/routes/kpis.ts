import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const kpiSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  suffix: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function kpisRoutes(fastify: FastifyInstance) {
  fastify.get("/kpis", async () => {
    return withCache(
      CacheKeys.kpis,
      async () => {
        const kpis = await prisma.homeKPI.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { kpis };
      },
      3600
    );
  });

  fastify.get("/admin/kpis", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const kpis = await prisma.homeKPI.findMany({ orderBy: { order: "asc" } });
    return { kpis };
  });

  fastify.post("/admin/kpis", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = kpiSchema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.homeKPI.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.homeKPI.create({ data: data as any });
      await invalidateCache(CacheKeys.kpis);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar KPI" });
    }
  });

  fastify.put("/admin/kpis/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = kpiSchema.partial().parse(request.body);
      const updated = await prisma.homeKPI.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.kpis);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar KPI" });
    }
  });

  fastify.delete("/admin/kpis/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.homeKPI.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.kpis);
      return { message: "KPI removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover KPI" });
    }
  });

  fastify.patch("/admin/kpis/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.homeKPI.findUnique({ where: { id: request.params.id } });
    if (!existing) {
      return reply.code(404).send({ error: "KPI não encontrado" });
    }
    const updated = await prisma.homeKPI.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.kpis);
    return updated;
  });

  fastify.patch("/admin/kpis/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;
      for (const item of items) {
        await prisma.homeKPI.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await invalidateCache(CacheKeys.kpis);
      return { message: "Ordem atualizada" };
    } catch {
      reply.code(500).send({ error: "Erro ao reordenar KPIs" });
    }
  });
}
