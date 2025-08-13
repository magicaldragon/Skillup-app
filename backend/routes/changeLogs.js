const express = require('express');
const router = express.Router();
const ChangeLog = require('../models/ChangeLog');
const { verifyToken } = require('./auth');

// GET /api/change-logs?entityType=class&userId=...&action=...&limit=100
router.get('/', verifyToken, async (req, res) => {
  try {
    const { entityType, userId, action, limit = 100 } = req.query;
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    const logs = await ChangeLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, logs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch change logs', error: error.message });
  }
});

module.exports = router;
