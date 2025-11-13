import { useCallback, useEffect, useState } from "react";
import type { Student, StudentClass } from "./types";
import { formatDateMMDDYYYY } from "./utils/stringUtils";
import "./PotentialStudentsPanel.css";
import "./ManagementTableStyles.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://us-central1-skillup-3beaf.cloudfunctions.net/api";

interface User {
  _id: string;
  name: string;
  englishName?: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  studentCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface PotentialStudentsPanelProps {
  classes: StudentClass[];
  currentUser: Student;
  onDataRefresh?: () => void;
}

const PotentialStudentsPanel = ({
  classes: _classes,
  currentUser: _currentUser,
  onDataRefresh,
}: PotentialStudentsPanelProps) => {
  const [potentialStudents, setPotentialStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Add search state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "potential" | "contacted">("all");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchPotentialStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("skillup_token");
    if (!token) {
      setError("No authentication token found. Please log in again.");
      setLoading(false);
      return;
    }

    // Validate token format - support both JWT tokens (with dots) and base64 session tokens
    if (token.length < 50) {
      setError("Invalid authentication token. Please log in again.");
      setLoading(false);
      return;
    }

    const apiUrl = `${API_BASE_URL}/users?status=potential,contacted`;
    console.log("🔍 [PotentialStudents] API Call Details:", {
      url: apiUrl,
      baseUrl: API_BASE_URL,
      hasToken: !!token,
      tokenPrefix: token ? `${token.substring(0, 10)}...` : "none",
      fullToken: token
        ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
        : "none",
    });

    try {
      // Fetch users with status 'potential' or 'contacted'
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 [PotentialStudents] Response Status:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [PotentialStudents] Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        if (response.status === 401) {
          setError("Authentication failed. Please log in again.");
          // Optionally clear the invalid token
          localStorage.removeItem("skillup_token");
        } else if (response.status === 403) {
          setError("Access denied. You do not have permission to view potential students.");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      console.log("✅ [PotentialStudents] Success Response:", {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : "N/A",
        firstItem: Array.isArray(data) && data.length > 0 ? data[0] : "none",
      });

      if (!Array.isArray(data)) {
        console.warn("Received non-array data:", data);
        setPotentialStudents([]);
      } else {
        setPotentialStudents(data);
      }
    } catch (error) {
      console.error("💥 [PotentialStudents] Fetch Error:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack",
        apiUrl,
      });
      setError(
        `Failed to load potential students: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPotentialStudents();
  }, [fetchPotentialStudents]);

  // Bulk update status
  const handleBulkUpdateStatus = async () => {
    const token = localStorage.getItem("skillup_token");
    if (!token) {
      alert("No authentication token found");
      return;
    }

    try {
      for (const id of selectedIds) {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: bulkStatus }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update user ${id} status`);
        }
      }
      setSelectedIds([]);
      setBulkStatus("");
      setShowBulkUpdate(false);
      fetchPotentialStudents();
      onDataRefresh?.();
    } catch (error) {
      console.error("Bulk status update error:", error);
      alert("Failed to update potential students status. Please try again.");
    }
  };

  // Individual select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Select all
  const selectAll = () => setSelectedIds(potentialStudents.map((s) => s._id));
  const clearAll = () => setSelectedIds([]);

  // Move to Waiting List (changes status to 'studying') - REMOVED AS PER UI REQUIREMENTS
  // This functionality was removed as part of the UI improvements

  // Sync existing students with PotentialStudent records
  const handleSyncExistingStudents = async () => {
    const token = localStorage.getItem("skillup_token");
    if (!token) {
      alert("No authentication token found");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/sync-potential-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to sync existing students");
      }

      const result = await response.json();
      alert(`Sync completed! ${result.created} new records created, ${result.skipped} skipped.`);

      // Refresh the potential students list
      fetchPotentialStudents();
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync existing students. Please try again.");
    }
  };

  // Filtered students
  const filteredStudents = potentialStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.englishName?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="management-panel">
        <div className="management-loading">
          <div className="management-spinner"></div>
          <p>Loading potential students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-panel">
        <div className="management-error">
          <h3>Error Loading Potential Students</h3>
          <p>{error}</p>
          <button type="button" className="management-retry-btn" onClick={fetchPotentialStudents}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-panel">
      <div className="management-header">
        <h2 className="management-title">Potential Students</h2>
        <p className="management-subtitle">
          Students with "Potential" or "Contacted" status - they will move to Waiting List when
          status changes to "Studying"
        </p>
      </div>

      <div className="management-search">
        <div className="search-controls">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search by name, phone, or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Search is already live, just focus the input
                  (e.target as HTMLInputElement).focus();
                }
              }}
              aria-label="Search potential students"
              title="Search by name, phone, or student ID"
            />
            <button
              type="button"
              className="search-bar-button"
              onClick={() => {
                // Search is already live, just focus the input for better UX
                const searchInput = document.querySelector(".search-bar-input") as HTMLInputElement;
                if (searchInput) {
                  searchInput.focus();
                }
              }}
              title="Search"
              aria-label="Search"
            >
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "potential" | "contacted")}
            className="status-filter-select"
          >
            <option value="all">All Status</option>
            <option value="potential">Potential</option>
            <option value="contacted">Contacted</option>
          </select>
        </div>
      </div>

      <div className="management-table-container table-container theme-orange">
        <table className="management-table">
          <thead>
            <tr>
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === potentialStudents.length && potentialStudents.length > 0
                  }
                  onChange={selectedIds.length === potentialStudents.length ? clearAll : selectAll}
                  className="select-all-checkbox"
                />
              </th>
              <th>Student ID</th>
              <th>Name</th>
              <th>English Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Status</th>
              <th>Parent's Name</th>
              <th>Parent's Phone</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-table">
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No potential students found.</p>
                    <p className="empty-subtitle">
                      Students with "potential" or "contacted" status will appear here.
                      {potentialStudents.length === 0 && (
                        <span>
                          {" "}
                          If you have existing students with "potential" status, click "Sync
                          Existing Students" below.
                        </span>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredStudents.map((student) => (
              <tr
                key={student._id}
                onClick={() => setSelectedStudent(student)}
                className="clickable-row"
              >
                <td
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="checkbox-cell"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student._id)}
                    onChange={() => toggleSelect(student._id)}
                    className="row-checkbox"
                  />
                </td>
                <td className="student-id-cell">
                  {student.studentCode ? (
                    <span
                      className={`student-id-badge ${student.gender?.toLowerCase() || "other"}`}
                    >
                      {student.studentCode}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="name-cell">
                  <div className="student-name">{student.name}</div>
                </td>
                <td className="english-name-cell">{student.englishName || "N/A"}</td>
                <td className="gender-cell">{student.gender || "N/A"}</td>
                <td className="dob-cell">
                  {student.dob ? formatDateMMDDYYYY(student.dob) : "N/A"}
                </td>
                <td className="status-cell">
                  <span className={`status-badge status-${student.status}`}>{student.status}</span>
                </td>
                <td className="parent-name-cell">{student.parentName || "N/A"}</td>
                <td className="parent-phone-cell">{student.parentPhone || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal/Panel */}
      {selectedStudent && (
        <div className="student-details-modal">
          <div className="modal-content">
            <button
              type="button"
              className="close-btn"
              onClick={() => {
                setSelectedStudent(null);
                setIsEditing(false);
                setEditForm({});
              }}
            >
              ×
            </button>
            <h3>Student Details</h3>
            <div className="student-details-grid">
              <div className="detail-item">
                <strong>Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || selectedStudent.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.name}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>English Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.englishName || selectedStudent.englishName || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, englishName: e.target.value }))
                    }
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.englishName || "N/A"}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Email:</strong>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || selectedStudent.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.email}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Phone:</strong>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || selectedStudent.phone || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.phone || "N/A"}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Gender:</strong>
                {isEditing ? (
                  <select
                    value={editForm.gender || selectedStudent.gender || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="edit-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <span>{selectedStudent.gender || "N/A"}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Status:</strong>
                {isEditing ? (
                  <select
                    value={editForm.status || selectedStudent.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="edit-select"
                  >
                    <option value="potential">Potential</option>
                    <option value="contacted">Contacted</option>
                    <option value="studying">Studying</option>
                    <option value="postponed">Postponed</option>
                    <option value="off">Off</option>
                    <option value="alumni">Alumni</option>
                  </select>
                ) : (
                  <span className={`status-badge status-${selectedStudent.status}`}>
                    {selectedStudent.status}
                  </span>
                )}
              </div>
              <div className="detail-item">
                <strong>Parent Name:</strong>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.parentName || selectedStudent.parentName || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, parentName: e.target.value }))
                    }
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.parentName || "N/A"}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Parent Phone:</strong>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.parentPhone || selectedStudent.parentPhone || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, parentPhone: e.target.value }))
                    }
                    className="edit-input"
                  />
                ) : (
                  <span>{selectedStudent.parentPhone || "N/A"}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>Student ID:</strong>
                <span className="locked-field">{selectedStudent.studentCode || "N/A"}</span>
              </div>
              <div className="detail-item full-width">
                <strong>Notes:</strong>
                {isEditing ? (
                  <textarea
                    value={editForm.notes || selectedStudent.notes || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="edit-textarea"
                    rows={3}
                  />
                ) : (
                  <span>{selectedStudent.notes || "No notes"}</span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("skillup_token");
                        const response = await fetch(
                          `${API_BASE_URL}/users/${selectedStudent._id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(editForm),
                          },
                        );

                        if (response.ok) {
                          alert("Student details updated successfully!");
                          setIsEditing(false);
                          setEditForm({});
                          onDataRefresh?.();
                          setSelectedStudent(null);
                        } else {
                          alert("Failed to update student details.");
                        }
                      } catch (error) {
                        console.error("Error updating student:", error);
                        alert("Error updating student details.");
                      }
                    }}
                    className="btn-save"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({});
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm(selectedStudent);
                  }}
                  className="btn-edit"
                >
                  Edit Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="management-actions">
        {selectedIds.length > 0 && (
          <button
            className="btn-primary-action"
            onClick={() => setShowBulkUpdate(true)}
            type="button"
          >
            Update Status
          </button>
        )}
        <button
          className="btn-secondary-action"
          onClick={clearAll}
          disabled={selectedIds.length === 0}
          type="button"
        >
          Clear
        </button>
        <button className="btn-secondary-action" onClick={handleSyncExistingStudents} type="button">
          Sync Existing Students
        </button>
      </div>

      {showBulkUpdate && (
        <div className="potential-students-bulk-section">
          <select
            className="potential-students-select"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Select status...</option>
            <option value="potential">Potential</option>
            <option value="contacted">Contacted</option>
            <option value="studying">Studying (Move to Waiting List)</option>
            <option value="postponed">Postponed (Move to Records)</option>
            <option value="off">Off (Move to Records)</option>
            <option value="alumni">Alumni (Move to Records)</option>
          </select>
          <div className="potential-students-confirm-buttons">
            <button
              className="potential-students-confirm-btn potential-students-confirm-btn-success"
              onClick={handleBulkUpdateStatus}
              disabled={!bulkStatus}
              type="button"
            >
              Confirm
            </button>
            <button
              className="potential-students-confirm-btn potential-students-confirm-btn-cancel"
              onClick={() => {
                setShowBulkUpdate(false);
                setBulkStatus("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotentialStudentsPanel;
