// checkMongoDB.cjs - Check MongoDB databases and collections
const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB Structure');
  console.log('=============================\n');
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful\n');
    
    // List all databases
    const adminDb = client.db('admin');
    const databases = await adminDb.admin().listDatabases();
    
    console.log('📊 Available Databases:');
    console.log('=======================');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check specific databases for collections
    const dbNames = ['skillup', 'admin', 'local'];
    
    for (const dbName of dbNames) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`\n📁 Database: ${dbName}`);
          console.log('Collections:');
          collections.forEach(col => {
            console.log(`   - ${col.name}`);
          });
        }
      } catch (error) {
        // Database might not exist, skip
      }
    }
    
    await client.close();
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  checkMongoDB().catch(console.error);
}

module.exports = { checkMongoDB }; 