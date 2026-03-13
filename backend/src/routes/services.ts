import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

// Helper para validar URL opcional (aceita string vazia, null ou URL válida)
const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const serviceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(1, "Descrição é obrigatória"),
  content: z.string().optional().nullable(),
  imageUrl: optionalUrl,
  iconName: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function servicesRoutes(fastify: FastifyInstance) {
  // Public routes (com cache)
  fastify.get("/services", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.services,
      async () => {
        const services = await prisma.service.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            description: true,
            content: true,
            imageUrl: true,
            iconName: true,
            order: true,
          },
        });
        return { services };
      },
      3600 // 1 hora de cache
    );

    return result;
  });

  fastify.get("/services/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.service(request.params.id),
      async () => {
        const service = await prisma.service.findFirst({
          where: {
            id: request.params.id,
            isActive: true,
          },
        });

        if (!service) {
          reply.code(404).send({ error: "Serviço não encontrado" });
          return null;
        }

        return service;
      },
      3600
    );

    if (!result) {
      return;
    }

    return result;
  });

  // Admin routes
  fastify.get("/admin/services", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const services = await prisma.service.findMany({
      orderBy: { order: "asc" },
    });

    return { services };
  });

  fastify.get("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
    });

    if (!service) {
      reply.code(404).send({ error: "Serviço não encontrado" });
      return;
    }

    return service;
  });

  fastify.post("/admin/services", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = serviceSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.service.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const service = await prisma.service.create({
        data,
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.services);

      return service;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar serviço" });
    }
  });

  fastify.put("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = serviceSchema.partial().parse(request.body);

      const service = await prisma.service.update({
        where: { id: request.params.id },
        data,
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.services);
      await invalidateCache(CacheKeys.service(request.params.id));

      return service;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar serviço" });
    }
  });

  fastify.delete("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.service.delete({
        where: { id: request.params.id },
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.services);
      await invalidateCache(CacheKeys.service(request.params.id));

      return { message: "Serviço deletado com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar serviço" });
    }
  });

  fastify.patch("/admin/services/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
    });

    if (!service) {
      reply.code(404).send({ error: "Serviço não encontrado" });
      return;
    }

    const updated = await prisma.service.update({
      where: { id: request.params.id },
      data: { isActive: !service.isActive },
    });

    // Invalidar cache
    await invalidateCache(CacheKeys.services);
    await invalidateCache(CacheKeys.service(request.params.id));

    return updated;
  });

  // Reordenar serviços
  fastify.patch("/admin/services/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      // Atualizar ordem de cada item
      for (const item of items) {
        await prisma.service.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.services);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar serviços" });
    }
  });
}