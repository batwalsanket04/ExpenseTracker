const {
  logger,
  serializeError,
  logError,
} = require("../config/logger");

/**
 * JSON 404 for unknown routes. Express would otherwise return an HTML page,
 * which is hard for API clients to consume.
 */
const notFoundHandler = (req, res) => {
  logger.warn("Route not found", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
  });

  return res.status(404).json({
    message: "Route not found",
    requestId: req.id,
  });
};

/**
 * Final error boundary. Controllers already handle their own failures; this
 * catches anything thrown by middleware or Express itself (e.g. bad JSON).
 */
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status = error.status || error.statusCode || 500;

  if (status >= 500) {
    logError(req, "Unhandled request error", error);
  } else {
    logger.warn("Request rejected", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status,
      error: serializeError(error),
    });
  }

  const expose = status < 500 && error.expose !== false;

  return res.status(status).json({
    message: expose ? error.message : "Internal server error",
    requestId: req.id,
  });
};

module.exports = { notFoundHandler, errorHandler };
