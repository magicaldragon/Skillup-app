// ClassesPanel.tsx
// Professional panel to show and manage classes with code names (SU-001, SU-002, ...)
import { useCallback, useEffect, useState } from 'react';
import type { Level, Student, StudentClass } from './types';
import { formatDateDDMMYYYY } from './utils/stringUtils';
import './ClassesPanel.css';
import './ManagementTableStyles.css';

// Interface for class editing modal
interface ClassEditModal {
  isOpen: boolean;
  classId: string | null;
  className: string;
  levelName: string;
  students: Student[];
}

// Interface for class info editing modal
interface ClassInfoEditModal {
  isOpen: boolean;
  classId: string;
  className: string;
  levelId: string | null;
  description: string;
}

// Interface for report modal
interface ReportModal {
  isOpen: boolean;
  studentId: string | null;
  studentName: string;
  classId: string;
  className: string;
}

const ClassesPanel = ({
  students,
  classes,
  onDataRefresh,
}: {
  students: Student[];
  classes: StudentClass[];
  onDataRefresh?: () => void;
}) => {
  const [adding, setAdding] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);

  const [classSearch, setClassSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  // Class editing modal state
  const [classEditModal, setClassEditModal] = useState<ClassEditModal>({
    isOpen: false,
    classId: null,
    className: '',
    levelName: '',
    students: [],
  });

  // Class info editing modal state
  const [classInfoEditModal, setClassInfoEditModal] = useState<ClassInfoEditModal>({
    isOpen: false,
    classId: '',
    className: '',
    levelId: null,
    description: '',
  });

  // Report modal state
  const [reportModal, setReportModal] = useState<ReportModal>({
    isOpen: false,
    studentId: null,
    studentName: '',
    classId: '',
    className: '',
  });

  // Add report modal state
  const [studentReportModal, setStudentReportModal] = useState<{
    isOpen: boolean;
    studentId: string | null;
    studentName: string;
    classId: string;
    className: string;
    caseNo: string;
    problems: string;
  }>({
    isOpen: false,
    studentId: null,
    studentName: '',
    classId: '',
    className: '',
    caseNo: '',
    problems: '',
  });

  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Add new class with level selection
  const [newClassLevelId, setNewClassLevelId] = useState<string>('');
  const [newClassStartingDate, setNewClassStartingDate] = useState<string>('');

  // Add state for showing action buttons
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

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
      setSelectedStudentIds([]);
    },
    [classes, levels, students]
  );

  // Close class edit modal
  const handleCloseClassEditModal = useCallback(() => {
    setClassEditModal({
      isOpen: false,
      classId: null,
      className: '',
      levelName: '',
      students: [],
    });
    setSelectedStudentIds([]);
  }, []);

  // Toggle student selection for bulk actions
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }, []);

  // Select all students
  const selectAllStudents = useCallback(() => {
    setSelectedStudentIds(classEditModal.students.map((s) => s.id));
  }, [classEditModal.students]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    setSelectedStudentIds([]);
  }, []);

  // Fetch levels for class creation
  const fetchLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      
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
      levelsData = levelsData.map(level => ({
        ...level,
        _id: level._id || level.id || '',
        id: level._id || level.id || ''
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

  // Report a student
  const handleReportStudent = useCallback(
    (studentId: string, studentName: string, classId: string, className: string) => {
      // Generate case number (this should come from backend, but for now we'll generate it)
      const timestamp = Date.now();
      const caseNo = `Case ${timestamp.toString().slice(-6)}`;
      
      setStudentReportModal({
        isOpen: true,
        studentId,
        studentName,
        classId,
        className,
        caseNo,
        problems: '',
      });
    },
    []
  );

  // Submit student report
  const handleSubmitReport = useCallback(async () => {
    if (!studentReportModal.studentId || !studentReportModal.problems.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      
      const reportData = {
        studentId: studentReportModal.studentId,
        classId: studentReportModal.classId,
        className: studentReportModal.className,
        problems: studentReportModal.problems,
        caseNo: studentReportModal.caseNo,
      };

      const response = await fetch(`${apiUrl}/student-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const data = await response.json();
      if (data.success) {
        alert('Report submitted successfully!');
        setStudentReportModal({
          isOpen: false,
          studentId: null,
          studentName: '',
          classId: '',
          className: '',
          caseNo: '',
          problems: '',
        });
        // Refresh data if callback provided
        onDataRefresh?.();
      } else {
        throw new Error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    }
  }, [studentReportModal, onDataRefresh]);

  // Close student report modal
  const handleCloseStudentReportModal = useCallback(() => {
    setStudentReportModal({
      isOpen: false,
      studentId: null,
      studentName: '',
      classId: '',
      className: '',
      caseNo: '',
      problems: '',
    });
  }, []);

  // Close class info edit modal
  const handleCloseClassInfoEditModal = useCallback(() => {
    setClassInfoEditModal({
      isOpen: false,
      classId: '',
      className: '',
      levelId: null,
      description: '',
    });
  }, []);

  // Update class information
  const handleUpdateClassInfo = useCallback(async () => {
    if (!classInfoEditModal.classId) return;

    const confirmUpdate = window.confirm(
      `Are you sure you want to update the level for class "${classInfoEditModal.className}"?\n\n` +
        `• New Level: ${levels.find((l) => l._id === classInfoEditModal.levelId)?.name || 'Not specified'}\n` +
        `• Description: ${classInfoEditModal.description || 'None'}\n\n` +
        `Proceed with update?`
    );

    if (!confirmUpdate) return;

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiUrl}/classes/${classInfoEditModal.classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Do not allow changing class code/name
          levelId: classInfoEditModal.levelId || null,
          description: classInfoEditModal.description,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      alert(`✅ Class "${classInfoEditModal.className}" has been successfully updated!`);
      handleCloseClassInfoEditModal();
      onDataRefresh?.();
      setSelectedClassId(null);
    } catch (error) {
      console.error('Error updating class info:', error);
      alert('❌ Failed to update class information. Please try again.');
    }
  }, [classInfoEditModal, levels, handleCloseClassInfoEditModal, onDataRefresh]);

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
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

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

  // Close report modal
  const handleCloseReportModal = useCallback(() => {
    setReportModal({
      isOpen: false,
      studentId: null,
      studentName: '',
      classId: '',
      className: '',
    });
  }, []);

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

  // Add new class
  const handleAddClass = useCallback(async () => {
    if (!newClassLevelId) {
      alert('Please select a level');
      return;
    }

    if (!newClassStartingDate) {
      alert('Please select a starting date');
      return;
    }

    // Note: Date restriction removed - users can create classes with any date

    setAdding(true);
    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');

      const requestBody = { 
        levelId: newClassLevelId,
        startingDate: newClassStartingDate
      };

      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${apiUrl}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
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
      console.error('Error adding class:', error);
      alert(error instanceof Error ? error.message : 'Failed to add class. Please try again.');
    } finally {
      setAdding(false);
    }
  }, [newClassLevelId, newClassStartingDate, onDataRefresh]);

  // Bulk assign students to another class
  const handleBulkAssign = useCallback(
    async (targetClassId: string) => {
      if (selectedStudentIds.length === 0) {
        alert('Please select students to assign');
        return;
      }

      if (!classEditModal.classId) {
        alert('No source class selected');
        return;
      }

      try {
        const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

        // First, remove students from current class
        for (const studentId of selectedStudentIds) {
          const removeRes = await fetch(
            `${apiUrl}/classes/${classEditModal.classId}/students/${studentId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!removeRes.ok) {
            throw new Error(`Failed to remove student ${studentId} from current class`);
          }
        }

        // Then, add students to target class
        for (const studentId of selectedStudentIds) {
          const addRes = await fetch(`${apiUrl}/classes/${targetClassId}/students/${studentId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ studentId }),
          });

          if (!addRes.ok) {
            throw new Error(`Failed to assign student ${studentId} to target class`);
          }
        }

        alert('Students assigned successfully!');
        onDataRefresh?.();
        handleCloseClassEditModal();
      } catch (error) {
        console.error('Error bulk assigning students:', error);
        alert('Failed to assign students. Please try again.');
      }
    },
    [selectedStudentIds, classEditModal.classId, onDataRefresh, handleCloseClassEditModal]
  );

  // Bulk remove students to waiting list
  const handleBulkRemove = useCallback(async () => {
    if (selectedStudentIds.length === 0) {
      alert('Please select students to remove');
      return;
    }

    if (!classEditModal.classId) {
      alert('No class selected');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to remove ${selectedStudentIds.length} students to the waiting list?`
      )
    )
      return;

    try {
      const token = localStorage.getItem('skillup_token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      for (const studentId of selectedStudentIds) {
        // Remove from current class
        const removeRes = await fetch(
          `${apiUrl}/classes/${classEditModal.classId}/students/${studentId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
          body: JSON.stringify({ 
            status: 'studying'
          }),
        });

        if (!updateRes.ok) {
          console.warn(`Failed to update student ${studentId} status`);
        }
      }

      alert('Students removed to waiting list successfully!');
      onDataRefresh?.();
      handleCloseClassEditModal();
    } catch (error) {
      console.error('Error bulk removing students:', error);
      alert('Failed to remove students. Please try again.');
    }
  }, [selectedStudentIds, classEditModal.classId, onDataRefresh, handleCloseClassEditModal]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (classEditModal.isOpen) {
          handleCloseClassEditModal();
        }
        if (reportModal.isOpen) {
          handleCloseReportModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [
    classEditModal.isOpen,
    reportModal.isOpen,
    handleCloseClassEditModal,
    handleCloseReportModal,
  ]);



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
            title={levelsLoading ? "Loading levels..." : "Filter by level"}
          >
            <option value="">All Levels</option>
            {levelsLoading ? (
              <option value="" disabled>Loading levels...</option>
            ) : levels && Array.isArray(levels) && levels.length > 0 ? (
              levels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No levels available</option>
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
                {levelFilter && ` in ${levels.find((l) => l._id === levelFilter)?.name || 'Unknown Level'}`}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.8rem', color: '#666' }}>EMPTY</span>
        )}
      </div>

      <div className="management-table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Class Code</th>
              <th>Level</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-table">
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
              const studentCount = cls.studentIds?.length || 0;
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
                            'linear-gradient(135deg, #00c853 0%, #4caf50 50%, #66bb6a 100%)',
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClass(safeClassId);
                        }}
                        title="Show class details"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #00c853 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px rgba(76, 175, 80, 0.4), 0 0 0 3px rgba(76, 175, 80, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #00c853 0%, #4caf50 50%, #66bb6a 100%)';
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
                            'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)',
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const cls = classes.find((c) => (c._id || c.id) === safeClassId);
                          if (!cls) return;
                          const displayNameLocal = cls.classCode || cls.name || 'Unnamed Class';
                          setClassInfoEditModal({
                            isOpen: true,
                            classId: safeClassId,
                            className: displayNameLocal,
                            levelId:
                              typeof cls.levelId === 'object'
                                ? cls.levelId?._id || null
                                : cls.levelId || null,
                            description: cls.description || '',
                          });
                        }}
                        title="Edit Level"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #42a5f5 0%, #64b5f6 50%, #2196f3 100%)';
                          e.currentTarget.style.boxShadow =
                            '0 8px 25px rgba(33, 150, 243, 0.4), 0 0 0 3px rgba(33, 150, 243, 0.2)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)';
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
              <option value="" disabled>Loading levels...</option>
            ) : levels && Array.isArray(levels) && levels.length > 0 ? (
              levels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name}
                </option>
              ))
            ) : (
              <option value="" disabled>No levels available</option>
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
                onChange={(e) => setNewClassStartingDate(e.target.value)}
                className="starting-date-input"
                title="" // Removed title to eliminate hover tooltip
                placeholder=""
              />
            </div>
            {newClassStartingDate && (
              <div className="date-format-preview">
                <small>{formatDateDDMMYYYY(newClassStartingDate)}</small>
              </div>
            )}
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

      {/* Class Edit Modal */}
      {classEditModal.isOpen && (
        <div className="class-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                CLASS: {classEditModal.className} / LEVEL: {classEditModal.levelName}
              </h3>
              <button type="button" className="close-btn" onClick={handleCloseClassEditModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="students-section">
                <div className="section-header">
                  <h4>List of Students ({classEditModal.students.length})</h4>
                  <div className="bulk-actions">
                    <button
                      type="button"
                      className="bulk-btn select-all-btn"
                      onClick={selectAllStudents}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="bulk-btn clear-all-btn"
                      onClick={clearAllSelections}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {classEditModal.students.length === 0 ? (
                  <p className="no-students">No students assigned to this class.</p>
                ) : (
                  <div className="students-table-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th className="checkbox-header">
                            <input
                              type="checkbox"
                              checked={
                                selectedStudentIds.length === classEditModal.students.length &&
                                classEditModal.students.length > 0
                              }
                              onChange={
                                selectedStudentIds.length === classEditModal.students.length
                                  ? clearAllSelections
                                  : selectAllStudents
                              }
                              className="select-all-checkbox"
                            />
                          </th>
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
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="row-checkbox"
                              />
                            </td>
                            <td>{student.studentCode || student.id}</td>
                            <td>
                              <div className="student-name">
                                <strong>{student.name}</strong>
                                {student.englishName && (
                                  <div className="english-name">({student.englishName})</div>
                                )}
                              </div>
                            </td>
                            <td>{student.englishName || 'N/A'}</td>
                            <td>
                              {student.dob ? formatDateDDMMYYYY(student.dob) : 'N/A'}
                            </td>
                            <td>{student.gender || 'N/A'}</td>
                            <td className="student-actions">
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  onClick={() => handleReportStudent(student.id, student.name, classEditModal.classId || '', classEditModal.className)}
                                  className="action-btn report-btn"
                                  title="Report student issue"
                                >
                                  📝 Report
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Remove single student to waiting list
                                    if (window.confirm(`Remove ${student.name} to waiting list?`)) {
                                      setSelectedStudentIds([student.id]);
                                      handleBulkRemove();
                                    }
                                  }}
                                  className="action-btn remove-btn"
                                  title="Remove student to waiting list"
                                >
                                  ➖ Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedStudentIds.length > 0 && (
                <div className="bulk-actions-section">
                  <h4>Bulk Actions for {selectedStudentIds.length} selected student(s):</h4>
                  <div className="bulk-actions-buttons">
                    <div className="bulk-action-group">
                      <label htmlFor="target-class-select">Assign to another class:</label>
                      <select
                        id="target-class-select"
                        className="target-class-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            const targetClass = classes.find(c => c.id === e.target.value);
                            if (targetClass && window.confirm(
                              `Assign ${selectedStudentIds.length} student(s) to ${targetClass.name || targetClass.classCode}?`
                            )) {
                              handleBulkAssign(e.target.value);
                              e.target.value = '';
                            } else {
                              e.target.value = '';
                            }
                          }
                        }}
                      >
                        <option value="">Select target class...</option>
                        {classes &&
                          Array.isArray(classes) &&
                          classes
                            .filter((c) => c.id !== classEditModal.classId)
                            .map((cls) => {
                              // Handle both populated levelId object and string levelId
                              const levelName = cls.levelId
                                ? typeof cls.levelId === 'object'
                                  ? cls.levelId.name
                                  : levels.find((l) => l._id === cls.levelId)?.name || 'N/A'
                                : 'N/A';
                              const displayName = cls.classCode || cls.name || 'Unnamed Class';
                              return (
                                <option key={cls.id} value={cls.id}>
                                  {displayName} ({levelName}) - {cls.studentIds?.length || 0} students
                                </option>
                              );
                            })}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkRemove}
                      className="bulk-btn remove-btn"
                    >
                      ➖ Remove to Waiting List
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Info Edit Modal */}
      {classInfoEditModal.isOpen && (
        <div className="class-info-edit-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Class Level</h3>
              <button type="button" className="close-btn" onClick={handleCloseClassInfoEditModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="class-name">Class Code:</label>
                <input
                  id="class-name"
                  type="text"
                  value={classInfoEditModal.className}
                  readOnly
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="class-level">Level:</label>
                <select
                  id="class-level"
                  value={classInfoEditModal.levelId || ''}
                  onChange={(e) =>
                    setClassInfoEditModal((prev) => ({ ...prev, levelId: e.target.value || null }))
                  }
                  className="form-select"
                >
                  <option value="">Select Level</option>
                  {levels.map((level) => (
                    <option key={level._id} value={level._id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="class-description">Description (Optional):</label>
                <textarea
                  id="class-description"
                  value={classInfoEditModal.description}
                  onChange={(e) =>
                    setClassInfoEditModal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="form-textarea"
                  rows={3}
                  placeholder="Add any additional notes about this class..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleUpdateClassInfo} className="save-btn">
                  Update Class
                </button>
                <button
                  type="button"
                  onClick={handleCloseClassInfoEditModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {studentReportModal.isOpen && (
        <div className="student-report-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Report Student: {studentReportModal.studentName}</h3>
              <button type="button" className="close-btn" onClick={handleCloseStudentReportModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="case-no">Case Number:</label>
                <input
                  id="case-no"
                  type="text"
                  value={studentReportModal.caseNo}
                  readOnly
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student-name">Student Name:</label>
                <input
                  id="student-name"
                  type="text"
                  value={studentReportModal.studentName}
                  readOnly
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="class-name">Class:</label>
                <input
                  id="class-name"
                  type="text"
                  value={studentReportModal.className}
                  readOnly
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="problems">Problem Description:</label>
                <textarea
                  id="problems"
                  value={studentReportModal.problems}
                  onChange={(e) =>
                    setStudentReportModal((prev) => ({ ...prev, problems: e.target.value }))
                  }
                  placeholder="Describe the problem or misbehavior..."
                  rows={4}
                  className="form-textarea"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleSubmitReport} className="save-btn">
                  Submit Report
                </button>
                <button type="button" onClick={handleCloseStudentReportModal} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPanel;
