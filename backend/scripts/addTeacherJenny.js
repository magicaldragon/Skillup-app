const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'staff'],
    default: 'student',
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  phone: String,
  englishName: String,
  dob: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  note: String,
  classIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function addTeacherJenny() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if Teacher Jenny already exists
    const existingUser = await User.findOne({ email: 'teacher-jenny@teacher.skillup' });
    if (existingUser) {
      console.log('Teacher Jenny already exists in MongoDB');
      console.log('User ID:', existingUser._id);
      console.log('Firebase UID:', existingUser.firebaseUid);
      return;
    }

    // Create Teacher Jenny
    const hashedPassword = await bcrypt.hash('Skillup@123', 10);

    const teacherJenny = new User({
      name: 'Jenny Teacher',
      email: 'teacher-jenny@teacher.skillup',
      password: hashedPassword,
      role: 'teacher',
      firebaseUid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2', // From hybridAuthService.ts
      username: 'teacher-jenny',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await teacherJenny.save();
    console.log('Teacher Jenny added to MongoDB successfully!');
    console.log('User ID:', teacherJenny._id);
    console.log('Firebase UID:', teacherJenny.firebaseUid);
  } catch (error) {
    console.error('Error adding Teacher Jenny:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTeacherJenny();
