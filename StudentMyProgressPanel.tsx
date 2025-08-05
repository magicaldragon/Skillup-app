import { useEffect, useState } from 'react';
import type { Student, Submission, Assignment } from './types';

const SKILLS = ['Listening', 'Reading', 'Writing', 'Speaking'];

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171'];

const StudentMyProgressPanel = ({ user }: { user: Student }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [assignRes, subRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/submissions'),
      ]);
      const assignData = await assignRes.json();
      setAssignments(assignData.assignments || []);
      const subData = await subRes.json();
      const all = subData.submissions || [];
      setAllSubs(all);
      setSubmissions(all.filter(s => s.studentId === user.id));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Calculate average score per skill for this student
  const skillAverages: { [skill: string]: number } = {};
  SKILLS.forEach(skill => {
    const skillSubs = submissions.filter(s => {
      const a = assignments.find(a => a.id === s.assignmentId);
      return a && a.skill === skill && typeof s.score === 'number';
    });
    skillAverages[skill] = skillSubs.length ? Math.round(skillSubs.reduce((sum, s) => sum + (s.score || 0), 0) / skillSubs.length) : 0;
  });

  // Calculate class averages for each skill
  const classAverages: { [skill: string]: number } = {};
  SKILLS.forEach(skill => {
    const skillSubs = allSubs.filter(s => {
      const a = assignments.find(a => a.id === s.assignmentId);
      return a && a.skill === skill && typeof s.score === 'number';
    });
    classAverages[skill] = skillSubs.length ? Math.round(skillSubs.reduce((sum, s) => sum + (s.score || 0), 0) / skillSubs.length) : 0;
  });

  // Find best/worst skill
  const bestSkill = Object.entries(skillAverages).reduce((best, curr) => curr[1] > best[1] ? curr : best, ['', 0])[0];
  const worstSkill = Object.entries(skillAverages).reduce((worst, curr) => (curr[1] < worst[1] ? curr : worst), ['', 100])[0];

  // Score trends for each skill (last 8 assignments)
  const skillTrends: { [skill: string]: { x: string, y: number }[] } = {};
  SKILLS.forEach((skill, i) => {
    const skillSubs = submissions
      .filter(s => {
        const a = assignments.find(a => a.id === s.assignmentId);
        return a && a.skill === skill && typeof s.score === 'number';
      })
      .sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''))
      .slice(-8);
    skillTrends[skill] = skillSubs.map(s => {
      const a = assignments.find(a => a.id === s.assignmentId);
      return { x: a?.title || '', y: s.score || 0 };
    });
  });

  // Estimate IELTS score (simple average for demo)
  const estimatedIELTS = (Object.values(skillAverages).reduce((a, b) => a + b, 0) / SKILLS.length / 10).toFixed(1);

  // Time spent vs assignments completed (demo: random data)
  const completedAssignments = submissions.length;
  const timeSpent = completedAssignments * 30 + Math.floor(Math.random() * 60); // minutes

  const pieData = {
    labels: SKILLS,
    datasets: [
      {
        data: SKILLS.map(skill => skillAverages[skill]),
        backgroundColor: COLORS,
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Assignments Completed', 'Time Spent (min)'],
    datasets: [
      {
        label: 'Progress',
        data: [completedAssignments, timeSpent],
        backgroundColor: ['#34d399', '#60a5fa'],
      },
    ],
  };

  const lineData = {
    labels: Array.from(new Set([].concat(...SKILLS.map(skill => skillTrends[skill].map(d => d.x))))),
    datasets: SKILLS.map((skill, i) => ({
      label: skill,
      data: skillTrends[skill].map(d => d.y),
      borderColor: COLORS[i],
      backgroundColor: COLORS[i] + '33',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  };

  // Recent assignments
  const recent = submissions
    .map(s => {
      const a = assignments.find(a => a.id === s.assignmentId);
      return { ...s, title: a?.title || '', skill: a?.skill || '', date: s.submittedAt || '' };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  if (loading) return <div className="p-8 text-center text-lg">Loading progress...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto mt-8 flex flex-col gap-8">
      <h2 className="text-2xl font-bold mb-4">My Progress</h2>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <h3 className="font-semibold mb-2">Skill Breakdown</h3>
          <div className="w-full max-w-xs">
            <canvas id="skillBreakdownChart"></canvas>
          </div>
          <div className="mt-2 text-sm">
            <span className="font-bold text-green-700">Best:</span> {bestSkill} &nbsp;|&nbsp;
            <span className="font-bold text-red-600">Needs Work:</span> {worstSkill}
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <h3 className="font-semibold mb-2">Estimated IELTS Score</h3>
          <div className="text-4xl font-bold text-blue-600 mb-4 animate-pulse">{estimatedIELTS}</div>
          <div className="w-full max-w-xs">
            <canvas id="estimatedIELTSChart"></canvas>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Score Trends</h3>
        <div className="w-full max-w-2xl">
          <canvas id="scoreTrendsChart"></canvas>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Class Comparison</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SKILLS.map((skill, i) => (
            <div key={skill} className="bg-slate-50 rounded-lg p-3 flex flex-col items-center shadow-sm">
              <span className="font-bold text-base" style={{ color: COLORS[i] }}>{skill}</span>
              <span className="text-2xl font-bold">{skillAverages[skill]}%</span>
              <span className="text-xs text-slate-500">You</span>
              <span className="text-lg font-bold mt-1">{classAverages[skill]}%</span>
              <span className="text-xs text-slate-500">Class Avg</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Recent Assignments</h3>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Skill</th>
              <th className="p-2">Score</th>
              <th className="p-2">Date</th>
              <th className="p-2">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400">No recent assignments.</td></tr>}
            {recent.map(r => (
              <tr key={r.id} className="hover:bg-slate-100 transition">
                <td className="p-2 font-semibold">{r.title}</td>
                <td className="p-2">{r.skill}</td>
                <td className="p-2">{typeof r.score === 'number' ? r.score : '-'}</td>
                <td className="p-2">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                <td className="p-2">{r.feedback || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 text-center mt-4">Charts and stats are interactive and responsive. Keep up the great work!</div>
    </div>
  );
};

export default StudentMyProgressPanel; 