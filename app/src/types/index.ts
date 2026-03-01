// User Roles
export type UserRole = 'student' | 'faculty' | 'admin';

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  institution?: string;
}

// Student specific
export interface Student extends User {
  role: 'student';
  rollNumber: string;
  program: string;
  semester: number;
  cgpa: number;
  attendance: number;
  courses: Course[];
  // Admission fields (set by admin at onboarding)
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  batchYear?: string;
  fatherName?: string;
  motherName?: string;
  guardianContact?: string;
}

// Faculty specific
export interface Faculty extends User {
  role: 'faculty';
  employeeId: string;
  designation: string;
  qualification?: string;
  dateOfJoining?: string;
  courses: Course[];
}

// Admin specific
export interface Admin extends User {
  role: 'admin';
  employeeId: string;
  permissions: string[];
}

// Course Interface
export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester?: number;
  instructor?: string;
  progress?: number;
  grade?: string;
  attendance?: number;
}

// Assignment Interface
export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  marks?: number;
  totalMarks: number;
  description?: string;
  submittedAt?: string;
}

// Notification Interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// Leave Request Interface
export interface LeaveRequest {
  id: string;
  type: 'medical' | 'personal' | 'academic';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[];
}

// Re-evaluation Request Interface
export interface ReevaluationRequest {
  id: string;
  courseId: string;
  courseName: string;
  examType: string;
  reason: string;
  status: 'pending' | 'under_review' | 'completed';
  originalGrade?: string;
  newGrade?: string;
}

// Workflow Interface
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'task' | 'notification';
  assignee?: string;
  sla?: number;
}

// Stats Interface
export interface DashboardStats {
  totalUsers?: number;
  activeWorkflows?: number;
  pendingApprovals?: number;
  systemHealth?: number;
  cgpa?: number;
  attendance?: number;
  pendingTasks?: number;
  notifications?: number;
}

// Announcement Interface
export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'students' | 'faculty' | 'department';
  priority: 'low' | 'medium' | 'high';
  publishedAt: string;
  author: string;
}

// ---------- Admin Onboarding Forms ----------

export interface StudentAdmissionForm {
  // Personal
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  // Academic
  rollNumber: string;
  program: string;
  department: string;
  batchYear: string;
  semester: number;
  institution: string;
  // Guardian
  fatherName: string;
  motherName: string;
  guardianContact: string;
}

export interface FacultyAdmissionForm {
  // Personal
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  // Professional
  employeeId: string;
  department: string;
  designation: 'Assistant Professor' | 'Associate Professor' | 'Professor' | 'Lecturer';
  qualification: string;
  dateOfJoining: string;
  institution: string;
}

// Row returned from Supabase students / faculty tables
export interface StudentRow {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  roll_number: string;
  program: string;
  department: string;
  batch_year: string;
  semester: number;
  cgpa: number;
  attendance: number;
  gender?: string;
  phone?: string;
  institution?: string;
  avatar?: string;
  courses: Course[];
}

export interface FacultyRow {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  employee_id: string;
  department: string;
  designation: string;
  qualification?: string;
  date_of_joining?: string;
  gender?: string;
  phone?: string;
  institution?: string;
  avatar?: string;
  courses: Course[];
}