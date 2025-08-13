const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('Database:', mongoose.connection.db.databaseName);

    // Test if we can access the users collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(
      'Collections found:',
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testConnection();
