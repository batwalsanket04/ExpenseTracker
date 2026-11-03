const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Credit = sequelize.define(
    "Credit",
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
      source: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING,
      },
      note: {
        type: DataTypes.TEXT,
      },
    },
    {
      timestamps: true,
      tableName: "credits",
    }
  );

  return Credit;
};
