const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Budget = sequelize.define(
    "Budget",
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
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      spent: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      period: {
        type: DataTypes.ENUM("weekly", "monthly", "yearly"),
        defaultValue: "monthly",
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "budgets",
    }
  );

  return Budget;
};
