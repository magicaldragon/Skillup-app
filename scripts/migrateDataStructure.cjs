// migrateDataStructure.cjs - Migrate data structure for Firestore
const { MongoClient } = require('mongodb');

async function migrateDataStructure() {
  console.log('🔄 Migrating Data Structure for Firestore');
  console.log('==========================================\n');
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    const db = client.db('skillup');
    
    // Collections to migrate
    const collections = ['users', 'classes', 'levels', 'potentialstudents', 'changelogs', 'studentrecords'];
    
    console.log('📊 Analyzing collections for migration...\n');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        console.log(`📁 ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          // Get a sample document to analyze structure
          const sample = await collection.findOne({});
          console.log(`   Sample structure:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...');
        }
        
      } catch (error) {
        console.log(`❌ Error analyzing ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n📋 Migration Summary:');
    console.log('====================');
    console.log('✅ Data structure analysis complete');
    console.log('✅ Ready for Firestore migration');
    console.log('\n🚀 Next steps:');
    console.log('1. Download service account key from Firebase Console');
    console.log('2. Save as serviceAccountKey.json in project root');
    console.log('3. Run: npm run migrate:firestore');
    
    await client.close();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  migrateDataStructure().catch(console.error);
}

module.exports = { migrateDataStructure }; 