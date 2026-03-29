## Assignment 7 - BLL, Validation, and Data Transformation Rules

---

## Q1. Core Functional Modules of the BLL & Interaction with the Presentation Layer

The BLL is the middle layer between the UI (React pages) and Supabase (database). The four fully implemented BLL modules are:

---

### Module 1: Authentication & Role-Based Access (`AuthContext.tsx`, `Login.tsx`)

**What it does:** Handles login, session management, and role enforcement.

**BLL Logic:**
- On login, the BLL first authenticates via Supabase Auth (email + password).
- Then it checks the correct role table (`students`, `faculty`, or `admins`) based on the role the user selected on the login screen.
- If the profile does not exist in that table, or the role does not match, the BLL signs the user out and throws an error — the UI never loads.
- On page refresh, the BLL restores the session and resolves the user profile automatically.

**Interaction with UI (Login.tsx):**

```
Login Page (UI)
  └── Step 1: User picks a role (Student / Faculty / Admin)
  └── Step 2: User enters email + password
       |
       | login(email, password, role)  ──> AuthContext (BLL)
                                              |
                                              ├── supabase.auth.signInWithPassword()
                                              ├── Check role table (students / faculty / admins)
                                              ├── Verify role matches selected tab
                                              └── Set user in React context
                                                     |
                                                     v
                                          Role-based Dashboard loads
                                 (StudentDashboard / FacultyDashboard / AdminDashboard)
```

---

### Module 2: Password Reset Flow (`ForgotPasswordModal.tsx`, `/api/password-reset-*`)

**What it does:** Lets users securely reset their password using an OTP sent to their recovery email.

**BLL Logic (3-step flow):**

```
Step 1 – Email Submitted
  └── POST /api/password-reset-request-otp
       └── Validates university email exists -> sends OTP to recovery email

Step 2 – OTP Entered
  └── POST /api/password-reset-verify-otp
       └── Verifies 6-digit OTP -> grants reset session if valid

Step 3 – New Password Set
  └── POST /api/password-reset-complete
       └── Validates password strength -> updates in Supabase Auth
```

**Interaction with UI:**
- UI displays different form steps (`email -> otp -> reset -> done`) based on which BLL step passes.
- The "Set New Password" button is disabled unless all password rules pass (checked live in the UI using `getPasswordChecks()`):
  - Uppercase + Lowercase + Number + Special character + Minimum 8 chars
  - Confirm password must match exactly.
- Errors from the BLL API (wrong OTP, weak password) are shown as inline error messages on the UI.

---

### Module 3: User Management (`UserManagement.tsx`, `/api/create-user`, `/api/manage-user`)

**What it does:** Admin can create, edit, and delete student and faculty accounts. This is a full-stack flow using a secure backend API.

**BLL Logic:**

**Creating a User:**
- Admin fills a multi-step form (Personal -> Academic -> Guardian -> Credentials).
- The BLL auto-generates the email from Roll Number or Employee ID (e.g., `cs2026001@university.edu`) and generates a random secure password (uppercase + lowercase + digit + special char, 12 chars).
- On submit, the BLL posts to `/api/create-user` with the admin's session token as authorization.
- The API creates the user in Supabase Auth AND inserts the profile row in the correct table (`students` or `faculty`).

**Editing a User:**
- Admin clicks Edit -> fills in updated fields.
- BLL calls `PATCH /api/manage-user` with the session token for authorization.
- Only allowed profile fields are updated (not email/password via this form).

**Deleting a User:**
- A confirmation modal is shown first.
- BLL calls `DELETE /api/manage-user` — removes the user from both Supabase Auth and the role table.

**Interaction with UI:**
```
Admin UI (UserManagement.tsx)
  └── Add Student / Faculty button -> multi-step modal form
       |
       | POST /api/create-user (with Bearer token)
       v
  Backend BLL (server.js / api/create-user)
       ├── Validates admin session token
       ├── Creates Supabase Auth user
       └── Inserts profile in students / faculty table
              |
              v
  User list refreshes automatically on UI
```

---

### Module 4: Course & Enrollment Management (`AdminCourseEnrollStudents.tsx`, `AdminCourseEditor.tsx`, Supabase)

**What it does:** Admin creates courses under departments/terms and enrolls students — with strict business rules enforced by the BLL.

**BLL Logic:**

**Course Creation (`AdminCourseEditor.tsx`):**
- Courses are linked to a `department` and an `academic_term` in Supabase.
- Course code, name, credits, and semester must be entered. The BLL uses this metadata to filter eligible students during enrollment.

**Enrollment (`AdminCourseEnrollStudents.tsx`):**
- When a course is selected, the BLL loads all students and automatically filters out:
  - Students already enrolled in the course.
  - Students from a different **department** than the course.
  - Students in a different **semester** than the course.
- Admin can enroll individually or in batch (with optional section + section faculty assignment).
- Before batch enrollment, the BLL re-validates every selected student against semester and department rules — if any mismatch, enrollment is blocked with an error.

**Interaction with UI:**
```
Admin selects a Course (UI)
       |
       v
BLL filters: eligible students only
  ├── Exclude already-enrolled students
  ├── Match department (course dept == student dept)
  └── Match semester (course sem == student sem)
       |
       v
UI shows filtered student list

Admin clicks "Enroll" (single or batch)
       |
       v
BLL re-validates each student -> supabase.insert into course_enrollments
```

---

## Q2. A) Business Rules Implementation

| Module | Business Rule |
|---|---|
| **Authentication** | Login requires both valid Supabase Auth credentials AND a matching profile in the correct role table. Wrong role tab → access denied. |
| **Authentication** | A user's role is permanently determined by which table (`students`, `faculty`, `admins`) their profile exists in. They cannot self-select a different role. |
| **Password Reset** | OTP must be 6 digits. Verify button is disabled until exactly 6 digits are entered. |
| **Password Reset** | New password must contain uppercase, lowercase, number, special character, and be ≥8 characters. Reset is blocked until all conditions pass. |
| **Password Reset** | Confirm password must match exactly before the "Set New Password" button is enabled. |
| **User Management** | Only admin-authenticated requests (valid Bearer token) can create, edit, or delete users. No unauthenticated access allowed. |
| **User Management** | Email for a new student/faculty is auto-generated from their Roll Number / Employee ID. Admin cannot enter arbitrary emails. |
| **User Management** | Deleting a user requires an explicit confirmation step before the BLL proceeds. |
| **Course Enrollment** | Only students matching the course's **department** can be enrolled. |
| **Course Enrollment** | Only students matching the course's **semester** can be enrolled. |
| **Course Enrollment** | Already-enrolled students are automatically excluded from the available list — duplicate enrollment is prevented. |
| **Course Enrollment** | Batch enrollment validates all selected students before inserting — if any student fails the department/semester check, the entire batch is blocked. |

---

## Q2. B) Validation Logic

Yes, validation is implemented across all 4 modules.

### Authentication (`AuthContext.tsx`)
- Email + password validated by Supabase Auth (wrong credentials -> error).
- After auth, a check is made: does a profile exist in the selected role's table?
  - If not: BLL signs out the user and throws -> *"No student profile found. Contact your administrator."*
- Role cross-check: if the account exists as a faculty but the user selected "student" -> BLL throws error message.

### Password Reset (`ForgotPasswordModal.tsx`/`ChangePasswordModal.tsx`)
```
OTP input: only digits allowed, maxLength = 6. Verify disabled until length == 6, 
and also checks entered OTP is valid or not.

New Password strength check (live, per keystroke):
  hasUppercase: /[A-Z]/.test(password)
  hasLowercase: /[a-z]/.test(password)
  hasNumber:    /\d/.test(password)
  hasSpecial:   /[!@#$%...]/  .test(password)
  hasMinLength: password.length >= 8

isPasswordStrong = all 5 checks pass
isConfirmMatch   = confirmPassword === newPassword && confirmPassword.length > 0

Submit enabled only when: isPasswordStrong AND isConfirmMatch
```

### User Management (`UserManagement.tsx`)
- `canProceedFromSection()` checks required fields before allowing the user to move to the next step in the multi-step form:
  - **Personal section:** name, date of birth, phone, gender must be filled.
  - **Academic section (student):** roll number, program, department, batch year required.
  - **Academic section (faculty):** employee ID, department, designation, qualification, joining date required.
  - **Credentials section:** generated email and password must exist.
- The "Next" button is disabled if the current section is incomplete.

### Course Enrollment (`AdminCourseEnrollStudents.tsx`)
- `availableStudents` is computed using `useMemo` — it filters students in real-time:
  - `enrolledIds.has(student.id)` -> exclude already-enrolled.
  - `student.semester !== selectedCourse.semester` -> exclude wrong semester.
  - `normalizeText(student.department) !== normalizeText(selectedCourseDepartment)` -> exclude wrong department.
- On batch enroll, the BLL repeats the same checks for every selected student before inserting into Supabase.

---

## Q2. C) Data Transformation

Data from Supabase (raw DB rows) is transformed into clean TypeScript objects before being used by the UI.

### 1. Row Mappers in `AuthContext.tsx`

Supabase returns snake_case columns with raw types. Three mapper functions convert them:

| DB (snake_case / raw type) | App Object (camelCase / correct type) |
|---|---|
| `auth_user_id` | `id` |
| `roll_number` | `rollNumber` |
| `date_of_birth` | `dateOfBirth` |
| `father_name` | `fatherName` |
| `"6"` (string from DB) | `6` (cast via `Number()`) |
| `null` / `undefined` | sensible default (e.g., `[]` for arrays, `0` for numbers) |
| `avatar: null` (admin) | auto-generated DiceBear URL using the user's name |

These mappers (`mapStudentRow`, `mapFacultyRow`, `mapAdminRow`) run right after the DB fetch — the UI never sees raw DB data.

### 2. Email Generation in `UserManagement.tsx`
Admin enters a Roll Number or Employee ID. The BLL transforms it into a university email before creating the account:
```
generateStudentEmail("CS2026001") -> "cs2026001@university.edu"
generateFacultyEmail("FAC2016001") -> "fac2016001@university.edu"
```

### 3. Relation Flattening in `AdminCourseEnrollStudents.tsx`
Supabase joins (`academic_terms`, `departments`) can return arrays or single objects depending on the query. The `getRelationOne()` helper normalizes them:
```javascript
// If Supabase returns an array for a joined relation (common bug), take first item:
getRelationOne(row.academic_terms) -> single AcademicTerm object or null
getRelationOne(row.departments)    -> single Department object or null
```
This ensures the UI always gets a consistent object and never crashes on `array.name`.

### 4. Date Formatting in `UserManagement.tsx`
Dates selected from the date picker (JavaScript `Date` objects) are converted to `'yyyy-MM-dd'` strings using `date-fns format()` before being sent to the Supabase DB:
```
Date object -> format(date, 'yyyy-MM-dd') -> "2003-08-15"
```

### 5. Semester Type Conversion
In edit forms, the semester field comes as a string from the dropdown but must be stored as a number:
```
String("5") -> Number(studentEditForm.semester) -> 5
```
This prevents type mismatches when the DB expects an integer.

---