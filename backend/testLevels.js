const mongoose = require('mongoose');
const Level = require('./models/Level');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testLevels() {
  try {
    console.log('Testing levels in database...');

    // Check if we can connect
    console.log('MongoDB connection status:', mongoose.connection.readyState);

    // Count all levels
    const totalLevels = await Level.countDocuments();
    console.log('Total levels in database:', totalLevels);

    // Count active levels
    const activeLevels = await Level.countDocuments({ isActive: true });
    console.log('Active levels in database:', activeLevels);

    // Get all levels
    const allLevels = await Level.find({});
    console.log(
      'All levels:',
      allLevels.map((l) => ({ id: l._id, name: l.name, code: l.code, isActive: l.isActive }))
    );

    // Get active levels
    const activeLevelsData = await Level.find({ isActive: true });
    console.log(
      'Active levels data:',
      activeLevelsData.map((l) => ({ id: l._id, name: l.name, code: l.code }))
    );
  } catch (error) {
    console.error('Error testing levels:', error);
  } finally {
    mongoose.connection.close();
  }
}

testLevels();
