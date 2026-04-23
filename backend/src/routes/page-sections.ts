import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

// Páginas aceitas — mantido em sincronia com o seed e com o frontend
const VALID_PAGES = [
  "home",
  "services",
  "solutions",
  "about",
  "blog",
  "careers",
  "contact",
  "ai",
] as const;
type ValidPage = (typeof VALID_PAGES)[number];

function isValidPage(page: string): page is ValidPage {
  return (VALID_PAGES as readonly string[]).includes(page);
}

const updateSchema = z.object({
  isVisible: z.boolean().optional(),
  label: z.string().min(1).optional(),
  order: z.number().int().optional(),
});

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export default async function pageSectionsRoutes(fastify: FastifyInstance) {
  // ───────── PÚBLICO: só visíveis, ordenadas ─────────
  fastify.get(
    "/pages/:page/sections",
    async (
      request: FastifyRequest<{ Params: { page: string } }>,
      reply: FastifyReply
    ) => {
      const { page } = request.params;
      if (!isValidPage(page)) {
        return reply.code(400).send({ error: "Página inválida" });
      }
      return withCache(
        CacheKeys.pageSections(page),
        async () => {
          const sections = await prisma.pageSection.findMany({
            where: { page, isVisible: true },
            orderBy: { order: "asc" },
          });
          return { sections };
        },
        3600
      );
    }
  );

  // ───────── ADMIN: todas as sections da página ─────────
  fastify.get(
    "/admin/pages/:page/sections",
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
    },
    async (
      request: FastifyRequest<{ Params: { page: string } }>,
      reply: FastifyReply
    ) => {
      const { page } = request.params;
      if (!isValidPage(page)) {
        return reply.code(400).send({ error: "Página inválida" });
      }
      const sections = await prisma.pageSection.findMany({
        where: { page },
        orderBy: { order: "asc" },
      });
      return { sections };
    }
  );

  // ───────── ADMIN: editar section (isVisible / label) ─────────
  fastify.put(
    "/admin/pages/:page/sections/:id",
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
    },
    async (
      request: FastifyRequest<{ Params: { page: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const { page, id } = request.params;
      if (!isValidPage(page)) {
        return reply.code(400).send({ error: "Página inválida" });
      }
      try {
        const data = updateSchema.parse(request.body);
        const existing = await prisma.pageSection.findUnique({ where: { id } });
        if (!existing || existing.page !== page) {
          return reply.code(404).send({ error: "Section não encontrada" });
        }
        const updated = await prisma.pageSection.update({
          where: { id },
          data,
        });
        await invalidateCache(CacheKeys.pageSections(page));
        return updated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        return reply.code(500).send({ error: "Erro ao atualizar section" });
      }
    }
  );

  // ───────── ADMIN: reordenar sections ─────────
  fastify.put(
    "/admin/pages/:page/sections/reorder",
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
    },
    async (
      request: FastifyRequest<{ Params: { page: string } }>,
      reply: FastifyReply
    ) => {
      const { page } = request.params;
      if (!isValidPage(page)) {
        return reply.code(400).send({ error: "Página inválida" });
      }
      try {
        const { ids } = reorderSchema.parse(request.body);
        // Valida que todos os ids pertencem à página
        const owned = await prisma.pageSection.findMany({
          where: { id: { in: ids }, page },
          select: { id: true },
        });
        if (owned.length !== ids.length) {
          return reply
            .code(400)
            .send({ error: "Lista de ids contém section que não é desta página" });
        }
        await prisma.$transaction(
          ids.map((id, idx) =>
            prisma.pageSection.update({
              where: { id },
              data: { order: idx },
            })
          )
        );
        await invalidateCache(CacheKeys.pageSections(page));
        const sections = await prisma.pageSection.findMany({
          where: { page },
          orderBy: { order: "asc" },
        });
        return { sections };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Dados inválidos", details: error.errors });
        }
        return reply.code(500).send({ error: "Erro ao reordenar sections" });
      }
    }
  );
}
