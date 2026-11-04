const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NotificationPreference = sequelize.define(
    "NotificationPreference",
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
        unique: true,
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      inAppNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expenseReminder: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      weeklySummary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      monthlySummary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      tableName: "notification_preferences",
    }
  );

  NotificationPreference.associate = (models) => {
    NotificationPreference.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return NotificationPreference;
};
