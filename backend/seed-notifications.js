require("dotenv").config();
const { sequelize } = require("./config/DB");
const { User, Notification } = require("./models");

const seedNotifications = async () => {
  try {
    await sequelize.authenticate();

    // Find first user
    const user = await User.findOne();
    if (!user) {
      console.error("No users found. Please create a user first.");
      process.exit(1);
    }

    console.log("Seeding notifications for user:", user.id, user.name);

    const notifications = [
      {
        userId: user.id,
        type: "system",
        title: "Welcome to ExpenseTracker",
        message: "Your notification center is ready. Alerts and summaries will appear here.",
        data: null,
      },
      {
        userId: user.id,
        type: "expense_reminder",
        title: "Daily expense reminder",
        message: "Don't forget to log today's expenses. Keeping records up to date helps you stay on budget.",
        data: { reminderType: "daily" },
      },
      {
        userId: user.id,
        type: "weekly_summary",
        title: "Weekly summary",
        message: "You spent ₹2,850 this week across 6 transactions. Your top category was Food.",
        data: { period: "weekly", totalSpent: 2850, transactionCount: 6, topCategory: "Food" },
      },
      {
        userId: user.id,
        type: "monthly_summary",
        title: "Monthly summary",
        message: "You spent ₹12,400 this month. You're 62% of the way to your monthly budget of ₹20,000.",
        data: { period: "monthly", totalSpent: 12400, budget: 20000, percentage: 62 },
      },
      {
        userId: user.id,
        type: "budget_alert",
        title: "Budget alert: Food",
        message: "Your Food budget is at 85% (₹1,700 of ₹2,000). Consider slowing down on dining out.",
        data: { category: "Food", spent: 1700, budget: 2000, percentage: 85 },
      },
    ];

    await Notification.bulkCreate(notifications);
    console.log(`Successfully created ${notifications.length} notifications for user ${user.id}`);

    // Show unread count
    const unreadCount = await Notification.count({ where: { userId: user.id, read: false } });
    console.log(`Unread notifications: ${unreadCount}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedNotifications();
