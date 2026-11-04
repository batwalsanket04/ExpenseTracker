'use strict';

/**
 * Migration: Create notification_preferences table
 * Ref: backend/models/NotificationPreference.js
 *
 * Stores per-user dynamic notification preferences:
 *   - emailNotifications
 *   - inAppNotifications
 *   - expenseReminder
 *   - weeklySummary
 *   - monthlySummary
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notification_preferences", {
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
        unique: true,
      },
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      inAppNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expenseReminder: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      weeklySummary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      monthlySummary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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

    // Index for fast lookups by user
    await queryInterface.addIndex("notification_preferences", ["userId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notification_preferences");
  },
};
