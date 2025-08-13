const mongoose = require('mongoose');

const potentialStudentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
  },
  englishName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  dob: {
    type: Date,
  },

  // Contact Information
  parentName: {
    type: String,
    trim: true,
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },

  // Academic Information
  currentSchool: {
    type: String,
    trim: true,
  },
  currentGrade: {
    type: String,
    trim: true,
  },
  englishLevel: {
    type: String,
    enum: [
      'beginner',
      'elementary',
      'pre-intermediate',
      'intermediate',
      'upper-intermediate',
      'advanced',
    ],
    default: 'beginner',
  },

  // Application Details
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'walk_in', 'other'],
    default: 'other',
  },
  referralBy: {
    type: String,
    trim: true,
  },
  interestedPrograms: [
    {
      type: String,
      trim: true,
    },
  ],

  // Status and Processing
  status: {
    type: String,
    enum: ['pending', 'contacted', 'interviewed', 'approved', 'rejected', 'enrolled'],
    default: 'pending',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin/Teacher who is handling this potential student
  },
  notes: {
    type: String,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  contactedAt: {
    type: Date,
  },
  interviewedAt: {
    type: Date,
  },
  enrolledAt: {
    type: Date,
  },
});

// Update the updatedAt field before saving
potentialStudentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to convert to regular user
potentialStudentSchema.methods.convertToUser = function () {
  return {
    name: this.name,
    englishName: this.englishName,
    email: this.email,
    phone: this.phone,
    gender: this.gender,
    dob: this.dob,
    role: 'student',
    status: 'active',
  };
};

// Index for efficient queries
potentialStudentSchema.index({ status: 1, createdAt: -1 });
potentialStudentSchema.index({ assignedTo: 1 });
potentialStudentSchema.index({ email: 1 });

module.exports = mongoose.model('PotentialStudent', potentialStudentSchema);
