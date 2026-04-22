import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const solutionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(1, "Descrição é obrigatória"),
  content: z.string().optional().nullable(),
  imageUrl: optionalUrl,
  technologies: z.array(z.string()).optional().default([]),
  projectUrl: optionalUrl,
  githubUrl: optionalUrl,
  tag: z.string().optional().nullable(),
  colorClass: z.string().optional().nullable(),
  bullets: z.array(z.string()).optional().default([]),
  ctaLabel: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function solutionsRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/solutions", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.solutions,
      async () => {
        const solutions = await prisma.solution.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { solutions };
      },
      3600
    );

    return result;
  });

  fastify.get("/solutions/featured", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.solutionsFeatured,
      async () => {
        const solutions = await prisma.solution.findMany({
          where: { 
            isActive: true,
            isFeatured: true,
          },
          orderBy: { order: "asc" },
        });
        return { solutions };
      },
      3600
    );

    return result;
  });

  fastify.get("/solutions/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.solution(request.params.id),
      async () => {
        const solution = await prisma.solution.findFirst({
          where: {
            id: request.params.id,
            isActive: true,
          },
        });

        if (!solution) {
          reply.code(404).send({ error: "Solução não encontrada" });
          return null;
        }

        return solution;
      },
      3600
    );

    if (!result) {
      return;
    }

    return result;
  });

  // Admin routes
  fastify.get("/admin/solutions", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const solutions = await prisma.solution.findMany({
      orderBy: { order: "asc" },
    });

    return { solutions };
  });

  fastify.get("/admin/solutions/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const solution = await prisma.solution.findUnique({
      where: { id: request.params.id },
    });

    if (!solution) {
      reply.code(404).send({ error: "Solução não encontrada" });
      return;
    }

    return solution;
  });

  fastify.post("/admin/solutions", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = solutionSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.solution.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const solution = await prisma.solution.create({
        data,
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.solutions);
      await invalidateCache(CacheKeys.solutionsFeatured);

      return solution;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar solução" });
    }
  });

  fastify.put("/admin/solutions/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = solutionSchema.partial().parse(request.body);

      const solution = await prisma.solution.update({
        where: { id: request.params.id },
        data,
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.solutions);
      await invalidateCache(CacheKeys.solutionsFeatured);
      await invalidateCache(CacheKeys.solution(request.params.id));

      return solution;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar solução" });
    }
  });

  fastify.delete("/admin/solutions/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.solution.delete({
        where: { id: request.params.id },
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.solutions);
      await invalidateCache(CacheKeys.solutionsFeatured);
      await invalidateCache(CacheKeys.solution(request.params.id));

      return { message: "Solução deletada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar solução" });
    }
  });

  fastify.patch("/admin/solutions/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const solution = await prisma.solution.findUnique({
      where: { id: request.params.id },
    });

    if (!solution) {
      reply.code(404).send({ error: "Solução não encontrada" });
      return;
    }

    const updated = await prisma.solution.update({
      where: { id: request.params.id },
      data: { isActive: !solution.isActive },
    });

    // Invalidar cache
    await invalidateCache(CacheKeys.solutions);
    await invalidateCache(CacheKeys.solutionsFeatured);
    await invalidateCache(CacheKeys.solution(request.params.id));

    return updated;
  });

  fastify.patch("/admin/solutions/:id/toggle-featured", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const solution = await prisma.solution.findUnique({
      where: { id: request.params.id },
    });

    if (!solution) {
      reply.code(404).send({ error: "Solução não encontrada" });
      return;
    }

    const updated = await prisma.solution.update({
      where: { id: request.params.id },
      data: { isFeatured: !solution.isFeatured },
    });

    // Invalidar cache
    await invalidateCache(CacheKeys.solutions);
    await invalidateCache(CacheKeys.solutionsFeatured);
    await invalidateCache(CacheKeys.solution(request.params.id));

    return updated;
  });

  // Reordenar soluções
  fastify.patch("/admin/solutions/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      // Atualizar ordem de cada item
      for (const item of items) {
        await prisma.solution.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.solutions);
      await invalidateCache(CacheKeys.solutionsFeatured);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar soluções" });
    }
  });
}