import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";
import { authenticate, requireAdmin, requirePermission, requireAnyPermission } from "./middleware/auth";
import { prisma } from "./lib/prisma";
import { closeRedis } from "./lib/redis";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate;
    requireAdmin: typeof requireAdmin;
    requirePermission: typeof requirePermission;
    requireAnyPermission: typeof requireAnyPermission;
  }
}

// Routes
import authRoutes from "./routes/auth";
import homeRoutes from "./routes/home";
import servicesRoutes from "./routes/services";
import solutionsRoutes from "./routes/solutions";
import testimonialsRoutes from "./routes/testimonials";
import contactRoutes from "./routes/contact";
import uploadRoutes from "./routes/upload";
import siteSettingsRoutes from "./routes/site-settings";
import analyticsRoutes from "./routes/analytics";
import jobsRoutes from "./routes/jobs";
import clientsRoutes from "./routes/clients";
import inboxRoutes from "./routes/inbox";
import blogRoutes from "./routes/blog";
import teamRoutes from "./routes/team";
import valuesRoutes from "./routes/values";
import kpisRoutes from "./routes/kpis";
import perksRoutes from "./routes/perks";
import homeExtrasRoutes from "./routes/home-extras";
import stackItemsRoutes from "./routes/stack-items";
import aboutCardsRoutes from "./routes/about-cards";
import usersRoutes from "./routes/users";
import processStepsRoutes from "./routes/process-steps";
import aiRoutes from "./routes/ai";
import pageSectionsRoutes from "./routes/page-sections";
import apiTokenRoutes from "./routes/api-tokens";
import publicApiBlogRoutes from "./routes/public-api-blog";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Register authenticate and requireAdmin as decorators
fastify.decorate("authenticate", authenticate);
fastify.decorate("requireAdmin", requireAdmin);
fastify.decorate("requirePermission", requirePermission);
fastify.decorate("requireAnyPermission", requireAnyPermission);

// Register plugins
fastify.register(cors, {
  origin: process.env.NODE_ENV === "production"
    ? ["https://bsnsolution.com.br", "https://www.bsnsolution.com.br"]
    : true,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

fastify.register(multipart, {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Error handler para arquivos muito grandes
fastify.setErrorHandler((error, request, reply) => {
  if (error.code === "FST_REQ_FILE_TOO_LARGE") {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    reply.code(413).send({
      error: "Arquivo muito grande!",
      message: `O tamanho máximo permitido é ${maxSizeMB}MB`,
      maxSize: MAX_FILE_SIZE,
      maxSizeMB: maxSizeMB,
    });
    return;
  }
  
  // Outros erros
  reply.send(error);
});

// Register routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(homeRoutes, { prefix: "/api" });
fastify.register(servicesRoutes, { prefix: "/api" });
fastify.register(solutionsRoutes, { prefix: "/api" });
fastify.register(testimonialsRoutes, { prefix: "/api" });
fastify.register(contactRoutes, { prefix: "/api" });
fastify.register(uploadRoutes, { prefix: "/api" });
fastify.register(siteSettingsRoutes, { prefix: "/api" });
fastify.register(analyticsRoutes, { prefix: "/api" });
fastify.register(jobsRoutes, { prefix: "/api" });
fastify.register(clientsRoutes, { prefix: "/api" });
fastify.register(inboxRoutes, { prefix: "/api" });
fastify.register(blogRoutes, { prefix: "/api" });
fastify.register(teamRoutes, { prefix: "/api" });
fastify.register(valuesRoutes, { prefix: "/api" });
fastify.register(kpisRoutes, { prefix: "/api" });
fastify.register(perksRoutes, { prefix: "/api" });
fastify.register(homeExtrasRoutes, { prefix: "/api" });
fastify.register(stackItemsRoutes, { prefix: "/api" });
fastify.register(aboutCardsRoutes, { prefix: "/api" });
fastify.register(usersRoutes, { prefix: "/api" });
fastify.register(processStepsRoutes, { prefix: "/api" });
fastify.register(aiRoutes, { prefix: "/api" });
fastify.register(pageSectionsRoutes, { prefix: "/api" });
fastify.register(apiTokenRoutes, { prefix: "/api" });
// Rotas externas para automação (AI) — prefixo /api/v1
fastify.register(publicApiBlogRoutes, { prefix: "/api/v1" });

// Health check
fastify.get("/health", async () => {
  return { 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "BSN Solution API"
  };
});

// Root endpoint
fastify.get("/", async () => {
  return { 
    message: "BSN Solution API",
    version: "1.0.0",
    status: "active"
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 BSN Solution API running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await fastify.close();
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await fastify.close();
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});