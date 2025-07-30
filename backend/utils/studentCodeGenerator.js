const User = require('../models/User');

const generateStudentCode = async () => {
  try {
    // Find the last student with a student code
    const lastStudent = await User.findOne(
      { 
        studentCode: { $exists: true, $ne: null },
        role: 'student'
      },
      {},
      { sort: { studentCode: -1 } }
    );

    if (!lastStudent || !lastStudent.studentCode) {
      // If no students exist, start with SU-001
      return 'SU-001';
    }

    // Extract the number from the last student code
    const lastNumber = parseInt(lastStudent.studentCode.replace('SU-', ''));
    const nextNumber = lastNumber + 1;
    
    // Format with leading zeros (e.g., SU-001, SU-002, etc.)
    return `SU-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating student code:', error);
    throw new Error('Failed to generate student code');
  }
};

module.exports = { generateStudentCode }; 