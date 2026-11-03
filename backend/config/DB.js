const { Sequelize } = require("sequelize");
require("dotenv").config();
const { logger, serializeError } = require("./logger");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    // SQL statements are logged at debug level, so they never clutter the
    // normal console output unless LOG_LEVEL=debug.
    logging:
      process.env.NODE_ENV === "development"
        ? (message) => logger.debug(message)
        : false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected successfully");
  } catch (error) {
    logger.error("PostgreSQL connection failed", {
      error: serializeError(error),
    });
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
