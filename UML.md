```mermaid
flowchart LR

%% Actors
Student([Student])
Faculty([Faculty])
Admin([Admin])

%% System Boundary
subgraph UniPortal [University]

  Login((Login))
  Signup((Signup))
  Logout((Logout))

  ViewDashboard((View Dashboard))
  UpdateProfile((Update Profile))
  CourseReg((Course Registration))
  ViewAttendance((View Attendance))
  ViewGrades((View Grades & GPA))
  ApplyLeave((Apply for Leave))
  RequestDocs((Request Documents))
  ViewNotifications((View Notifications))

  MarkAttendance((Mark Attendance))
  ManageGrades((Manage Grades))
  UploadMaterial((Upload Study Material))
  CreateAssessments((Create Assessments))
  ApproveRequests((Approve Requests))
  MonitorPerformance((Monitor Performance))
  MessageStudents((Message Students))
  GenerateReports((Generate Reports))

  ManageUsers((Manage all Users))
  AssignRoles((Assign Roles & Permissions))
  ManageCourses((Manage Courses & Departments))
  PublishAnnouncements((Publish Announcements))
  SystemMonitoring((System Monitoring))
  BackupRecovery((Backup & Recovery))

end

%% Associations
Student --> Login
Student --> Signup
Student --> Logout
Student --> ViewDashboard
Student --> UpdateProfile
Student --> CourseReg
Student --> ViewAttendance
Student --> ViewGrades
Student --> ApplyLeave
Student --> RequestDocs
Student --> ViewNotifications

Faculty --> Login
Faculty --> Logout
Faculty --> MarkAttendance
Faculty --> ManageGrades
Faculty --> UploadMaterial
Faculty --> CreateAssessments
Faculty --> ApproveRequests
Faculty --> MonitorPerformance
Faculty --> MessageStudents
Faculty --> GenerateReports

Admin --> Login
Admin --> Logout
Admin --> ManageUsers
Admin --> AssignRoles
Admin --> ManageCourses
Admin --> PublishAnnouncements
Admin --> SystemMonitoring
Admin --> BackupRecovery

%% Include / Extend
ViewDashboard -.-> ViewNotifications
ManageGrades -.-> MonitorPerformance
ApplyLeave -.-> ApproveRequests
RequestDocs -.-> ApproveRequests