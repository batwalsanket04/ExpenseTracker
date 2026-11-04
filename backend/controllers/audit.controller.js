const { Audit, User } = require("../models");
const { logError } = require("../config/logger");
const { Op } = require("sequelize");

/**
 * Parse and sanitize pagination params.
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10) || 20)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * List audit logs with server-side pagination + filtering.
 *
 * Query params:
 *   page, limit          pagination
 *   user                 filter by user id or name (case-insensitive partial match)
 *   action               filter by action (exact)
 *   module               filter by module (exact)
 *   startDate            filter logs on/after this date (inclusive)
 *   endDate              filter logs on/before this date (inclusive end of day)
 *
 * Admin only.
 */
const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: only admins can view audit logs",
      });
    }

    const { page, limit, offset } = getPagination(req.query);
    const { user, action, module, startDate, endDate } = req.query;

    const where = {};

    // Filter by user (id or name). When filtering by name, resolve matching
    // user ids first, then filter audit_logs.userId IN those ids.
    if (user) {
      const userIdMatch = /^[0-9a-fA-F-]{36}$/.test(user);
      if (userIdMatch) {
        where.userId = user;
      } else {
        const matchingUsers = await User.findAll({
          attributes: ["id"],
          where: {
            name: { [Op.iLike]: `%${user}%` },
          },
        });
        const userIds = matchingUsers.map((u) => u.id);
        if (userIds.length === 0) {
          // No users match the name -> return empty page
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          });
        }
        where.userId = { [Op.in]: userIds };
      }
    }

    if (action) where.action = action;
    if (module) where.module = module;

    // Date range (inclusive). endDate is treated as end of that day.
    if (startDate) {
      where.createdAt = { ...where.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      const endInclusive = new Date(endDate);
      endInclusive.setHours(23, 59, 59, 999);
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: endInclusive,
      };
    }

    const { count, rows } = await Audit.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logError(req, "Get audit logs failed", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAuditLogs,
};
