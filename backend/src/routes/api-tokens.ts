import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { generateApiToken } from "../middleware/api-token"

const VALID_SCOPES = [
  "blog:read",
  "blog:write",
  "blog:delete",
  "blog:metrics",
  "upload:write",
] as const

const createSchema = z.object({
  name: z.string().min(3).max(80),
  scopes: z.array(z.enum(VALID_SCOPES)).min(1),
  expiresAt: z.string().datetime().optional().nullable(),
})

const updateSchema = z.object({
  name: z.string().min(3).max(80).optional(),
  scopes: z.array(z.enum(VALID_SCOPES)).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export default async function apiTokenRoutes(fastify: FastifyInstance) {
  // LIST
  fastify.get(
    "/admin/api-tokens",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.read")] },
    async () => {
      const tokens = await prisma.apiToken.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      })
      // NUNCA retornar tokenHash; apenas o prefixo
      return {
        tokens: tokens.map((t) => ({
          id: t.id,
          name: t.name,
          tokenPrefix: t.tokenPrefix,
          scopes: t.scopes,
          isActive: t.isActive,
          lastUsedAt: t.lastUsedAt,
          expiresAt: t.expiresAt,
          createdAt: t.createdAt,
          createdBy: t.createdBy,
        })),
      }
    }
  )

  // CREATE — retorna o token em claro apenas nesta resposta
  fastify.post(
    "/admin/api-tokens",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.write")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createSchema.parse(request.body)
        const { plain, hash, prefix } = generateApiToken()

        const token = await prisma.apiToken.create({
          data: {
            name: body.name,
            tokenHash: hash,
            tokenPrefix: prefix,
            scopes: body.scopes,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            createdById: request.user!.id,
          },
        })

        return reply.code(201).send({
          id: token.id,
          name: token.name,
          scopes: token.scopes,
          expiresAt: token.expiresAt,
          createdAt: token.createdAt,
          // Mostrado uma única vez — usuário deve copiar agora
          token: plain,
          warning: "Guarde este token agora — ele não será exibido novamente.",
        })
      } catch (err) {
        if (err instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: err.errors })
          return
        }
        reply.code(500).send({ error: "Erro ao criar token" })
      }
    }
  )

  // UPDATE (metadata: nome, scopes, isActive, expiração) — NUNCA regenera o token
  fastify.put(
    "/admin/api-tokens/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.write")] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = updateSchema.parse(request.body)
        const updated = await prisma.apiToken.update({
          where: { id: request.params.id },
          data: {
            ...body,
            expiresAt: body.expiresAt === undefined
              ? undefined
              : body.expiresAt === null
                ? null
                : new Date(body.expiresAt),
          },
        })
        return {
          id: updated.id,
          name: updated.name,
          tokenPrefix: updated.tokenPrefix,
          scopes: updated.scopes,
          isActive: updated.isActive,
          expiresAt: updated.expiresAt,
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: err.errors })
          return
        }
        reply.code(500).send({ error: "Erro ao atualizar token" })
      }
    }
  )

  // REVOGAR (soft delete)
  fastify.patch(
    "/admin/api-tokens/:id/revoke",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.write")] },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      await prisma.apiToken.update({
        where: { id: request.params.id },
        data: { isActive: false },
      })
      return { message: "Token revogado" }
    }
  )

  // DELETE (hard)
  fastify.delete(
    "/admin/api-tokens/:id",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.write")] },
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      await prisma.apiToken.delete({ where: { id: request.params.id } })
      return { message: "Token removido" }
    }
  )

  // Listar scopes disponíveis (para UI)
  fastify.get(
    "/admin/api-tokens/scopes",
    { preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("api-tokens.read")] },
    async () => {
      return {
        scopes: [
          { slug: "blog:read", label: "Listar posts" },
          { slug: "blog:write", label: "Criar/editar posts" },
          { slug: "blog:delete", label: "Excluir posts" },
          { slug: "blog:metrics", label: "Ler métricas dos posts" },
          { slug: "upload:write", label: "Fazer upload de imagens" },
        ],
      }
    }
  )
}
