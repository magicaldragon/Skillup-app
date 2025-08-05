import React, { useState } from 'react';
import type { Assignment, Submission, Student } from './types';

interface StudentAssignmentTestProps {
  assignment: Assignment;
  student: Student;
  onSubmitted?: (submission: Submission) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return arr.map(v => [Math.random(), v] as [number, T])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);
}

const StudentAssignmentTest: React.FC<StudentAssignmentTestProps> = ({ assignment, student, onSubmitted }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (qid: string, value: any) => {
    setAnswers(a => ({ ...a, [qid]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    let total = 0, correct = 0;
    const fb: Record<string, boolean | null> = {};
    assignment.questions.forEach(q => {
      if (q.type === 'mcq' || q.type === 'fill') {
        const ans = answers[q.id];
        const isCorrect = ans === assignment.answerKey[q.id];
        fb[q.id] = isCorrect;
        total++;
        if (isCorrect) correct++;
      } else if (q.type === 'match' && q.matchPairs) {
        let matchCorrect = 0;
        q.matchPairs.forEach((pair, idx) => {
          const ans = answers[q.id + '_' + idx];
          const isCorrect = ans === pair.right;
          fb[q.id + '_' + idx] = isCorrect;
          if (isCorrect) matchCorrect++;
        });
        total++;
        if (matchCorrect === q.matchPairs.length) correct++;
      } else if (q.type === 'essay') {
        fb[q.id] = null; // No auto-grade
      }
    });
    setFeedback(fb);
    setScore(total > 0 ? Math.round((correct / total) * 100) : null);
    setSubmitted(true);
    // Save submission
    try {
      const submission: Omit<Submission, 'id'> = {
        studentId: student.id,
        assignmentId: assignment.id,
        submittedAt: new Date().toISOString(),
        content: JSON.stringify(answers),
        score: total > 0 ? Math.round((correct / total) * 100) : null,
        feedback: JSON.stringify(fb),
      };
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      if (onSubmitted) onSubmitted({ ...submission, id: 'new' });
    } catch (err: any) {
      setError('Failed to submit: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">{assignment.title}</h2>
      {assignment.questions.map((q, idx) => (
        <div key={q.id} className="mb-6">
          <div className="font-semibold mb-2">{idx + 1}. {q.question}</div>
          {q.type === 'mcq' && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={e => handleChange(q.id, opt)}
                    disabled={submitted}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {q.type === 'fill' && (
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              className="p-2 border rounded"
              disabled={submitted}
            />
          )}
          {q.type === 'match' && q.matchPairs && (
            <div className="flex flex-col gap-2">
              {q.matchPairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span>{pair.left}</span>
                  <select
                    value={answers[q.id + '_' + i] || ''}
                    onChange={e => handleChange(q.id + '_' + i, e.target.value)}
                    disabled={submitted}
                    className="p-2 border rounded"
                  >
                    <option value="">Select</option>
                    {shuffle(q.matchPairs.map(p => p.right)).map((right, j) => (
                      <option key={j} value={right}>{right}</option>
                    ))}
                  </select>
                  {submitted && (
                    <span className={feedback[q.id + '_' + i] ? 'text-green-600' : 'text-red-600'}>
                      {feedback[q.id + '_' + i] ? 'Correct' : `Answer: ${pair.right}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {q.type === 'essay' && (
            <textarea
              value={answers[q.id] || ''}
              onChange={e => handleChange(q.id, e.target.value)}
              className="p-2 border rounded w-full"
              disabled={submitted}
              rows={6}
              placeholder="Type your essay here..."
            />
          )}
          {submitted && feedback[q.id] !== undefined && feedback[q.id] !== null && (
            <div className={feedback[q.id] ? 'text-green-600' : 'text-red-600'}>
              {feedback[q.id] ? 'Correct' : 'Incorrect'}
            </div>
          )}
        </div>
      ))}
      {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
      {submitted && score !== null && (
        <div className="text-xl font-bold text-center text-[#307637]">Your Score: {score}%</div>
      )}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 bg-[#307637] text-white rounded" disabled={submitted || saving}>Submit</button>
      </div>
    </form>
  );
};

export default StudentAssignmentTest; 