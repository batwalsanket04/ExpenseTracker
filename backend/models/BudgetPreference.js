const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BudgetPreference = sequelize.define(
    "BudgetPreference",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      monthlyBudget: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 20000,
      },
      budgetPeriod: {
        type: DataTypes.ENUM("weekly", "monthly", "yearly"),
        defaultValue: "monthly",
        allowNull: false,
      },
      alertThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 80,
        validate: {
          min: 1,
          max: 100,
        },
      },
      enableBudgetAlert: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      enableEmailAlert: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      enableInAppAlert: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      carryForwardBudget: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      autoResetBudget: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      tableName: "budget_preferences",
    }
  );

  return BudgetPreference;
};
