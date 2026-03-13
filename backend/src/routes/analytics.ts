import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const analyticsEventSchema = z.object({
  event: z.string().min(1, "Nome do evento é obrigatório"),
  page: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  data: z.record(z.any()).optional().nullable(),
});

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  event: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || "100")),
});

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Registrar evento (público)
  fastify.post("/analytics/track", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = analyticsEventSchema.parse(request.body);
      
      // Obter IP do cliente
      const ip = request.headers['x-forwarded-for'] as string || 
                 request.headers['x-real-ip'] as string || 
                 request.socket.remoteAddress || 
                 'unknown';

      // Obter User-Agent
      const userAgent = data.userAgent || request.headers['user-agent'] || 'unknown';

      await prisma.analyticsEvent.create({
        data: {
          event: data.event,
          page: data.page,
          userAgent,
          ip: Array.isArray(ip) ? ip[0] : ip,
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
    preHandler: [fastify.authenticate, fastify.requireAdmin],
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

  // Estatísticas gerais
  fastify.get("/admin/analytics/stats", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
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
        // Total de eventos
        prisma.analyticsEvent.count({ where }),
        
        // Eventos por tipo
        prisma.analyticsEvent.groupBy({
          by: ['event'],
          where,
          _count: { event: true },
          orderBy: { _count: { event: 'desc' } },
          take: 10,
        }),
        
        // Page views
        prisma.analyticsEvent.count({
          where: { ...where, event: 'page_view' },
        }),
        
        // Páginas mais visitadas
        prisma.analyticsEvent.groupBy({
          by: ['page'],
          where: { ...where, event: 'page_view' },
          _count: { page: true },
          orderBy: { _count: { page: 'desc' } },
          take: 10,
        }),
        
        // Visitantes únicos (aproximado por IP)
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

  // Dashboard - eventos recentes
  fastify.get("/admin/analytics/recent", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
    preHandler: [fastify.authenticate, fastify.requireAdmin],
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