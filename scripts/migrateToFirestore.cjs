// migrateToFirestore.cjs - Migration script from MongoDB to Firestore
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'skillup-3beaf',
});

const db = admin.firestore();

// Migration configuration
const config = {
  batchSize: 500, // Number of documents to process in each batch
  delayBetweenBatches: 1000, // Delay between batches in milliseconds
  collections: [
    'users',
    'classes',
    'levels',
    'assignments',
    'submissions',
    'potentialStudents',
    'studentRecords',
    'changeLogs',
  ],
};

// Helper function to add timestamps
function addTimestamps(data) {
  return {
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// Helper function to convert MongoDB ObjectId to string
function convertObjectIds(data) {
  if (typeof data === 'object' && data !== null) {
    if (data._id && typeof data._id === 'object') {
      data.id = data._id.toString();
      delete data._id;
    }

    for (const key in data) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = convertObjectIds(data[key]);
      }
    }
  }
  return data;
}

// Helper function to convert dates
function convertDates(data) {
  if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data[key] instanceof Date) {
        data[key] = admin.firestore.Timestamp.fromDate(data[key]);
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        data[key] = convertDates(data[key]);
      }
    }
  }
  return data;
}

// Helper function to process data before migration
function processData(data) {
  let processed = JSON.parse(JSON.stringify(data)); // Deep clone
  processed = convertObjectIds(processed);
  processed = convertDates(processed);
  processed = addTimestamps(processed);
  return processed;
}

// Helper function to sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Migration function for a single collection
async function migrateCollection(collectionName, mongoCollection) {
  console.log(`\n🔄 Starting migration for collection: ${collectionName}`);

  try {
    // Get total count
    const totalCount = await mongoCollection.countDocuments();
    console.log(`📊 Total documents in ${collectionName}: ${totalCount}`);

    if (totalCount === 0) {
      console.log(`✅ No documents to migrate for ${collectionName}`);
      return { success: true, count: 0 };
    }

    // Process in batches
    let processedCount = 0;
    let batchCount = 0;

    const cursor = mongoCollection.find({});

    while (await cursor.hasNext()) {
      const batch = [];

      // Collect documents for this batch
      for (let i = 0; i < config.batchSize && (await cursor.hasNext()); i++) {
        const doc = await cursor.next();
        batch.push(doc);
      }

      if (batch.length === 0) break;

      // Process batch
      const writeBatch = db.batch();

      for (const doc of batch) {
        const processedDoc = processData(doc);
        const docRef = db.collection(collectionName).doc();
        writeBatch.set(docRef, processedDoc);
      }

      // Commit batch
      await writeBatch.commit();

      processedCount += batch.length;
      batchCount++;

      console.log(
        `�� Batch ${batchCount}: Processed ${batch.length} documents (${processedCount}/${totalCount})`
      );

      // Add delay between batches to avoid rate limiting
      if (await cursor.hasNext()) {
        await sleep(config.delayBetweenBatches);
      }
    }

    console.log(`✅ Successfully migrated ${processedCount} documents from ${collectionName}`);
    return { success: true, count: processedCount };
  } catch (error) {
    console.error(`❌ Error migrating collection ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
}

// Main migration function
async function migrateData() {
  console.log('🚀 Starting MongoDB to Firestore migration...');
  console.log('📋 Configuration:', config);

  let mongoClient;

  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');

    const mongoDb = mongoClient.db();

    // Migration results
    const results = {
      totalCollections: config.collections.length,
      successfulCollections: 0,
      failedCollections: 0,
      totalDocuments: 0,
      errors: [],
    };

    // Migrate each collection
    for (const collectionName of config.collections) {
      try {
        const mongoCollection = mongoDb.collection(collectionName);
        const result = await migrateCollection(collectionName, mongoCollection);

        if (result.success) {
          results.successfulCollections++;
          results.totalDocuments += result.count;
        } else {
          results.failedCollections++;
          results.errors.push({
            collection: collectionName,
            error: result.error,
          });
        }
      } catch (error) {
        console.error(`❌ Failed to migrate collection ${collectionName}:`, error);
        results.failedCollections++;
        results.errors.push({
          collection: collectionName,
          error: error.message,
        });
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`Total Collections: ${results.totalCollections}`);
    console.log(`Successful: ${results.successfulCollections}`);
    console.log(`Failed: ${results.failedCollections}`);
    console.log(`Total Documents Migrated: ${results.totalDocuments}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error) => {
        console.log(`  - ${error.collection}: ${error.error}`);
      });
    }

    if (results.failedCollections === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the errors above.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Validation function
async function validateMigration() {
  console.log('\n🔍 Validating migration...');

  try {
    for (const collectionName of config.collections) {
      const snapshot = await db.collection(collectionName).limit(1).get();
      console.log(`✅ ${collectionName}: ${snapshot.size > 0 ? 'Has data' : 'Empty'}`);
    }
    console.log('✅ Validation completed');
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  // Check for MongoDB URI
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    console.log('Please set it with: export MONGODB_URI="your_mongodb_connection_string"');
    process.exit(1);
  }

  // Check for service account key
  try {
    require('../serviceAccountKey.json');
  } catch (_error) {
    console.error('❌ serviceAccountKey.json file is required');
    console.log('Please download it from Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }

  // Run migration
  migrateData()
    .then(() => validateMigration())
    .then(() => {
      console.log('\n🎉 Migration process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData, validateMigration };
