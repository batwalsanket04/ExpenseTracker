const { Sequelize } = require("sequelize");
require("dotenv").config();
const { logger, serializeError } = require("./logger");

// Build the Sequelize instance. Render's managed PostgreSQL provides a single
// DATABASE_URL (with ?sslmode=require). Fall back to the individual DB_* vars
// for local development / other providers.
const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl || {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  dialectOptions:
    process.env.DB_SSL === "true" || process.env.NODE_ENV === "production"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Render-managed DB uses a valid cert
          },
        }
      : {},
  logging:
    process.env.NODE_ENV === "development"
      ? (message) => logger.debug(message)
      : false,
});

const MAX_CONNECT_RETRIES = 10;
const INITIAL_BACKOFF_MS = 2000;

const connectDB = async (retries = 0) => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected successfully");
  } catch (error) {
    logger.error("PostgreSQL connection failed", {
      error: serializeError(error),
      attempt: retries + 1,
      maxRetries: MAX_CONNECT_RETRIES,
    });

    if (retries >= MAX_CONNECT_RETRIES) {
      logger.error("Exhausted PostgreSQL connection retries", {
        error: serializeError(error),
      });
      process.exit(1);
    }

    // Exponential backoff before retrying (useful when the DB service is
    // still starting up on first deploy).
    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retries);
    logger.info(`Retrying PostgreSQL connection in ${backoffMs}ms`, {
      attempt: retries + 1,
    });
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return connectDB(retries + 1);
  }
};

module.exports = { sequelize, connectDB };
