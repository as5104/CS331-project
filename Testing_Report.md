# Assignment 9

## Q1(a) Test Plan

### 1. Objective
Test the **User Management module** end to end (Admin side) to ensure user onboarding and management are correct and secure.

### 2. Scope (Modules/Features Tested)
- Add Student flow (`UserManagement.tsx` -> `POST /api/create-user`)
- Add Faculty flow (`UserManagement.tsx` -> `POST /api/create-user`)
- Edit Student/Faculty flow (`PATCH /api/manage-user`)
- Delete Student/Faculty flow (`DELETE /api/manage-user`)
- Admin authorization checks for create/edit/delete
- Multi-step form validation and generated credentials

### 3. Types of Testing
- Unit/logic testing (form progression rules, payload checks)
- Integration testing (UI + API + Supabase Auth + profile tables)
- System testing (full admin workflow from add to edit to delete)

### 4. Tools Used
- Manual testing in Chrome
- Browser DevTools (Network + Console)
- Supabase table checks (`students`, `faculty`, `admins`, auth users)
- API response logs from local server

### 5. Entry Criteria
- Frontend and API are running
- Admin account is logged in
- Supabase connection is active
- `departments` data exists for onboarding

### 6. Exit Criteria
- At least 8 User Management test cases executed
- Core create/edit/delete paths validated
- Minimum 3 defects documented with severity and suggested fix

---

## Q1(b) Test Cases (Major Module: User Management)

| Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| TC-UM-01 | Create new student (valid flow) | Full valid student form + generated credentials | Student account created in Auth + `students` table row created | Created successfully and listed in table | Pass |
| TC-UM-02 | Create new faculty (valid flow) | Full valid faculty form + generated credentials | Faculty account created in Auth + `faculty` table row created | Created successfully and listed in table | Pass |
| TC-UM-03 | Multi-step validation (student form) | Keep required fields empty in current step | Next button must stay disabled | Next stayed disabled | Pass |
| TC-UM-04 | Non-admin access to create user | Call `POST /api/create-user` using non-admin token | Request should be rejected with 403 | API returned 403 (Only admins can create users) | Pass |
| TC-UM-05 | Edit student with valid values | Update program/department/semester(5)/phone no. | Student row updates successfully | Update applied and shown after refresh | Pass |
| TC-UM-06 | Edit student semester out of range | `semester = 13` via `PATCH /api/manage-user` | Reject request with validation error | Rejected with semester range error | Pass |
| TC-UM-07 | Create user with duplicate roll/employee ID | Reuse existing roll number/employee ID  or email id | User should get clear friendly duplicate message | complex backend db message | Fail |
| TC-UM-08 | Edit user with invalid phone format | Save phone no. like `abcxyz` | UI/API should block invalid phone value | Update accepted and saved invalid value | Fail |

---

## Q2(a) Test Execution Results + Evidence

### Execution Summary
- Total executed: **8**
- Passed: **6**
- Failed: **2**

---

## Q2(b) Defect Analysis (3 Bugs)

### Bug 1
- **Bug ID:** BUG-UM-01  
- **Description:** Duplicate user create (same roll number/employee ID) does not show a clean user-friendly error.  
- **Steps to Reproduce:**  
  1. Open User Management as Admin.  
  2. Create a student/faculty using an already existing roll number or employee ID or email id.  
  3. Submit form.  
- **Expected vs Actual:**  
  - Expected: Clear message like "Roll number already exists" / "Employee ID already exists" / "Email ID already exists".  
  - Actual: Technical/raw database style error message is shown.  
- **Severity:** Medium  
- **Suggested Fix:** Catch unique-key errors in API and return clean business messages.

### Bug 2
- **Bug ID:** BUG-UM-02  
- **Description:** Invalid phone values (letters/special text) are accepted in edit flow.  
- **Steps to Reproduce:**  
  1. Edit any student/faculty.  
  2. Enter phone as `abcxyz` or similar invalid value.  
  3. Save changes.  
- **Expected vs Actual:**  
  - Expected: Validation should block non-numeric/invalid phone format.  
  - Actual: Value gets saved.  
- **Severity:** Medium  
- **Suggested Fix:** Add frontend + API phone format validation (digits + length checks).

### Bug 3
- **Bug ID:** BUG-UM-03  
- **Description:** Server-side create API does not strictly validate profile field completeness if called directly (outside UI).  
- **Steps to Reproduce:**  
  1. Send direct `POST /api/create-user` as admin with empty profile sub-fields.  
  2. Keep only minimum top-level keys (`email`, `password`, `role`, `profile`).  
  3. Submit request.  
- **Expected vs Actual:**  
  - Expected: API should reject incomplete profile data.  
  - Actual: API can proceed until DB-level failure or create incomplete/weak data path.  
- **Severity:** High  
- **Suggested Fix:** Add strict backend schema validation for required profile fields before insert.

---

## Final Note
This report is prepared using the current implemented User Management module files:
- `app/src/pages/admin/UserManagement.tsx`
- `app/api/create-user.js`
- `app/api/manage-user.js`