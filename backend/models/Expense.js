const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Expense = sequelize.define(
    "Expense",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: "Other",
      },
      date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      note: {
        type: DataTypes.TEXT,
      },
    },
    {
      timestamps: true,
      tableName: "expenses",
    }
  );

  return Expense;
};
