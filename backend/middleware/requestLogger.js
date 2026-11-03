const { randomUUID } = require("crypto");
const { logger } = require("../config/logger");

/**
 * Attaches a request id to every request and emits one structured access log
 * line when the response finishes.
 */
const requestLogger = (req, res, next) => {
  const incomingId = req.get("x-request-id");
  req.id =
    incomingId && incomingId.length <= 100 ? incomingId : randomUUID();

  res.setHeader("X-Request-Id", req.id);

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const status = res.statusCode;
    const forwardedFor = (req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();

    const level =
      status >= 500 ? "error" : status >= 400 ? "warn" : "http";
    const isHealthCheck = req.method === "GET" && req.originalUrl === "/";

    logger.log(isHealthCheck ? "debug" : level, "HTTP request", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status,
      durationMs: Number(durationMs.toFixed(1)),
      ip: forwardedFor || req.ip || req.socket.remoteAddress,
      userId: req.user && req.user.id,
      role: req.user && req.user.role,
    });
  });

  next();
};

module.exports = { requestLogger };
