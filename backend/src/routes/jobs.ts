import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";
import { sendEmail } from "../lib/smtp";

const jobSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  requirements: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
  salary: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

const jobApplicationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  resumeUrl: z.string().url().optional().nullable(),
  jobId: z.string().uuid("ID da vaga inválido"),
});

const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || "1")),
  limit: z.string().optional().transform(val => parseInt(val || "10")),
});

export default async function jobsRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/jobs", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.jobs,
      async () => {
        const jobs = await prisma.job.findMany({
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        });
        return { jobs };
      },
      1800 // 30 minutos
    );

    return result;
  });

  fastify.get("/jobs/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.job(request.params.id),
      async () => {
        const job = await prisma.job.findFirst({
          where: {
            id: request.params.id,
            isActive: true,
          },
        });

        if (!job) {
          reply.code(404).send({ error: "Vaga não encontrada" });
          return null;
        }

        return job;
      },
      3600
    );

    if (!result) {
      return;
    }

    return result;
  });

  // Aplicar para vaga
  fastify.post("/jobs/:id/apply", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Verificar se a vaga existe e está ativa
      const job = await prisma.job.findFirst({
        where: {
          id: request.params.id,
          isActive: true,
        },
      });

      if (!job) {
        reply.code(404).send({ error: "Vaga não encontrada ou inativa" });
        return;
      }

      const data = jobApplicationSchema.parse({
        ...request.body,
        jobId: request.params.id,
      });

      // Verificar se a pessoa já se candidatou para esta vaga
      const existingApplication = await prisma.jobApplication.findFirst({
        where: {
          email: data.email,
          jobId: request.params.id,
        },
      });

      if (existingApplication) {
        reply.code(400).send({ error: "Você já se candidatou para esta vaga" });
        return;
      }

      // Salvar candidatura
      const application = await prisma.jobApplication.create({
        data,
      });

      // Enviar email de notificação para o RH
      try {
        const emailContent = `
          <h2>Nova candidatura - ${job.title}</h2>
          
          <p><strong>Candidato:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Telefone:</strong> ${data.phone}</p>` : ''}
          ${data.resumeUrl ? `<p><strong>Currículo:</strong> <a href="${data.resumeUrl}">Download</a></p>` : ''}
          
          <h3>Vaga:</h3>
          <p><strong>Título:</strong> ${job.title}</p>
          <p><strong>Localização:</strong> ${job.location || 'Não especificado'}</p>
          <p><strong>Tipo:</strong> ${job.type}</p>
          
          ${data.message ? `
            <h3>Mensagem do candidato:</h3>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          ` : ''}
          
          <hr>
          <p><small>Esta candidatura foi enviada através do site BSN Solution</small></p>
        `;

        await sendEmail({
          to: process.env.SMTP_USER || "rh@bsnsolution.com.br",
          subject: `Nova candidatura - ${job.title} - ${data.name}`,
          html: emailContent,
          replyTo: data.email,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de notificação da candidatura:", emailError);
      }

      // Email de confirmação para o candidato
      try {
        const confirmationContent = `
          <h2>Candidatura enviada com sucesso!</h2>
          
          <p>Olá, ${data.name}!</p>
          
          <p>Recebemos sua candidatura para a vaga de <strong>${job.title}</strong> e agradecemos pelo interesse em fazer parte da nossa equipe.</p>
          
          <p>Nossa equipe de RH irá analisar seu perfil e, caso esteja alinhado com a vaga, entraremos em contato em breve.</p>
          
          <h3>Resumo da sua candidatura:</h3>
          <p><strong>Vaga:</strong> ${job.title}</p>
          <p><strong>Nome:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p><strong>Telefone:</strong> ${data.phone}</p>` : ''}
          ${data.message ? `<p><strong>Mensagem:</strong> ${data.message}</p>` : ''}
          
          <hr>
          <p>Atenciosamente,<br><strong>Equipe BSN Solution</strong></p>
          <p><small>Este é um email automático, não responda a esta mensagem.</small></p>
        `;

        await sendEmail({
          to: data.email,
          subject: `Candidatura recebida - ${job.title}`,
          html: confirmationContent,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação da candidatura:", emailError);
      }

      return {
        success: true,
        message: "Candidatura enviada com sucesso! Entraremos em contato em breve.",
        id: application.id,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      console.error("Erro ao processar candidatura:", error);
      reply.code(500).send({ error: "Erro ao enviar candidatura" });
    }
  });

  // Admin routes
  fastify.get("/admin/jobs", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return { jobs };
  });

  fastify.get("/admin/jobs/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const job = await prisma.job.findUnique({
      where: { id: request.params.id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      reply.code(404).send({ error: "Vaga não encontrada" });
      return;
    }

    return job;
  });

  fastify.post("/admin/jobs", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = jobSchema.parse(request.body);

      const job = await prisma.job.create({
        data,
      });

      await invalidateCache(CacheKeys.jobs);

      return job;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar vaga" });
    }
  });

  fastify.put("/admin/jobs/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = jobSchema.partial().parse(request.body);

      const job = await prisma.job.update({
        where: { id: request.params.id },
        data,
      });

      await invalidateCache(CacheKeys.jobs);
      await invalidateCache(CacheKeys.job(request.params.id));

      return job;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar vaga" });
    }
  });

  fastify.delete("/admin/jobs/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await prisma.job.delete({
        where: { id: request.params.id },
      });

      await invalidateCache(CacheKeys.jobs);
      await invalidateCache(CacheKeys.job(request.params.id));

      return { message: "Vaga deletada com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar vaga" });
    }
  });

  fastify.patch("/admin/jobs/:id/toggle", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const job = await prisma.job.findUnique({
      where: { id: request.params.id },
    });

    if (!job) {
      reply.code(404).send({ error: "Vaga não encontrada" });
      return;
    }

    const updated = await prisma.job.update({
      where: { id: request.params.id },
      data: { isActive: !job.isActive },
    });

    await invalidateCache(CacheKeys.jobs);
    await invalidateCache(CacheKeys.job(request.params.id));

    return updated;
  });

  // Gerenciar candidaturas
  fastify.get("/admin/jobs/:id/applications", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: any }>, reply: FastifyReply) => {
    try {
      const { page, limit } = querySchema.parse(request.query);

      const [applications, total] = await Promise.all([
        prisma.jobApplication.findMany({
          where: { jobId: request.params.id },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            job: {
              select: { title: true },
            },
          },
        }),
        prisma.jobApplication.count({
          where: { jobId: request.params.id },
        }),
      ]);

      return {
        applications,
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
      reply.code(500).send({ error: "Erro ao buscar candidaturas" });
    }
  });

  fastify.patch("/admin/applications/:id/status", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' } }>, reply: FastifyReply) => {
    try {
      const { status } = request.body;

      const application = await prisma.jobApplication.update({
        where: { id: request.params.id },
        data: { status },
        include: {
          job: { select: { title: true } },
        },
      });

      return application;
    } catch (error) {
      reply.code(500).send({ error: "Erro ao atualizar status da candidatura" });
    }
  });
}