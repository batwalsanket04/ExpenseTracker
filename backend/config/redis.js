const Redis = require("ioredis");
const { logger, serializeError } = require("./logger");

let redis;
let redisConnected = false;
const options = {
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  maxRetries: 5,
  retryStrategy: (times) => {
    // Stop retrying after several attempts so startup never hangs forever.
    if (times > 5) return null;
    return Math.min(times * 200, 5000);
  },
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

redis.isConnected = () => redisConnected;

redis.on("connect", () => {
  redisConnected = true;
  logger.info("Redis connected successfully");
});
redis.on("reconnecting", (delay) =>
  logger.warn("Redis reconnecting", { delayMs: delay })
);
redis.on("error", (err) => {
  redisConnected = false;
  logger.error("Redis error", { error: serializeError(err) });
});
redis.on("close", () => {
  redisConnected = false;
  logger.warn("Redis connection closed");
});
redis.on("end", () => {
  redisConnected = false;
});

module.exports = redis;
