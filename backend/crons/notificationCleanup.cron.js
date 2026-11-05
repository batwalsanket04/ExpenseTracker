const cron = require("node-cron");
const { cleanupNotifications } = require("../services/notificationCleanup.service");
const { logger, serializeError } = require("../config/logger");

const MODULE = "notificationCleanupCron";
// Runs daily at 02:00 AM by default. Override with NOTIFICATION_CLEANUP_CRON env.
const schedule = process.env.NOTIFICATION_CLEANUP_CRON || "0 2 * * *";

let task = null;

const start = () => {
  if (process.env.CRON_ENABLED === "false") {
    logger.info(`${MODULE}: disabled (CRON_ENABLED=false)`);
    return null;
  }

  task = cron.schedule(
    schedule,
    async () => {
      logger.info(`${MODULE}: running scheduled task`, { schedule });
      try {
        const result = await cleanupNotifications();
        logger.info(`${MODULE}: scheduled task completed`, result);
      } catch (error) {
        logger.error(`${MODULE}: scheduled task failed`, {
          error: serializeError(error),
        });
      }
    },
    {
      scheduled: true,
      timezone:
        process.env.CRON_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  );

  logger.info(`${MODULE}: scheduled`, { schedule });
  return task;
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info(`${MODULE}: stopped`);
  }
};

module.exports = { start, stop, schedule };
