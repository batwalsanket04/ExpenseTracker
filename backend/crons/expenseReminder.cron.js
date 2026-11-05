const cron = require("node-cron");
const { sendExpenseReminders } = require("../services/expenseReminder.service");
const { logger, serializeError } = require("../config/logger");

const MODULE = "expenseReminderCron";
// Runs daily at 9:00 AM by default. Override with EXPENSE_REMINDER_CRON env.
const schedule = process.env.EXPENSE_REMINDER_CRON || "0 9 * * *";

let task = null;

/**
 * Start the expense reminder cron job.
 * Cron files only schedule tasks and delegate business logic to services.
 */
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
        const result = await sendExpenseReminders();
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
