const mongoose = require('mongoose');

const ChangeLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g., add, edit, delete, assign
  entityType: { type: String, required: true }, // e.g., class, level, student
  entityId: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed }, // { before, after } or summary
  timestamp: { type: Date, default: Date.now },
  ip: { type: String }, // optional
});

module.exports = mongoose.model('ChangeLog', ChangeLogSchema); 