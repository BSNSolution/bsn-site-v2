import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { uploadToR2, deleteFromR2 } from "../lib/r2";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf', // Para currículos
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export default async function uploadRoutes(fastify: FastifyInstance) {
  // Upload de arquivo
  fastify.post("/admin/upload", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("uploads.write")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        reply.code(400).send({ error: "Nenhum arquivo enviado" });
        return;
      }

      // Validar tipo de arquivo
      if (!allowedMimeTypes.includes(data.mimetype)) {
        reply.code(400).send({ 
          error: "Tipo de arquivo não permitido",
          allowedTypes: allowedMimeTypes,
        });
        return;
      }

      // Validar tamanho
      const buffer = await data.toBuffer();
      if (buffer.length > maxFileSize) {
        reply.code(413).send({
          error: "Arquivo muito grande",
          maxSize: maxFileSize,
          maxSizeMB: maxFileSize / (1024 * 1024),
        });
        return;
      }

      // Upload para R2
      const url = await uploadToR2(buffer, data.filename, data.mimetype);

      // Salvar no banco
      const uploadedImage = await prisma.uploadedImage.create({
        data: {
          filename: data.filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          url,
          r2Key: url.split('/').pop(), // Extrair chave do URL
        },
      });

      // Invalidar cache das imagens
      await invalidateCache(CacheKeys.uploadedImages);

      return {
        success: true,
        file: {
          id: uploadedImage.id,
          filename: uploadedImage.filename,
          url: uploadedImage.url,
          size: uploadedImage.size,
          mimeType: uploadedImage.mimeType,
        },
      };
    } catch (error) {
      console.error("Erro no upload:", error);
      reply.code(500).send({ error: "Erro ao fazer upload do arquivo" });
    }
  });

  // Upload público (para currículos em candidaturas)
  fastify.post("/upload/resume", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        reply.code(400).send({ error: "Nenhum arquivo enviado" });
        return;
      }

      // Validar se é PDF
      if (data.mimetype !== 'application/pdf') {
        reply.code(400).send({ 
          error: "Apenas arquivos PDF são permitidos para currículos",
        });
        return;
      }

      // Validar tamanho (5MB para currículos)
      const buffer = await data.toBuffer();
      const maxResumeSize = 5 * 1024 * 1024;
      if (buffer.length > maxResumeSize) {
        reply.code(413).send({
          error: "Arquivo muito grande",
          maxSize: maxResumeSize,
          maxSizeMB: 5,
        });
        return;
      }

      // Upload para R2
      const url = await uploadToR2(buffer, data.filename, data.mimetype);

      // Salvar no banco
      const uploadedImage = await prisma.uploadedImage.create({
        data: {
          filename: data.filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          url,
          r2Key: url.split('/').pop(),
        },
      });

      return {
        success: true,
        file: {
          id: uploadedImage.id,
          filename: uploadedImage.filename,
          url: uploadedImage.url,
          size: uploadedImage.size,
        },
      };
    } catch (error) {
      console.error("Erro no upload do currículo:", error);
      reply.code(500).send({ error: "Erro ao fazer upload do currículo" });
    }
  });

  // Listar arquivos (admin)
  fastify.get("/admin/uploads", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("uploads.read")],
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "20");
      const mimeType = request.query.mimeType;

      const cacheKey = `${CacheKeys.uploadedImages}:page:${page}:limit:${limit}:type:${mimeType || 'all'}`;

      const result = await withCache(
        cacheKey,
        async () => {
          const where: any = {};
          if (mimeType) {
            where.mimeType = { startsWith: mimeType };
          }

          const [files, total] = await Promise.all([
            prisma.uploadedImage.findMany({
              where,
              orderBy: { createdAt: "desc" },
              skip: (page - 1) * limit,
              take: limit,
            }),
            prisma.uploadedImage.count({ where }),
          ]);

          return {
            files,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          };
        },
        1800 // 30 minutos
      );

      return result;
    } catch (error) {
      reply.code(500).send({ error: "Erro ao listar arquivos" });
    }
  });

  // Deletar arquivo (admin)
  fastify.delete("/admin/uploads/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("uploads.write")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const file = await prisma.uploadedImage.findUnique({
        where: { id: request.params.id },
      });

      if (!file) {
        reply.code(404).send({ error: "Arquivo não encontrado" });
        return;
      }

      // Deletar do R2
      try {
        await deleteFromR2(file.url);
      } catch (r2Error) {
        console.error("Erro ao deletar do R2:", r2Error);
        // Continuar mesmo se falhar no R2
      }

      // Deletar do banco
      await prisma.uploadedImage.delete({
        where: { id: request.params.id },
      });

      // Invalidar cache
      await invalidateCache(CacheKeys.uploadedImages);

      return { success: true, message: "Arquivo deletado com sucesso" };
    } catch (error) {
      console.error("Erro ao deletar arquivo:", error);
      reply.code(500).send({ error: "Erro ao deletar arquivo" });
    }
  });

  // Obter informações do arquivo
  fastify.get("/admin/uploads/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("uploads.read")],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const file = await prisma.uploadedImage.findUnique({
      where: { id: request.params.id },
    });

    if (!file) {
      reply.code(404).send({ error: "Arquivo não encontrado" });
      return;
    }

    return file;
  });

  // Estatísticas de uploads (admin)
  fastify.get("/admin/uploads/stats", {
    preHandler: [fastify.authenticate, fastify.requireAdmin, fastify.requirePermission("uploads.read")],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      "uploads:stats",
      async () => {
        const [totalFiles, totalSize, filesByType] = await Promise.all([
          prisma.uploadedImage.count(),
          prisma.uploadedImage.aggregate({
            _sum: { size: true },
          }),
          prisma.uploadedImage.groupBy({
            by: ['mimeType'],
            _count: { mimeType: true },
            _sum: { size: true },
          }),
        ]);

        return {
          totalFiles,
          totalSize: totalSize._sum.size || 0,
          totalSizeMB: Math.round((totalSize._sum.size || 0) / (1024 * 1024) * 100) / 100,
          filesByType: filesByType.map(type => ({
            mimeType: type.mimeType,
            count: type._count.mimeType,
            size: type._sum.size || 0,
            sizeMB: Math.round((type._sum.size || 0) / (1024 * 1024) * 100) / 100,
          })),
        };
      },
      3600 // 1 hora
    );

    return result;
  });
}