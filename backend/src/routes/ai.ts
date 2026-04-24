import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const AI_BLOCK_TYPES = ["HERO_BENEFIT", "STAGE", "EDU_HIGHLIGHT"] as const;

const aiBlockSchema = z.object({
  type: z.enum(AI_BLOCK_TYPES),
  tag: z.string().optional().nullable(),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  bullets: z.array(z.string()).optional(),
  colorClass: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function aiRoutes(fastify: FastifyInstance) {
  // PÚBLICO — retorna blocos agrupados por tipo
  fastify.get("/ai-blocks", async () => {
    return withCache(
      CacheKeys.aiBlocks,
      async () => {
        const blocks = await prisma.aIBlock.findMany({
          where: { isActive: true },
          orderBy: [{ type: "asc" }, { order: "asc" }],
        });
        const benefits = blocks.filter((b) => b.type === "HERO_BENEFIT");
        const stages = blocks.filter((b) => b.type === "STAGE");
        const education = blocks.filter((b) => b.type === "EDU_HIGHLIGHT");
        return { blocks, benefits, stages, education };
      },
      3600
    );
  });

  // ADMIN — listar tudo
  fastify.get(
    "/admin/ai-blocks",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async () => {
      const blocks = await prisma.aIBlock.findMany({
        orderBy: [{ type: "asc" }, { order: "asc" }],
      });
      return { blocks };
    }
  );

  fastify.get(
    "/admin/ai-blocks/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const block = await prisma.aIBlock.findUnique({
        where: { id: request.params.id },
      });
      if (!block) {
        reply.code(404).send({ error: "Bloco não encontrado" });
        return;
      }
      return block;
    }
  );

  fastify.post(
    "/admin/ai-blocks",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = aiBlockSchema.parse(request.body);

        if (data.order === undefined) {
          const max = await prisma.aIBlock.findFirst({
            where: { type: data.type },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          data.order = (max?.order || 0) + 1;
        }

        const created = await prisma.aIBlock.create({ data: data as any });
        await invalidateCache(CacheKeys.aiBlocks);
        return created;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        }
        return reply.code(500).send({ error: "Erro ao criar bloco" });
      }
    }
  );

  fastify.put(
    "/admin/ai-blocks/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const data = aiBlockSchema.partial().parse(request.body);
        const updated = await prisma.aIBlock.update({
          where: { id: request.params.id },
          data: data as any,
        });
        await invalidateCache(CacheKeys.aiBlocks);
        return updated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        }
        return reply.code(500).send({ error: "Erro ao atualizar bloco" });
      }
    }
  );

  fastify.delete(
    "/admin/ai-blocks/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await prisma.aIBlock.delete({ where: { id: request.params.id } });
        await invalidateCache(CacheKeys.aiBlocks);
        return { message: "Bloco removido" };
      } catch {
        return reply.code(500).send({ error: "Erro ao remover bloco" });
      }
    }
  );

  fastify.patch(
    "/admin/ai-blocks/:id/toggle",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const existing = await prisma.aIBlock.findUnique({
        where: { id: request.params.id },
      });
      if (!existing) {
        return reply.code(404).send({ error: "Bloco não encontrado" });
      }
      const updated = await prisma.aIBlock.update({
        where: { id: request.params.id },
        data: { isActive: !existing.isActive },
      });
      await invalidateCache(CacheKeys.aiBlocks);
      return updated;
    }
  );

  fastify.patch(
    "/admin/ai-blocks/reorder",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
      try {
        const { items } = request.body;
        for (const item of items) {
          await prisma.aIBlock.update({ where: { id: item.id }, data: { order: item.order } });
        }
        await invalidateCache(CacheKeys.aiBlocks);
        return { message: "Ordem atualizada" };
      } catch {
        reply.code(500).send({ error: "Erro ao reordenar" });
      }
    }
  );
}
