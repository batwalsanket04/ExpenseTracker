require("dotenv").config();
const { sequelize } = require("./config/DB");
const { User, Expense, Audit } = require("./models");

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Utilities",
  "Entertainment",
  "Health",
  "Rent",
  "Groceries",
  "Fuel",
  "Other",
];

const titles = [
  "Grocery shopping",
  "Dinner out",
  "Uber ride",
  "Electricity bill",
  "Movie tickets",
  "Pharmacy",
  "Monthly rent",
  "Supermarket",
  "Gas station",
  "Coffee",
  "Internet bill",
  "Gym membership",
  "Clothing",
  "Doctor visit",
  "Book store",
  "Pet food",
  "Car maintenance",
  "Haircut",
  "Streaming subscription",
  "Home repairs",
];

const getRandomDate = () => {
  const start = new Date(2026, 9, 1); // Oct 1, 2026
  const end = new Date(2026, 10, 3); // Nov 3, 2026
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString();
};

const seedExpenses = async () => {
  try {
    await sequelize.authenticate();

    // Find first user (create one if none exists)
    let user = await User.findOne();
    if (!user) {
      const bcrypt = require("bcryptjs");
      user = await User.create({
        name: "Seed User",
        email: "seed@example.com",
        password: await bcrypt.hash("Seed@1234", 10),
        role: "user",
      });
      console.log("Created seed user:", user.id);
    } else {
      console.log("Using existing user:", user.id);
    }

    // Create 50 expenses
    const expenses = [];
    for (let i = 0; i < 50; i++) {
      expenses.push({
        userId: user.id,
        title: titles[i % titles.length],
        amount: parseFloat((Math.random() * 100 + 5).toFixed(2)),
        category: categories[i % categories.length],
        date: getRandomDate(),
        note: `Auto-generated expense #${i + 1}`,
      });
    }

    await Expense.bulkCreate(expenses);
    console.log(`Successfully created ${expenses.length} expenses for user ${user.id}`);

    // Seed a few audit log entries so the admin audit tab has data
    const auditEntries = [
      { userId: user.id, action: "LOGIN", module: "auth", details: "Seed user logged in" },
      { userId: user.id, action: "EXPENSE_CREATE", module: "expense", details: "Created seed expenses" },
      { userId: user.id, action: "EXPENSE_UPDATE", module: "expense", details: "Updated an expense" },
      { userId: user.id, action: "EXPENSE_DELETE", module: "expense", details: "Deleted an expense" },
    ];
    await Audit.bulkCreate(auditEntries);
    console.log(`Successfully created ${auditEntries.length} audit log entries`);
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedExpenses();
