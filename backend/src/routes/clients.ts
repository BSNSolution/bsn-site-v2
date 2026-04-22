import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  logoUrl: z.string().url("URL do logo inválida").or(z.literal("")),
  websiteUrl: optionalUrl,
  sector: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function clientsRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/clients", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.clients,
      async () => {
        const clients = await prisma.client.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { clients };
      },
      3600
    );

    return result;
  });

  // Admin routes
  fastify.get("/admin/clients", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const clients = await prisma.client.findMany({
      orderBy: { order: "asc" },
    });

    return { clients };
  });

  fastify.get("/admin/clients/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const client = await prisma.client.findUnique({
      where: { id: request.params.id },
    });

    if (!client) {
      reply.code(404).send({ error: "Cliente não encontrado" });
      return;
    }

    return client;
  });

  fastify.post("/admin/clients", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = clientSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.client.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const client = await prisma.client.create({
        data,
      });

      await invalidateCache(CacheKeys.clients);

      return client;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar cliente" });
    }
  });

  fastify.put("/admin/clients/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = clientSchema.partial().parse(request.body);

      const client = await prisma.client.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.clients);

      return client;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar cliente" });
    }
  });

  fastify.delete("/admin/clients/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.client.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.clients);

      return { message: "Cliente deletado com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar cliente" });
    }
  });

  fastify.patch("/admin/clients/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const client = await prisma.client.findUnique({
      where: { id: request.params.id },
    });

    if (!client) {
      reply.code(404).send({ error: "Cliente não encontrado" });
      return;
    }

    const updated = await prisma.client.update({
      where: { id: request.params.id },
      data: { isActive: !client.isActive },
    });

    await invalidateCache(CacheKeys.clients);

    return updated;
  });

  // Reordenar clientes
  fastify.patch("/admin/clients/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      for (const item of items) {
        await prisma.client.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      await invalidateCache(CacheKeys.clients);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar clientes" });
    }
  });
}