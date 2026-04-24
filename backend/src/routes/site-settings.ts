import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const siteSettingsSchema = z.object({
  siteName: z.string().min(1, "Nome do site é obrigatório"),
  siteDescription: z.string().optional().nullable(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  
  // Redes sociais
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  twitterUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  
  // SEO
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  
  // Configurações
  maintenanceMode: z.boolean().optional(),
  allowContactForm: z.boolean().optional(),
});

export default async function siteSettingsRoutes(fastify: FastifyInstance) {
  // Public route - obter configurações públicas
  fastify.get("/settings", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.siteSettings,
      async () => {
        const settings = await prisma.siteSettings.findFirst({
          select: {
            siteName: true,
            siteDescription: true,
            logoUrl: true,
            faviconUrl: true,
            email: true,
            phone: true,
            address: true,
            facebookUrl: true,
            instagramUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            youtubeUrl: true,
            metaTitle: true,
            metaDescription: true,
            metaKeywords: true,
            maintenanceMode: true,
            allowContactForm: true,
          },
        });

        // Se não existir configuração, retornar padrões
        if (!settings) {
          return {
            siteName: "BSN Solution",
            siteDescription: "Soluções em tecnologia e desenvolvimento",
            maintenanceMode: false,
            allowContactForm: true,
          };
        }

        return settings;
      },
      3600 // 1 hora de cache
    );

    return result;
  });

  // Admin routes
  fastify.get("/admin/settings", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.read")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    let settings = await prisma.siteSettings.findFirst();

    // Se não existir configuração, criar uma padrão
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: "BSN Solution",
          siteDescription: "Soluções em tecnologia e desenvolvimento",
          email: "contato@bsnsolution.com.br",
          phone: "+55 (65) 99999-9999",
          address: "Cuiabá, Mato Grosso, Brasil",
          metaTitle: "BSN Solution - Desenvolvimento e Tecnologia",
          metaDescription: "Especialistas em desenvolvimento web, mobile e soluções em tecnologia em Cuiabá-MT",
          maintenanceMode: false,
          allowContactForm: true,
        },
      });
    }

    return settings;
  });

  fastify.put("/admin/settings", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = siteSettingsSchema.parse(request.body);

      // Buscar configuração existente
      let settings = await prisma.siteSettings.findFirst();

      if (settings) {
        // Atualizar existente
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data,
        });
      } else {
        // Criar nova
        settings = await prisma.siteSettings.create({
          data,
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.siteSettings);

      return settings;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao salvar configurações" });
    }
  });

  // Ativar/desativar modo de manutenção rapidamente
  fastify.patch("/admin/settings/maintenance", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.write")],
  }, async (request: FastifyRequest<{ Body: { enabled: boolean } }>, reply: FastifyReply) => {
    try {
      const { enabled } = request.body;

      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            siteName: "BSN Solution",
            maintenanceMode: enabled,
          },
        });
      } else {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: { maintenanceMode: enabled },
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.siteSettings);

      return {
        success: true,
        maintenanceMode: settings.maintenanceMode,
        message: enabled ? "Modo de manutenção ativado" : "Modo de manutenção desativado",
      };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao alterar modo de manutenção" });
    }
  });

  // Ativar/desativar formulário de contato
  fastify.patch("/admin/settings/contact-form", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.write")],
  }, async (request: FastifyRequest<{ Body: { enabled: boolean } }>, reply: FastifyReply) => {
    try {
      const { enabled } = request.body;

      let settings = await prisma.siteSettings.findFirst();

      if (!settings) {
        settings = await prisma.siteSettings.create({
          data: {
            siteName: "BSN Solution",
            allowContactForm: enabled,
          },
        });
      } else {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data: { allowContactForm: enabled },
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.siteSettings);

      return {
        success: true,
        allowContactForm: settings.allowContactForm,
        message: enabled ? "Formulário de contato ativado" : "Formulário de contato desativado",
      };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao alterar configuração do formulário" });
    }
  });

  // Backup das configurações
  fastify.get("/admin/settings/backup", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.read")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      reply.code(404).send({ error: "Nenhuma configuração encontrada" });
      return;
    }

    // Remover campos de metadados
    const { id, createdAt, updatedAt, ...backup } = settings;

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="bsn-settings-backup-${new Date().toISOString().split('T')[0]}.json"`);
    
    return backup;
  });

  // Restaurar configurações do backup
  fastify.post("/admin/settings/restore", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("settings.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = siteSettingsSchema.parse(request.body);

      let settings = await prisma.siteSettings.findFirst();

      if (settings) {
        settings = await prisma.siteSettings.update({
          where: { id: settings.id },
          data,
        });
      } else {
        settings = await prisma.siteSettings.create({
          data,
        });
      }

      // Invalidar cache
      await invalidateCache(CacheKeys.siteSettings);

      return {
        success: true,
        message: "Configurações restauradas com sucesso",
        settings,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados do backup inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao restaurar configurações" });
    }
  });
}