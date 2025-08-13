const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'staff'],
    default: 'student'
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  phone: String,
  englishName: String,
  dob: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  note: String,
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function setupUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const usersToAdd = [
      {
        name: 'Jenny Teacher',
        email: 'teacher-jenny@teacher.skillup',
        password: 'Skillup@123',
        role: 'teacher',
        firebaseUid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2',
        username: 'teacher-jenny'
      },
      {
        name: 'SkillUp Admin',
        email: 'admin@admin.skillup',
        password: 'Skillup@123',
        role: 'admin',
        firebaseUid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222',
        username: 'skillup-admin'
      }
    ];

    for (const userData of usersToAdd) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`${userData.name} already exists in MongoDB`);
        console.log('User ID:', existingUser._id);
        console.log('Firebase UID:', existingUser.firebaseUid);
        continue;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        firebaseUid: userData.firebaseUid,
        username: userData.username,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();
      console.log(`${userData.name} added to MongoDB successfully!`);
      console.log('User ID:', user._id);
      console.log('Firebase UID:', user.firebaseUid);
    }

    console.log('\n✅ All users setup complete!');

  } catch (error) {
    console.error('Error setting up users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
setupUsers(); 