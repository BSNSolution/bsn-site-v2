import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const schema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function processStepsRoutes(fastify: FastifyInstance) {
  fastify.get("/process-steps", async () => {
    return withCache(
      CacheKeys.processSteps,
      async () => {
        const steps = await prisma.processStep.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { steps };
      },
      3600
    );
  });

  fastify.get("/admin/process-steps", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.read")],
  }, async () => {
    const steps = await prisma.processStep.findMany({ orderBy: { order: "asc" } });
    return { steps };
  });

  fastify.post("/admin/process-steps", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("process-steps.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schema.parse(request.body);
      if (data.order === undefined) {
        const max = await prisma.processStep.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
        data.order = (max?.order || 0) + 1;
      }
      const created = await prisma.processStep.create({ data: data as any });
      await invalidateCache(CacheKeys.processSteps);
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar etapa" });
    }
  });

  fastify.put("/admin/process-steps/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("process-steps.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = schema.partial().parse(request.body);
      const updated = await prisma.processStep.update({ where: { id: request.params.id }, data });
      await invalidateCache(CacheKeys.processSteps);
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar etapa" });
    }
  });

  fastify.delete("/admin/process-steps/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("process-steps.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.processStep.delete({ where: { id: request.params.id } });
      await invalidateCache(CacheKeys.processSteps);
      return { message: "Etapa removida" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover etapa" });
    }
  });

  fastify.patch("/admin/process-steps/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("process-steps.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.processStep.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ error: "Etapa não encontrada" });
    const updated = await prisma.processStep.update({
      where: { id: request.params.id },
      data: { isActive: !existing.isActive },
    });
    await invalidateCache(CacheKeys.processSteps);
    return updated;
  });

  // Reorder (drag & drop no admin)
  fastify.patch("/admin/process-steps/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("process-steps.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        items: z.array(z.object({ id: z.string(), order: z.number() })),
      }).parse(request.body);

      await prisma.$transaction(
        body.items.map((item) =>
          prisma.processStep.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      await invalidateCache(CacheKeys.processSteps);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao reordenar etapas" });
    }
  });
}
