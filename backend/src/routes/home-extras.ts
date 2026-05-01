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

const homeHeroSchema = z.object({
  eyebrowTemplate: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  ctaPrimaryLabel: z.string().min(1),
  ctaPrimaryUrl: z.string().min(1),
  ctaPrimaryIcon: z.string().nullable().optional(),
  ctaSecondaryLabel: z.string().nullable().optional(),
  ctaSecondaryUrl: z.string().nullable().optional(),
  badge1Text: z.string().nullable().optional(),
  badge1HasPulse: z.boolean().optional(),
  badge2Text: z.string().nullable().optional(),
  showFloatingNodes: z.boolean().optional(),
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
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async () => {
    const card = await prisma.homeLiveCard.findFirst({ orderBy: { updatedAt: "desc" } });
    return { card };
  });

  fastify.put("/admin/home/live-card", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
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
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async () => {
    const pill = await prisma.homeBrandPill.findFirst({ orderBy: { updatedAt: "desc" } });
    return { pill };
  });

  fastify.put("/admin/home/brand-pill", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
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
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async () => {
    const band = await prisma.homeBand.findFirst({ orderBy: { updatedAt: "desc" } });
    return { band };
  });

  fastify.put("/admin/home/band", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
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

  // ===== HERO (home pública) =====
  // Singleton: sempre retorna o registro mais recente (sem filtro isActive —
  // o hero é parte obrigatória da home, não tem opção de "esconder").
  fastify.get("/home/hero", async () => {
    return withCache(
      CacheKeys.homeHero,
      async () => {
        const hero = await prisma.homeHero.findFirst({
          orderBy: { updatedAt: "desc" },
        });
        return { hero };
      },
      3600
    );
  });

  fastify.get("/admin/home/hero", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.read")],
  }, async () => {
    const hero = await prisma.homeHero.findFirst({ orderBy: { updatedAt: "desc" } });
    return { hero };
  });

  fastify.put("/admin/home/hero", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("home.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = homeHeroSchema.parse(request.body);
      // Hero é singleton obrigatório — força isActive=true independente do payload
      const data = { ...parsed, isActive: true };
      const existing = await prisma.homeHero.findFirst({ orderBy: { updatedAt: "desc" } });
      const saved = existing
        ? await prisma.homeHero.update({ where: { id: existing.id }, data: data as any })
        : await prisma.homeHero.create({ data: data as any });
      await invalidateCache(CacheKeys.homeHero);
      return saved;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      fastify.log.error({ err: error, body: request.body }, "Erro ao salvar hero");
      return reply.code(500).send({
        error: "Erro ao salvar hero",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
