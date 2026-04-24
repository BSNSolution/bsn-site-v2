import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const optionalUrl = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.string().url().nullable().optional()
);

const teamMemberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().min(1, "Cargo é obrigatório"),
  bio: z.string().optional().nullable(),
  imageUrl: optionalUrl,
  email: z.string().email().optional().nullable(),
  linkedinUrl: optionalUrl,
  twitterUrl: optionalUrl,
  githubUrl: optionalUrl,
  avatarVariant: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export default async function teamRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/team", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.team,
      async () => {
        const team = await prisma.teamMember.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        });
        return { team };
      },
      3600
    );

    return result;
  });

  fastify.get("/team/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.teamMember(request.params.id),
      async () => {
        const member = await prisma.teamMember.findFirst({
          where: {
            id: request.params.id,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            role: true,
            bio: true,
            imageUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            githubUrl: true,
            order: true,
          },
        });

        if (!member) {
          reply.code(404).send({ error: "Membro da equipe não encontrado" });
          return null;
        }

        return member;
      },
      3600
    );

    if (!result) {
      return;
    }

    return result;
  });

  // Admin routes
  fastify.get("/admin/team", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.read")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const team = await prisma.teamMember.findMany({
      orderBy: { order: "asc" },
    });

    return { team };
  });

  fastify.get("/admin/team/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("about.read")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const member = await prisma.teamMember.findUnique({
      where: { id: request.params.id },
    });

    if (!member) {
      reply.code(404).send({ error: "Membro da equipe não encontrado" });
      return;
    }

    return member;
  });

  fastify.post("/admin/team", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("team.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = teamMemberSchema.parse(request.body);

      // Se não foi fornecida uma ordem, usar a próxima disponível
      if (data.order === undefined) {
        const maxOrder = await prisma.teamMember.findFirst({
          orderBy: { order: "desc" },
          select: { order: true },
        });
        data.order = (maxOrder?.order || 0) + 1;
      }

      const member = await prisma.teamMember.create({
        data,
      });

      await invalidateCache(CacheKeys.team);

      return member;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar membro da equipe" });
    }
  });

  fastify.put("/admin/team/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("team.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = teamMemberSchema.partial().parse(request.body);

      const member = await prisma.teamMember.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.team);
      await invalidateCache(CacheKeys.teamMember(request.params.id));

      return member;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar membro da equipe" });
    }
  });

  fastify.delete("/admin/team/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("team.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.teamMember.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.team);
      await invalidateCache(CacheKeys.teamMember(request.params.id));

      return { message: "Membro da equipe deletado com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar membro da equipe" });
    }
  });

  fastify.patch("/admin/team/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("team.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const member = await prisma.teamMember.findUnique({
      where: { id: request.params.id },
    });

    if (!member) {
      reply.code(404).send({ error: "Membro da equipe não encontrado" });
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id: request.params.id },
      data: { isActive: !member.isActive },
    });

    await invalidateCache(CacheKeys.team);
    await invalidateCache(CacheKeys.teamMember(request.params.id));

    return updated;
  });

  // Reordenar membros da equipe
  fastify.patch("/admin/team/reorder", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("team.write")],
  }, async (request: FastifyRequest<{ Body: { items: { id: string, order: number }[] } }>, reply: FastifyReply) => {
    try {
      const { items } = request.body;

      for (const item of items) {
        await prisma.teamMember.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      await invalidateCache(CacheKeys.team);

      return { message: "Ordem atualizada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao reordenar membros da equipe" });
    }
  });
}