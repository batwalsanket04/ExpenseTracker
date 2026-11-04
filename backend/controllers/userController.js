const bcrypt = require("bcryptjs");
const { logError } = require("../config/logger");
const { User, Admin } = require("../models");
const { Op } = require("sequelize");

const modelByRole = (role) => (role === "admin" ? Admin : User);

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

const paginateModel = async (Model, where, { page, limit, offset }) => {
  const { count, rows } = await Model.findAndCountAll({
    attributes: { exclude: ["password"] },
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getUsers = async (req, res) => {
  try {
    // Only admins can list all users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: only admins can view all users",
      });
    }

    const { page, limit, offset } = getPagination(req.query);
    const { search, role } = req.query;

    const userWhere = {};
    const adminWhere = {};
    let skipUsers = false;
    let skipAdmins = false;

    if (search) {
      const like = `%${search}%`;
      userWhere[Op.or] = [
        { name: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
      ];
      adminWhere[Op.or] = [
        { name: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
      ];
    }

    if (role) {
      if (role === "admin") {
        skipUsers = true; // Only admins table
      } else if (role === "user") {
        skipAdmins = true; // Only users table
      }
    }

    const emptyPage = {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };

    const queries = [
      skipUsers
        ? Promise.resolve(emptyPage)
        : paginateModel(User, userWhere, { page, limit, offset }),
      skipAdmins
        ? Promise.resolve(emptyPage)
        : paginateModel(Admin, adminWhere, { page, limit, offset }),
    ];

    const [usersResult, adminsResult] = await Promise.all(queries);

    return res.status(200).json({
      users: usersResult.data,
      admins: adminsResult.data,
      pagination: {
        page,
        limit,
        total: usersResult.pagination.total + adminsResult.pagination.total,
        totalPages: Math.max(
          usersResult.pagination.totalPages,
          adminsResult.pagination.totalPages
        ),
      },
    });
  } catch (error) {
    logError(req, "Get users failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view themselves; admins can view anyone
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        message: "Forbidden: you can only view your own profile",
      });
    }

    let user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) user = await Admin.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    logError(req, "Get user by id failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Users can only update themselves; admins can update anyone
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        message: "Forbidden: you can only update your own profile",
      });
    }

    let user = await User.findByPk(id);
    if (!user) user = await Admin.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be 8+ chars, include uppercase, lowercase, number & special char",
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }
    // Only admins can change roles
    if (role && req.user.role === "admin") {
      updateData.role = role;
    }

    await user.update(updateData);
    const updated = await (user.constructor).findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    return res.status(200).json({ message: "User updated", user: updated });
  } catch (error) {
    logError(req, "Update user failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: only admins can delete users",
      });
    }
    // Prevent self-delete
    if (req.user.id === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    let user = await User.findByPk(id);
    if (!user) user = await Admin.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logError(req, "Delete user failed", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
