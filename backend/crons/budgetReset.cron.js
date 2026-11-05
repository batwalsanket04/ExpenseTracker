const cron = require("node-cron");
const { processBudgetReset } = require("../services/budgetReset.service");
const { logger, serializeError } = require("../config/logger");

const MODULE = "budgetResetCron";
// Runs daily at 00:00 by default; the service determines whether each user's
// budget period has actually ended. Override with BUDGET_RESET_CRON env.
const schedule = process.env.BUDGET_RESET_CRON || "0 0 * * *";

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
        const result = await processBudgetReset();
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
