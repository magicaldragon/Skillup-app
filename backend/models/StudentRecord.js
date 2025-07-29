const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      'enrollment', 'class_assignment', 'class_removal', 'grade_update',
      'attendance', 'payment', 'withdrawal', 're_enrollment',
      'profile_update', 'status_change', 'note_added', 'test_result'
    ]
  },
  
  // Action Category
  category: {
    type: String,
    required: true,
    enum: ['academic', 'administrative', 'financial', 'attendance', 'assessment']
  },
  
  // Detailed Information
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Related Entities
  relatedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  relatedAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  
  // Performed By
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Additional Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficient queries
studentRecordSchema.index({ studentId: 1, timestamp: -1 });
studentRecordSchema.index({ action: 1, timestamp: -1 });
studentRecordSchema.index({ category: 1, timestamp: -1 });
studentRecordSchema.index({ performedBy: 1, timestamp: -1 });

// Method to get formatted details
studentRecordSchema.methods.getFormattedDetails = function() {
  const details = this.details;
  
  switch (this.action) {
    case 'enrollment':
      return `Enrolled in ${details.program || 'program'}`;
    case 'class_assignment':
      return `Assigned to ${details.className || 'class'}`;
    case 'class_removal':
      return `Removed from ${details.className || 'class'}`;
    case 'grade_update':
      return `Grade updated: ${details.oldGrade} → ${details.newGrade}`;
    case 'attendance':
      return `Attendance marked: ${details.status} for ${details.date}`;
    case 'payment':
      return `Payment: ${details.amount} for ${details.description}`;
    case 'withdrawal':
      return `Withdrawn from ${details.program || 'program'}`;
    case 're_enrollment':
      return `Re-enrolled in ${details.program || 'program'}`;
    case 'profile_update':
      return `Profile updated: ${details.field} changed`;
    case 'status_change':
      return `Status changed: ${details.oldStatus} → ${details.newStatus}`;
    case 'note_added':
      return `Note added: ${details.note}`;
    case 'test_result':
      return `Test result: ${details.score} in ${details.testName}`;
    default:
      return details.description || 'Action performed';
  }
};

// Static method to create enrollment record
studentRecordSchema.statics.createEnrollmentRecord = function(studentId, studentName, performedBy, performedByName, details) {
  return this.create({
    studentId,
    studentName,
    action: 'enrollment',
    category: 'administrative',
    details,
    performedBy,
    performedByName
  });
};

// Static method to create class assignment record
studentRecordSchema.statics.createClassAssignmentRecord = function(studentId, studentName, performedBy, performedByName, classId, className) {
  return this.create({
    studentId,
    studentName,
    action: 'class_assignment',
    category: 'academic',
    details: { className },
    relatedClass: classId,
    performedBy,
    performedByName
  });
};

// Static method to create grade update record
studentRecordSchema.statics.createGradeRecord = function(studentId, studentName, performedBy, performedByName, assignmentId, oldGrade, newGrade) {
  return this.create({
    studentId,
    studentName,
    action: 'grade_update',
    category: 'assessment',
    details: { oldGrade, newGrade },
    relatedAssignment: assignmentId,
    performedBy,
    performedByName
  });
};

module.exports = mongoose.model('StudentRecord', studentRecordSchema);