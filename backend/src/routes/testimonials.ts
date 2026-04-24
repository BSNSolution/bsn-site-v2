import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const testimonialSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientRole: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  rating: z.number().min(1).max(5).optional().default(5),
  avatarUrl: optionalUrl,
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function testimonialsRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/testimonials", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.testimonials,
      async () => {
        const testimonials = await prisma.testimonial.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            clientName: true,
            clientRole: true,
            company: true,
            content: true,
            rating: true,
            avatarUrl: true,
            order: true,
          },
        });
        return { testimonials };
      },
      3600
    );

    return result;
  });

  // Admin routes
  fastify.get("/admin/testimonials", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { order: "asc" },
    });

    return { testimonials };
  });

  fastify.get("/admin/testimonials/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: request.params.id },
    });

    if (!testimonial) {
      reply.code(404).send({ error: "Depoimento não encontrado" });
      return;
    }

    return testimonial;
  });

  fastify.post("/admin/testimonials", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = testimonialSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.testimonial.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const testimonial = await prisma.testimonial.create({
        data,
      });

      await invalidateCache(CacheKeys.testimonials);

      return testimonial;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar depoimento" });
    }
  });

  fastify.put("/admin/testimonials/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = testimonialSchema.partial().parse(request.body);

      const testimonial = await prisma.testimonial.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.testimonials);

      return testimonial;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar depoimento" });
    }
  });

  fastify.delete("/admin/testimonials/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.testimonial.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.testimonials);

      return { message: "Depoimento deletado com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar depoimento" });
    }
  });

  fastify.patch("/admin/testimonials/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: request.params.id },
    });

    if (!testimonial) {
      reply.code(404).send({ error: "Depoimento não encontrado" });
      return;
    }

    const updated = await prisma.testimonial.update({
      where: { id: request.params.id },
      data: { isActive: !testimonial.isActive },
    });

    await invalidateCache(CacheKeys.testimonials);

    return updated;
  });

  // Reordenar depoimentos
  fastify.patch("/admin/testimonials/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("testimonials.write")],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      for (const item of items) {
        await prisma.testimonial.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      await invalidateCache(CacheKeys.testimonials);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar depoimentos" });
    }
  });
}