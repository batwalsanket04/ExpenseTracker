const express = require("express");
const { getAuditLogs } = require("../controllers/audit.controller");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// List audit logs - admin only
// Query: page, limit, user, action, module, startDate, endDate
router.get("/", protect, authorize("admin"), getAuditLogs);

module.exports = router;
