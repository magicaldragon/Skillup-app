// LevelsPanel.tsx
// Professional panel to show and manage levels (starters, movers, flyers, ket, pet, ielts, ...)
// [NOTE] Created as part of 2024-05-XX dashboard refactor
import React, { useState } from 'react';
import { ICONS, LEVELS } from './constants';
import type { Level, StudentClass } from './types';
import { safeTrim } from './utils/stringUtils';
import './LevelsPanel.css';
import './ManagementTableStyles.css';

const LevelsPanel = ({ onDataRefresh }: { onDataRefresh?: () => void }) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [classesByLevel, setClassesByLevel] = useState<{ [level: string]: StudentClass[] }>({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [newLevel, setNewLevel] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [editLevel, setEditLevel] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Fetch levels from backend on mount
  React.useEffect(() => {
    setLoading(true);
    const fetchLevels = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

        const res = await fetch(`${apiUrl}/levels`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
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
        console.log('Fetching classes for levels...');
        // Get token from localStorage
        const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

        const res = await fetch(`${apiUrl}/classes`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Classes data received:', data.classes);

        // Group classes by level
        const classesByLevelMap: { [level: string]: StudentClass[] } = {};
        (data.classes || []).forEach((cls: StudentClass) => {
          // Handle both populated levelId object and string levelId
          const levelId = cls.levelId
            ? typeof cls.levelId === 'object'
              ? cls.levelId._id
              : cls.levelId
            : null;
          console.log(`Class ${cls.classCode || cls.name} has levelId:`, levelId);

          if (levelId) {
            if (!classesByLevelMap[levelId]) {
              classesByLevelMap[levelId] = [];
            }
            classesByLevelMap[levelId].push(cls);
          } else {
            console.warn(`Class ${cls.classCode || cls.name} has no levelId assigned`);
          }
        });

        console.log('Classes grouped by level:', classesByLevelMap);
        setClassesByLevel(classesByLevelMap);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClassesByLevel({});
      }
    };
    if (levels.length > 0) fetchClasses();
  }, [levels]);

  // Refresh data function
  const refreshData = async () => {
    try {
      setLoading(true);
      // Fetch levels first, then classes will be fetched automatically
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      const res = await fetch(`${apiUrl}/levels`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLevels(data.levels || []);

      // Classes will be fetched automatically due to the useEffect dependency
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new level
  const handleAddLevel = async () => {
    const name = safeTrim(newLevel.name);
    const code = safeTrim(newLevel.code);
    const description = safeTrim(newLevel.description);

    if (!name || !code) {
      alert('Level name and code are required');
      return;
    }

    if (
      levels.some(
        (l) =>
          l.name.toUpperCase() === name.toUpperCase() || l.code.toUpperCase() === code.toUpperCase()
      )
    ) {
      alert('Level name or code already exists');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      const levelData = {
        name,
        code,
        description,
        isActive: true,
        order: levels.length + 1, // Add order field
      };

      console.log('Creating level with data:', levelData);

      const res = await fetch(`${apiUrl}/levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(levelData),
      });

      console.log('Level creation response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create level' }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Level creation response:', data);
      
      if (data.success) {
        const newLevelData = {
          ...data.level,
          _id: data.level.id || data.level._id,
          id: data.level.id || data.level._id,
        };
        setLevels((prev) => [...prev, newLevelData]);
        setNewLevel({ name: '', code: '', description: '' });
        setShowAddForm(false);
        onDataRefresh?.();
        alert('Level created successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('levelUpdated'));
      } else {
        alert(data.message || 'Failed to add level');
      }
    } catch (error) {
      console.error('Error adding level:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to add level: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Update existing level
  const handleUpdateLevel = async () => {
    if (!editingLevel) return;

    const name = safeTrim(editLevel.name);
    const code = safeTrim(editLevel.code);
    const description = safeTrim(editLevel.description);

    if (!name || !code) {
      alert('Level name and code are required');
      return;
    }

    // Check if name or code already exists (excluding current level)
    if (
      levels.some(
        (l) =>
          l._id !== editingLevel._id &&
          (l.name.toUpperCase() === name.toUpperCase() ||
            l.code.toUpperCase() === code.toUpperCase())
      )
    ) {
      alert('Level name or code already exists');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      const updateData = {
        name,
        code,
        description,
        isActive: true,
      };

      console.log('Updating level with data:', updateData);

      const res = await fetch(`${apiUrl}/levels/${editingLevel._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Level update response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update level' }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Level update response:', data);
      
      if (data.success) {
        const updatedLevelData = {
          ...editingLevel,
          name,
          code,
          description,
        };
        setLevels((prev) => prev.map((l) => (l._id === editingLevel._id ? updatedLevelData : l)));
        setEditingLevel(null);
        setEditLevel({ name: '', code: '', description: '' });
        onDataRefresh?.();
        alert('Level updated successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('levelUpdated'));
      } else {
        alert(data.message || 'Failed to update level');
      }
    } catch (error: unknown) {
      console.error('Error updating level:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update level: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete level
  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('Are you sure you want to delete this level? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      const res = await fetch(`${apiUrl}/levels/${levelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to delete level' }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setLevels((prev) => prev.filter((l) => l._id !== levelId));
        setSelectedLevel(null);
        onDataRefresh?.();
        alert('Level deleted successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('levelUpdated'));
      } else {
        alert(data.message || 'Failed to delete level');
      }
    } catch (error: unknown) {
      console.error('Error deleting level:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete level: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Start editing a level
  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
    setEditLevel({
      name: level.name,
      code: level.code,
      description: level.description || '',
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingLevel(null);
    setEditLevel({ name: '', code: '', description: '' });
  };

  // Level color classes are no longer used with unified dashboard styling

  // Handle level card click
  const handleLevelClick = (level: Level) => {
    if (selectedLevel?._id === level._id) {
      // If clicking the same level, close it
      setSelectedLevel(null);
    } else {
      // If clicking a different level, expand it
      setSelectedLevel(level);
    }
  };

  // Handle level card double-click to edit
  const handleLevelDoubleClick = (level: Level) => {
    handleEditLevel(level);
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
        setEditingLevel(null);
      }
    };

    if (selectedLevel || editingLevel) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLevel, editingLevel]);

  // Use backend levels if available, otherwise fall back to constants
  const displayLevels = levels.length > 0 ? levels : LEVELS;

  if (loading) {
    return (
      <div className="management-panel">
        <div className="management-loading">
          <div className="management-spinner"></div>
          <p>Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-panel">
      <div className="management-header">
        <h2 className="management-title">Levels Management</h2>
        <p className="management-subtitle">Organize classes by proficiency levels</p>
      </div>

      {/* Add New Level Button */}
      <div className="levels-actions">
        <button
          type="button"
          className="levels-add-btn"
          onClick={() => setShowAddForm(true)}
          disabled={loading}
        >
          {ICONS.add}
          Add New Level
        </button>
        <button
          type="button"
          className="levels-refresh-btn"
          onClick={refreshData}
          disabled={loading}
          title="Refresh data"
        >
          🔄 Refresh
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
                onChange={(e) => setNewLevel((prev) => ({ ...prev, name: e.target.value }))}
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
                onChange={(e) => setNewLevel((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., ADV, INT"
                className="levels-form-input"
              />
            </div>
            <div className="levels-form-field levels-form-field-full">
              <label htmlFor="level-description">Description</label>
              <textarea
                id="level-description"
                value={newLevel.description}
                onChange={(e) => setNewLevel((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this level..."
                className="levels-form-textarea"
                rows={3}
              />
            </div>
          </div>
          <div className="levels-form-actions">
            <button
              type="button"
              className="levels-form-save-btn"
              onClick={handleAddLevel}
              disabled={loading || !newLevel.name || !newLevel.code}
            >
              {loading ? 'Adding...' : 'Add Level'}
            </button>
            <button
              type="button"
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

      {/* Edit Level Form */}
      {editingLevel && (
        <div className="levels-edit-form">
          <h3 className="levels-form-title">Edit Level</h3>
          <div className="levels-form-grid">
            <div className="levels-form-field">
              <label htmlFor="edit-level-name">Level Name *</label>
              <input
                id="edit-level-name"
                type="text"
                value={editLevel.name}
                onChange={(e) => setEditLevel((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ADVANCED, INTERMEDIATE"
                className="levels-form-input"
              />
            </div>
            <div className="levels-form-field">
              <label htmlFor="edit-level-code">Level Code *</label>
              <input
                id="edit-level-code"
                type="text"
                value={editLevel.code}
                onChange={(e) => setEditLevel((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., ADV, INT"
                className="levels-form-input"
              />
            </div>
            <div className="levels-form-field levels-form-field-full">
              <label htmlFor="edit-level-description">Description</label>
              <textarea
                id="edit-level-description"
                value={editLevel.description}
                onChange={(e) => setEditLevel((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this level..."
                className="levels-form-textarea"
                rows={3}
              />
            </div>
          </div>
          <div className="levels-form-actions">
            <button
              type="button"
              className="levels-form-save-btn"
              onClick={handleUpdateLevel}
              disabled={loading || !editLevel.name || !editLevel.code}
            >
              {loading ? 'Updating...' : 'Update Level'}
            </button>
            <button
              type="button"
              className="levels-form-cancel-btn"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="levels-form-delete-btn"
              onClick={() => handleDeleteLevel(editingLevel._id)}
              disabled={loading}
            >
              Delete Level
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
            <p className="levels-empty-text">
              Add your first level to start organizing classes by proficiency.
            </p>
            <button type="button" className="levels-empty-btn" onClick={() => setShowAddForm(true)}>
              Add First Level
            </button>
          </div>
        ) : selectedLevel ? (
          // Show expanded level details
          <div className="level-expanded-view">
            <div className="level-expanded-header">
              <button type="button" className="level-expanded-close" onClick={handleCloseModal}>
                ×
              </button>
              <div className="level-expanded-info">
                <div className="level-expanded-title-row">
                  <h2>{selectedLevel.name}</h2>
                  <div className="level-expanded-actions">
                    <button
                      type="button"
                      className="level-expanded-edit-btn"
                      onClick={() => handleEditLevel(selectedLevel)}
                    >
                      Edit Level
                    </button>
                    <button
                      type="button"
                      className="level-expanded-delete-btn"
                      onClick={() => handleDeleteLevel(selectedLevel._id)}
                    >
                      Delete Level
                    </button>
                  </div>
                </div>
                <div className="level-expanded-code-count">
                  <span className="level-expanded-code">{selectedLevel.code}</span>
                  <span className="level-expanded-class-count">
                    {classesByLevel[selectedLevel._id] && classesByLevel[selectedLevel._id].length > 0 
                      ? `${classesByLevel[selectedLevel._id].length} class${classesByLevel[selectedLevel._id].length !== 1 ? 'es' : ''}`
                      : 'EMPTY'
                    }
                  </span>
                </div>
              </div>
            </div>

            {selectedLevel.description && (
              <div className="level-expanded-description">{selectedLevel.description}</div>
            )}

            <div className="level-expanded-classes">
              <h3 className="level-expanded-classes-title">Assigned Classes</h3>
              {classesByLevel[selectedLevel._id] && classesByLevel[selectedLevel._id].length > 0 ? (
                <div className="level-expanded-classes-list">
                  {classesByLevel[selectedLevel._id].map((cls: StudentClass) => {
                    const classCode = cls.classCode || cls.name || 'Unnamed Class';
                    const studentCount = cls.studentIds?.length || 0;
                    const levelName = cls.levelId
                      ? typeof cls.levelId === 'object'
                        ? cls.levelId.name
                        : 'N/A'
                      : 'N/A';

                    return (
                      <div key={cls._id || cls.id} className="level-expanded-class-item">
                        <div className="class-item-header">
                          <span className="class-item-code">{classCode}</span>
                          <span className="class-item-students">{studentCount} students</span>
                        </div>
                        <div className="class-item-details">
                          <span className="class-item-level">Level: {levelName}</span>
                          {cls.description && (
                            <span className="class-item-description">{cls.description}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="level-expanded-no-classes">
                  <p>No classes assigned to this level</p>
                  <p className="no-classes-hint">
                    Classes will appear here when they are created and assigned to this level.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Show all levels in grid
          displayLevels.map((level) => {
            return (
              <button
                type="button"
                key={level._id}
                className="levels-card"
                onClick={() => handleLevelClick(level)}
                onDoubleClick={() => handleLevelDoubleClick(level)}
                aria-label={`View details for ${level.name} level. Click to edit.`}
              >
                <div className="levels-card-header">
                  <div className="levels-card-info">
                    <h3 className="levels-card-title">{level.name}</h3>
                    <span className="levels-card-code">{level.code}</span>
                    <span className="levels-card-hint">Click to edit</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LevelsPanel;
