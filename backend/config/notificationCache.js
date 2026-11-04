const redis = require("./redis");
const { logger, serializeError } = require("./logger");

/**
 * Redis cache layer for notification preferences.
 *
 * Keys:
 *   notif:prefs:<userId>  -> JSON string of the preference object (TTL 15 min)
 *
 * Why cache: preference reads happen on every page load / notification dispatch.
 * Keeping them in Redis avoids a PostgreSQL round-trip on hot reads while the
 * database remains the source of truth.
 */
const TTL_SECONDS = 15 * 60; // 15 minutes

const cacheKey = (userId) => `notif:prefs:${userId}`;

/**
 * Read cached notification preferences for a user.
 * Returns null on a miss or any Redis error (caller falls back to DB).
 */
const getCached = async (userId) => {
  try {
    const raw = await redis.get(cacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    logger.warn("Notification cache read failed", {
      userId,
      error: serializeError(error),
    });
    return null;
  }
};

/**
 * Write notification preferences to the cache.
 */
const setCached = async (userId, preferences) => {
  try {
    await redis.setex(cacheKey(userId), TTL_SECONDS, JSON.stringify(preferences));
  } catch (error) {
    logger.warn("Notification cache write failed", {
      userId,
      error: serializeError(error),
    });
  }
};

/**
 * Remove cached preferences for a user (call after any update).
 */
const delCached = async (userId) => {
  try {
    await redis.del(cacheKey(userId));
  } catch (error) {
    logger.warn("Notification cache delete failed", {
      userId,
      error: serializeError(error),
    });
  }
};

/**
 * Publish a preference-change event on Redis so other server instances (and
 * real-time consumers) can react immediately instead of waiting for TTL expiry.
 */
const publishChange = async (userId, preferences) => {
  try {
    await redis.publish(
      "notification:preference:changed",
      JSON.stringify({ userId, preferences, updatedAt: new Date().toISOString() })
    );
  } catch (error) {
    logger.warn("Notification preference publish failed", {
      userId,
      error: serializeError(error),
    });
  }
};

module.exports = {
  getCached,
  setCached,
  delCached,
  publishChange,
  cacheKey,
  TTL_SECONDS,
};
