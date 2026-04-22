import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "EDITOR", "DEVELOPER", "GUEST"]).optional(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});

export default async function usersRoutes(fastify: FastifyInstance) {
  // Listar permissões (catálogo)
  fastify.get("/admin/permissions", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { label: "asc" }],
    });
    return { permissions };
  });

  // Listar grupos
  fastify.get("/admin/groups", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const groups = await prisma.permissionGroup.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        permissions: { select: { id: true, slug: true, label: true, category: true } },
        _count: { select: { users: true } },
      },
    });
    return { groups };
  });

  // Criar grupo
  fastify.post("/admin/groups", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional().nullable(),
          permissionIds: z.array(z.string().uuid()).optional().default([]),
        })
        .parse(request.body);

      const created = await prisma.permissionGroup.create({
        data: {
          name: body.name,
          description: body.description ?? null,
          permissions: { connect: body.permissionIds.map((id) => ({ id })) },
        },
        include: { permissions: true },
      });
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar grupo" });
    }
  });

  // Atualizar grupo
  fastify.put("/admin/groups/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          permissionIds: z.array(z.string().uuid()).optional(),
        })
        .parse(request.body);

      const existing = await prisma.permissionGroup.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.code(404).send({ error: "Grupo não encontrado" });

      const data: any = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.description !== undefined) data.description = body.description;
      if (body.permissionIds) {
        data.permissions = { set: body.permissionIds.map((id) => ({ id })) };
      }

      const updated = await prisma.permissionGroup.update({
        where: { id: request.params.id },
        data,
        include: { permissions: true },
      });
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar grupo" });
    }
  });

  // Excluir grupo (somente não-system)
  fastify.delete("/admin/groups/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const existing = await prisma.permissionGroup.findUnique({ where: { id: request.params.id } });
    if (!existing) return reply.code(404).send({ error: "Grupo não encontrado" });
    if (existing.isSystem) {
      return reply.code(400).send({ error: "Grupos do sistema não podem ser excluídos." });
    }
    await prisma.permissionGroup.delete({ where: { id: request.params.id } });
    return { message: "Grupo removido" };
  });

  // ================== USERS ==================
  fastify.get("/admin/users", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: { select: { id: true, slug: true, label: true } },
        groups: { select: { id: true, name: true } },
      },
    });
    return { users };
  });

  fastify.get("/admin/users/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
        groups: { include: { permissions: true } },
      },
    });
    if (!user) return reply.code(404).send({ error: "Usuário não encontrado" });
    return user;
  });

  fastify.post("/admin/users", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = userSchema.parse(request.body);
      if (!body.password) return reply.code(400).send({ error: "Senha é obrigatória" });

      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) return reply.code(400).send({ error: "E-mail já cadastrado" });

      const hashed = await bcrypt.hash(body.password, 10);
      const created = await prisma.user.create({
        data: {
          email: body.email,
          password: hashed,
          name: body.name,
          role: body.role ?? "EDITOR",
          isActive: body.isActive ?? true,
          permissions: body.permissionIds ? { connect: body.permissionIds.map((id) => ({ id })) } : undefined,
          groups: body.groupIds ? { connect: body.groupIds.map((id) => ({ id })) } : undefined,
        },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
      return created;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao criar usuário" });
    }
  });

  fastify.put("/admin/users/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const body = userSchema.partial().parse(request.body);
      const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.code(404).send({ error: "Usuário não encontrado" });

      const data: any = {};
      if (body.email !== undefined) data.email = body.email;
      if (body.name !== undefined) data.name = body.name;
      if (body.role !== undefined) data.role = body.role;
      if (body.isActive !== undefined) data.isActive = body.isActive;
      if (body.password) data.password = await bcrypt.hash(body.password, 10);
      if (body.permissionIds) {
        data.permissions = { set: body.permissionIds.map((id) => ({ id })) };
      }
      if (body.groupIds) {
        data.groups = { set: body.groupIds.map((id) => ({ id })) };
      }

      const updated = await prisma.user.update({
        where: { id: request.params.id },
        data,
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: "Dados inválidos", details: error.errors });
      }
      return reply.code(500).send({ error: "Erro ao atualizar usuário" });
    }
  });

  fastify.delete("/admin/users/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (request.user!.id === request.params.id) {
      return reply.code(400).send({ error: "Você não pode excluir a si mesmo." });
    }
    try {
      await prisma.user.delete({ where: { id: request.params.id } });
      return { message: "Usuário removido" };
    } catch {
      return reply.code(500).send({ error: "Erro ao remover usuário" });
    }
  });

  // "Effective permissions" do usuário logado (para o frontend saber o que mostrar)
  fastify.get("/admin/me/permissions", {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        permissions: { select: { slug: true } },
        groups: { include: { permissions: { select: { slug: true } } } },
      },
    });
    if (!user) return { permissions: [] };
    const set = new Set<string>();
    user.permissions.forEach((p) => set.add(p.slug));
    user.groups.forEach((g) => g.permissions.forEach((p) => set.add(p.slug)));
    // Admin tem todas
    if (user.role === "ADMIN") {
      const all = await prisma.permission.findMany({ select: { slug: true } });
      all.forEach((p) => set.add(p.slug));
    }
    return { permissions: Array.from(set), role: user.role };
  });
}
