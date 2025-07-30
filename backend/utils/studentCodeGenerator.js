const User = require('../models/User');

const generateStudentCode = async () => {
  try {
    // Get all existing student codes, sorted
    const existingStudents = await User.find(
      { 
        studentCode: { $exists: true, $ne: null },
        role: 'student'
      },
      { studentCode: 1 },
      { sort: { studentCode: 1 } }
    );

    if (existingStudents.length === 0) {
      // If no students exist, start with SU-001
      return 'SU-001';
    }

    // Extract numbers from existing codes
    const existingNumbers = existingStudents
      .map(student => parseInt(student.studentCode.replace('SU-', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    // Find the first gap in the sequence, or use the next number
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num > nextNumber) {
        // Found a gap, use this number
        break;
      }
      nextNumber = num + 1;
    }
    
    // Format with leading zeros (e.g., SU-001, SU-002, etc.)
    return `SU-${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating student code:', error);
    throw new Error('Failed to generate student code');
  }
};

// Utility function to reassign all student codes sequentially
const reassignAllStudentCodes = async () => {
  try {
    const students = await User.find(
      { role: 'student' },
      { _id: 1, name: 1, studentCode: 1 },
      { sort: { createdAt: 1 } }
    );

    let codeNumber = 1;
    const updates = [];

    for (const student of students) {
      const newCode = `SU-${codeNumber.toString().padStart(3, '0')}`;
      if (student.studentCode !== newCode) {
        updates.push({
          id: student._id,
          oldCode: student.studentCode,
          newCode: newCode,
          name: student.name
        });
        
        await User.findByIdAndUpdate(student._id, { studentCode: newCode });
      }
      codeNumber++;
    }

    return {
      success: true,
      message: `Reassigned ${updates.length} student codes`,
      updates: updates
    };
  } catch (error) {
    console.error('Error reassigning student codes:', error);
    throw new Error('Failed to reassign student codes');
  }
};

// Utility function to find gaps in student codes
const findStudentCodeGaps = async () => {
  try {
    const students = await User.find(
      { 
        studentCode: { $exists: true, $ne: null },
        role: 'student'
      },
      { studentCode: 1, name: 1 },
      { sort: { studentCode: 1 } }
    );

    const existingNumbers = students
      .map(student => parseInt(student.studentCode.replace('SU-', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    const gaps = [];
    for (let i = 1; i <= Math.max(...existingNumbers); i++) {
      if (!existingNumbers.includes(i)) {
        gaps.push(`SU-${i.toString().padStart(3, '0')}`);
      }
    }

    return {
      totalStudents: students.length,
      highestCode: existingNumbers.length > 0 ? `SU-${Math.max(...existingNumbers).toString().padStart(3, '0')}` : 'None',
      gaps: gaps,
      gapCount: gaps.length
    };
  } catch (error) {
    console.error('Error finding student code gaps:', error);
    throw new Error('Failed to find student code gaps');
  }
};

module.exports = { 
  generateStudentCode, 
  reassignAllStudentCodes, 
  findStudentCodeGaps 
}; 