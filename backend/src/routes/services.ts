import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

// Helper para validar URL opcional (aceita string vazia, null ou URL válida)
const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const featureSchema = z.object({
  title: z.string(),
  description: z.string(),
});

// Slug: lowercase, letras/números/hífen, não começando com hífen
const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve ser lowercase, apenas letras/números/hífen")
  .min(1);

const serviceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(1, "Descrição é obrigatória"),
  content: z.string().optional().nullable(),
  imageUrl: optionalUrl,
  iconName: z.string().optional().nullable(),
  anchor: z.string().optional().nullable(),
  slug: z.union([slugSchema, z.literal(""), z.null()]).optional(),
  numLabel: z.string().optional().nullable(),
  shardColor: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  features: z.array(featureSchema).optional().nullable(),
  tileClass: z.string().optional().nullable(),
  homePill: z.string().optional().nullable(),
  homePillTags: z.array(z.string()).optional(),
  // Página de detalhe
  heroEyebrow: z.string().optional().nullable(),
  heroDescription: z.string().optional().nullable(),
  heroLongText: z.string().optional().nullable(),
  ctaTitle: z.string().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaButtonLabel: z.string().optional().nullable(),
  ctaButtonUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

const blockSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  iconName: z.string().optional().nullable(),
  colorClass: z.string().optional().nullable(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Normaliza slug vazio para null antes de gravar
function normalizeSlug<T extends { slug?: string | null }>(data: T): T {
  if (data.slug === "") {
    return { ...data, slug: null };
  }
  return data;
}

export default async function servicesRoutes(fastify: FastifyInstance) {
  // ─────────────────────────────────────────────────────────────
  // Public routes (com cache)
  // ─────────────────────────────────────────────────────────────
  fastify.get("/services", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.services,
      async () => {
        const services = await prisma.service.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { services };
      },
      3600 // 1 hora de cache
    );

    return result;
  });

  // Detalhe da página /servicos/:slug — inclui blocks ordenados e ativos
  // Rota por slug declarada ANTES de /services/:id para não ser "engolida" por parâmetro genérico.
  fastify.get("/services/slug/:slug", async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.serviceBySlug(request.params.slug),
      async () => {
        const service = await prisma.service.findFirst({
          where: {
            slug: request.params.slug,
            isActive: true,
          },
          include: {
            detailBlocks: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
          },
        });

        if (!service) {
          return null;
        }

        return service;
      },
      3600
    );

    if (!result) {
      reply.code(404).send({ error: "Serviço não encontrado" });
      return;
    }

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
          return null;
        }

        return service;
      },
      3600
    );

    if (!result) {
      reply.code(404).send({ error: "Serviço não encontrado" });
      return;
    }

    return result;
  });

  // ─────────────────────────────────────────────────────────────
  // Admin routes — Serviços
  // ─────────────────────────────────────────────────────────────
  fastify.get("/admin/services", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const services = await prisma.service.findMany({
      orderBy: { order: "asc" },
      include: {
        detailBlocks: {
          orderBy: { order: "asc" },
        },
      },
    });

    return { services };
  });

  fastify.get("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const service = await prisma.service.findUnique({
      where: { id: request.params.id },
      include: {
        detailBlocks: {
          orderBy: { order: "asc" },
        },
      },
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
      const parsed = serviceSchema.parse(request.body);
      const data = normalizeSlug(parsed);

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

      await invalidateCache(CacheKeys.services);

      return service;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      // Unique constraint violation (slug duplicado)
      if (error?.code === "P2002") {
        reply.code(409).send({ error: "Slug já está em uso", field: "slug" });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar serviço" });
    }
  });

  fastify.put("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const parsed = serviceSchema.partial().parse(request.body);
      const data = normalizeSlug(parsed);

      const existing = await prisma.service.findUnique({
        where: { id: request.params.id },
        select: { slug: true },
      });

      const service = await prisma.service.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.services);
      await invalidateCache(CacheKeys.service(request.params.id));
      if (existing?.slug) {
        await invalidateCache(CacheKeys.serviceBySlug(existing.slug));
      }
      if (service.slug) {
        await invalidateCache(CacheKeys.serviceBySlug(service.slug));
      }

      return service;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      if (error?.code === "P2002") {
        reply.code(409).send({ error: "Slug já está em uso", field: "slug" });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar serviço" });
    }
  });

  fastify.delete("/admin/services/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await prisma.service.findUnique({
        where: { id: request.params.id },
        select: { slug: true },
      });

      await prisma.service.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.services);
      await invalidateCache(CacheKeys.service(request.params.id));
      if (existing?.slug) {
        await invalidateCache(CacheKeys.serviceBySlug(existing.slug));
      }

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

    await invalidateCache(CacheKeys.services);
    await invalidateCache(CacheKeys.service(request.params.id));
    if (service.slug) {
      await invalidateCache(CacheKeys.serviceBySlug(service.slug));
    }

    return updated;
  });

  // Reordenar serviços
  fastify.patch("/admin/services/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      for (const item of items) {
        await prisma.service.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      await invalidateCache(CacheKeys.services);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar serviços" });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // Admin routes — Blocks de detalhe
  // ─────────────────────────────────────────────────────────────
  fastify.get(
    "/admin/services/:id/blocks",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const blocks = await prisma.serviceDetailBlock.findMany({
        where: { serviceId: request.params.id },
        orderBy: { order: "asc" },
      });
      return { blocks };
    }
  );

  fastify.post(
    "/admin/services/:id/blocks",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const data = blockSchema.parse(request.body);

        const service = await prisma.service.findUnique({
          where: { id: request.params.id },
          select: { id: true, slug: true },
        });
        if (!service) {
          reply.code(404).send({ error: "Serviço não encontrado" });
          return;
        }

        if (data.order === undefined) {
          const max = await prisma.serviceDetailBlock.findFirst({
            where: { serviceId: request.params.id },
            orderBy: { order: "desc" },
            select: { order: true },
          });
          data.order = (max?.order || 0) + 1;
        }

        const block = await prisma.serviceDetailBlock.create({
          data: { ...data, serviceId: request.params.id },
        });

        await invalidateCache(CacheKeys.services);
        await invalidateCache(CacheKeys.service(request.params.id));
        if (service.slug) {
          await invalidateCache(CacheKeys.serviceBySlug(service.slug));
        }

        return block;
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: error.errors });
          return;
        }
        reply.code(500).send({ error: "Erro ao criar bloco" });
      }
    }
  );

  fastify.put(
    "/admin/services/:id/blocks/:blockId",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string; blockId: string } }>, reply: FastifyReply) => {
      try {
        const data = blockSchema.partial().parse(request.body);

        const service = await prisma.service.findUnique({
          where: { id: request.params.id },
          select: { slug: true },
        });

        const block = await prisma.serviceDetailBlock.update({
          where: { id: request.params.blockId },
          data,
        });

        await invalidateCache(CacheKeys.services);
        await invalidateCache(CacheKeys.service(request.params.id));
        if (service?.slug) {
          await invalidateCache(CacheKeys.serviceBySlug(service.slug));
        }

        return block;
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: error.errors });
          return;
        }
        reply.code(500).send({ error: "Erro ao atualizar bloco" });
      }
    }
  );

  fastify.delete(
    "/admin/services/:id/blocks/:blockId",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string; blockId: string } }>, reply: FastifyReply) => {
      try {
        const service = await prisma.service.findUnique({
          where: { id: request.params.id },
          select: { slug: true },
        });

        await prisma.serviceDetailBlock.delete({
          where: { id: request.params.blockId },
        });

        await invalidateCache(CacheKeys.services);
        await invalidateCache(CacheKeys.service(request.params.id));
        if (service?.slug) {
          await invalidateCache(CacheKeys.serviceBySlug(service.slug));
        }

        return { message: "Bloco removido" };
      } catch (error) {
        reply.code(500).send({ error: "Erro ao remover bloco" });
      }
    }
  );

  fastify.patch(
    "/admin/services/:id/blocks/:blockId/toggle",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string; blockId: string } }>, reply: FastifyReply) => {
      const existing = await prisma.serviceDetailBlock.findUnique({
        where: { id: request.params.blockId },
      });
      if (!existing) {
        reply.code(404).send({ error: "Bloco não encontrado" });
        return;
      }
      const service = await prisma.service.findUnique({
        where: { id: request.params.id },
        select: { slug: true },
      });
      const updated = await prisma.serviceDetailBlock.update({
        where: { id: request.params.blockId },
        data: { isActive: !existing.isActive },
      });
      await invalidateCache(CacheKeys.services);
      await invalidateCache(CacheKeys.service(request.params.id));
      if (service?.slug) {
        await invalidateCache(CacheKeys.serviceBySlug(service.slug));
      }
      return updated;
    }
  );

  fastify.patch(
    "/admin/services/:id/blocks/reorder",
    { preHandler: [fastify.authenticate, fastify.requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { items: { id: string; order: number }[] } }>, reply: FastifyReply) => {
      try {
        const { items } = request.body;
        for (const item of items) {
          await prisma.serviceDetailBlock.update({
            where: { id: item.id },
            data: { order: item.order },
          });
        }
        const service = await prisma.service.findUnique({
          where: { id: request.params.id },
          select: { slug: true },
        });
        await invalidateCache(CacheKeys.services);
        await invalidateCache(CacheKeys.service(request.params.id));
        if (service?.slug) {
          await invalidateCache(CacheKeys.serviceBySlug(service.slug));
        }
        return { message: "Ordem atualizada" };
      } catch (error) {
        reply.code(500).send({ error: "Erro ao reordenar blocos" });
      }
    }
  );
}
