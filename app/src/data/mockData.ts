import type { 
  Assignment, 
  Notification, 
  LeaveRequest, 
  ReevaluationRequest, 
  Course, 
  Workflow,
  Announcement 
} from '@/types';

export const mockAssignments: Assignment[] = [
  {
    id: 'ASG001',
    title: 'Binary Search Tree Implementation',
    courseId: 'CSE301',
    courseName: 'Data Structures',
    deadline: '2026-02-15T23:59:00',
    status: 'pending',
    totalMarks: 100,
    description: 'Implement a binary search tree with insertion, deletion, and traversal operations.',
  },
  {
    id: 'ASG002',
    title: 'SQL Queries Assignment',
    courseId: 'CSE302',
    courseName: 'Database Systems',
    deadline: '2026-02-10T23:59:00',
    status: 'submitted',
    totalMarks: 50,
    submittedAt: '2026-02-09T18:30:00',
    description: 'Write SQL queries for the given database schema.',
  },
  {
    id: 'ASG003',
    title: 'Network Protocol Analysis',
    courseId: 'CSE303',
    courseName: 'Computer Networks',
    deadline: '2026-02-20T23:59:00',
    status: 'graded',
    totalMarks: 75,
    marks: 68,
    description: 'Analyze TCP/IP protocols using Wireshark.',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'NOT001',
    title: 'Assignment Deadline Reminder',
    message: 'Binary Search Tree assignment is due in 2 days.',
    type: 'warning',
    timestamp: '2026-02-13T10:00:00',
    read: false,
  },
  {
    id: 'NOT002',
    title: 'Grade Published',
    message: 'Your Network Protocol Analysis assignment has been graded.',
    type: 'success',
    timestamp: '2026-02-12T14:30:00',
    read: true,
  },
  {
    id: 'NOT003',
    title: 'New Announcement',
    message: 'Mid-semester exam schedule has been published.',
    type: 'info',
    timestamp: '2026-02-11T09:00:00',
    read: false,
  },
  {
    id: 'NOT004',
    title: 'Leave Request Approved',
    message: 'Your leave request for Feb 15-16 has been approved.',
    type: 'success',
    timestamp: '2026-02-10T16:45:00',
    read: true,
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LEV001',
    type: 'medical',
    fromDate: '2026-02-15',
    toDate: '2026-02-16',
    reason: 'Doctor appointment and recovery',
    status: 'approved',
    documents: ['medical_certificate.pdf'],
  },
  {
    id: 'LEV002',
    type: 'personal',
    fromDate: '2026-02-20',
    toDate: '2026-02-20',
    reason: 'Family function',
    status: 'pending',
  },
];

export const mockReevaluationRequests: ReevaluationRequest[] = [
  {
    id: 'REV001',
    courseId: 'CSE302',
    courseName: 'Database Systems',
    examType: 'Mid Semester',
    reason: 'I believe my answers were correct and deserve more marks.',
    status: 'under_review',
    originalGrade: 'B',
  },
];

export const mockCourses: Course[] = [
  {
    id: 'CSE301',
    code: 'CSE301',
    name: 'Data Structures',
    credits: 4,
    semester: 6,
    instructor: 'Dr. Debrup Das',
    progress: 75,
    grade: 'A',
    attendance: 90,
  },
  {
    id: 'CSE302',
    code: 'CSE302',
    name: 'Database Systems',
    credits: 3,
    semester: 6,
    instructor: 'Prof. Robert Brown',
    progress: 60,
    grade: 'B+',
    attendance: 85,
  },
  {
    id: 'CSE303',
    code: 'CSE303',
    name: 'Computer Networks',
    credits: 4,
    semester: 6,
    instructor: 'Dr. Emily Davis',
    progress: 80,
    grade: 'A-',
    attendance: 88,
  },
  {
    id: 'CSE304',
    code: 'CSE304',
    name: 'Operating Systems',
    credits: 4,
    semester: 6,
    instructor: 'Prof. James Wilson',
    progress: 65,
    grade: 'B',
    attendance: 82,
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: 'WF001',
    name: 'Leave Approval Workflow',
    description: 'Standard workflow for student leave requests',
    status: 'active',
    steps: [
      { id: 'S1', name: 'Student Submit', type: 'task' },
      { id: 'S2', name: 'Faculty Review', type: 'approval', assignee: 'Faculty', sla: 24 },
      { id: 'S3', name: 'Admin Approval', type: 'approval', assignee: 'Admin', sla: 48 },
      { id: 'S4', name: 'Notification', type: 'notification' },
    ],
  },
  {
    id: 'WF002',
    name: 'Re-evaluation Workflow',
    description: 'Workflow for exam re-evaluation requests',
    status: 'active',
    steps: [
      { id: 'S1', name: 'Student Apply', type: 'task' },
      { id: 'S2', name: 'Fee Payment', type: 'task' },
      { id: 'S3', name: 'Reviewer Assign', type: 'task', assignee: 'Admin', sla: 72 },
      { id: 'S4', name: 'Evaluation', type: 'task', assignee: 'Faculty', sla: 168 },
      { id: 'S5', name: 'Result Publish', type: 'notification' },
    ],
  },
  {
    id: 'WF003',
    name: 'Assignment Submission',
    description: 'Workflow for assignment submission and grading',
    status: 'active',
    steps: [
      { id: 'S1', name: 'Student Submit', type: 'task' },
      { id: 'S2', name: 'Plagiarism Check', type: 'task', sla: 24 },
      { id: 'S3', name: 'Faculty Review', type: 'approval', assignee: 'Faculty', sla: 72 },
      { id: 'S4', name: 'Grade Entry', type: 'task', assignee: 'Faculty' },
      { id: 'S5', name: 'Notification', type: 'notification' },
    ],
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ANN001',
    title: 'Mid-Semester Examination Schedule',
    content: 'The mid-semester examinations will commence from March 1, 2026. Please check your individual schedules in the student portal.',
    target: 'students',
    priority: 'high',
    publishedAt: '2026-02-10T09:00:00',
    author: 'Dr. Arijit Sen',
  },
  {
    id: 'ANN002',
    title: 'Faculty Development Program',
    content: 'A faculty development program on "Modern Teaching Methodologies" will be held on Feb 20, 2026. All faculty members are encouraged to attend.',
    target: 'faculty',
    priority: 'medium',
    publishedAt: '2026-02-09T14:00:00',
    author: 'Admin Office',
  },
  {
    id: 'ANN003',
    title: 'System Maintenance Notice',
    content: 'The platform will be under maintenance on Feb 18, 2026, from 2:00 AM to 6:00 AM. Please save your work accordingly.',
    target: 'all',
    priority: 'high',
    publishedAt: '2026-02-08T10:00:00',
    author: 'IT Support',
  },
];

// Faculty specific data
export const mockPendingReviews = [
  {
    id: 'REV001',
    studentName: 'John Smith',
    assignmentTitle: 'Binary Search Tree Implementation',
    courseName: 'Data Structures',
    submittedAt: '2026-02-09T18:30:00',
    deadline: '2026-02-10T23:59:00',
  },
  {
    id: 'REV002',
    studentName: 'Emma Wilson',
    assignmentTitle: 'SQL Queries Assignment',
    courseName: 'Database Systems',
    submittedAt: '2026-02-08T14:20:00',
    deadline: '2026-02-10T23:59:00',
  },
  {
    id: 'REV003',
    studentName: 'Michael Brown',
    assignmentTitle: 'Network Protocol Analysis',
    courseName: 'Computer Networks',
    submittedAt: '2026-02-07T20:15:00',
    deadline: '2026-02-10T23:59:00',
  },
];

export const mockFacultyTasks = [
  {
    id: 'TASK001',
    title: 'Review Assignment Submissions',
    description: 'Review pending assignments for Data Structures course',
    priority: 'high',
    dueDate: '2026-02-14',
    completed: false,
  },
  {
    id: 'TASK002',
    title: 'Prepare Lecture Slides',
    description: 'Prepare slides for next week\'s Database Systems lecture',
    priority: 'medium',
    dueDate: '2026-02-16',
    completed: false,
  },
  {
    id: 'TASK003',
    title: 'Submit Attendance Report',
    description: 'Submit monthly attendance report for all courses',
    priority: 'high',
    dueDate: '2026-02-15',
    completed: true,
  },
];

// Admin specific data
export const mockSystemStats = {
  totalUsers: 3247,
  activeStudents: 2850,
  activeFaculty: 312,
  adminStaff: 85,
  activeWorkflows: 156,
  pendingApprovals: 43,
  systemHealth: 98.5,
  uptime: '99.9%',
  cpuUsage: 42,
  memoryUsage: 68,
  diskUsage: 54,
};

export const mockRecentActivities = [
  {
    id: 'ACT001',
    user: 'Ankit Sarkar',
    action: 'Submitted assignment',
    target: 'Binary Search Tree Implementation',
    timestamp: '2026-02-13T10:30:00',
  },
  {
    id: 'ACT002',
    user: 'Dr. Debrup Das',
    action: 'Graded assignment',
    target: 'Network Protocol Analysis',
    timestamp: '2026-02-13T09:15:00',
  },
  {
    id: 'ACT003',
    user: 'Arijit Sen',
    action: 'Published announcement',
    target: 'Mid-Semester Examination Schedule',
    timestamp: '2026-02-13T08:00:00',
  },
  {
    id: 'ACT004',
    user: 'Emma Wilson',
    action: 'Applied for leave',
    target: 'Medical Leave - Feb 15-16',
    timestamp: '2026-02-12T16:45:00',
  },
];

export const mockSystemAlerts = [
  {
    id: 'ALERT001',
    type: 'warning',
    message: 'High CPU usage detected on server node 3',
    timestamp: '2026-02-13T11:00:00',
  },
  {
    id: 'ALERT002',
    type: 'info',
    message: 'Scheduled maintenance in 48 hours',
    timestamp: '2026-02-13T10:00:00',
  },
  {
    id: 'ALERT003',
    type: 'error',
    message: 'Database backup failed on secondary node',
    timestamp: '2026-02-12T23:30:00',
  },
];