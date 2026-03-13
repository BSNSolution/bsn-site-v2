import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        reply.code(401).send({ error: "Credenciais inválidas" });
        return;
      }

      if (!user.isActive) {
        reply.code(401).send({ error: "Usuário inativo" });
        return;
      }

      const isValidPassword = await bcrypt.compare(body.password, user.password);

      if (!isValidPassword) {
        reply.code(401).send({ error: "Credenciais inválidas" });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao fazer login" });
    }
  });

  // Verificar se está logado
  fastify.get("/me", {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  });

  // Trocar senha
  fastify.put("/change-password", {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = changePasswordSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
      });

      if (!user) {
        reply.code(404).send({ error: "Usuário não encontrado" });
        return;
      }

      const isValidPassword = await bcrypt.compare(body.currentPassword, user.password);

      if (!isValidPassword) {
        reply.code(401).send({ error: "Senha atual incorreta" });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(body.newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      return { message: "Senha alterada com sucesso" };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao trocar senha" });
    }
  });

  // Logout (opcional - apenas retorna sucesso, pois JWT é stateless)
  fastify.post("/logout", {
    preHandler: [fastify.authenticate],
  }, async () => {
    return { message: "Logout realizado com sucesso" };
  });
}