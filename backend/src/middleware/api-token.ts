import { FastifyRequest, FastifyReply } from "fastify"
import { createHash, randomBytes } from "crypto"
import { prisma } from "../lib/prisma"

export interface ApiTokenAuth {
  id: string
  name: string
  scopes: string[]
}

declare module "fastify" {
  interface FastifyRequest {
    apiToken?: ApiTokenAuth
  }
}

/**
 * Gera um token novo em claro + hash SHA256 + prefixo (para exibição segura).
 * Formato: "bsn_" + 40 chars aleatórios (url-safe base64).
 */
export function generateApiToken(): { plain: string; hash: string; prefix: string } {
  const plain = "bsn_" + randomBytes(30).toString("base64url")
  const hash = createHash("sha256").update(plain).digest("hex")
  const prefix = plain.slice(0, 12)
  return { plain, hash, prefix }
}

/**
 * Middleware Fastify: valida `Authorization: Bearer <token>`,
 * popula `request.apiToken` com id/name/scopes.
 *
 * Retorna 401 se ausente/inválido/expirado/desativado.
 */
export async function authenticateApiToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Token de API não fornecido (header Authorization: Bearer <token>)" })
    return
  }

  const plain = authHeader.slice(7).trim()
  if (!plain.startsWith("bsn_")) {
    reply.code(401).send({ error: "Formato de token inválido" })
    return
  }

  const hash = createHash("sha256").update(plain).digest("hex")

  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
  })

  if (!token) {
    reply.code(401).send({ error: "Token inválido" })
    return
  }
  if (!token.isActive) {
    reply.code(401).send({ error: "Token revogado" })
    return
  }
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
    reply.code(401).send({ error: "Token expirado" })
    return
  }

  // Atualiza lastUsedAt sem bloquear a request (fire-and-forget)
  prisma.apiToken
    .update({ where: { id: token.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {
      /* ignore */
    })

  request.apiToken = {
    id: token.id,
    name: token.name,
    scopes: token.scopes,
  }
}

/**
 * Verifica se o token tem o scope necessário.
 * Usar como segundo preHandler após `authenticateApiToken`.
 */
export function requireScope(scope: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.apiToken) {
      reply.code(401).send({ error: "Token de API necessário" })
      return
    }
    if (!request.apiToken.scopes.includes(scope)) {
      reply.code(403).send({
        error: `Scope insuficiente. Necessário: ${scope}`,
        granted: request.apiToken.scopes,
      })
      return
    }
  }
}
