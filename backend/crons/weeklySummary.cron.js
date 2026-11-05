const cron = require("node-cron");
const { sendWeeklySummaries } = require("../services/weeklySummary.service");
const { logger, serializeError } = require("../config/logger");

const MODULE = "weeklySummaryCron";
// Runs every Monday at 8:00 AM by default. Override with WEEKLY_SUMMARY_CRON env.
const schedule = process.env.WEEKLY_SUMMARY_CRON || "0 8 * * 1";

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
        const result = await sendWeeklySummaries();
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
