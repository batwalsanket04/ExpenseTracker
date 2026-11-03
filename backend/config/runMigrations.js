const fs = require("fs");
const path = require("path");
const { sequelize } = require("./DB");
const { logger, serializeError } = require("./logger");

/**
 * Self-contained migration runner.
 *
 * Migration state is tracked in a `SequelizeMeta` table (one row per applied
 * migration, storing the migration file name). This makes migrations
 * idempotent — running them multiple times is safe because already-applied
 * migrations are skipped.
 *
 * Migration files must export { up(queryInterface, Sequelize), down(...) }
 * and are executed in filename order.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");
const META_TABLE = "SequelizeMeta";

/**
 * Ensure the SequelizeMeta tracking table exists.
 */
async function ensureMetaTable(queryInterface) {
  const tableExists = await queryInterface.tableExists(META_TABLE);
  if (!tableExists) {
    await queryInterface.createTable(META_TABLE, {
      name: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
    });
    logger.info("Created migration tracking table", { table: META_TABLE });
  }
}

/**
 * Get the list of migration file names already applied.
 */
async function getAppliedMigrations(queryInterface) {
  const [rows] = await sequelize.query(
    `SELECT name FROM "${META_TABLE}" ORDER BY name ASC`
  );
  return rows.map((r) => r.name);
}

/**
 * Record a migration as applied.
 */
async function markMigrationApplied(queryInterface, fileName) {
  await sequelize.query(
    `INSERT INTO "${META_TABLE}" (name) VALUES (:name) ON CONFLICT (name) DO NOTHING`,
    { replacements: { name: fileName } }
  );
}

/**
 * Remove a migration record (used on rollback).
 */
async function markMigrationReverted(queryInterface, fileName) {
  await sequelize.query(
    `DELETE FROM "${META_TABLE}" WHERE name = :name`,
    { replacements: { name: fileName } }
  );
}

/**
 * Load all migration files sorted by filename.
 */
function loadMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort();
}

/**
 * Run all pending migrations.
 * Safe to call on every server start — already-applied migrations are skipped.
 */
const runMigrations = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await ensureMetaTable(queryInterface);
  const applied = new Set(await getAppliedMigrations(queryInterface));
  const files = loadMigrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    logger.info("No pending migrations");
    return;
  }

  logger.info("Migrations to apply", { count: pending.length, files: pending });

  for (const file of pending) {
    const migration = require(path.join(MIGRATIONS_DIR, file));
    logger.info("Applying migration", { file });
    await migration.up(queryInterface, sequelize.Sequelize);
    await markMigrationApplied(queryInterface, file);
    logger.info("Migration applied", { file });
  }
};

/**
 * Revert the most recent migration (use with care).
 */
const revertLastMigration = async () => {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);
  const applied = await getAppliedMigrations(queryInterface);

  if (applied.length === 0) {
    logger.info("No migrations to revert");
    return;
  }

  const last = applied[applied.length - 1]; // highest filename = most recent
  const migration = require(path.join(MIGRATIONS_DIR, last));
  logger.info("Reverting migration", { file: last });
  await migration.down(queryInterface, sequelize.Sequelize);
  await markMigrationReverted(queryInterface, last);
  logger.info("Migration reverted", { file: last });
};

/**
 * List executed and pending migrations.
 */
const listMigrations = async () => {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);
  const applied = await getAppliedMigrations(queryInterface);
  const files = loadMigrationFiles();
  return {
    executed: files.filter((f) => applied.includes(f)),
    pending: files.filter((f) => !applied.includes(f)),
  };
};

module.exports = { runMigrations, revertLastMigration, listMigrations };
