const mongoose = require('mongoose');
const Level = require('../models/Level');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup';

// Standard levels to populate
const standardLevels = [
  {
    name: 'STARTERS (PRE)',
    code: 'PRE',
    description: 'Cambridge English Qualifications Pre A1 Starters.',
    isActive: true,
  },
  {
    name: 'MOVERS (A1)',
    code: 'A1',
    description: 'Cambridge English Qualifications A1 Movers.',
    isActive: true,
  },
  {
    name: 'FLYERS (A2A)',
    code: 'A2A',
    description: 'Cambridge English Qualifications A2 Flyers.',
    isActive: true,
  },
  {
    name: 'KET (A2B)',
    code: 'A2B',
    description: 'Cambridge English Qualifications A2 Key for Schools.',
    isActive: true,
  },
  {
    name: 'PET (B1)',
    code: 'B1',
    description: 'Cambridge English Qualifications B1 Preliminary for Schools.',
    isActive: true,
  },
  {
    name: 'PRE-IELTS (B2PRE)',
    code: 'B2PRE',
    description: 'Foundation for IELTS.',
    isActive: true,
  },
  {
    name: 'IELTS',
    code: 'I',
    description: 'International English Language Testing System.',
    isActive: true,
  },
];

async function populateLevels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if levels already exist
    const existingLevels = await Level.find({ isActive: true });
    console.log(`Found ${existingLevels.length} existing levels`);

    if (existingLevels.length === 0) {
      console.log('No levels found. Populating with standard levels...');

      for (const levelData of standardLevels) {
        const existingLevel = await Level.findOne({
          $or: [{ name: levelData.name }, { code: levelData.code }],
        });

        if (!existingLevel) {
          const newLevel = new Level(levelData);
          await newLevel.save();
          console.log(`Created level: ${levelData.name} (${levelData.code})`);
        } else {
          console.log(`Level already exists: ${levelData.name} (${levelData.code})`);
        }
      }

      console.log('Levels population completed successfully');
    } else {
      console.log('Levels already exist in the database');
      console.log('Existing levels:');
      existingLevels.forEach((level) => {
        console.log(`- ${level.name} (${level.code})`);
      });
    }
  } catch (error) {
    console.error('Error populating levels:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateLevels();
