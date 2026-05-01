import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";

const analyticsEventSchema = z.object({
  event: z.string().min(1, "Nome do evento é obrigatório"),
  page: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  // Novos campos opcionais (frontend envia para enriquecer analytics
  // sem regredir consumidores antigos que enviam só event/page).
  sessionId: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
  data: z.record(z.any()).optional().nullable(),
});

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  event: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || "100")),
});

const summaryQuerySchema = z.object({
  period: z.enum(["today", "7d", "30d", "90d", "1y"]).optional().default("30d"),
});

function periodToDays(period: string): number {
  switch (period) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfHour(d: Date): Date {
  const x = new Date(d);
  x.setMinutes(0, 0, 0);
  return x;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Registrar evento (público)
  fastify.post("/analytics/track", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = analyticsEventSchema.parse(request.body);

      // Obter IP do cliente
      const rawIp =
        (request.headers["x-forwarded-for"] as string) ||
        (request.headers["x-real-ip"] as string) ||
        request.socket.remoteAddress ||
        "unknown";
      const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;

      // Obter User-Agent
      const userAgent = data.userAgent || request.headers["user-agent"] || "unknown";

      await prisma.analyticsEvent.create({
        data: {
          event: data.event,
          page: data.page,
          userAgent,
          ip, // legacy (backward compat)
          ipHash: hashIp(ip),
          sessionId: data.sessionId ?? null,
          referrer:
            data.referrer ??
            (request.headers.referer?.toString() ?? null),
          data: data.data,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      // Para analytics, não queremos falhar a requisição
      console.error("Erro ao registrar evento de analytics:", error);
      return { success: false };
    }
  });

  // Admin routes
  fastify.get("/admin/analytics/events", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("analytics.view")],
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const { startDate, endDate, event, page, limit } = querySchema.parse(request.query);

      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (event) where.event = event;
      if (page) where.page = page;

      const events = await prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return { events };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Parâmetros inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao buscar eventos" });
    }
  });

  // Estatísticas gerais (legado — mantido pra compat)
  fastify.get("/admin/analytics/stats", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("analytics.view")],
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const { startDate, endDate } = querySchema.parse(request.query);

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [
        totalEvents,
        eventsByType,
        pageViews,
        topPages,
        uniqueVisitors,
      ] = await Promise.all([
        prisma.analyticsEvent.count({ where }),
        prisma.analyticsEvent.groupBy({
          by: ['event'],
          where,
          _count: { event: true },
          orderBy: { _count: { event: 'desc' } },
          take: 10,
        }),
        prisma.analyticsEvent.count({
          where: { ...where, event: 'page_view' },
        }),
        prisma.analyticsEvent.groupBy({
          by: ['page'],
          where: { ...where, event: 'page_view' },
          _count: { page: true },
          orderBy: { _count: { page: 'desc' } },
          take: 10,
        }),
        prisma.analyticsEvent.groupBy({
          by: ['ip'],
          where: { ...where, event: 'page_view' },
          _count: { ip: true },
        }),
      ]);

      return {
        totalEvents,
        pageViews,
        uniqueVisitors: uniqueVisitors.length,
        eventsByType: eventsByType.map(item => ({
          event: item.event,
          count: item._count.event,
        })),
        topPages: topPages
          .filter(item => item.page)
          .map(item => ({
            page: item.page,
            views: item._count.page,
          })),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Parâmetros inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao gerar estatísticas" });
    }
  });

  // ============================================================
  // SUMMARY — endpoint único com tudo que o dashboard precisa
  // ============================================================
  fastify.get(
    "/admin/analytics/summary",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("analytics.view"),
      ],
    },
    async (
      request: FastifyRequest<{ Querystring: any }>,
      reply: FastifyReply
    ) => {
      try {
        const { period } = summaryQuerySchema.parse(request.query);
        const days = periodToDays(period);

        const now = new Date();
        const startToday = startOfDay(now);
        const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const startPeriod = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Roda em paralelo todas as queries
        const [
          totalToday,
          total7d,
          total30d,
          totalYear,
          totalAll,
          onlineSessions,
          topPagesRaw,
          topReferrersRaw,
          eventsForChart,
          allSessionsInPeriod,
          bouncedSessions,
        ] = await Promise.all([
          prisma.analyticsEvent.count({
            where: { event: "page_view", createdAt: { gte: startToday } },
          }),
          prisma.analyticsEvent.count({
            where: { event: "page_view", createdAt: { gte: start7d } },
          }),
          prisma.analyticsEvent.count({
            where: { event: "page_view", createdAt: { gte: start30d } },
          }),
          prisma.analyticsEvent.count({
            where: { event: "page_view", createdAt: { gte: startYear } },
          }),
          prisma.analyticsEvent.count({
            where: { event: "page_view" },
          }),
          // Sessões ativas (último evento < 5 min)
          prisma.analyticsEvent.findMany({
            where: {
              createdAt: { gte: fiveMinAgo },
              sessionId: { not: null },
            },
            select: { sessionId: true },
            distinct: ["sessionId"],
          }),
          // Top pages no período selecionado
          prisma.analyticsEvent.groupBy({
            by: ["page"],
            where: {
              event: "page_view",
              createdAt: { gte: startPeriod },
              page: { not: null },
            },
            _count: { page: true },
            orderBy: { _count: { page: "desc" } },
            take: 10,
          }),
          // Top referrers
          prisma.analyticsEvent.groupBy({
            by: ["referrer"],
            where: {
              event: "page_view",
              createdAt: { gte: startPeriod },
              referrer: { not: null },
            },
            _count: { referrer: true },
            orderBy: { _count: { referrer: "desc" } },
            take: 5,
          }),
          // Eventos para gráfico — só os campos necessários
          prisma.analyticsEvent.findMany({
            where: {
              event: "page_view",
              createdAt: { gte: startPeriod },
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
          }),
          // Para bounce rate: sessões totais com pelo menos 1 page_view
          prisma.analyticsEvent.groupBy({
            by: ["sessionId"],
            where: {
              event: "page_view",
              createdAt: { gte: startPeriod },
              sessionId: { not: null },
            },
            _count: { sessionId: true },
          }),
          // Sessões com exatamente 1 page_view (bounced)
          prisma.analyticsEvent
            .groupBy({
              by: ["sessionId"],
              where: {
                event: "page_view",
                createdAt: { gte: startPeriod },
                sessionId: { not: null },
              },
              _count: { sessionId: true },
              having: {
                sessionId: {
                  _count: { equals: 1 },
                },
              },
            })
            .catch(() => [] as any[]),
        ]);

        // Agrupa para gráfico: hoje → por hora; resto → por dia
        const useHourly = period === "today";
        const bucketed = new Map<string, number>();
        for (const ev of eventsForChart) {
          const bucket = useHourly
            ? startOfHour(ev.createdAt).toISOString()
            : startOfDay(ev.createdAt).toISOString();
          bucketed.set(bucket, (bucketed.get(bucket) ?? 0) + 1);
        }

        // Preenche buckets vazios pra gráfico não ter "buracos"
        const byDay: Array<{ date: string; count: number }> = [];
        if (useHourly) {
          // 24h voltando do agora (arredondado para a hora cheia)
          const start = new Date(now);
          start.setMinutes(0, 0, 0);
          for (let i = 23; i >= 0; i--) {
            const d = new Date(start.getTime() - i * 60 * 60 * 1000);
            const key = d.toISOString();
            byDay.push({ date: key, count: bucketed.get(key) ?? 0 });
          }
        } else {
          for (let i = days - 1; i >= 0; i--) {
            const d = startOfDay(
              new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            );
            const key = d.toISOString();
            byDay.push({ date: key, count: bucketed.get(key) ?? 0 });
          }
        }

        const totalSessions = allSessionsInPeriod.length;
        const bouncedCount = (bouncedSessions as any[]).length;
        const bounceRate =
          totalSessions > 0 ? (bouncedCount / totalSessions) * 100 : 0;

        return {
          period,
          totals: {
            today: totalToday,
            week: total7d,
            month: total30d,
            year: totalYear,
            allTime: totalAll,
          },
          online: onlineSessions.length,
          topPages: topPagesRaw
            .filter((p) => p.page)
            .map((p) => ({ page: p.page!, views: p._count.page })),
          topReferrers: topReferrersRaw
            .filter((r) => r.referrer)
            .map((r) => ({
              referrer: r.referrer!,
              count: r._count.referrer,
            })),
          byDay,
          totalSessions,
          bouncedCount,
          bounceRate: Math.round(bounceRate * 10) / 10, // 1 casa decimal
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: "Parâmetros inválidos", details: error.errors });
        }
        request.log.error({ err: error }, "Erro ao gerar summary");
        return reply.code(500).send({ error: "Erro ao gerar resumo" });
      }
    }
  );

  // ============================================================
  // REALTIME — usuários online + últimos eventos (polling 30s)
  // ============================================================
  fastify.get(
    "/admin/analytics/realtime",
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAdmin,
        fastify.requirePermission("analytics.view"),
      ],
    },
    async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [onlineSessions, recentEvents] = await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            createdAt: { gte: fiveMinAgo },
            sessionId: { not: null },
          },
          select: { sessionId: true },
          distinct: ["sessionId"],
        }),
        prisma.analyticsEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            event: true,
            page: true,
            sessionId: true,
            referrer: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        online: onlineSessions.length,
        recentEvents,
      };
    }
  );

  // Dashboard - eventos recentes (legacy)
  fastify.get("/admin/analytics/recent", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("analytics.view")],
  }, async () => {
    const recentEvents = await prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        event: true,
        page: true,
        createdAt: true,
        data: true,
      },
    });

    return { events: recentEvents };
  });

  // Limpar eventos antigos (admin)
  fastify.delete("/admin/analytics/cleanup", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("analytics.view")],
  }, async (request: FastifyRequest<{ Body: { daysToKeep?: number } }>, reply: FastifyReply) => {
    try {
      const daysToKeep = request.body.daysToKeep || 90; // Padrão: 90 dias
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        success: true,
        deletedCount: result.count,
        message: `${result.count} eventos antigos foram removidos`,
      };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao limpar eventos antigos" });
    }
  });
}
