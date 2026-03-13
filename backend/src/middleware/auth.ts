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

export const requireAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user || request.user.role !== "ADMIN") {
    reply.code(403).send({ error: "Acesso negado" });
    return;
  }
};