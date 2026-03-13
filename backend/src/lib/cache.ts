import redis, { isRedisAvailable } from "./redis";

// Prefixo para todas as chaves de cache
const CACHE_PREFIX = "bsn-site:";

// TTL padrão (Time To Live) em segundos
const DEFAULT_TTL = 3600; // 1 hora

/**
 * Obtém valor do cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!(await isRedisAvailable())) {
      return null;
    }

    const fullKey = `${CACHE_PREFIX}${key}`;
    const cached = await redis.get(fullKey);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Define valor no cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const fullKey = `${CACHE_PREFIX}${key}`;
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await redis.setex(fullKey, ttl, serialized);
    } else {
      await redis.set(fullKey, serialized);
    }

    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Remove uma chave específica do cache
 */
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const fullKey = `${CACHE_PREFIX}${key}`;
    await redis.del(fullKey);
    return true;
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Remove múltiplas chaves do cache usando padrão
 */
export async function invalidateCachePattern(pattern: string): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const fullPattern = `${CACHE_PREFIX}${pattern}`;
    const keys = await redis.keys(fullPattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return true;
  } catch (error) {
    console.error(`Error invalidating cache pattern ${pattern}:`, error);
    return false;
  }
}

/**
 * Remove todo o cache (usar com cuidado!)
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    if (!(await isRedisAvailable())) {
      return false;
    }

    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return true;
  } catch (error) {
    console.error("Error clearing all cache:", error);
    return false;
  }
}

/**
 * Helper para executar função com cache
 * Se não houver cache, executa a função e armazena o resultado
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Tentar obter do cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Se não houver cache, executar função
  const result = await fn();

  // Armazenar no cache
  await setCache(key, result, ttl);

  return result;
}

// Chaves de cache padronizadas
export const CacheKeys = {
  // Home
  home: "home",
  homeSection: (id: string) => `home:${id}`,
  
  // Services
  services: "services",
  service: (id: string) => `service:${id}`,
  
  // Solutions
  solutions: "solutions",
  solutionsFeatured: "solutions:featured",
  solution: (id: string) => `solution:${id}`,
  
  // Testimonials
  testimonials: "testimonials",
  
  // Blog
  blogPosts: "blog-posts",
  blogPost: (slug: string) => `blog:${slug}`,
  
  // Team
  team: "team",
  teamMember: (id: string) => `team:${id}`,
  
  // Contact
  contact: "contact",
  
  // Clients
  clients: "clients",
  
  // Jobs
  jobs: "jobs",
  job: (id: string) => `job:${id}`,
  
  // Site Settings
  siteSettings: "site-settings",
  
  // Uploaded Images
  uploadedImages: "uploaded-images",
};