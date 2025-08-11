const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true }, // Add username field
  name: { type: String, required: true },
  displayName: String,
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'teacher', 'admin', 'staff'], default: 'student' },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  englishName: String,
  dob: String,
  phone: String,
  parentName: String,
  parentPhone: String,
  notes: String,
  status: { type: String, enum: ['active', 'potential', 'contacted', 'studying', 'postponed', 'off', 'alumni'], default: 'potential' },
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