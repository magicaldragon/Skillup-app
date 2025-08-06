// LevelsPanel.tsx
// Professional panel to show and manage levels (starters, movers, flyers, ket, pet, ielts, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React, { useState } from 'react';
import type { Level, StudentClass } from './types';
import { ICONS, LEVELS } from './constants';
import { safeTrim } from './utils/stringUtils';
import './LevelsPanel.css';

const LevelsPanel = ({ onDataRefresh }: { onDataRefresh?: () => void }) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [classesByLevel, setClassesByLevel] = useState<{ [level: string]: StudentClass[] }>({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [newLevel, setNewLevel] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Fetch levels from backend on mount
  React.useEffect(() => {
    setLoading(true);
    const fetchLevels = async () => {
      try {
        const res = await fetch('/api/levels', { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setLevels(data.levels || []);
      } catch (error) {
        console.error('Error fetching levels:', error);
        setLevels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, []);

  // Fetch all classes and categorize by level
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes', { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Group classes by level
        const classesByLevelMap: { [level: string]: StudentClass[] } = {};
        (data.classes || []).forEach((cls: any) => {
          if (cls.levelId) {
            if (!classesByLevelMap[cls.levelId]) {
              classesByLevelMap[cls.levelId] = [];
            }
            classesByLevelMap[cls.levelId].push(cls);
          }
        });
        setClassesByLevel(classesByLevelMap);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClassesByLevel({});
      }
    };
    if (levels.length > 0) fetchClasses();
  }, [levels]);

  // Add new level
  const handleAddLevel = async () => {
    const name = safeTrim(newLevel.name);
    const code = safeTrim(newLevel.code);
    const description = safeTrim(newLevel.description);
    
    if (!name || !code) {
      alert('Level name and code are required');
      return;
    }

    if (levels.some(l => l.name.toUpperCase() === name.toUpperCase() || l.code.toUpperCase() === code.toUpperCase())) {
      alert('Level name or code already exists');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, code, description }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels([...levels, data.level]);
      setNewLevel({ name: '', code: '', description: '' });
      setShowAddForm(false);
      onDataRefresh?.();
    } catch (error) {
      console.error('Error adding level:', error);
      alert('Failed to add level. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get level color based on name
  const getLevelColor = (levelName: string) => {
    const name = levelName.toLowerCase();
    if (name.includes('starters') || name.includes('pre')) return 'levels-card-blue';
    if (name.includes('movers') || name.includes('a1')) return 'levels-card-green';
    if (name.includes('flyers') || name.includes('a2')) return 'levels-card-yellow';
    if (name.includes('ket') || name.includes('a2b')) return 'levels-card-orange';
    if (name.includes('pet') || name.includes('b1')) return 'levels-card-purple';
    if (name.includes('pre-ielts') || name.includes('b2pre')) return 'levels-card-pink';
    if (name.includes('ielts')) return 'levels-card-red';
    return 'levels-card-gray';
  };

  // Get level icon
  const getLevelIcon = (levelName: string) => {
    const name = levelName.toLowerCase();
    if (name.includes('starters') || name.includes('pre')) return '🌟';
    if (name.includes('movers') || name.includes('a1')) return '🚀';
    if (name.includes('flyers') || name.includes('a2')) return '✈️';
    if (name.includes('ket')) return '🎯';
    if (name.includes('pet')) return '🏆';
    if (name.includes('pre-ielts') || name.includes('b2pre')) return '📚';
    if (name.includes('ielts')) return '🎓';
    return '📖';
  };

  // Handle level card click
  const handleLevelClick = (level: Level) => {
    setSelectedLevel(level);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedLevel(null);
  };

  // Handle ESC key press
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedLevel(null);
      }
    };

    if (selectedLevel) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLevel]);

  // Use backend levels if available, otherwise fall back to constants
  const displayLevels = levels.length > 0 ? levels : LEVELS;

  if (loading) {
    return (
      <div className="levels-panel">
        <div className="levels-loading">
          <div className="levels-spinner"></div>
          <p>Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="levels-panel">
      <div className="levels-header">
        <h2 className="levels-title">Levels Management</h2>
        <p className="levels-subtitle">Organize classes by proficiency levels</p>
      </div>

      {/* Add New Level Button */}
      <div className="levels-actions">
        <button
          className="levels-add-btn"
          onClick={() => setShowAddForm(true)}
          disabled={loading}
        >
          {ICONS.add}
          Add New Level
        </button>
      </div>

      {/* Add Level Form */}
      {showAddForm && (
        <div className="levels-add-form">
          <h3 className="levels-form-title">Add New Level</h3>
          <div className="levels-form-grid">
            <div className="levels-form-field">
              <label htmlFor="level-name">Level Name *</label>
              <input
                id="level-name"
                type="text"
                value={newLevel.name}
                onChange={e => setNewLevel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ADVANCED, INTERMEDIATE"
                className="levels-form-input"
              />
            </div>
            <div className="levels-form-field">
              <label htmlFor="level-code">Level Code *</label>
              <input
                id="level-code"
                type="text"
                value={newLevel.code}
                onChange={e => setNewLevel(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., ADV, INT"
                className="levels-form-input"
              />
            </div>
            <div className="levels-form-field levels-form-field-full">
              <label htmlFor="level-description">Description</label>
              <textarea
                id="level-description"
                value={newLevel.description}
                onChange={e => setNewLevel(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this level..."
                className="levels-form-textarea"
                rows={3}
              />
            </div>
          </div>
          <div className="levels-form-actions">
            <button
              className="levels-form-save-btn"
              onClick={handleAddLevel}
              disabled={loading || !newLevel.name || !newLevel.code}
            >
              {loading ? 'Adding...' : 'Add Level'}
            </button>
            <button
              className="levels-form-cancel-btn"
              onClick={() => {
                setShowAddForm(false);
                setNewLevel({ name: '', code: '', description: '' });
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Levels Grid */}
      <div className="levels-grid">
        {displayLevels.length === 0 ? (
          <div className="levels-empty">
            <div className="levels-empty-icon">📚</div>
            <h3 className="levels-empty-title">No Levels Found</h3>
            <p className="levels-empty-text">Add your first level to start organizing classes by proficiency.</p>
            <button
              className="levels-empty-btn"
              onClick={() => setShowAddForm(true)}
            >
              Add First Level
            </button>
          </div>
        ) : (
          displayLevels.map((level) => {
            const assignedClasses = classesByLevel[level._id] || [];
            const colorClass = getLevelColor(level.name);
            const icon = getLevelIcon(level.name);
            
            return (
              <div 
                key={level._id} 
                className={`levels-card ${colorClass}`}
                onClick={() => handleLevelClick(level)}
              >
                <div className="levels-card-header">
                  <div className="levels-card-icon">{icon}</div>
                  <div className="levels-card-info">
                    <h3 className="levels-card-title">{level.name}</h3>
                    <span className="levels-card-code">{level.code}</span>
                  </div>
                  <div className="levels-card-stats">
                    <span className="levels-card-class-count">
                      {assignedClasses.length} class{assignedClasses.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Level Details Modal */}
      {selectedLevel && (
        <div className="level-details-modal" onClick={handleCloseModal}>
          <div className="level-details-content" onClick={(e) => e.stopPropagation()}>
            <button className="level-details-close" onClick={handleCloseModal}>×</button>
            
            <div className="level-details-header">
              <div className="level-details-icon">{getLevelIcon(selectedLevel.name)}</div>
              <div className="level-details-info">
                <h2>{selectedLevel.name}</h2>
                <span className="level-details-code">{selectedLevel.code}</span>
              </div>
            </div>

            {selectedLevel.description && (
              <div className="level-details-description">{selectedLevel.description}</div>
            )}

            <div className="level-details-classes">
              <h3 className="level-details-classes-title">Assigned Classes</h3>
              {classesByLevel[selectedLevel._id] && classesByLevel[selectedLevel._id].length > 0 ? (
                <div className="level-details-classes-list">
                  {classesByLevel[selectedLevel._id].map((cls: any) => (
                    <span key={cls.id} className="level-details-class-item">{cls.name}</span>
                  ))}
                </div>
              ) : (
                <p className="level-details-no-classes">No classes assigned to this level</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelsPanel; 