# Assignment 8

## Part A (DAL)

### 1) Database and Tables Created

- Database is created in Supabase.
- Required tables are created and available (20 tables total).
- Core tables include: `students`, `faculty`, `admins`, `courses`, `course_enrollments`, `departments`, `academic_terms`, `assignments`, `attendance_records`, `re_evaluations`, `notifications`, and security tables.

### 2) Data Access Layer (DAL) Implemented

DAL is implemented in backend API files and service logic:

- `app/api/create-user.js` -> create student/faculty user in Auth + profile table insert.
- `app/api/manage-user.js` -> update and delete user records.
- `app/api/password-reset-request-otp.js`
- `app/api/password-reset-verify-otp.js`
- `app/api/password-reset-complete.js` -> password reset data flow.
- `app/server.js` -> server-side routing and DAL integration.
- `app/src/context/AuthContext.tsx` -> login/session + role-based data fetch.

### 3) DAL Operations Completed

- `INSERT`: new users, enrollments, and security logs.
- `SELECT`: role/profile lookup, course/student fetch, OTP/session checks.
- `UPDATE`: user details, password reset completion.
- `DELETE`: user removal from Auth/profile via admin flow.

### 4) Validation and Access Control in DAL

- Admin-protected APIs require valid authorization token.
- Login is allowed only when Auth credentials and role table match.
- OTP must be valid before password reset completion.
- Enrollment checks department/semester rules before DB insert.

### 5) Conclusion

- Database and required tables are created.
- DAL code components are implemented and working.
- CRUD, validation, and access control are integrated in the backend flow.


## Part B (White Box and Black Box Testing)
 
Testing done on implemented modules: Authentication, Password Reset, User Management, Course Enrollment.

### 1) White Box Testing (code-logic based)

| Logic checked (inside code) | Test input | Expected result | Actual result |
|---|---|---|---|
| `AuthContext.login()` success path | Valid email + password + correct selected role | User session is created and correct dashboard opens | Pass |
| Role mismatch branch in `AuthContext.login()` | Valid credentials but wrong role selected | User is signed out and error is shown | Pass |
| OTP validation guard in reset flow | OTP length less than 6 | Verify action stays blocked | Pass |
| Password strength checks (`upper/lower/number/special/min 8`) | Weak password like `abc123` | Reset submit stays disabled | Pass |
| `canProceedFromSection()` in `UserManagement.tsx` | Required fields missing in current step | Next button stays disabled | Pass |
| Batch enrollment re-validation | One selected student has wrong dept/semester | Whole batch insert is blocked with error | Pass |

### 2) Black Box Testing (functionality based)

| Feature tested (user view) | Test input | Expected output | Actual result |
|---|---|---|---|
| Login | Enter correct email/password and role | Login success and dashboard opens | Pass |
| Login failure | Enter wrong password | Error message shown, no login | Pass |
| Password reset OTP | Enter invalid OTP | OTP verification fails with error | Pass |
| Create student by admin | Fill form and submit create user | New account is created with generated university email | Pass |
| Delete user safety | Click delete, cancel in confirmation | User is not deleted | Pass |
| Course enrollment rule | Try enrolling student from wrong dept/semester | Enrollment is rejected | Pass |

### 3) Test Execution Summary

- White Box: 6 executed, 6 passed, 0 failed.  
- Black Box: 6 executed, 6 passed, 0 failed.  
- Conclusion: Part B testing is completed for the implemented backend and connected UI flows.