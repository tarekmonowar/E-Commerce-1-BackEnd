import { Redis } from "ioredis";

export const connectRedis = (redisUrl: string) => {
  const redis = new Redis(redisUrl, {
    tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });

  redis.on("connect", () => {
    console.log("✅ Connected to Redis");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis Error:", err);
  });

  return redis;
};
