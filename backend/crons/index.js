const { logger } = require("../config/logger");

const expenseReminderCron = require("./expenseReminder.cron");
const weeklySummaryCron = require("./weeklySummary.cron");
const monthlySummaryCron = require("./monthlySummary.cron");
const budgetResetCron = require("./budgetReset.cron");
const notificationCleanupCron = require("./notificationCleanup.cron");

const allCrons = [
  { name: "expenseReminder", cron: expenseReminderCron },
  { name: "weeklySummary", cron: weeklySummaryCron },
  { name: "monthlySummary", cron: monthlySummaryCron },
  { name: "budgetReset", cron: budgetResetCron },
  { name: "notificationCleanup", cron: notificationCleanupCron },
];

/**
 * Start every configured cron job.
 * @returns {Array<{name: string, scheduled: string}>} list of started crons
 */
const startAll = () => {
  const started = [];
  for (const { name, cron: c } of allCrons) {
    const task = c.start();
    if (task) {
      started.push({ name, schedule: c.schedule });
    }
  }
  logger.info("Cron scheduler initialized", { count: started.length, crons: started });
  return started;
};

/**
 * Stop every cron job (useful for graceful shutdown / tests).
 */
const stopAll = () => {
  for (const { cron: c } of allCrons) {
    c.stop();
  }
  logger.info("All cron jobs stopped");
};

module.exports = { startAll, stopAll, allCrons };
