const fs = require("fs");
const path = require("path");
const winston = require("winston");

/**
 * Central Winston logger.
 *
 * Environment variables (all optional):
 *   LOG_LEVEL       Console log level (default: "http").
 *                   Use "debug" to also see SQL queries.
 *   LOG_FILE_LEVEL  Minimum level written to logs/combined.log (default: "debug").
 *   LOG_TO_FILE     Set to "false" to disable file transports.
 *   LOG_DIR         Directory for log files (default: backend/logs).
 */
const LOG_TO_FILE = process.env.LOG_TO_FILE !== "false";
const CONSOLE_LEVEL = process.env.LOG_LEVEL || "http";
const FILE_LEVEL = process.env.LOG_FILE_LEVEL || "debug";
const LOG_DIR = path.resolve(__dirname, "..", process.env.LOG_DIR || "logs");

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ level: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp, stack, ...meta } = info;
    const details =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${details}${
      stack ? `\n${stack}` : ""
    }`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    level: CONSOLE_LEVEL,
    format: consoleFormat,
  }),
];

if (LOG_TO_FILE) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });

    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, "error.log"),
        level: "error",
        format: fileFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, "combined.log"),
        level: FILE_LEVEL,
        format: fileFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );
  } catch (error) {
    // Never prevent the API from booting just because file logging failed.
    // eslint-disable-next-line no-console
    console.warn(`[logger] File logging disabled: ${error.message}`);
  }
}

const logger = winston.createLogger({
  // Let transports decide the verbosity. This keeps debug-level SQL out of
  // the console while still capturing it in combined.log.
  level: "debug",
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
});

/**
 * Convert an Error into a plain, JSON-safe object without leaking fields
 * such as SQL bind parameters.
 */
const serializeError = (error) => {
  if (error === undefined || error === null) return undefined;
  if (!(error instanceof Error)) {
    return typeof error === "object" ? error : { message: String(error) };
  }

  const serialized = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error.code) serialized.code = error.code;
  if (error.status || error.statusCode) {
    serialized.status = error.status || error.statusCode;
  }
  if (Array.isArray(error.errors)) {
    serialized.errors = error.errors.map(serializeError);
  }

  return serialized;
};

/**
 * Log an error together with the request context. Safe to call with req = null
 * (for startup failures).
 */
const logError = (req, message, error, meta = {}) => {
  logger.error(message, {
    requestId: req && req.id,
    userId: req && req.user && req.user.id,
    method: req && req.method,
    path: req && req.originalUrl,
    ...meta,
    error: serializeError(error),
  });
};

module.exports = { logger, serializeError, logError };
