const nodemailer = require("nodemailer");
const { logger, serializeError } = require("../config/logger");

/**
 * Email service for notification preferences.
 *
 * Sending is gated behind SMTP environment variables. When SMTP is not
 * configured the service degrades gracefully (logs instead of sending) so the
 * rest of the application keeps working without a mail server.
 *
 * Required env vars (all optional):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
 */
let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.info("Email service disabled: SMTP_HOST not configured");
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    tls: {
      // Allow self-signed certs in dev only when explicitly opted in.
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    },
  });
  return transporter;
};

/**
 * Send an email to a single recipient.
 * @param {Object} params
 * @param {string} params.to - recipient email
 * @param {string} params.subject
 * @param {string} params.text - plain-text body
 * @param {string} [params.html] - optional HTML body
 * @returns {Promise<{sent: boolean, info?: Object, error?: string}>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = initTransporter();
  if (!transport) {
    logger.info("Email skipped (no SMTP):", { to, subject });
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    const info = await transport.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "ExpenseTracker"}" <${process.env.SMTP_FROM || "noreply@example.com"}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info("Email sent", { to, subject, messageId: info.messageId });
    return { sent: true, info };
  } catch (error) {
    logger.error("Email send failed", {
      to,
      subject,
      error: serializeError(error),
    });
    return { sent: false, error: error.message };
  }
};

/**
 * Send a preference-change confirmation email (only when the user has email
 * notifications enabled).
 */
const sendPreferenceChangeConfirmation = async ({ to, name, updatedPreferences }) => {
  const enabledChannels = [];
  if (updatedPreferences.emailNotifications) enabledChannels.push("Email");
  if (updatedPreferences.inAppNotifications) enabledChannels.push("In-app");
  if (updatedPreferences.expenseReminder) enabledChannels.push("Expense reminders");
  if (updatedPreferences.weeklySummary) enabledChannels.push("Weekly summary");
  if (updatedPreferences.monthlySummary) enabledChannels.push("Monthly summary");

  const text = `Hi ${name || "there"},\n\nYour notification preferences have been updated.\n\nEnabled channels: ${enabledChannels.length ? enabledChannels.join(", ") : "none"}\n\nIf you did not make this change, please contact support.\n\n— ExpenseTracker`;

  return sendEmail({
    to,
    subject: "Your notification preferences were updated",
    text,
  });
};

module.exports = {
  sendEmail,
  sendPreferenceChangeConfirmation,
  initTransporter,
};
