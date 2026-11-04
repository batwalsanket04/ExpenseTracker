'use strict';

/**
 * Migration: Create budget_preferences table
 * Ref: backend/models/BudgetPreference.js
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("budget_preferences", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      monthlyBudget: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 20000,
      },
      budgetPeriod: {
        type: Sequelize.ENUM("weekly", "monthly", "yearly"),
        defaultValue: "monthly",
        allowNull: false,
      },
      alertThreshold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 80,
      },
      enableBudgetAlert: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      enableEmailAlert: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      enableInAppAlert: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      carryForwardBudget: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      autoResetBudget: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("budget_preferences");
  },
};
