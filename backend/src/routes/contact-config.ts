import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

// ============================================================
// Configuração da página /contato (singleton — 1 registro ativo)
// + Tipos de projeto (CRUD com reorder).
//
// Substitui a derivação automática de Service.subtitle (bug em
// ContactPage.tsx que gerava chips com "sob", "&", "de" etc.).
// ============================================================

const contactConfigSchema = z.object({
  pageTitle: z.string().min(1),
  pageSubtitle: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  whatsappNumber: z.string().min(1),
  address: z.string().min(1),
  addressLat: z.number().nullable().optional(),
  addressLng: z.number().nullable().optional(),
  businessHours: z.string().min(1),
  responseTimeText: z.string().min(1),
  showMap: z.boolean().optional(),
  showBriefForm: z.boolean().optional(),
  showProjectTypes: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const projectTypeSchema = z.object({
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export default async function contactConfigRoutes(fastify: FastifyInstance) {
  // ============================================================
  // Public — leitura cacheada
  // ============================================================
  fastify.get("/contact-config", async () => {
    return withCache(
      CacheKeys.contactConfig,
      async () => {
        const config = await prisma.contactPageConfig.findFirst({
          orderBy: { updatedAt: "desc" },
        });
        return { config };
      },
      3600
    );
  });

  fastify.get("/contact-project-types", async () => {
    return withCache(
      CacheKeys.contactProjectTypes,
      async () => {
        const types = await prisma.contactProjectType.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { types };
      },
      3600
    );
  });

  // ============================================================
  // Admin — Config (singleton)
  // ============================================================
  fastify.get(
    "/admin/contact-config",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.read"),
      ],
    },
    async () => {
      const config = await prisma.contactPageConfig.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return { config };
    }
  );

  fastify.put(
    "/admin/contact-config",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = contactConfigSchema.parse(request.body);
        const existing = await prisma.contactPageConfig.findFirst({
          orderBy: { updatedAt: "desc" },
        });
        const saved = existing
          ? await prisma.contactPageConfig.update({
              where: { id: existing.id },
              data: data as any,
            })
          : await prisma.contactPageConfig.create({ data: data as any });
        await invalidateCache(CacheKeys.contactConfig);
        return saved;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        fastify.log.error(
          { err: error, body: request.body },
          "Erro ao salvar contact-config"
        );
        return reply.code(500).send({
          error: "Erro ao salvar configurações de contato",
          message:
            error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // ============================================================
  // Admin — Project Types (CRUD + reorder + toggle)
  // IMPORTANTE: rotas estáticas (/reorder) declaradas ANTES das
  // dinâmicas (/:id) — find-my-way prioriza estática mas seguir
  // a ordem deixa o código mais previsível.
  // ============================================================
  fastify.get(
    "/admin/contact-project-types",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.read"),
      ],
    },
    async () => {
      const types = await prisma.contactProjectType.findMany({
        orderBy: { order: "asc" },
      });
      return { types };
    }
  );

  fastify.post(
    "/admin/contact-project-types",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = projectTypeSchema.parse(request.body);
        // Auto-order: pega o maior + 1 se não vier no body
        if (data.order === undefined) {
          const max = await prisma.contactProjectType.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
          });
          data.order = (max?.order ?? 0) + 1;
        }
        const created = await prisma.contactProjectType.create({
          data: data as any,
        });
        await invalidateCache(CacheKeys.contactProjectTypes);
        return created;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        return reply
          .code(500)
          .send({ error: "Erro ao criar tipo de projeto" });
      }
    }
  );

  fastify.patch(
    "/admin/contact-project-types/reorder",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = reorderSchema.parse(request.body);
        await prisma.$transaction(
          body.items.map((item) =>
            prisma.contactProjectType.update({
              where: { id: item.id },
              data: { order: item.order },
            })
          )
        );
        await invalidateCache(CacheKeys.contactProjectTypes);
        return { success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        return reply
          .code(500)
          .send({ error: "Erro ao reordenar tipos de projeto" });
      }
    }
  );

  fastify.put(
    "/admin/contact-project-types/:id",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const data = projectTypeSchema.partial().parse(request.body);
        const updated = await prisma.contactProjectType.update({
          where: { id: request.params.id },
          data: data as any,
        });
        await invalidateCache(CacheKeys.contactProjectTypes);
        return updated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        return reply
          .code(500)
          .send({ error: "Erro ao atualizar tipo de projeto" });
      }
    }
  );

  fastify.delete(
    "/admin/contact-project-types/:id",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await prisma.contactProjectType.delete({
          where: { id: request.params.id },
        });
        await invalidateCache(CacheKeys.contactProjectTypes);
        return { message: "Tipo removido" };
      } catch {
        return reply
          .code(500)
          .send({ error: "Erro ao remover tipo de projeto" });
      }
    }
  );

  fastify.patch(
    "/admin/contact-project-types/:id/toggle",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("contact.write"),
      ],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const existing = await prisma.contactProjectType.findUnique({
        where: { id: request.params.id },
      });
      if (!existing) {
        return reply
          .code(404)
          .send({ error: "Tipo de projeto não encontrado" });
      }
      const updated = await prisma.contactProjectType.update({
        where: { id: request.params.id },
        data: { isActive: !existing.isActive },
      });
      await invalidateCache(CacheKeys.contactProjectTypes);
      return updated;
    }
  );
}
