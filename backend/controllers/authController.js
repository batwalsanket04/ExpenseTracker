const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const redis = require("../config/redis");
const { logger, logError } = require("../config/logger");
const { User, Admin } = require("../models");

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" }
);

const userResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * Register a new user or admin
 * Body: { name, email, password, role? }  (role defaults to "user")
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars, include uppercase, lowercase, number & special char",
      });
    }

    const Model = role === "admin" ? Admin : User;
    const exists = await Model.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Model.create({
      name,
      email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    await redis.set(
      `refresh:${newUser.id}`,
      refreshToken,
      "EX",
      REFRESH_TTL_SECONDS
    );

    logger.info("User registered", {
      requestId: req.id,
      userId: newUser.id,
      role: newUser.role,
    });

    return res.status(201).json({
      message: "Registered successfully",
      accessToken,
      refreshToken,
      user: userResponse(newUser),
    });
  } catch (error) {
    logError(req, "Registration failed", error);
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

/**
 * Login - returns access token + refresh token (refresh stored in Redis)
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await Admin.findOne({ where: { email } });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn("Login failed: invalid credentials", {
        requestId: req.id,
        ip: req.ip,
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await redis.set(
      `refresh:${user.id}`,
      refreshToken,
      "EX",
      REFRESH_TTL_SECONDS
    );

    logger.info("Login successful", {
      requestId: req.id,
      userId: user.id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: userResponse(user),
    });
  } catch (error) {
    logError(req, "Login failed", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Refresh access token using a valid refresh token stored in Redis
 * Body: { refreshToken }
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    const stored = await redis.get(`refresh:${decoded.id}`);
    if (stored !== refreshToken) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    let user = await User.findByPk(decoded.id);
    if (!user) user = await Admin.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(user);
    return res.json({
      success: true,
      accessToken,
      user: userResponse(user),
    });
  } catch (error) {
    logError(req, "Token refresh failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Logout - delete refresh token from Redis
 * Body: { refreshToken }
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
        await redis.del(`refresh:${decoded.id}`);
      } catch (err) {
        // token malformed; ignore
      }
    }
    logger.info("Logout successful", { requestId: req.id });
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    logError(req, "Logout failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get logged-in user profile (protected route)
 */
const me = async (req, res) => {
  return res.json({
    success: true,
    user: userResponse(req.user),
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
