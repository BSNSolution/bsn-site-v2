import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const liveCardSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  rows: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      highlight: z.string().nullable().optional(),
    })
  ),
  isActive: z.boolean().optional(),
});

const brandPillSchema = z.object({
  personName: z.string().min(1),
  company: z.string().optional().nullable(),
  quote: z.string().min(1),
  avatarUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const homeBandSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  ctaLabel: z.string().min(1),
  ctaUrl: z.string().min(1),
  mono: z.string().min(1),
  isActive: z.boolean().optional(),
});

export default async function homeExtrasRoutes(fastify: FastifyInstance) {
  // ===== LIVE CARD =====
  fastify.get("/home/live-card", async () => {
    return withCache(
      CacheKeys.homeLive,
      async () => {
        const card = await prisma.homeLiveCard.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        });
        return { card };
      },
      3600
    );
  });

  fastify.get("/admin/home/live-card", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const card = await prisma.homeLiveCard.findFirst({ orderBy: { updatedAt: "desc" } });
    return { card };
  });

  fastify.put("/admin/home/live-card", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = liveCardSchema.parse(request.body);
      const existing = await prisma.homeLiveCard.findFirst({ orderBy: { updatedAt: "desc" } });
      const saved = existing
        ? await prisma.homeLiveCard.update({ where: { id: existing.id }, data: data as any })
        : await prisma.homeLiveCard.create({ data: data as any });
      await invalidateCache(CacheKeys.homeLive);
      return saved;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao salvar live card" });
    }
  });

  // ===== BRAND PILL =====
  fastify.get("/home/brand-pill", async () => {
    return withCache(
      CacheKeys.homePill,
      async () => {
        const pill = await prisma.homeBrandPill.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        });
        return { pill };
      },
      3600
    );
  });

  fastify.get("/admin/home/brand-pill", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const pill = await prisma.homeBrandPill.findFirst({ orderBy: { updatedAt: "desc" } });
    return { pill };
  });

  fastify.put("/admin/home/brand-pill", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = brandPillSchema.parse(request.body);
      const existing = await prisma.homeBrandPill.findFirst({ orderBy: { updatedAt: "desc" } });
      const saved = existing
        ? await prisma.homeBrandPill.update({ where: { id: existing.id }, data })
        : await prisma.homeBrandPill.create({ data });
      await invalidateCache(CacheKeys.homePill);
      return saved;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao salvar brand pill" });
    }
  });

  // ===== BAND (Filosofia) =====
  fastify.get("/home/band", async () => {
    return withCache(
      CacheKeys.homeBand,
      async () => {
        const band = await prisma.homeBand.findFirst({
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
        });
        return { band };
      },
      3600
    );
  });

  fastify.get("/admin/home/band", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const band = await prisma.homeBand.findFirst({ orderBy: { updatedAt: "desc" } });
    return { band };
  });

  fastify.put("/admin/home/band", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = homeBandSchema.parse(request.body);
      const existing = await prisma.homeBand.findFirst({ orderBy: { updatedAt: "desc" } });
      const saved = existing
        ? await prisma.homeBand.update({ where: { id: existing.id }, data })
        : await prisma.homeBand.create({ data });
      await invalidateCache(CacheKeys.homeBand);
      return saved;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao salvar band" });
    }
  });
}
