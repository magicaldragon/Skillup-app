## [Unreleased]
- Fix: Deduplicated filteredRecords and filteredStudents memos in RecordsPanel; resolved no-redeclare lint errors.
- CI: Simplified failure notification step; removed direct secrets context from shell script, using env variables instead for linter compatibility.
- CI: Replaced raw curl failure notification with secure script (HMAC signature, retries, tests).
- Frontend: Fixed Biome lint issues in TeacherDashboard (type adapters) and RecordsPanel (duplicate hooks/memos).
- Frontend: Added explicit types in Firebase client initialization.