import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/smtp";

const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || "1")),
  limit: z.string().optional().transform(val => parseInt(val || "20")),
  status: z.enum(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
});

const replySchema = z.object({
  content: z.string().min(1, "Conteúdo da resposta é obrigatório"),
});

const statusUpdateSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED']),
});

export default async function inboxRoutes(fastify: FastifyInstance) {
  // Listar mensagens (admin)
  fastify.get("/admin/inbox", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const { page, limit, status } = querySchema.parse(request.query);

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [messages, total] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            replies: {
              include: {
                user: {
                  select: { name: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        }),
        prisma.contactMessage.count({ where }),
      ]);

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Parâmetros inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao buscar mensagens" });
    }
  });

  // Obter uma mensagem específica (admin)
  fastify.get("/admin/inbox/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const message = await prisma.contactMessage.findUnique({
      where: { id: request.params.id },
      include: {
        replies: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!message) {
      reply.code(404).send({ error: "Mensagem não encontrada" });
      return;
    }

    // Marcar como lida automaticamente
    if (message.status === 'UNREAD') {
      await prisma.contactMessage.update({
        where: { id: request.params.id },
        data: { status: 'READ' },
      });
    }

    return message;
  });

  // Responder mensagem
  fastify.post("/admin/inbox/:id/reply", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { content } = replySchema.parse(request.body);

      const message = await prisma.contactMessage.findUnique({
        where: { id: request.params.id },
      });

      if (!message) {
        reply.code(404).send({ error: "Mensagem não encontrada" });
        return;
      }

      // Criar resposta
      const messageReply = await prisma.messageReply.create({
        data: {
          content,
          messageId: request.params.id,
          userId: request.user!.id,
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      // Atualizar status da mensagem
      await prisma.contactMessage.update({
        where: { id: request.params.id },
        data: { status: 'REPLIED' },
      });

      // Enviar email de resposta
      try {
        const emailContent = `
          <h2>Resposta da BSN Solution</h2>
          
          <p>Olá, ${message.name}!</p>
          
          <p>Agradecemos pelo seu contato. Segue nossa resposta:</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #1e40af;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          
          <h3>Sua mensagem original:</h3>
          ${message.subject ? `<p><strong>Assunto:</strong> ${message.subject}</p>` : ''}
          <p>${message.message.replace(/\n/g, '<br>')}</p>
          
          <hr>
          <p>Atenciosamente,<br><strong>Equipe BSN Solution</strong></p>
          <p><small>Para continuar a conversa, responda a este email.</small></p>
        `;

        await sendEmail({
          to: message.email,
          subject: `Re: ${message.subject || 'Sua mensagem para BSN Solution'}`,
          html: emailContent,
          replyTo: process.env.SMTP_USER || "contato@bsnsolution.com.br",
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de resposta:", emailError);
        // Não falhar se o email não foi enviado
      }

      return messageReply;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao enviar resposta" });
    }
  });

  // Atualizar status da mensagem
  fastify.patch("/admin/inbox/:id/status", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { status } = statusUpdateSchema.parse(request.body);

      const message = await prisma.contactMessage.update({
        where: { id: request.params.id },
        data: { status },
      });

      return message;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Status inválido", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar status" });
    }
  });

  // Deletar mensagem
  fastify.delete("/admin/inbox/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.contactMessage.delete({
        where: { id: request.params.id },
      });

      return { message: "Mensagem deletada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar mensagem" });
    }
  });

  // Estatísticas do inbox
  fastify.get("/admin/inbox/stats", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const [total, unread, read, replied, archived] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      prisma.contactMessage.count({ where: { status: 'READ' } }),
      prisma.contactMessage.count({ where: { status: 'REPLIED' } }),
      prisma.contactMessage.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return {
      total,
      unread,
      read,
      replied,
      archived,
    };
  });

  // Marcar múltiplas mensagens como lidas
  fastify.patch("/admin/inbox/bulk/mark-read", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { messageIds: string[] } }>, reply: FastifyReply) => {
    try {
      const { messageIds } = request.body;

      await prisma.contactMessage.updateMany({
        where: { 
          id: { in: messageIds },
          status: 'UNREAD',
        },
        data: { status: 'READ' },
      });

      return { message: "Mensagens marcadas como lidas" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao marcar mensagens como lidas" });
    }
  });

  // Arquivar múltiplas mensagens
  fastify.patch("/admin/inbox/bulk/archive", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Body: { messageIds: string[] } }>, reply: FastifyReply) => {
    try {
      const { messageIds } = request.body;

      await prisma.contactMessage.updateMany({
        where: { id: { in: messageIds } },
        data: { status: 'ARCHIVED' },
      });

      return { message: "Mensagens arquivadas" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao arquivar mensagens" });
    }
  });
}