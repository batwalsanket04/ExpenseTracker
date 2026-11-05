const cron = require("node-cron");
const { sendMonthlySummaries } = require("../services/monthlySummary.service");
const { logger, serializeError } = require("../config/logger");

const MODULE = "monthlySummaryCron";
// Runs on the 1st of every month at 8:00 AM by default.
// Override with MONTHLY_SUMMARY_CRON env.
const schedule = process.env.MONTHLY_SUMMARY_CRON || "0 8 1 * *";

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
        const result = await sendMonthlySummaries();
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
