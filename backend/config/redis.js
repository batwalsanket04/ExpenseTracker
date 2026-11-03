const Redis = require("ioredis");
const { logger, serializeError } = require("./logger");

let redis;
const options = {
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};

if (process.env.REDIS_URL) {
  const redisUrl = process.env.REDIS_URL;

  if (/^https?:\/\//i.test(redisUrl)) {
    const endpoint = new URL(redisUrl);
    redis = new Redis({
      ...options,
      host: endpoint.hostname,
      port: Number(endpoint.port) || 6379,
      username: "default",
      tls: {},
    });
  } else {
    redis = new Redis(redisUrl, options);
  }
} else {
  redis = new Redis({
    ...options,
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  });
}

redis.on("connect", () => logger.info("Redis connected successfully"));
redis.on("reconnecting", (delay) =>
  logger.warn("Redis reconnecting", { delayMs: delay })
);
redis.on("error", (err) =>
  logger.error("Redis error", { error: serializeError(err) })
);

module.exports = redis;
