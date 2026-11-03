const fs = require("fs");
const path = require("path");
const { sequelize } = require("../config/DB");

const db = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

db.sequelize = sequelize;
db.Sequelize = require("sequelize");

module.exports = db;
