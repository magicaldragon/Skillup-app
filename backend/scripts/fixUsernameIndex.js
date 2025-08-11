const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';

async function fixUsernameIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    console.log('🔍 Checking existing indexes on users collection...');
    
    // List all indexes on the users collection
    const indexes = await db.collection('users').indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Check if there's a problematic username index
    const usernameIndex = indexes.find(index => 
      index.key && index.key.username === 1
    );
    
    if (usernameIndex) {
      console.log('⚠️  Found existing username index:', usernameIndex);
      
      // Check if it allows null values
      if (usernameIndex.sparse === false) {
        console.log('🔧 Fixing username index to allow sparse (null) values...');
        
        // Drop the existing index
        await db.collection('users').dropIndex(usernameIndex.name);
        console.log('✅ Dropped existing username index');
        
        // Create a new sparse index
        await db.collection('users').createIndex({ username: 1 }, { 
          unique: true, 
          sparse: true 
        });
        console.log('✅ Created new sparse username index');
      } else {
        console.log('✅ Username index is already properly configured');
      }
    } else {
      console.log('🔧 Creating username index...');
      await db.collection('users').createIndex({ username: 1 }, { 
        unique: true, 
        sparse: true 
      });
      console.log('✅ Created username index');
    }
    
    console.log('🎉 Username index fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing username index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixUsernameIndex(); 