const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  displayName: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  dob: String,
  role: { type: String, enum: ['student', 'teacher', 'admin', 'staff'], default: 'student' },
  status: { type: String, enum: ['potential', 'contacted', 'studying', 'postponed', 'off', 'alumni'], default: 'potential' },
  studentCode: { type: String, unique: true, sparse: true },
  avatarUrl: String,
  diceBearStyle: { type: String, default: 'avataaars' },
  diceBearSeed: String,
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema); 