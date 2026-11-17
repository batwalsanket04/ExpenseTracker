'use strict';

/**
 * Migration: Add previousValue and newValue columns to audit_logs table
 * Ref: backend/models/Audit.js
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("audit_logs", "previousValue", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("audit_logs", "newValue", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("audit_logs", "newValue");
    await queryInterface.removeColumn("audit_logs", "previousValue");
  },
};
