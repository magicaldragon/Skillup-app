// LevelsPanel.tsx
// Professional panel to show and manage levels (starters, movers, flyers, ket, pet, ielts, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React, { useState } from 'react';
import { db, getLevels, addLevel, updateLevel, deleteLevel } from './services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { StudentClass, Level } from './types';
import { ICONS } from './constants';
import { LEVELS as DEFAULT_LEVELS } from './constants';

const LevelsPanel = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [newLevel, setNewLevel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedEditIdx, setSelectedEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCode, setEditCode] = useState('');
  const [classesByLevel, setClassesByLevel] = useState<{ [level: string]: StudentClass[] }>({});
  const [loading, setLoading] = useState(false);

  // Fetch levels from Firestore on mount
  React.useEffect(() => {
    setLoading(true);
    getLevels().then(fetched => {
      setLevels(fetched);
      setLoading(false);
    });
  }, []);

  // Fetch all classes and categorize by level
  React.useEffect(() => {
    const fetchClasses = async () => {
      const snap = await getDocs(collection(db, 'classes'));
      const allClasses = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentClass[];
      const byLevel: { [level: string]: StudentClass[] } = {};
      levels.forEach(l => {
        byLevel[l.id] = allClasses.filter(c => c.levelId === l.id);
      });
      setClassesByLevel(byLevel);
    };
    if (levels.length > 0) fetchClasses();
  }, [levels]);

  // Add new level
  const handleAdd = async () => {
    const val = newLevel.trim().toUpperCase();
    if (val && !levels.some(l => l.name.toUpperCase() === val)) {
      setLoading(true);
      const newLevelObj = { name: val, code: val, description: '' };
      const id = await addLevel(newLevelObj);
      setLevels([...levels, { ...newLevelObj, id }]);
      setNewLevel('');
      setShowAdd(false);
      setLoading(false);
    }
  };

  // Seed default levels into Firestore
  const handleSeedLevels = async () => {
    setLoading(true);
    for (const lvl of DEFAULT_LEVELS) {
      // Remove id so Firestore can generate its own
      const { id, ...rest } = lvl;
      await addLevel(rest);
    }
    // Refresh levels
    const fetched = await getLevels();
    setLevels(fetched);
    setLoading(false);
  };

  // Open edit dialog
  const openEditDialog = () => {
    setShowEdit(true);
    setSelectedEditIdx(null);
    setEditValue('');
    setEditDesc('');
    setEditCode('');
  };

  // When selecting a level to edit
  const handleSelectEdit = (idx: number) => {
    setSelectedEditIdx(idx);
    setEditValue(levels[idx].name);
    setEditDesc(levels[idx].description || '');
    setEditCode(levels[idx].code || '');
  };

  // Save edited level
  const handleEditSave = async () => {
    if (
      selectedEditIdx !== null &&
      editValue.trim() &&
      !levels.some((l, i) => i !== selectedEditIdx && l.name.toUpperCase() === editValue.trim().toUpperCase())
    ) {
      setLoading(true);
      const id = levels[selectedEditIdx].id;
      await updateLevel(id, { name: editValue.trim(), description: editDesc, code: editCode });
      const updated = levels.map((l, i) =>
        i === selectedEditIdx ? { ...l, name: editValue.trim(), description: editDesc, code: editCode } : l
      );
      setLevels(updated);
      setShowEdit(false);
      setSelectedEditIdx(null);
      setEditValue('');
      setEditDesc('');
      setEditCode('');
      setLoading(false);
    }
  };

  // Remove selected level
  const handleRemove = async () => {
    if (selectedEditIdx !== null) {
      setLoading(true);
      const id = levels[selectedEditIdx].id;
      await deleteLevel(id);
      setLevels(levels.filter((_, i) => i !== selectedEditIdx));
      setShowEdit(false);
      setSelectedEditIdx(null);
      setEditValue('');
      setEditDesc('');
      setEditCode('');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 max-w-2xl mx-auto mt-8">
      <h2 className="text-3xl font-bold mb-6 text-[#307637]">Levels</h2>
      {levels.length === 0 && !loading && (
        <div className="mb-6">
          <button
            className="px-5 py-3 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-lg font-semibold transition"
            onClick={handleSeedLevels}
            disabled={loading}
          >
            Seed Default Levels
          </button>
          <div className="mt-2 text-slate-500">No levels found. Click to add default levels (Starters, Movers, Flyers, etc.).</div>
        </div>
      )}
      {loading && <div className="mb-4 text-blue-600 font-semibold">Loading...</div>}
      <div className="mb-8 flex gap-2 items-center">
        <button
          className="px-5 py-3 bg-[#307637] text-white rounded shadow hover:bg-[#245929] text-lg font-semibold transition"
          onClick={() => setShowAdd(true)}
        >
          Add
        </button>
        <button
          className="px-5 py-3 bg-yellow-600 text-white rounded shadow hover:bg-yellow-700 text-lg font-semibold transition"
          onClick={openEditDialog}
        >
          Edit
        </button>
      </div>
      {/* Add Level Dialog */}
      {showAdd && (
        <div className="mb-6 flex gap-2 items-center">
          <input
            type="text"
            value={newLevel}
            onChange={e => setNewLevel(e.target.value)}
            className="p-3 border rounded flex-1 text-lg focus:outline-[#307637]"
            placeholder="Add new level (e.g., ADVANCED)"
          />
          <button
            className="px-4 py-2 bg-[#307637] text-white rounded hover:bg-[#245929] font-semibold"
            onClick={handleAdd}
            disabled={loading}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
            onClick={() => { setShowAdd(false); setNewLevel(''); }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      )}
      {/* Edit Level Dialog */}
      {showEdit && (
        <div className="mb-6 flex flex-col gap-3 p-4 border rounded bg-slate-50">
          <label className="font-semibold text-lg">Select a level to edit or delete:</label>
          <select
            className="p-2 border rounded text-lg"
            value={selectedEditIdx !== null ? selectedEditIdx : ''}
            onChange={e => handleSelectEdit(Number(e.target.value))}
            disabled={loading}
          >
            <option value="" disabled>Select level</option>
            {levels.map((l, idx) => (
              <option key={l.id} value={idx}>{l.name}</option>
            ))}
          </select>
          {selectedEditIdx !== null && (
            <>
              <input
                className="p-2 border rounded text-lg"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder="Edit level name"
                disabled={loading}
              />
              <input
                className="p-2 border rounded text-lg"
                value={editCode}
                onChange={e => setEditCode(e.target.value)}
                placeholder="Edit level code"
                disabled={loading}
              />
              <input
                className="p-2 border rounded text-lg"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Edit level description"
                disabled={loading}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                  onClick={handleEditSave}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  Delete
                </button>
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
                  onClick={() => { setShowEdit(false); setSelectedEditIdx(null); setEditValue(''); setEditDesc(''); setEditCode(''); }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map((l) => {
          const assignedClasses = classesByLevel[l.id] || [];
          return (
            <div key={l.id} className="bg-slate-50 rounded-lg shadow-md p-5 flex flex-col gap-2 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                {/* Level icon */}
                <span className="inline-block w-8 h-8 flex items-center justify-center bg-[#307637]/10 rounded-full mr-2">
                  {ICONS.level || <span className="text-2xl">★</span>}
                </span>
                <span className="font-bold text-xl text-[#222] tracking-wide">{l.name}</span>
                {/* Class count badge */}
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {assignedClasses.length} class{assignedClasses.length !== 1 ? 'es' : ''}
                </span>
                <span className="ml-2 text-slate-500 text-base">{l.code}</span>
              </div>
              {l.description && <div className="text-slate-600 text-sm mb-1 italic">{l.description}</div>}
              <div className="mt-2">
                <div className="text-sm text-slate-500 font-semibold mb-1">Classes in this level:</div>
                {assignedClasses.length > 0 ? (
                  <ul className="ml-2 text-base text-slate-700 list-disc pl-4">
                    {assignedClasses.map(c => (
                      <li key={c.id} className="py-0.5 font-medium bg-slate-200 rounded px-2 my-1 inline-block">
                        {c.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="ml-2 text-slate-400 italic text-base">No classes assigned</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelsPanel; 