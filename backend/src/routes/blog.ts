import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withCache, invalidateCache, CacheKeys } from "../lib/cache";

const blogPostSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  authorId: z.string().uuid().optional(),
});

const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || "1")),
  limit: z.string().optional().transform(val => parseInt(val || "10")),
  tag: z.string().optional(),
  featured: z.string().optional().transform(val => val === "true"),
});

export default async function blogRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get("/blog", async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const { page, limit, tag, featured } = querySchema.parse(request.query);
      
      const cacheKey = `${CacheKeys.blogPosts}:page:${page}:limit:${limit}:tag:${tag || 'all'}:featured:${featured || 'all'}`;
      
      const result = await withCache(
        cacheKey,
        async () => {
          const where: any = { isPublished: true };
          
          if (tag) {
            where.tags = { has: tag };
          }
          
          if (featured !== undefined) {
            where.isFeatured = featured;
          }

          const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
              where,
              orderBy: { publishedAt: "desc" },
              skip: (page - 1) * limit,
              take: limit,
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true,
                tags: true,
                isFeatured: true,
                publishedAt: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            }),
            prisma.blogPost.count({ where }),
          ]);

          return {
            posts,
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
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Parâmetros inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao buscar posts" });
    }
  });

  fastify.get("/blog/:slug", async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const result = await withCache(
      CacheKeys.blogPost(request.params.slug),
      async () => {
        const post = await prisma.blogPost.findFirst({
          where: {
            slug: request.params.slug,
            isPublished: true,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!post) {
          reply.code(404).send({ error: "Post não encontrado" });
          return null;
        }

        return post;
      },
      3600
    );

    if (!result) {
      return;
    }

    return result;
  });

  // Lista de tags únicas
  fastify.get("/blog/tags", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await withCache(
      "blog:tags",
      async () => {
        const posts = await prisma.blogPost.findMany({
          where: { isPublished: true },
          select: { tags: true },
        });

        const allTags = posts.flatMap(post => post.tags);
        const uniqueTags = [...new Set(allTags)].sort();

        return { tags: uniqueTags };
      },
      7200 // 2 horas
    );

    return result;
  });

  // Admin routes
  fastify.get("/admin/blog", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const { page, limit } = querySchema.parse(request.query);

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.blogPost.count(),
      ]);

      return {
        posts,
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
      reply.code(500).send({ error: "Erro ao buscar posts" });
    }
  });

  fastify.get("/admin/blog/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      reply.code(404).send({ error: "Post não encontrado" });
      return;
    }

    return post;
  });

  fastify.post("/admin/blog", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = blogPostSchema.parse(request.body);

      // Verificar se o slug já existe
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });

      if (existingPost) {
        reply.code(400).send({ error: "Slug já existe" });
        return;
      }

      // Se publishedAt não foi fornecido e o post está sendo publicado, usar agora
      if (data.isPublished && !data.publishedAt) {
        data.publishedAt = new Date().toISOString();
      }

      // authorId: se não foi passado, usa o usuário logado
      const authorId = data.authorId || request.user!.id;

      const post = await prisma.blogPost.create({
        data: {
          ...data,
          authorId,
          coverImage: data.coverImage || null,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Invalidar cache
      await invalidateCache(`${CacheKeys.blogPosts}:*`);
      await invalidateCache("blog:tags");

      return post;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao criar post" });
    }
  });

  fastify.put("/admin/blog/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = blogPostSchema.partial().parse(request.body);

      // Se o slug está sendo alterado, verificar se não existe
      if (data.slug) {
        const existingPost = await prisma.blogPost.findFirst({
          where: {
            slug: data.slug,
            NOT: { id: request.params.id },
          },
        });

        if (existingPost) {
          reply.code(400).send({ error: "Slug já existe" });
          return;
        }
      }

      const post = await prisma.blogPost.update({
        where: { id: request.params.id },
        data: {
          ...data,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Invalidar cache
      await invalidateCache(`${CacheKeys.blogPosts}:*`);
      if (data.slug) {
        await invalidateCache(CacheKeys.blogPost(data.slug));
      }
      await invalidateCache("blog:tags");

      return post;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: "Dados inválidos", details: error.errors });
        return;
      }
      reply.code(500).send({ error: "Erro ao atualizar post" });
    }
  });

  fastify.delete("/admin/blog/:id", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { id: request.params.id },
        select: { slug: true },
      });

      if (!post) {
        reply.code(404).send({ error: "Post não encontrado" });
        return;
      }

      await prisma.blogPost.delete({
        where: { id: request.params.id },
      });

      // Invalidar cache
      await invalidateCache(`${CacheKeys.blogPosts}:*`);
      await invalidateCache(CacheKeys.blogPost(post.slug));
      await invalidateCache("blog:tags");

      return { message: "Post deletado com sucesso" };
    } catch (error) {
      reply.code(500).send({ error: "Erro ao deletar post" });
    }
  });

  fastify.patch("/admin/blog/:id/toggle-published", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
    });

    if (!post) {
      reply.code(404).send({ error: "Post não encontrado" });
      return;
    }

    const updated = await prisma.blogPost.update({
      where: { id: request.params.id },
      data: { 
        isPublished: !post.isPublished,
        publishedAt: !post.isPublished && !post.publishedAt ? new Date() : post.publishedAt,
      },
    });

    // Invalidar cache
    await invalidateCache(`${CacheKeys.blogPosts}:*`);
    await invalidateCache(CacheKeys.blogPost(post.slug));

    return updated;
  });

  fastify.patch("/admin/blog/:id/toggle-featured", {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: request.params.id },
    });

    if (!post) {
      reply.code(404).send({ error: "Post não encontrado" });
      return;
    }

    const updated = await prisma.blogPost.update({
      where: { id: request.params.id },
      data: { isFeatured: !post.isFeatured },
    });

    // Invalidar cache
    await invalidateCache(`${CacheKeys.blogPosts}:*`);

    return updated;
  });
}