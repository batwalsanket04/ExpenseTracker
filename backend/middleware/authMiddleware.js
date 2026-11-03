const jwt = require("jsonwebtoken");
const { logger, serializeError } = require("../config/logger");

const getUserById = async (id) => {
  const { User, Admin } = require("../models");
  let user = await User.findByPk(id);
  if (!user) user = await Admin.findByPk(id);
  return user;
};

/**
 * Verify access token and attach req.user (includes role)
 */
const protect = async (req, res, next) => {
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    logger.warn("Authorization denied: missing token", {
      requestId: req.id,
      ip: req.ip,
      path: req.originalUrl,
    });
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await getUserById(decoded.id);
    if (!user) {
      logger.warn("Authorization denied: user not found", {
        requestId: req.id,
        userId: decoded.id,
      });
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.warn("Authorization denied: invalid token", {
      requestId: req.id,
      error: serializeError(error),
    });
    return res.status(401).json({
      message: "Token invalid or expired",
      error: error.message,
    });
  }
};

/**
 * Role-based access control. Usage: authorize("admin") or authorize("user", "admin")
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logger.warn("Authorization denied: insufficient role", {
      requestId: req.id,
      userId: req.user && req.user.id,
      role: req.user && req.user.role,
      requiredRoles: roles,
      path: req.originalUrl,
    });
    return res.status(403).json({
      message: "Forbidden: insufficient role",
      required: roles,
      current: req.user ? req.user.role : null,
    });
  }
  next();
};

module.exports = { protect, authorize };
