# Role Permissions in SKILLUP

## Canonical Role Naming
- Canonical identifiers used by logic and security rules: `admin`, `teacher`, `staff`, `student` (lowercase)
- UI display label may show “Administrator” when the canonical role is `admin`
- Any stored role value of `administrator` should be normalized to `admin`

## Admin
- Log in
- View all users (students, teachers, admins)
- Add new users (students, teachers, admins)
- Edit user information
- Delete users from the app
- Create student, teacher, and admin accounts
- Set default password for new accounts
- Reset any user’s password (if backend implemented)
- Create and manage classes
- Assign students to classes
- Assign classes to levels
- Create and manage levels
- View, create, and manage assignments
- See and manage waiting list
- View dashboard statistics
- Sign out

## Teacher
- Log in
- View students and classes
- Add and edit student accounts
- Assign students to classes
- Create and manage assignments
- View and manage waiting list
- View dashboard statistics
- Sign out

## Student
- Log in
- View assignments
- Submit assignments
- View grades and feedback
- View and edit profile
- Sign out 

## Role Naming Standardization and Migration Notes
- Rationale: historical UI used “Administrator” as a display label and some records persisted this label into the `role` field, while back-end and rules require lowercase `admin`
- Resolution: normalize inputs and persisted records to canonical lowercase values
- Migration: update any `users` documents with `role === "administrator"` to `role = "admin"`
- Script: run in Functions package directory
  - Dry run: `npm run migrate:roles:dry`
  - Execute with backup: `npm run migrate:roles`
- Backup: script writes JSON backups and migration logs under `backups/`
- Impact: aligns Firestore rules and visibility checks; UI continues to show “Administrator” label for `admin`
