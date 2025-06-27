import { Redis } from "ioredis";

export const connectRedis = (redisUrl: string) => {
  const redis = new Redis(redisUrl);

  redis.on("connect", () => {
    console.log("✅ Connected to Redis");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis Error:", err);
  });

  return redis;
};
