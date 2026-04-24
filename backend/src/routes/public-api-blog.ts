import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { invalidateCache, CacheKeys } from "../lib/cache"
import { authenticateApiToken, requireScope } from "../middleware/api-token"
import { uploadToR2 } from "../lib/r2"

/**
 * Rotas consumidas por integrações externas (ex: IA gerando posts).
 * Base: /api/v1/blog
 *
 * Autenticação: Bearer <token> (ApiToken com scope apropriado)
 * Scopes:
 *  - blog:read     — listar/ver posts
 *  - blog:write    — criar/editar
 *  - blog:delete   — excluir
 *  - blog:metrics  — ler métricas agregadas
 *  - upload:write  — upload de imagens (capa)
 */

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

// Schemas
const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || "1")),
  limit: z.string().optional().transform((v) => parseInt(v || "20")),
  status: z.enum(["all", "published", "draft"]).optional().default("all"),
  tag: z.string().optional(),
  search: z.string().optional(),
  includeMetrics: z.string().optional().transform((v) => v === "true"),
})

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug deve ser kebab-case"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
})

const updateSchema = createSchema.partial()

export default async function publicApiBlogRoutes(fastify: FastifyInstance) {
  // Todas as rotas exigem token válido
  fastify.addHook("preHandler", authenticateApiToken)

  // ─────────────────────────────────────────────────────────────
  // LIST — com métricas opcionais
  // GET /api/v1/blog?page=1&limit=20&status=all&tag=ia&includeMetrics=true
  // ─────────────────────────────────────────────────────────────
  fastify.get(
    "/blog",
    { preHandler: [requireScope("blog:read")] },
    async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
      try {
        const { page, limit, status, tag, search, includeMetrics } = listQuerySchema.parse(
          request.query
        )

        const where: any = {}
        if (status === "published") where.isPublished = true
        if (status === "draft") where.isPublished = false
        if (tag) where.tags = { has: tag }
        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
          ]
        }

        // Se pedir métricas, precisa do scope correspondente
        if (includeMetrics && !request.apiToken?.scopes.includes("blog:metrics")) {
          reply.code(403).send({
            error: "Scope 'blog:metrics' necessário para includeMetrics=true",
          })
          return
        }

        const [posts, total] = await Promise.all([
          prisma.blogPost.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              coverImage: true,
              tags: true,
              isPublished: true,
              isFeatured: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,
              author: { select: { id: true, name: true } },
              ...(includeMetrics
                ? {
                    viewCount: true,
                    uniqueViewCount: true,
                    avgReadTimeSec: true,
                    lastViewedAt: true,
                  }
                : {}),
            },
          }),
          prisma.blogPost.count({ where }),
        ])

        return {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          reply.code(400).send({ error: "Parâmetros inválidos", details: err.errors })
          return
        }
        reply.code(500).send({ error: "Erro ao listar posts" })
      }
    }
  )

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/blog/:id  — pode ser id OU slug
  // ─────────────────────────────────────────────────────────────
  fastify.get(
    "/blog/:idOrSlug",
    { preHandler: [requireScope("blog:read")] },
    async (request: FastifyRequest<{ Params: { idOrSlug: string } }>, reply: FastifyReply) => {
      const { idOrSlug } = request.params
      const post = await prisma.blogPost.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        include: { author: { select: { id: true, name: true } } },
      })
      if (!post) {
        reply.code(404).send({ error: "Post não encontrado" })
        return
      }
      return post
    }
  )

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/blog/:id/metrics — métricas detalhadas
  // ─────────────────────────────────────────────────────────────
  fastify.get(
    "/blog/:idOrSlug/metrics",
    { preHandler: [requireScope("blog:metrics")] },
    async (request: FastifyRequest<{ Params: { idOrSlug: string }; Querystring: any }>, reply: FastifyReply) => {
      const { idOrSlug } = request.params
      const windowDays = Math.max(1, Math.min(365, parseInt(request.query.windowDays || "30")))

      const post = await prisma.blogPost.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          uniqueViewCount: true,
          avgReadTimeSec: true,
          lastViewedAt: true,
          publishedAt: true,
          createdAt: true,
        },
      })
      if (!post) {
        reply.code(404).send({ error: "Post não encontrado" })
        return
      }

      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

      // Série temporal (views por dia nos últimos N dias)
      const viewsPerDay = await prisma.$queryRawUnsafe<{ day: string; views: bigint }[]>(
        `SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS views
         FROM "blog_post_views"
         WHERE "postId" = $1 AND "createdAt" >= $2
         GROUP BY 1
         ORDER BY 1 ASC`,
        post.id,
        since
      )

      // Agregados úteis pra AI
      const aggregates = await prisma.blogPostView.aggregate({
        where: { postId: post.id, createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { readTimeSec: true },
      })

      // Referrers top 10
      const topReferrers = await prisma.blogPostView.groupBy({
        by: ["referrer"],
        where: { postId: post.id, createdAt: { gte: since }, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      })

      return {
        post,
        window: { days: windowDays, since: since.toISOString() },
        totals: {
          views: aggregates._count._all,
          avgReadTimeSec: Math.round(aggregates._avg.readTimeSec || 0),
        },
        viewsPerDay: viewsPerDay.map((r) => ({ day: r.day, views: Number(r.views) })),
        topReferrers: topReferrers.map((r) => ({
          referrer: r.referrer,
          count: r._count.referrer,
        })),
      }
    }
  )

  // ─────────────────────────────────────────────────────────────
  // CREATE — POST /api/v1/blog
  // ─────────────────────────────────────────────────────────────
  fastify.post(
    "/blog",
    { preHandler: [requireScope("blog:write")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createSchema.parse(request.body)

        const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } })
        if (existing) {
          reply.code(409).send({ error: "Slug já existe" })
          return
        }

        // Autor default: primeiro ADMIN (posts criados por API usam um autor "system")
        const fallbackAuthor = await prisma.user.findFirst({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        })
        if (!fallbackAuthor) {
          reply.code(500).send({ error: "Nenhum autor disponível no sistema" })
          return
        }

        const post = await prisma.blogPost.create({
          data: {
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt ?? null,
            content: data.content,
            coverImage: data.coverImage ?? null,
            tags: data.tags ?? [],
            isPublished: data.isPublished ?? false,
            isFeatured: data.isFeatured ?? false,
            publishedAt: data.isPublished
              ? data.publishedAt
                ? new Date(data.publishedAt)
                : new Date()
              : null,
            authorId: fallbackAuthor.id,
          },
          include: { author: { select: { id: true, name: true } } },
        })

        await invalidateCache(`${CacheKeys.blogPosts}:*`)
        await invalidateCache("blog:tags")

        return reply.code(201).send(post)
      } catch (err) {
        if (err instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: err.errors })
          return
        }
        reply.code(500).send({ error: "Erro ao criar post" })
      }
    }
  )

  // ─────────────────────────────────────────────────────────────
  // UPDATE — PUT /api/v1/blog/:idOrSlug
  // ─────────────────────────────────────────────────────────────
  fastify.put(
    "/blog/:idOrSlug",
    { preHandler: [requireScope("blog:write")] },
    async (request: FastifyRequest<{ Params: { idOrSlug: string } }>, reply: FastifyReply) => {
      try {
        const data = updateSchema.parse(request.body)
        const { idOrSlug } = request.params

        const existing = await prisma.blogPost.findFirst({
          where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
          select: { id: true, slug: true },
        })
        if (!existing) {
          reply.code(404).send({ error: "Post não encontrado" })
          return
        }

        // Se mudar slug, verificar conflito
        if (data.slug && data.slug !== existing.slug) {
          const conflict = await prisma.blogPost.findUnique({ where: { slug: data.slug } })
          if (conflict) {
            reply.code(409).send({ error: "Slug já em uso" })
            return
          }
        }

        const updated = await prisma.blogPost.update({
          where: { id: existing.id },
          data: {
            ...data,
            publishedAt: data.publishedAt === undefined
              ? undefined
              : data.publishedAt === null
                ? null
                : new Date(data.publishedAt),
          },
          include: { author: { select: { id: true, name: true } } },
        })

        await invalidateCache(`${CacheKeys.blogPosts}:*`)
        await invalidateCache(CacheKeys.blogPost(existing.slug))
        if (updated.slug !== existing.slug) {
          await invalidateCache(CacheKeys.blogPost(updated.slug))
        }
        await invalidateCache("blog:tags")

        return updated
      } catch (err) {
        if (err instanceof z.ZodError) {
          reply.code(400).send({ error: "Dados inválidos", details: err.errors })
          return
        }
        reply.code(500).send({ error: "Erro ao atualizar post" })
      }
    }
  )

  // ─────────────────────────────────────────────────────────────
  // DELETE — DELETE /api/v1/blog/:idOrSlug
  // ─────────────────────────────────────────────────────────────
  fastify.delete(
    "/blog/:idOrSlug",
    { preHandler: [requireScope("blog:delete")] },
    async (request: FastifyRequest<{ Params: { idOrSlug: string } }>, reply: FastifyReply) => {
      const { idOrSlug } = request.params
      const post = await prisma.blogPost.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: { id: true, slug: true },
      })
      if (!post) {
        reply.code(404).send({ error: "Post não encontrado" })
        return
      }
      await prisma.blogPost.delete({ where: { id: post.id } })
      await invalidateCache(`${CacheKeys.blogPosts}:*`)
      await invalidateCache(CacheKeys.blogPost(post.slug))
      await invalidateCache("blog:tags")
      return { message: "Post removido" }
    }
  )

  // ─────────────────────────────────────────────────────────────
  // UPLOAD de imagem (para usar em coverImage)
  // POST /api/v1/blog/images (multipart form-data)
  // ─────────────────────────────────────────────────────────────
  fastify.post(
    "/blog/images",
    { preHandler: [requireScope("upload:write")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await request.file()
        if (!data) {
          reply.code(400).send({ error: "Nenhum arquivo enviado" })
          return
        }
        if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
          reply.code(400).send({
            error: "Tipo de arquivo não permitido",
            allowed: ALLOWED_IMAGE_TYPES,
          })
          return
        }
        const buffer = await data.toBuffer()
        if (buffer.length > MAX_IMAGE_SIZE) {
          reply.code(413).send({ error: "Arquivo muito grande", maxBytes: MAX_IMAGE_SIZE })
          return
        }

        const url = await uploadToR2(buffer, data.filename, data.mimetype)

        const uploaded = await prisma.uploadedImage.create({
          data: {
            filename: data.filename,
            originalName: data.filename,
            mimeType: data.mimetype,
            size: buffer.length,
            url,
            r2Key: url.split("/").pop() || data.filename,
          },
        })

        return reply.code(201).send({
          id: uploaded.id,
          url: uploaded.url,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        })
      } catch (err) {
        request.log.error({ err }, "api-v1 upload error")
        reply.code(500).send({ error: "Erro ao fazer upload" })
      }
    }
  )
}
