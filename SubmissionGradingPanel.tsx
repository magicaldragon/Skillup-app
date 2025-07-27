// SubmissionGradingPanel.tsx
// Props:
// - assignment: Assignment
// - submission: Submission
// - student: Student
// - onGraded?: (updated: Submission) => void
import React, { useState } from 'react';
import type { Assignment, Submission, Student } from './types';

interface SubmissionGradingPanelProps {
  assignment: Assignment;
  submission: Submission;
  student: Student;
  onGraded?: (updated: Submission) => void;
}

const SubmissionGradingPanel: React.FC<SubmissionGradingPanelProps> = ({ assignment, submission, student, onGraded }) => {
  const answers = React.useMemo(() => {
    try { return JSON.parse(submission.content); } catch { return {}; }
  }, [submission.content]);
  const [score, setScore] = useState<number | null>(submission.score ?? null);
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setShowToast(false);
    try {
      await fetch(`/api/submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback }),
      });
      setSuccess('Grading saved!');
      setShowToast(true);
      if (onGraded) onGraded({ ...submission, score, feedback });
      setTimeout(() => setShowToast(false), 2500);
    } catch (err: any) {
      setError('Failed to save: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Grading: {assignment.title}</h2>
      <div className="mb-4 text-slate-700"><b>Student:</b> {student.name} ({student.email})</div>
      {assignment.questions.map((q, idx) => (
        <div key={q.id} className="mb-6">
          <div className="font-semibold mb-2">{idx + 1}. {q.question}</div>
          <div className="mb-1">
            <b>Student Answer:</b>{' '}
            {q.type === 'mcq' || q.type === 'fill' ? (
              <span>{answers[q.id] || <i className="text-slate-400">No answer</i>}</span>
            ) : q.type === 'match' && q.matchPairs ? (
              <ul className="ml-4 list-disc">
                {q.matchPairs.map((pair, i) => (
                  <li key={i}>{pair.left} → <b>{answers[q.id + '_' + i] || <i className="text-slate-400">No answer</i>}</b> (Correct: {pair.right})</li>
                ))}
              </ul>
            ) : q.type === 'essay' ? (
              <div className="border p-2 rounded bg-slate-50 whitespace-pre-wrap">{answers[q.id] || <i className="text-slate-400">No answer</i>}</div>
            ) : null}
          </div>
          {q.type === 'essay' && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Feedback for Essay</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Enter feedback for the essay..."
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium">Score</label>
        <input
          type="number"
          value={score ?? ''}
          onChange={e => setScore(e.target.value === '' ? null : Number(e.target.value))}
          className="p-2 border rounded w-24"
          min={0}
          max={100}
          step={1}
          required
        />
        <span className="text-slate-500">/ 100</span>
      </div>
      {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
      {success && <div className="text-green-600 font-semibold text-center">{success}</div>}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-bounce-in">Grading saved!</div>
      )}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 bg-[#307637] text-white rounded" disabled={saving}>Save Grade</button>
      </div>
    </form>
  );
};

export default SubmissionGradingPanel; 