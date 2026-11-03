const bcrypt = require("bcryptjs");
const { logError } = require("../config/logger");
const { User, Admin } = require("../models");

const modelByRole = (role) => (role === "admin" ? Admin : User);

const getUsers = async (req, res) => {
  try {
    // Only admins can list all users
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: only admins can view all users",
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
    });
    return res.status(200).json({ users, admins });
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
