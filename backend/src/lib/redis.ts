import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Mock Redis that silently no-ops when Redis is unavailable
function createMockRedis(): any {
  const noop = () => Promise.resolve(null);
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "on" || prop === "once") return () => {};
      if (prop === "status") return "mock";
      return noop;
    },
  };
  console.log("⚠️ Redis not configured (REDIS_HOST not set) — using noop mock");
  return new Proxy({}, handler);
}

let redis: any;

if (process.env.REDIS_HOST) {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    };

    redis = new Redis(redisConfig);

    redis.on("error", (err: Error) => {
      console.error("Redis Client Error:", err.message);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("ready", () => {
      console.log("✅ Redis ready");
    });

    redis.on("close", () => {
      console.log("⚠️ Redis connection closed");
    });
  } catch (err) {
    console.error("Failed to create Redis client:", err);
    redis = createMockRedis();
  }
} else {
  redis = createMockRedis();
}

// Função para verificar se Redis está disponível
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    return false;
  }
}

// Função para fechar conexão
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit();
  } catch {
    // ignore
  }
}

export { redis };
export default redis;
