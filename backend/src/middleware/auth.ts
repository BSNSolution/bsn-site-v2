import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      reply.code(401).send({ error: "Token não fornecido" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      reply.code(401).send({ error: "Usuário não encontrado ou inativo" });
      return;
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    reply.code(401).send({ error: "Token inválido" });
  }
};

/**
 * Acesso genérico ao painel admin: qualquer role diferente de GUEST pode chegar
 * até os endpoints admin. A autorização fina é feita por requirePermission
 * em cada rota sensível (ex: services.write, blog.delete).
 *
 * GUEST tem apenas leitura e deve ser barrado nas rotas de escrita via
 * requirePermission.
 */
export const requireAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user) {
    reply.code(401).send({ error: "Não autenticado" });
    return;
  }
  const allowedRoles = ["ADMIN", "DEVELOPER", "EDITOR", "GUEST"];
  if (!allowedRoles.includes(request.user.role)) {
    reply.code(403).send({ error: "Acesso negado" });
    return;
  }
};

/**
 * Só permite ADMIN (usado em users/groups).
 */
export const requireRoot = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user || request.user.role !== "ADMIN") {
    reply.code(403).send({ error: "Apenas administradores podem acessar este recurso" });
    return;
  }
};

/**
 * Cache in-memory das permissões efetivas por userId.
 * Invalidado por updates em User/PermissionGroup.
 */
const permCache = new Map<string, { set: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto

export function invalidatePermissionCache(userId?: string) {
  if (userId) permCache.delete(userId);
  else permCache.clear();
}

async function getEffectivePermissions(userId: string, role: string): Promise<Set<string>> {
  const cached = permCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.set;

  // ADMIN tem todas as permissões do sistema
  if (role === "ADMIN") {
    const all = await prisma.permission.findMany({ select: { slug: true } });
    const set = new Set(all.map((p) => p.slug));
    permCache.set(userId, { set, expiresAt: Date.now() + CACHE_TTL_MS });
    return set;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: { select: { slug: true } },
      groups: { include: { permissions: { select: { slug: true } } } },
    },
  });

  const set = new Set<string>();
  if (user) {
    user.permissions.forEach((p) => set.add(p.slug));
    user.groups.forEach((g) => g.permissions.forEach((p) => set.add(p.slug)));
  }

  permCache.set(userId, { set, expiresAt: Date.now() + CACHE_TTL_MS });
  return set;
}

/**
 * Middleware factory: exige uma permissão específica.
 * Exemplo: preHandler: [fastify.authenticate, requirePermission("services.write")]
 */
export function requirePermission(slug: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ error: "Não autenticado" });
      return;
    }
    // ADMIN bypassa
    if (request.user.role === "ADMIN") return;

    const perms = await getEffectivePermissions(request.user.id, request.user.role);
    if (!perms.has(slug)) {
      reply.code(403).send({ error: `Acesso negado. Permissão necessária: ${slug}` });
      return;
    }
  };
}

/**
 * Variante que aceita uma das permissões (OR).
 */
export function requireAnyPermission(...slugs: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ error: "Não autenticado" });
      return;
    }
    if (request.user.role === "ADMIN") return;

    const perms = await getEffectivePermissions(request.user.id, request.user.role);
    const ok = slugs.some((s) => perms.has(s));
    if (!ok) {
      reply.code(403).send({ error: `Acesso negado. Uma destas permissões é necessária: ${slugs.join(", ")}` });
      return;
    }
  };
}
