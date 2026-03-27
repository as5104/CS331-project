import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Login } from '@/pages/Login';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { SubmitAssignment } from '@/pages/student/SubmitAssignment';
import { ExamReevaluation } from '@/pages/student/ExamReevaluation';
import { LeaveRequest } from '@/pages/student/LeaveRequest';
import { ViewAttendance } from '@/pages/student/ViewAttendance';
import { CGPACalculator } from '@/pages/student/CGPACalculator';
import { Notifications } from '@/pages/student/Notifications';

// Faculty Pages
import { FacultyDashboard } from '@/pages/faculty/FacultyDashboard';
import { FacultyProfile } from '@/pages/faculty/FacultyProfile';
import { FacultyCourses } from '@/pages/faculty/FacultyCourses';
import { FacultyReviewAssignments } from '@/pages/faculty/FacultyReviewAssignments';
import { FacultyAttendance } from '@/pages/faculty/FacultyAttendance';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProfile } from '@/pages/admin/AdminProfile';
import { UserManagement } from '@/pages/admin/UserManagement';
import { AdminWorkflows } from '@/pages/admin/AdminWorkflows';
import { AdminMonitor } from '@/pages/admin/AdminMonitor';
import { AdminAnnouncements } from '@/pages/admin/AdminAnnouncements';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminCourseManagement } from '@/pages/admin/AdminCourseManagement';
import { AccountSettings } from '@/pages/shared/AccountSettings';

import type { UserRole } from '@/types';

type PageRoute =
  | '/login'
  | '/dashboard'
  | '/profile'
  | '/courses'
  | '/assignments'
  | '/attendance'
  | '/notifications'
  | '/review'
  | '/users'
  | '/workflows'
  | '/monitor'
  | '/announcements'
  | '/settings'
  | '/submit-assignment'
  | '/reevaluation'
  | '/leave-request'
  | '/view-attendance'
  | '/cgpa-calculator'
  | '/course-management';

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    return (sessionStorage.getItem('currentPage') as PageRoute) || '/dashboard';
  });

  const handleLogin = () => {
    setCurrentPage('/dashboard');
    sessionStorage.setItem('currentPage', '/dashboard');
  };

  const handleNavigate = (path: string) => {
    setCurrentPage(path as PageRoute);
    sessionStorage.setItem('currentPage', path);
  };

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    const role = user?.role as UserRole;

    switch (currentPage) {
      // Dashboard
      case '/dashboard':
        if (role === 'student') return <StudentDashboard onNavigate={handleNavigate} />;
        if (role === 'faculty') return <FacultyDashboard onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      // Student Routes
      case '/profile':
        if (role === 'student') return <StudentProfile onNavigate={handleNavigate} />;
        if (role === 'faculty') return <FacultyProfile onNavigate={handleNavigate} />;
        return <AdminProfile onNavigate={handleNavigate} />;

      case '/courses':
        if (role === 'student') return <StudentProfile onNavigate={handleNavigate} />;
        if (role === 'faculty') return <FacultyCourses onNavigate={handleNavigate} />;
        return <AdminCourseManagement onNavigate={handleNavigate} />;

      case '/course-management':
        if (role === 'admin') return <AdminCourseManagement onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/assignments':
        if (role === 'student') return <SubmitAssignment onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/submit-assignment':
        if (role === 'student') return <SubmitAssignment onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/reevaluation':
        if (role === 'student') return <ExamReevaluation onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/attendance':
        if (role === 'student') return <ViewAttendance onNavigate={handleNavigate} />;
        if (role === 'faculty') return <FacultyAttendance onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/leave-request':
        if (role === 'student') return <LeaveRequest onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/view-attendance':
        if (role === 'student') return <ViewAttendance onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/cgpa-calculator':
        if (role === 'student') return <CGPACalculator onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/notifications':
        if (role === 'student') return <Notifications onNavigate={handleNavigate} />;
        if (role === 'faculty') return <Notifications onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      // Faculty Routes
      case '/review':
        if (role === 'faculty') return <FacultyReviewAssignments onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      // Admin Routes
      case '/users':
        if (role === 'admin') return <UserManagement onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/workflows':
        if (role === 'admin') return <AdminWorkflows onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/monitor':
        if (role === 'admin') return <AdminMonitor onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/announcements':
        if (role === 'admin') return <AdminAnnouncements onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;

      case '/settings':
        if (role === 'admin') return <AdminSettings onNavigate={handleNavigate} />;
        return <AccountSettings onNavigate={handleNavigate} />;

      default:
        if (role === 'admin') return <AdminDashboard onNavigate={handleNavigate} />;
        if (role === 'faculty') return <FacultyDashboard onNavigate={handleNavigate} />;
        return <StudentDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isAuthenticated ? currentPage : 'login'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
