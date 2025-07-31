import React, { useState, useEffect } from 'react';
import type { Assignment, Submission, Student, StudentClass } from './types';
import ClassesPanel from './ClassesPanel';
import AddNewMembers from './AddNewMembers';
import LevelsPanel from './LevelsPanel';
import WaitingListPanel from './WaitingListPanel';
import PotentialStudentsPanel from './PotentialStudentsPanel';
import './AddNewMembers.css';

interface DashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  students: Student[];
  classes: StudentClass[];
  loading?: boolean;
  error?: string | null;
  user?: Student;
  activeKey?: string;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ assignments, submissions, students, classes, loading, error, user, activeKey, onLogout }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Reset submission when assignment changes
  React.useEffect(() => { setSelectedSubmission(null); setSelectedStudent(null); }, [selectedAssignment]);

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-semibold">{error}</div>;

  // Handle settings panel
  if (activeKey === 'settings' && user && onLogout) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <SettingsPanel user={user} isAdmin={user.role === 'admin'} onLogout={onLogout} classes={classes} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <AnalyticsDashboard assignments={assignments} submissions={submissions} students={students} />
      <AssignmentListPanel
        assignments={assignments}
        classes={classes}
        onSelectAssignment={a => setSelectedAssignment(a)}
      />
      {selectedAssignment && !selectedSubmission && (
        <SubmissionListPanel
          assignment={selectedAssignment}
          submissions={submissions}
          students={students}
          onSelectSubmission={(s, stu) => { setSelectedSubmission(s); setSelectedStudent(stu); }}
        />
      )}
      {selectedAssignment && selectedSubmission && selectedStudent && (
        <SubmissionGradingPanel
          assignment={selectedAssignment}
          submission={selectedSubmission}
          student={selectedStudent}
          onGraded={updated => {
            // Optionally refresh submissions or show a toast
            setSelectedSubmission(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard; 