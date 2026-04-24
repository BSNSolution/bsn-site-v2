/**
 * Rotas de configuração de provedores de IA + endpoints que consomem
 * as configs (gerar post a partir de URL, melhorar/gerar texto).
 *
 * Endpoints:
 *   GET    /api/admin/ai-configs           — lista todas as configs
 *   GET    /api/admin/ai-configs/active    — retorna se existe ao menos 1 ativa (uso público-admin)
 *   GET    /api/admin/ai-configs/:id       — uma config
 *   POST   /api/admin/ai-configs           — cria
 *   PUT    /api/admin/ai-configs/:id       — atualiza
 *   PATCH  /api/admin/ai-configs/:id/default — marca como default (desmarca as outras)
 *   PATCH  /api/admin/ai-configs/:id/toggle — liga/desliga
 *   DELETE /api/admin/ai-configs/:id       — remove
 *
 *   POST   /api/admin/ai/generate-post     — gera post a partir de uma URL de referência
 *   POST   /api/admin/ai/enhance-text      — melhora/reescreve texto selecionado
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { callLLM, scrapeUrl, buildSystemPrompt } from "../lib/ai-provider";

const aiConfigSchema = z.object({
  name: z.string().min(1),
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string().min(1),
  apiKey: z.string().min(10),
  systemPrompt: z.string().optional().nullable(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(100).max(32000).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const generatePostSchema = z.object({
  url: z.string().url(),
  configId: z.string().uuid().optional(),
});

const enhanceTextSchema = z.object({
  text: z.string().min(1),
  mode: z.enum(["improve", "generate", "expand", "shorten"]).default("improve"),
  instruction: z.string().optional(),
  configId: z.string().uuid().optional(),
});

// Acesso "any" pro Prisma client até o regenerate pegar o model novo
const db: any = prisma;

function maskApiKey(key?: string | null) {
  if (!key) return "";
  if (key.length < 8) return "***";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

function sanitizeConfig(c: any, masked = true) {
  return {
    ...c,
    apiKey: masked ? maskApiKey(c.apiKey) : c.apiKey,
  };
}

async function getConfigFromRequest(configId?: string) {
  let config;
  if (configId) {
    config = await db.aiConfig.findUnique({ where: { id: configId } });
  } else {
    config = await db.aiConfig.findFirst({
      where: { isActive: true, isDefault: true },
    });
    if (!config) {
      config = await db.aiConfig.findFirst({ where: { isActive: true } });
    }
  }
  return config;
}

export default async function aiConfigsRoutes(fastify: FastifyInstance) {
  // Checa se há ao menos 1 config ativa (usado pra mostrar/esconder UI)
  // Endpoint leve de "há IA disponível?" — aceito por quem pode ler configs OU usar IA
  fastify.get(
    "/admin/ai-configs/active",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requireAnyPermission("ai-configs.read", "ai.use")] },
    async () => {
      const count = await db.aiConfig.count({ where: { isActive: true } });
      return { hasActive: count > 0, count };
    }
  );

  fastify.get(
    "/admin/ai-configs",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.read")] },
    async () => {
      const configs = await db.aiConfig.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
      return { configs: configs.map((c: any) => sanitizeConfig(c)) };
    }
  );

  fastify.get(
    "/admin/ai-configs/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.read")] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const c = await db.aiConfig.findUnique({ where: { id: req.params.id } });
      if (!c) return reply.code(404).send({ error: "Config não encontrada" });
      return sanitizeConfig(c);
    }
  );

  fastify.post(
    "/admin/ai-configs",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.write")] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = aiConfigSchema.parse(req.body);
        // Se setou isDefault, desmarca os outros
        if (data.isDefault) {
          await db.aiConfig.updateMany({ data: { isDefault: false } });
        }
        const created = await db.aiConfig.create({ data });
        return sanitizeConfig(created);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: err.errors });
        }
        return reply.code(500).send({ error: err.message });
      }
    }
  );

  fastify.put(
    "/admin/ai-configs/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.write")] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        const data = aiConfigSchema.partial().parse(req.body);
        // Se apiKey vier mascarada, não atualiza
        if (data.apiKey && data.apiKey.includes("...")) {
          delete data.apiKey;
        }
        if (data.isDefault) {
          await db.aiConfig.updateMany({
            where: { NOT: { id: req.params.id } },
            data: { isDefault: false },
          });
        }
        const updated = await db.aiConfig.update({
          where: { id: req.params.id },
          data,
        });
        return sanitizeConfig(updated);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: err.errors });
        }
        return reply.code(500).send({ error: err.message });
      }
    }
  );

  fastify.patch(
    "/admin/ai-configs/:id/default",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.write")] },
    async (req: FastifyRequest<{ Params: { id: string } }>) => {
      await db.aiConfig.updateMany({ data: { isDefault: false } });
      const updated = await db.aiConfig.update({
        where: { id: req.params.id },
        data: { isDefault: true, isActive: true },
      });
      return sanitizeConfig(updated);
    }
  );

  fastify.patch(
    "/admin/ai-configs/:id/toggle",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.write")] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const c = await db.aiConfig.findUnique({ where: { id: req.params.id } });
      if (!c) return reply.code(404).send({ error: "Config não encontrada" });
      const updated = await db.aiConfig.update({
        where: { id: req.params.id },
        data: { isActive: !c.isActive },
      });
      return sanitizeConfig(updated);
    }
  );

  fastify.delete(
    "/admin/ai-configs/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai-configs.delete")] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        await db.aiConfig.delete({ where: { id: req.params.id } });
        return { message: "Config removida" };
      } catch (err: any) {
        return reply.code(500).send({ error: err.message });
      }
    }
  );

  // ── GERAÇÃO DE POST A PARTIR DE URL ─────────────────────────────────────
  fastify.post(
    "/admin/ai/generate-post",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai.use")] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { url, configId } = generatePostSchema.parse(req.body);
        const config = await getConfigFromRequest(configId);
        if (!config) {
          return reply.code(400).send({
            error: "Nenhuma configuração de IA ativa encontrada. Cadastre em /admin/ai-configs.",
          });
        }

        // Scraping da URL
        const scraped = await scrapeUrl(url);
        if (!scraped.text || scraped.text.length < 200) {
          return reply.code(400).send({
            error: "Não foi possível extrair conteúdo suficiente da URL informada.",
          });
        }

        const systemPrompt = buildSystemPrompt(config.systemPrompt);
        const userPrompt = `Você recebeu um artigo/post de terceiros como REFERÊNCIA. Reescreva COMPLETAMENTE como se fosse um artigo original do blog da BSN Solution — não copie trechos, não cite o autor ou veículo original, não mencione que reescreveu nada. Produza conteúdo novo inspirado no tema, mas com voz, exemplos e posicionamento da BSN.

URL de referência: ${url}
Título do artigo original: ${scraped.title || "(não identificado)"}

Conteúdo extraído do artigo original (apenas inspiração):
"""
${scraped.text.slice(0, 8000)}
"""

Produza um JSON no seguinte formato EXATO (sem markdown code fence, apenas o JSON cru):
{
  "title": "título chamativo em PT-BR, no máximo 90 caracteres",
  "slug": "slug-em-kebab-case-sem-acentos",
  "excerpt": "resumo de 1-2 frases em PT-BR, no máximo 200 caracteres",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "conteúdo completo em MARKDOWN (600-1200 palavras), com ## seções, listas, código quando fizer sentido, tom direto, sem fluff, exemplos concretos e 1 seção final 'Como a BSN Solution aborda isso' + CTA"
}

Requisitos:
- Linguagem PT-BR, voz da BSN Solution (software house técnica, direta, sem jargão de marketing)
- Nenhuma menção ao site/autor original
- Pelo menos 4 seções ## e 1 lista ou tabela
- Se o tema envolver código, inclua 1 bloco de código realista
- Tags em lowercase, sem acentos, 3-5 tags`;

        const rawResponse = await callLLM({
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          systemPrompt,
          userPrompt,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4000,
        });

        // Tenta extrair JSON da resposta
        let post: any;
        try {
          // Remove fence de code se houver
          const cleaned = rawResponse
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          post = JSON.parse(cleaned);
        } catch {
          // Tenta achar o primeiro { ... } válido
          const match = rawResponse.match(/\{[\s\S]*\}/);
          if (!match) {
            return reply.code(500).send({
              error: "IA retornou resposta em formato inválido.",
              raw: rawResponse.slice(0, 500),
            });
          }
          post = JSON.parse(match[0]);
        }

        return { post, sourceUrl: url, sourceTitle: scraped.title };
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: err.errors });
        }
        return reply.code(500).send({ error: err.message || "Erro ao gerar post" });
      }
    }
  );

  // ── MELHORAR / GERAR TEXTO (inline no editor) ───────────────────────────
  fastify.post(
    "/admin/ai/enhance-text",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("ai.use")] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { text, mode, instruction, configId } = enhanceTextSchema.parse(req.body);
        const config = await getConfigFromRequest(configId);
        if (!config) {
          return reply.code(400).send({
            error: "Nenhuma configuração de IA ativa. Cadastre em /admin/ai-configs.",
          });
        }

        const modeInstruction: Record<string, string> = {
          improve:
            "Melhore o texto abaixo mantendo o mesmo idioma (PT-BR), significado e tom. Corrija gramática, clarifique ambiguidades, deixe mais direto e profissional. Devolva APENAS o texto reescrito, sem introdução, sem aspas, sem markdown extra.",
          generate:
            "Gere um texto em PT-BR sobre o tópico indicado abaixo. Tom: direto, técnico, sem fluff, voz de uma software house B2B. Devolva APENAS o texto gerado.",
          expand:
            "Expanda o texto abaixo com mais detalhes, exemplos e contexto — mantendo PT-BR, tom técnico-direto. Devolva APENAS o texto expandido.",
          shorten:
            "Resuma o texto abaixo mantendo as ideias principais, em PT-BR, tom direto. Devolva APENAS o texto resumido.",
        };

        const userPrompt = [
          modeInstruction[mode],
          instruction ? `\nInstrução adicional do usuário: ${instruction}` : "",
          `\n\nTexto:\n"""\n${text}\n"""`,
        ].join("");

        const response = await callLLM({
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          systemPrompt: buildSystemPrompt(config.systemPrompt),
          userPrompt,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 2000,
        });

        return { result: response.trim() };
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: "Dados inválidos", details: err.errors });
        }
        return reply.code(500).send({ error: err.message || "Erro ao processar" });
      }
    }
  );
}
