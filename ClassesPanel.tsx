// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useCallback, useEffect, useState } from 'react';
import type { Level, Student, StudentClass } from './types';
import { formatDateMMDDYYYY } from './utils/stringUtils';
import './ClassesPanel.css';
import './ManagementTableStyles.css';

// Resolve API base consistently for local dev and deployed hosting
function resolveApiBase(): string {
  try {
    if (typeof window !== 'undefined' && window.location.host.endsWith('.web.app')) {
      return '/api';
    }
  } catch {
    // ignore
  }
  return (import.meta.env?.VITE_API_BASE_URL as string) || '/api';
}

const API_BASE_URL: string = resolveApiBase();

// Interface for class editing modal
interface ClassEditModal {
  isOpen: boolean;
  classId: string | null;
  className: string;
  levelName: string;
  students: Student[];
}

// Add explicit props interface for this panel
interface ClassesPanelProps {
  students: Student[];
  classes: StudentClass[];
  onDataRefresh?: () => void;
}

export default function ClassesPanel({ students, classes, onDataRefresh }: ClassesPanelProps) {
  const [adding, setAdding] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);

  // Create an alphabetically sorted copy for UI
  const sortedLevels = Array.isArray(levels)
    ? [...levels].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    : [];

  const [classSearch, setClassSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  // Class editing modal state (SHOW modal for student list)
  const [classEditModal, setClassEditModal] = useState<ClassEditModal>({
    isOpen: false,
    classId: null,
    className: '',
    levelName: '',
    students: [],
  });

  // New: data for EDIT CLASS (update name/level, keep code fixed)
  interface ClassUpdateModal {
    isOpen: boolean;
    classId: string | null;
    classCode: string;
    name: string;
    levelId: string | null;
  }
  const [classUpdateModal, setClassUpdateModal] = useState<ClassUpdateModal>({
    isOpen: false,
    classId: null,
    classCode: '',
    name: '',
    levelId: null,
  });

  // New: inline student edit inside SHOW modal
  interface StudentEditModal {
    isOpen: boolean;
    student: Student | null;
  }
  const [studentEditModal, setStudentEditModal] = useState<StudentEditModal>({
    isOpen: false,
    student: null,
  });

  // Add new class with level selection
  const [newClassLevelId, setNewClassLevelId] = useState<string>('');
  const [newClassStartingDate, setNewClassStartingDate] = useState<string>('');

  // Add state for showing action buttons
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Per-row assignment UI state
  const [singleAssignStudentId, setSingleAssignStudentId] = useState<string | null>(null);
  const [singleAssignTargetClassId, setSingleAssignTargetClassId] = useState<string>('');

  // Open class edit modal
  const handleEditClass = useCallback(
    (classId: string) => {
      const classObj = classes.find((c) => (c._id || c.id) === classId);
      if (!classObj) return;

      // Handle both populated levelId object and string levelId
      const levelName = classObj.levelId
        ? typeof classObj.levelId === 'object'
          ? classObj.levelId.name
          : levels.find((l) => l._id === classObj.levelId)?.name || 'N/A'
        : 'N/A';
      const classStudents = students.filter((s) => (s.classIds || []).includes(classId));
      const displayName = classObj.classCode || classObj.name || 'Unnamed Class';

      setClassEditModal({
        isOpen: true,
        classId,
        className: displayName,
        levelName,
        students: classStudents,
      });
    },
    [classes, levels, students]
  );

  // New: open EDIT CLASS (update name/level) modal
  const handleOpenClassUpdateModal = useCallback(
    (classId: string) => {
      const classObj = classes.find((c) => (c._id || c.id) === classId);
      if (!classObj) return;

      const levelId =
        classObj.levelId && typeof classObj.levelId === 'object'
          ? classObj.levelId._id
          : (classObj.levelId as string | null) || null;

      setClassUpdateModal({
        isOpen: true,
        classId,
        classCode: classObj.classCode || 'N/A',
        name: classObj.name || '',
        levelId,
      });
    },
    [classes]
  );

  const handleCloseClassUpdateModal = useCallback(() => {
    setClassUpdateModal({
      isOpen: false,
      classId: null,
      classCode: '',
      name: '',
      levelId: null,
    });
  }, []);

  const handleSaveClassUpdate = useCallback(async () => {
    if (!classUpdateModal.classId) return;
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL ||
        'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

      const payload: Record<string, unknown> = {
        name: classUpdateModal.name,
      };
      if (classUpdateModal.levelId) {
        payload.levelId = classUpdateModal.levelId;
      }

      const res = await fetch(`${apiUrl}/classes/${classUpdateModal.classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update class');

      alert('Class updated successfully!');
      onDataRefresh?.();
      handleCloseClassUpdateModal();
    } catch (err) {
      console.error(err);
      alert('Update failed. Please try again.');
    }
  }, [classUpdateModal, onDataRefresh, handleCloseClassUpdateModal]);

  // New: student edit modal handlers
  const handleOpenStudentEdit = useCallback(
    (studentId: string) => {
      const st = classEditModal.students.find((s) => s.id === studentId);
      if (!st) return;
      setStudentEditModal({ isOpen: true, student: { ...st } });
    },
    [classEditModal.students]
  );

  const handleCloseStudentEdit = useCallback(() => {
    setStudentEditModal({ isOpen: false, student: null });
  }, []);

  const handleSaveStudentEdit = useCallback(async () => {
    if (!studentEditModal.student) return;
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL ||
        'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

      const { id, name, englishName, dob, gender } = studentEditModal.student;
      const res = await fetch(`${apiUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, englishName, dob, gender }),
      });
      if (!res.ok) throw new Error('Failed to update student');

      // reflect changes in the SHOW modal list
      setClassEditModal((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === id ? { ...s, name, englishName, dob, gender } : s
        ),
      }));

      alert('Student updated successfully!');
      handleCloseStudentEdit();
      onDataRefresh?.();
    } catch (err) {
      console.error(err);
      alert('Student update failed. Please try again.');
    }
  }, [studentEditModal, onDataRefresh, handleCloseStudentEdit]);

  // Close class edit modal
  const handleCloseClassEditModal = useCallback(() => {
    setClassEditModal({
      isOpen: false,
      classId: null,
      className: '',
      levelName: '',
      students: [],
    });
  }, []);

  // Fetch levels for class creation
  const fetchLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = API_BASE_URL;

      console.log('Fetching levels from:', `${apiUrl}/levels`);
      console.log('Token available:', !!token);

      const response = await fetch(`${apiUrl}/levels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Levels response status:', response.status);
      console.log('Levels response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view levels.');
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Levels response data:', data);

      // Handle both new structured response and legacy array response
      let levelsData: Level[] = [];
      if (data && typeof data === 'object' && 'success' in data && data.success) {
        // New structured response: { success: true, levels: [...] }
        levelsData = data.levels || [];
        console.log('Using structured response, levels count:', levelsData.length);
      } else if (Array.isArray(data)) {
        // Legacy array response
        levelsData = data;
        console.log('Using legacy array response, levels count:', levelsData.length);
      } else {
        console.warn('Unexpected levels response format:', data);
        levelsData = [];
      }

      // Ensure all levels have _id property for consistency
      levelsData = levelsData.map((level) => ({
        ...level,
        _id: level._id || level.id || '',
        id: level._id || level.id || '',
      }));

      setLevels(levelsData);
      console.log('Levels state updated:', levelsData);
    } catch (error) {
      console.error('Error fetching levels:', error);
      setLevels([]);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch levels';
      alert(`Error loading levels: ${errorMessage}`);
    } finally {
      setLevelsLoading(false);
      console.log('Levels loading finished');
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Listen for level updates from other components
  useEffect(() => {
    const handleLevelUpdate = () => {
      console.log('Level update event received, refreshing levels...');
      fetchLevels();
    };

    // Add event listener for level updates
    window.addEventListener('levelUpdated', handleLevelUpdate);

    return () => {
      window.removeEventListener('levelUpdated', handleLevelUpdate);
    };
  }, [fetchLevels]);

  // Refresh levels when data is refreshed from parent
  useEffect(() => {
    if (onDataRefresh) {
      // Refresh levels when parent triggers a data refresh
      fetchLevels();
    }
  }, [onDataRefresh, fetchLevels]);

  // ESC key closes the modal (in-scope effect)
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (classEditModal.isOpen) {
          handleCloseClassEditModal();
        }
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [classEditModal.isOpen, handleCloseClassEditModal]);

  // Filter classes based on search and level filter
  const filteredClasses = classes.filter((c) => {
    // Handle both populated levelId object and string levelId
    const levelId = c.levelId ? (typeof c.levelId === 'object' ? c.levelId._id : c.levelId) : null;
    const levelName = c.levelId
      ? typeof c.levelId === 'object'
        ? c.levelId.name
        : levels.find((l) => l._id === c.levelId)?.name || ''
      : 'N/A';

    const matchesSearch =
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.classCode?.toLowerCase().includes(classSearch.toLowerCase()) ||
      levelName.toLowerCase().includes(classSearch.toLowerCase());
    const matchesLevel = !levelFilter || levelId === levelFilter;

    return matchesSearch && matchesLevel;
  });

  // Handle single click to show action buttons
  const handleClassClick = useCallback(
    (classId: string) => {
      console.log('handleClassClick called with classId:', classId);
      console.log('Current selectedClassId:', selectedClassId);
      // Toggle selection: if same class is clicked, deselect it; otherwise select the new one
      setSelectedClassId((prevId) => {
        const newId = prevId === classId ? null : classId;
        console.log('Setting selectedClassId to:', newId);
        return newId;
      });
    },
    [selectedClassId]
  );

  // Single-student assign UI handlers
  const handleAssignButtonClick = useCallback((studentId: string) => {
    setSingleAssignStudentId((prev) => (prev === studentId ? null : studentId));
    setSingleAssignTargetClassId('');
  }, []);

  const handleConfirmSingleAssign = useCallback(async () => {
    if (!singleAssignStudentId || !singleAssignTargetClassId) {
      alert('Please choose a target class to assign.');
      return;
    }

    if (!classEditModal.classId) {
      alert('No class is currently open.');
      return;
    }

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      const apiUrl = API_BASE_URL;

      const addRes = await fetch(
        `${apiUrl}/classes/${singleAssignTargetClassId}/students/${singleAssignStudentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentId: singleAssignStudentId }),
        }
      );

      if (!addRes.ok) {
        throw new Error('Failed to assign student to the selected class.');
      }

      alert('Student assigned to the selected class.');
      setSingleAssignStudentId(null);
      setSingleAssignTargetClassId('');
    } catch (err) {
      console.error(err);
      alert('Assignment failed. Please try again.');
    }
  }, [singleAssignStudentId, singleAssignTargetClassId, classEditModal.classId]);

  // Single-student remove handler (replaces bulk remove usage in per-row action)
  const handleRemoveSingle = useCallback(
    async (studentId: string) => {
      if (!classEditModal.classId) {
        alert('No class selected');
        return;
      }
      const student = classEditModal.students.find((s) => s.id === studentId);
      const studentName = student?.name || 'this student';
      if (!window.confirm(`Remove ${studentName} to waiting list?`)) return;

      try {
        const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL ||
          'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

        // Remove from current class
        const removeRes = await fetch(
          `${apiUrl}/classes/${classEditModal.classId}/students/${studentId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!removeRes.ok) {
          throw new Error(`Failed to remove student ${studentId} from class`);
        }

        // Update student status to 'studying' (waiting list)
        const updateRes = await fetch(`${apiUrl}/users/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'studying' }),
        });
        if (!updateRes.ok) {
          console.warn(`Failed to update student ${studentId} status`);
        }

        // Reflect removal in the modal without closing
        setClassEditModal((prev) => ({
          ...prev,
          students: prev.students.filter((s) => s.id !== studentId),
        }));

        alert('Student removed to waiting list successfully!');
        onDataRefresh?.();
      } catch (error) {
        console.error('Error removing student:', error);
        alert('Failed to remove student. Please try again.');
      }
    },
    [classEditModal.classId, classEditModal.students, onDataRefresh]
  );

  // Delete class
  const handleDeleteClass = useCallback(
    async (classId: string) => {
      const classObj = classes.find((c) => (c._id || c.id) === classId);
      if (!classObj) return;

      const displayName = classObj.classCode || classObj.name || 'this class';
      const levelName = classObj.levelId
        ? typeof classObj.levelId === 'object'
          ? classObj.levelId.name
          : levels.find((l) => l._id === classObj.levelId)?.name || 'N/A'
        : 'N/A';

      const confirmDelete = window.confirm(
        `Are you sure you want to delete class "${displayName}" (Level: ${levelName})?\n\n` +
          `⚠️  WARNING: This action cannot be undone!\n` +
          `• All students will be removed from this class\n` +
          `• Class assignments will be lost\n` +
          `• This will affect student progress tracking\n\n` +
          `Type "DELETE" to confirm:`
      );

      if (!confirmDelete) return;

      // Additional confirmation step
      const userInput = prompt('Please type "DELETE" to confirm deletion:');
      if (userInput !== 'DELETE') {
        alert('Deletion cancelled. Class was not deleted.');
        return;
      }

      try {
        const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL ||
          'https://us-central1-skillup-3beaf.cloudfunctions.net/api';

        const res = await fetch(`${apiUrl}/classes/${classId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        alert(`✅ Class "${displayName}" has been successfully deleted.`);
        onDataRefresh?.();
        // Clear selection after deletion
        setSelectedClassId(null);
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('❌ Failed to delete class. Please try again.');
      }
    },
    [classes, levels, onDataRefresh]
  );

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, classId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClassClick(classId);
      }
    },
    [handleClassClick]
  );

  // Handle date change (removed auto-create to avoid unexpected requests)
  const handleDateChange = useCallback((date: string) => {
    setNewClassStartingDate(date);
  }, []);

  const handleAddClass = useCallback(async () => {
    if (!newClassLevelId) {
      alert('Please select a level');
      return;
    }

    if (!newClassStartingDate) {
      alert('Please select a starting date');
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      if (!token) {
        alert('You must be logged in as a teacher/admin to create a class.');
        return;
      }

      const userInfoRaw = localStorage.getItem('skillup_user');
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

      const requestBody: any = {
        levelId: newClassLevelId,
        startingDate: newClassStartingDate,
      };
      if (userInfo?.role === 'teacher' || userInfo?.role === 'admin') {
        requestBody.teacherId = userInfo.id || userInfo._id || userInfo.docId;
      }

      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        let message = `HTTP error! status: ${res.status}`;
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const errorData = await res.json();
            message = errorData.message || message;
          } else {
            const text = await res.text();
            message = text || message;
          }
        } catch {
          // keep default message
        }
        throw new Error(message);
      }

      const data = await res.json();

      if (data.success) {
        setNewClassLevelId('');
        setNewClassStartingDate('');
        alert(`Class created successfully! Class Code: ${data.class.classCode}`);
        onDataRefresh?.();
      } else {
        alert(data.message || 'Failed to create class');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add class. Please try again.');
    } finally {
      setAdding(false);
    }
  }, [newClassLevelId, newClassStartingDate, onDataRefresh]);

  return (
    <div className="management-panel">
      <div className="management-header">
        <h2 className="management-title">Classes Management</h2>
        <p className="management-subtitle">Manage all classes and student assignments</p>
      </div>

      <div className="management-search">
        <div className="search-controls">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search classes..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Search is already live, just focus the input
                  (e.target as HTMLInputElement).focus();
                }
              }}
              aria-label="Search classes"
              title="Search classes by name or code"
            />
            <button type="button" className="search-bar-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Search">
                <title>Search</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
          <select
            className="status-filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            disabled={levelsLoading}
            title={levelsLoading ? 'Loading levels...' : 'Filter by level'}
          >
            <option value="">All Levels</option>
            {levelsLoading ? (
              <option value="" disabled>
                Loading levels...
              </option>
            ) : sortedLevels && Array.isArray(sortedLevels) && sortedLevels.length > 0 ? (
              sortedLevels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No levels available
              </option>
            )}
          </select>
        </div>
      </div>

      <div className="classes-info">
        {classes && Array.isArray(classes) && classes.length > 0 ? (
          <>
            Showing {filteredClasses.length} of {classes.length} classes
            {(classSearch || levelFilter) && (
              <span className="filter-info">
                {classSearch && ` matching "${classSearch}"`}
                {levelFilter &&
                  ` in ${levels.find((l) => l._id === levelFilter)?.name || 'Unknown Level'}`}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.8rem', color: '#666' }}>EMPTY</span>
        )}
      </div>

      <div className="management-table-container table-container theme-dark-green">
        <table className="management-table">
          <thead>
            <tr>
              <th>Class Code</th>
              <th>Level</th>
              <th>Students</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <p>No classes found.</p>
                    <p className="empty-subtitle">
                      {!classes || !Array.isArray(classes) || classes.length === 0
                        ? 'Create your first class by selecting a level below.'
                        : 'No classes match your current search criteria.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredClasses.map((cls) => {
              // Use classCode as the display name, fallback to name
              const displayName = cls.classCode || cls.name || 'Unnamed Class';
              const classId = cls._id || cls.id;

              // Skip rendering if classId is undefined
              if (!classId) {
                console.warn('Class without ID found:', cls);
                return null;
              }

              // TypeScript now knows classId is a string
              const safeClassId: string = classId;
              // Handle both populated levelId object and string levelId
              const levelName = cls.levelId
                ? typeof cls.levelId === 'object'
                  ? cls.levelId.name
                  : levels.find((l) => l._id === cls.levelId)?.name || 'N/A'
                : 'N/A';
              const studentCount = students.filter((s) =>
                (s.classIds || []).includes(safeClassId)
              ).length;
              const isSelected = selectedClassId === safeClassId;

              return (
                <tr
                  key={safeClassId}
                  onClick={() => handleClassClick(safeClassId)}
                  onKeyDown={(e) => handleKeyDown(e, safeClassId)}
                  className={`clickable-row ${isSelected ? 'selected-row' : ''}`}
                  title="Click this row to reveal actions"
                  tabIndex={0}
                >
                  <td className="class-name-cell">
                    <div className="class-name">{displayName}</div>
                  </td>
                  <td className="level-cell">
                    <span className="level-badge">{levelName}</span>
                  </td>
                  <td className="students-cell">{studentCount} students</td>
                  <td className="description-cell">{cls.description || '-'}</td>
                  <td
                    style={{
                      width: '200px',
                      minWidth: '200px',
                      maxWidth: '200px',
                      verticalAlign: 'middle',
                      textAlign: 'center',
                      padding: '8px',
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        width: '100%',
                        minHeight: '40px',
                        padding: '4px',
                        opacity: isSelected ? 1 : 0.3,
                        transform: isSelected ? 'scale(1)' : 'scale(0.9)',
                        filter: isSelected ? 'grayscale(0%)' : 'grayscale(50%)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      className="action-buttons"
                    >
                      <button
                        type="button"
                        style={{
                          padding: '8px 16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          minWidth: '60px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          position: 'relative',
                          overflow: 'hidden',
                          outline: 'none',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          display: 'inline-block',
                          background:
                            'linear-gradient(135deg, #f5b802 0%, #ffd54f 50%, #fbc02d 100%)',
                          color: '#2b2b2b',
                          textShadow: '0 1px 2px rgba(255, 255, 255, 0.2)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClass(safeClassId);
                        }}
                        title="Show: list students, assign/remove"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #ffd54f 0%, #fbc02d 50%, #f5b802 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px rgba(245, 184, 2, 0.35), 0 0 0 3px rgba(245, 184, 2, 0.25)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #f5b802 0%, #ffd54f 50%, #fbc02d 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        Show
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '8px 16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          minWidth: '60px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          position: 'relative',
                          overflow: 'hidden',
                          outline: 'none',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          display: 'inline-block',
                          background:
                            'linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)',
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenClassUpdateModal(safeClassId);
                        }}
                        title="Edit class name or level"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #81c784 0%, #66bb6a 50%, #4caf50 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px rgba(102, 187, 106, 0.4), 0 0 0 3px rgba(102, 187, 106, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '8px 16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          minWidth: '60px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          position: 'relative',
                          overflow: 'hidden',
                          outline: 'none',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          display: 'inline-block',
                          background:
                            'linear-gradient(135deg, #f44336 0%, #ef5350 50%, #e57373 100%)',
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(safeClassId);
                        }}
                        title="Delete Class"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #ef5350 0%, #e57373 50%, #f44336 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px rgba(244, 67, 54, 0.4), 0 0 0 3px rgba(244, 67, 54, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #f44336 0%, #ef5350 50%, #e57373 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Class Form */}
      <div className="add-class-section">
        <h3 className="add-class-title">ADD A NEW CLASS</h3>
        <div className="add-class-form">
          <select
            value={newClassLevelId}
            onChange={(e) => setNewClassLevelId(e.target.value)}
            className="level-select"
            disabled={levelsLoading}
          >
            <option value="">Select Level</option>
            {levelsLoading ? (
              <option value="" disabled>
                Loading levels...
              </option>
            ) : sortedLevels && Array.isArray(sortedLevels) && sortedLevels.length > 0 ? (
              sortedLevels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No levels available
              </option>
            )}
          </select>

          <div className="date-input-container">
            <label htmlFor="starting-date" className="date-label">
              Starting Date
            </label>
            <div className="date-input-enhanced">
              <input
                id="starting-date"
                type="date"
                value={newClassStartingDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="starting-date-input"
                title=""
                placeholder="Select starting date"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddClass}
            disabled={adding || !newClassLevelId || !newClassStartingDate}
            className="add-class-btn"
          >
            {adding ? 'Creating...' : 'Add Class'}
          </button>
        </div>
      </div>

      {/* Class SHOW Modal (renamed header) */}
      {classEditModal.isOpen && (
        <div className="class-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                SHOW CLASS — {classEditModal.className} / LEVEL: {classEditModal.levelName}
              </h3>
              <button type="button" className="close-btn" onClick={handleCloseClassEditModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="students-section">
                <div className="section-header">
                  <h4>List of Students ({classEditModal.students.length})</h4>
                </div>

                {classEditModal.students.length === 0 ? (
                  <p className="no-students">No students assigned to this class.</p>
                ) : (
                  <div className="students-table-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Full Name</th>
                          <th>English Name</th>
                          <th>DOB</th>
                          <th>Gender</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classEditModal.students.map((student) => (
                          <tr key={student.id} className="student-row">
                            <td style={{ color: '#1D9A6C' }}>
                              {student.studentCode || student.id}
                            </td>
                            <td style={{ color: '#1D9A6C' }}>
                              <div className="student-name">
                                <strong>{student.name}</strong>
                                {student.englishName && (
                                  <div className="english-name">({student.englishName})</div>
                                )}
                              </div>
                            </td>
                            <td style={{ color: '#1D9A6C' }}>{student.englishName || 'N/A'}</td>
                            <td style={{ color: '#1D9A6C' }}>
                              {student.dob ? formatDateMMDDYYYY(student.dob) : 'N/A'}
                            </td>
                            <td style={{ color: '#1D9A6C' }}>{student.gender || 'N/A'}</td>
                            <td className="student-actions">
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentEdit(student.id)}
                                  className="action-btn"
                                  title="Edit student details"
                                  style={{
                                    background:
                                      'linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)',
                                    color: 'white',
                                  }}
                                >
                                  Edit Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSingle(student.id)}
                                  className="action-btn remove-btn"
                                  title="Remove student to waiting list"
                                >
                                  ➖ Remove
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAssignButtonClick(student.id)}
                                  className="action-btn"
                                  title="Assign student to another class"
                                  style={{
                                    background:
                                      'linear-gradient(135deg, #00c853 0%, #4caf50 50%, #66bb6a 100%)',
                                    color: 'white',
                                  }}
                                >
                                  ➕ Assign
                                </button>
                                {singleAssignStudentId === student.id && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <select
                                      value={singleAssignTargetClassId}
                                      onChange={(e) => setSingleAssignTargetClassId(e.target.value)}
                                      className="target-class-select"
                                      title="Choose target class"
                                    >
                                      <option value="">Select target class...</option>
                                      {classes
                                        ?.filter((c) => (c._id || c.id) !== classEditModal.classId)
                                        .map((cls) => {
                                          const levelName = cls.levelId
                                            ? typeof cls.levelId === 'object'
                                              ? cls.levelId.name
                                              : levels.find((l) => l._id === cls.levelId)?.name ||
                                                'N/A'
                                            : 'N/A';
                                          const displayName =
                                            cls.classCode || cls.name || 'Unnamed Class';
                                          return (
                                            <option
                                              key={cls._id || cls.id}
                                              value={(cls._id || cls.id) as string}
                                            >
                                              {displayName} ({levelName})
                                            </option>
                                          );
                                        })}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={handleConfirmSingleAssign}
                                      className="bulk-btn"
                                      style={{
                                        background:
                                          'linear-gradient(135deg, #00c853 0%, #4caf50 50%, #66bb6a 100%)',
                                        color: 'white',
                                      }}
                                    >
                                      Confirm
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New: EDIT CLASS modal (change name or level; class code fixed) */}
      {classUpdateModal.isOpen && (
        <div className="class-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">EDIT CLASS</h3>
              <button type="button" className="close-btn" onClick={handleCloseClassUpdateModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-row">
                  <label>Class Code</label>
                  <input type="text" value={classUpdateModal.classCode} disabled />
                </div>
                <div className="form-row">
                  <label>Class Name</label>
                  <input
                    type="text"
                    value={classUpdateModal.name}
                    onChange={(e) =>
                      setClassUpdateModal((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-row">
                  <label>Level</label>
                  <select
                    value={classUpdateModal.levelId || ''}
                    onChange={(e) =>
                      setClassUpdateModal((prev) => ({
                        ...prev,
                        levelId: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">Select Level</option>
                    {sortedLevels.map((lvl) => (
                      <option key={lvl._id} value={lvl._id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="action-buttons" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleSaveClassUpdate}
                  className="action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)',
                    color: 'white',
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="action-btn remove-btn"
                  onClick={handleCloseClassUpdateModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New: Student Edit modal */}
      {studentEditModal.isOpen && studentEditModal.student && (
        <div className="class-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">EDIT STUDENT</h3>
              <button type="button" className="close-btn" onClick={handleCloseStudentEdit}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-row">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={studentEditModal.student.name || ''}
                    onChange={(e) =>
                      setStudentEditModal((prev) =>
                        prev.student
                          ? { ...prev, student: { ...prev.student, name: e.target.value } }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="form-row">
                  <label>English Name</label>
                  <input
                    type="text"
                    value={studentEditModal.student.englishName || ''}
                    onChange={(e) =>
                      setStudentEditModal((prev) =>
                        prev.student
                          ? { ...prev, student: { ...prev.student, englishName: e.target.value } }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="form-row">
                  <label>DOB</label>
                  <input
                    type="date"
                    value={studentEditModal.student.dob || ''}
                    onChange={(e) =>
                      setStudentEditModal((prev) =>
                        prev.student
                          ? { ...prev, student: { ...prev.student, dob: e.target.value } }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="form-row">
                  <label>Gender</label>
                  <select
                    value={studentEditModal.student.gender || ''}
                    onChange={(e) =>
                      setStudentEditModal((prev) =>
                        prev.student
                          ? { ...prev, student: { ...prev.student, gender: e.target.value } }
                          : prev
                      )
                    }
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="action-buttons" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleSaveStudentEdit}
                  className="action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%)',
                    color: 'white',
                  }}
                >
                  Save Student
                </button>
                <button
                  type="button"
                  className="action-btn remove-btn"
                  onClick={handleCloseStudentEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed: Report Student modal */}
    </div>
  );
}
