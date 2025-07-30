const mongoose = require('mongoose');
const { generateStudentCode, reassignAllStudentCodes, findStudentCodeGaps } = require('../utils/studentCodeGenerator');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'generate':
        const newCode = await generateStudentCode();
        console.log(`Next available student code: ${newCode}`);
        break;
        
      case 'gaps':
        const gaps = await findStudentCodeGaps();
        console.log('Student Code Analysis:');
        console.log(`Total students: ${gaps.totalStudents}`);
        console.log(`Highest code: ${gaps.highestCode}`);
        console.log(`Gap count: ${gaps.gapCount}`);
        if (gaps.gaps.length > 0) {
          console.log('Available codes:', gaps.gaps.join(', '));
        } else {
          console.log('No gaps found - codes are sequential');
        }
        break;
        
      case 'reassign':
        console.log('Reassigning all student codes sequentially...');
        const result = await reassignAllStudentCodes();
        console.log(result.message);
        if (result.updates.length > 0) {
          console.log('Updated codes:');
          result.updates.forEach(update => {
            console.log(`  ${update.name}: ${update.oldCode} → ${update.newCode}`);
          });
        } else {
          console.log('No codes needed reassignment');
        }
        break;
        
      case 'test':
        console.log('Testing student code generation...');
        for (let i = 0; i < 5; i++) {
          const code = await generateStudentCode();
          console.log(`Generated code ${i + 1}: ${code}`);
        }
        break;
        
      default:
        console.log('Student Code Management Script');
        console.log('Usage: node manageStudentCodes.js <command>');
        console.log('');
        console.log('Commands:');
        console.log('  generate  - Generate the next available student code');
        console.log('  gaps      - Find gaps in the student code sequence');
        console.log('  reassign  - Reassign all student codes sequentially (removes gaps)');
        console.log('  test      - Test student code generation');
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main(); 