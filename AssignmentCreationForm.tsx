import React, { useState } from 'react';
import { db } from './services/firebase';
import type { Assignment, AssignmentQuestion, QuestionType, IELTS_Skill, ExamLevel, StudentClass, Student } from './types';

const EXAM_LEVELS: ExamLevel[] = ['IELTS', 'KEY', 'PET'];
const SKILLS: IELTS_Skill[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
const QUESTION_TYPES: QuestionType[] = ['mcq', 'fill', 'match', 'essay'];

interface AssignmentCreationFormProps {
  classes: StudentClass[];
  currentUser: Student;
  onCreated?: () => void;
}

const initialQuestion: Partial<AssignmentQuestion> = {
  type: 'mcq',
  question: '',
  options: [''],
  answer: '',
  matchPairs: [],
};

export const AssignmentCreationForm: React.FC<AssignmentCreationFormProps> = ({ classes, currentUser, onCreated }) => {
  const [form, setForm] = useState<Partial<Assignment>>({
    title: '',
    level: 'IELTS',
    skill: 'Listening',
    description: '',
    questions: [],
    answerKey: {},
    classIds: [],
    publishDate: '',
    dueDate: '',
  });
  const [question, setQuestion] = useState<Partial<AssignmentQuestion>>(initialQuestion);
  const [editingQ, setEditingQ] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  // --- Question Handlers ---
  const addOrUpdateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.type || !question.question) return;
    let newQuestions = [...(form.questions || [])];
    const qId = editingQ !== null ? newQuestions[editingQ].id : Math.random().toString(36).slice(2, 10);
    const q: AssignmentQuestion = {
      id: qId,
      type: question.type,
      question: question.question,
      options: question.type === 'mcq' ? (question.options || []).filter(Boolean) : undefined,
      answer: question.type === 'mcq' || question.type === 'fill' ? question.answer : undefined,
      matchPairs: question.type === 'match' ? (question.matchPairs || []) : undefined,
    };
    if (editingQ !== null) {
      newQuestions[editingQ] = q;
    } else {
      newQuestions.push(q);
    }
    setForm(f => ({ ...f, questions: newQuestions }));
    setQuestion(initialQuestion);
    setEditingQ(null);
  };
  const editQuestion = (idx: number) => {
    setEditingQ(idx);
    setQuestion(form.questions![idx]);
  };
  const deleteQuestion = (idx: number) => {
    setForm(f => ({ ...f, questions: f.questions!.filter((_, i) => i !== idx) }));
    setEditingQ(null);
    setQuestion(initialQuestion);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0]);
    setUploadError('');
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('https://skillup-backend-v6vm.onrender.com/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFileUrl(data.url);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // --- Assignment Save Handler ---
  const saveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!form.title || !form.skill || !form.level || !form.questions?.length) {
        setError('Please fill all required fields and add at least one question.');
        setSaving(false);
        return;
      }
      // Build answerKey
      const answerKey: Record<string, string | string[]> = {};
      form.questions.forEach(q => {
        if (q.type === 'mcq' || q.type === 'fill') answerKey[q.id] = q.answer as string;
        if (q.type === 'match' && q.matchPairs) answerKey[q.id] = q.matchPairs.map(p => p.right);
      });
      const assignment: Omit<Assignment, 'id'> = {
        ...form,
        questions: form.questions,
        answerKey,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        publishDate: form.publishDate || new Date().toISOString().slice(0, 10),
        dueDate: form.dueDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10),
        classIds: form.classIds || [],
        pdfUrl: fileUrl.endsWith('.pdf') ? fileUrl : undefined,
        audioUrl: fileUrl.match(/\.(mp3|wav|ogg)$/) ? fileUrl : undefined,
      };
      await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      setForm({ title: '', level: 'IELTS', skill: 'Listening', description: '', questions: [], answerKey: {}, classIds: [], publishDate: '', dueDate: '' });
      setShowForm(false);
      if (onCreated) onCreated();
    } catch (err: any) {
      setError('Failed to save assignment: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // --- UI ---
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <button onClick={() => setShowForm(f => !f)} className="px-4 py-2 bg-[#307637] text-white rounded mb-4">{showForm ? 'Hide' : 'Create New Assignment'}</button>
      {showForm && (
        <form onSubmit={saveAssignment} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level *</label>
              <select value={form.level || 'IELTS'} onChange={e => setForm(f => ({ ...f, level: e.target.value as ExamLevel }))} className="w-full p-2 border rounded">
                {EXAM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Skill *</label>
              <select value={form.skill || 'Listening'} onChange={e => setForm(f => ({ ...f, skill: e.target.value as IELTS_Skill }))} className="w-full p-2 border rounded">
                {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Classes</label>
              <select multiple value={form.classIds || []} onChange={e => setForm(f => ({ ...f, classIds: Array.from(e.target.selectedOptions, o => o.value) }))} className="w-full p-2 border rounded">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Publish Date</label>
              <input type="date" value={form.publishDate || ''} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full p-2 border rounded" />
            </div>
          </div>
          {/* --- Question Builder --- */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Questions</h3>
            <form onSubmit={addOrUpdateQuestion} className="space-y-2 mb-4">
              <div className="flex gap-2 items-center flex-wrap">
                <select value={question.type} onChange={e => setQuestion(q => ({ ...q, type: e.target.value as QuestionType }))} className="p-2 border rounded">
                  {QUESTION_TYPES.map(qt => <option key={qt} value={qt}>{qt.toUpperCase()}</option>)}
                </select>
                <input type="text" value={question.question || ''} onChange={e => setQuestion(q => ({ ...q, question: e.target.value }))} placeholder="Question" className="flex-1 p-2 border rounded" required />
                {/* MCQ Options */}
                {question.type === 'mcq' && (
                  <>
                    <input type="text" value={question.options?.[0] || ''} onChange={e => setQuestion(q => ({ ...q, options: [e.target.value, ...(q.options?.slice(1) || [])] }))} placeholder="Option 1" className="p-2 border rounded" required />
                    <input type="text" value={question.options?.[1] || ''} onChange={e => setQuestion(q => ({ ...q, options: [(q.options?.[0] || ''), e.target.value, ...(q.options?.slice(2) || [])] }))} placeholder="Option 2" className="p-2 border rounded" required />
                    <input type="text" value={question.options?.[2] || ''} onChange={e => setQuestion(q => ({ ...q, options: [(q.options?.[0] || ''), (q.options?.[1] || ''), e.target.value, ...(q.options?.slice(3) || [])] }))} placeholder="Option 3" className="p-2 border rounded" />
                    <input type="text" value={question.options?.[3] || ''} onChange={e => setQuestion(q => ({ ...q, options: [(q.options?.[0] || ''), (q.options?.[1] || ''), (q.options?.[2] || ''), e.target.value] }))} placeholder="Option 4" className="p-2 border rounded" />
                    <input type="text" value={question.answer as string || ''} onChange={e => setQuestion(q => ({ ...q, answer: e.target.value }))} placeholder="Correct Answer" className="p-2 border rounded" required />
                  </>
                )}
                {/* Fill-in-the-blank */}
                {question.type === 'fill' && (
                  <input type="text" value={question.answer as string || ''} onChange={e => setQuestion(q => ({ ...q, answer: e.target.value }))} placeholder="Correct Answer" className="p-2 border rounded" required />
                )}
                {/* Match Pairs */}
                {question.type === 'match' && (
                  <div className="flex flex-col gap-1">
                    {(question.matchPairs || []).map((pair, idx) => (
                      <div key={idx} className="flex gap-1 items-center">
                        <input type="text" value={pair.left} onChange={e => {
                          const pairs = [...(question.matchPairs || [])];
                          pairs[idx].left = e.target.value;
                          setQuestion(q => ({ ...q, matchPairs: pairs }));
                        }} placeholder="Left" className="p-2 border rounded" />
                        <input type="text" value={pair.right} onChange={e => {
                          const pairs = [...(question.matchPairs || [])];
                          pairs[idx].right = e.target.value;
                          setQuestion(q => ({ ...q, matchPairs: pairs }));
                        }} placeholder="Right" className="p-2 border rounded" />
                        <button type="button" onClick={() => {
                          const pairs = [...(question.matchPairs || [])];
                          pairs.splice(idx, 1);
                          setQuestion(q => ({ ...q, matchPairs: pairs }));
                        }} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setQuestion(q => ({ ...q, matchPairs: [...(q.matchPairs || []), { left: '', right: '' }] }))} className="px-2 py-1 bg-blue-500 text-white rounded">Add Pair</button>
                  </div>
                )}
                {/* Essay */}
                {question.type === 'essay' && (
                  <textarea value={question.question || ''} onChange={e => setQuestion(q => ({ ...q, question: e.target.value }))} placeholder="Essay Prompt" className="p-2 border rounded" required />
                )}
                <button type="submit" className="px-3 py-1 bg-[#307637] text-white rounded">{editingQ !== null ? 'Update' : 'Add'}</button>
                {editingQ !== null && (
                  <button type="button" onClick={() => { setEditingQ(null); setQuestion(initialQuestion); }} className="px-3 py-1 bg-gray-400 text-white rounded">Cancel</button>
                )}
              </div>
            </form>
            <ul className="space-y-2">
              {form.questions?.map((q, idx) => (
                <li key={q.id} className="flex items-center gap-2">
                  <span className="font-semibold">{q.type.toUpperCase()}</span>
                  <span>{q.question}</span>
                  {q.type === 'mcq' && <span className="text-xs text-slate-500">Options: {(q.options || []).join(', ')}</span>}
                  {q.type === 'match' && <span className="text-xs text-slate-500">Pairs: {(q.matchPairs || []).map(p => `${p.left}→${p.right}`).join(', ')}</span>}
                  {q.type === 'fill' && <span className="text-xs text-slate-500">Answer: {q.answer as string}</span>}
                  <button onClick={() => editQuestion(idx)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                  <button onClick={() => deleteQuestion(idx)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </li>
              ))}
            </ul>
          </div>
          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-[#307637] text-white rounded" disabled={saving}>Create Assignment</button>
            <button type="button" className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          {currentUser?.role === 'teacher' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignment File (PDF/Audio)</label>
              <input type="file" accept=".pdf,audio/*" onChange={handleFileChange} />
              <button type="button" onClick={handleFileUpload} disabled={!file || uploading} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              {uploadError && <div className="text-red-600 text-xs mt-1">{uploadError}</div>}
              {fileUrl && (
                <div className="mt-2 text-xs text-green-700">
                  Uploaded: <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{fileUrl}</a>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default AssignmentCreationForm; 