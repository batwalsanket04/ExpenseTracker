require("dotenv").config();

const express = require("express");
const app = express();

const { sequelize, connectDB } = require("./config/DB");
const redis = require("./config/redis");
const { logger, serializeError, logError } = require("./config/logger");
const { requestLogger } = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { runMigrations } = require("./config/runMigrations");
const { startAll: startCrons } = require("./crons");

const PORT = process.env.PORT || 5000;

// Routes
const authRoute = require("./routes/auth.route");
const userRoute = require("./routes/user.route");
const expRoute = require("./routes/expenses.route");
const creditRoute = require("./routes/credit.route");
const budgetRoute = require("./routes/budget.route");
const budgetPreferenceRoute = require("./routes/budgetPreference.route");
const notificationPreferenceRoute = require("./routes/notificationPreference.route");
const notificationRoute = require("./routes/notification.route");
const auditRoute = require("./routes/audit.route");

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cors = require("cors");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://expensetracker-2-58w9.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("API Working");
});

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/expense", expRoute);
app.use("/api/credit", creditRoute);
app.use("/api/budget", budgetRoute);
app.use("/api/budget-preferences", budgetPreferenceRoute);
app.use("/api/notification-preferences", notificationPreferenceRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/audit", auditRoute);

// 404 + final error boundary
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize DB + Redis, run migrations, then start server
const startServer = async () => {
  try {
    await connectDB(); // authenticate PostgreSQL

    // Connect Redis, but never let a missing/unreachable Redis instance
    // prevent the API (and login) from starting. Refresh-token caching
    // degrades gracefully when Redis is unavailable.
    try {
      await redis.connect();
    } catch (error) {
      logger.warn("Redis unavailable, continuing without cache", {
        error: error.message,
      });
    }

    // Run pending migrations (creates/updates tables)
    await runMigrations();
    logger.info("Database migrations executed");

    // Start scheduled cron jobs (no-op when CRON_ENABLED=false).
    startCrons();

    app.listen(PORT, "0.0.0.0", () => {
      logger.info("Server started", {
        port: PORT,
        env: process.env.NODE_ENV || "development",
      });
    });
  } catch (error) {
    logError(null, "Failed to start server", error);
    process.exit(1);
  }
};

// Keep unexpected failures in the logs instead of losing them on the console.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    error: serializeError(reason),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: serializeError(error) });
  setTimeout(() => process.exit(1), 250).unref();
});

startServer();

module.exports = { app, sequelize, redis };
