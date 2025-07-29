const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function fixRoles() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Update admin
  await User.updateOne(
    { email: 'skillup-admin@teacher.skillup' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated skillup-admin@teacher.skillup to admin');

  // Update teacher
  await User.updateOne(
    { email: 'teacher-jenny@teacher.skillup' },
    { $set: { role: 'teacher' } }
  );
  console.log('Updated teacher-jenny@teacher.skillup to teacher');

  await mongoose.disconnect();
  console.log('Done!');
}

fixRoles();