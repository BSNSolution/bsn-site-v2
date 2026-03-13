import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/smtp";

const contactMessageSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

export default async function contactRoutes(fastify: FastifyInstance) {
  // Public route - enviar mensagem de contato
  fastify.post("/contact", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = contactMessageSchema.parse(request.body);

      // Salvar no banco
      const contactMessage = await prisma.contactMessage.create({
        data,
      });

      // Tentar enviar email de notificação
      try {
        const emailContent = `
          <h2>Nova mensagem de contato - BSN Solution</h2>
          
          <p><strong>Nome:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Telefone:</strong> ${data.phone}</p>` : ''}
          ${data.subject ? `<p><strong>Assunto:</strong> ${data.subject}</p>` : ''}
          
          <h3>Mensagem:</h3>
          <p>${data.message.replace(/\n/g, '<br>')}</p>
          
          <hr>
          <p><small>Esta mensagem foi enviada através do site BSN Solution</small></p>
        `;

        await sendEmail({
          to: process.env.SMTP_USER || "contato@bsnsolution.com.br",
          subject: `Nova mensagem de contato - ${data.name}`,
          html: emailContent,
          replyTo: data.email,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de notificação:", emailError);
        // Não falhar a requisição se o email não foi enviado
      }

      // Email de confirmação para o usuário
      try {
        const confirmationContent = `
          <h2>Obrigado pelo seu contato!</h2>
          
          <p>Olá, ${data.name}!</p>
          
          <p>Recebemos sua mensagem e agradecemos pelo interesse em nossos serviços.</p>
          
          <p>Nossa equipe irá analisar sua solicitação e retornar o contato em breve.</p>
          
          <h3>Resumo da sua mensagem:</h3>
          <p><strong>Nome:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Telefone:</strong> ${data.phone}</p>` : ''}
          ${data.subject ? `<p><strong>Assunto:</strong> ${data.subject}</p>` : ''}
          <p><strong>Mensagem:</strong> ${data.message}</p>
          
          <hr>
          <p>Atenciosamente,<br><strong>Equipe BSN Solution</strong></p>
          <p><small>Este é um email automático, não responda a esta mensagem.</small></p>
        `;

        await sendEmail({
          to: data.email,
          subject: "Confirmação - Sua mensagem foi recebida",
          html: confirmationContent,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação:", emailError);
        // Não falhar a requisição se o email não foi enviado
      }

      return { 
        success: true,
        message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
        id: contactMessage.id 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      console.error("Erro ao processar contato:", error);
      reply.code(500).send({ error: "Erro ao enviar mensagem" });
    }
  });
}