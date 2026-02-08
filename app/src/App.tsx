import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Login } from '@/pages/Login';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { SubmitAssignment } from '@/pages/student/SubmitAssignment';
import { ExamReevaluation } from '@/pages/student/ExamReevaluation';
import { LeaveRequest } from '@/pages/student/LeaveRequest';
import { ViewAttendance } from '@/pages/student/ViewAttendance';
import { CGPACalculator } from '@/pages/student/CGPACalculator';
import { Notifications } from '@/pages/student/Notifications';
// import { FacultyDashboard } from '@/pages/faculty/FacultyDashboard';
// import { AdminDashboard } from '@/pages/admin/AdminDashboard';
// import { PlaceholderPage } from '@/pages/PlaceholderPage';
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
  | '/cgpa-calculator';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageRoute>('/dashboard');

  const handleLogin = () => {
    setCurrentPage('/dashboard');
  };

  const handleNavigate = (path: string) => {
    setCurrentPage(path as PageRoute);
  };

  const renderPage = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    const role = user?.role as UserRole;

    switch (currentPage) {
      case '/dashboard':
        if (role === 'student') {
          return <StudentDashboard onNavigate={handleNavigate} />;
        } else if (role === 'faculty') {
          return <FacultyDashboard onNavigate={handleNavigate} />;
        } else {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }

      // Student Routes
      case '/profile':
        if (role === 'student') {
          return <StudentProfile onNavigate={handleNavigate} />;
        }
        return (
          <PlaceholderPage
            title="My Profile"
            description="View and manage your personal information."
            activePath="/profile"
            onNavigate={handleNavigate}
          />
        );

      case '/courses':
        if (role === 'student') {
          return <StudentProfile onNavigate={handleNavigate} />;
        }
        return (
          <PlaceholderPage
            title="Course Management"
            description="Manage your courses and materials."
            activePath="/courses"
            onNavigate={handleNavigate}
          />
        );

      case '/assignments':
        if (role === 'student') {
          return <SubmitAssignment onNavigate={handleNavigate} />;
        }
        return (
          <PlaceholderPage
            title="Assignments"
            description="Create, manage, and grade student assignments."
            activePath="/assignments"
            onNavigate={handleNavigate}
          />
        );

      case '/submit-assignment':
        if (role === 'student') {
          return <SubmitAssignment onNavigate={handleNavigate} />;
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/reevaluation':
        if (role === 'student') {
          return <ExamReevaluation onNavigate={handleNavigate} />;
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/attendance':
        if (role === 'student') {
          return <ViewAttendance onNavigate={handleNavigate} />;
        }
        return (
          <PlaceholderPage
            title="Attendance"
            description="Mark and manage student attendance."
            activePath="/attendance"
            onNavigate={handleNavigate}
          />
        );

      case '/leave-request':
        if (role === 'student') {
          return <LeaveRequest onNavigate={handleNavigate} />;
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/view-attendance':
        if (role === 'student') {
          return <ViewAttendance onNavigate={handleNavigate} />;
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/notifications':
        if (role === 'student') {
          return <Notifications onNavigate={handleNavigate} />;
        }
        return (
          <PlaceholderPage
            title="Notifications"
            description="View all notifications and announcements."
            activePath="/notifications"
            onNavigate={handleNavigate}
          />
        );

      case '/cgpa-calculator':
        if (role === 'student') {
          return <CGPACalculator onNavigate={handleNavigate} />;
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      // Faculty Routes
      case '/review':
        if (role === 'faculty') {
          return (
            <PlaceholderPage
              title="Review Assignments"
              description="Review and grade student assignment submissions."
              activePath="/review"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      // Admin Routes
      case '/users':
        if (role === 'admin') {
          return (
            <PlaceholderPage
              title="User Management"
              description="Onboard new users, manage roles and permissions."
              activePath="/users"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/workflows':
        if (role === 'admin') {
          return (
            <PlaceholderPage
              title="Workflow Configuration"
              description="Configure and manage administrative workflows."
              activePath="/workflows"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/monitor':
        if (role === 'admin') {
          return (
            <PlaceholderPage
              title="System Monitoring"
              description="Monitor system performance and manage alerts."
              activePath="/monitor"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/announcements':
        if (role === 'admin') {
          return (
            <PlaceholderPage
              title="Announcements"
              description="Create and publish announcements."
              activePath="/announcements"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      case '/settings':
        if (role === 'admin') {
          return (
            <PlaceholderPage
              title="System Settings"
              description="Configure system settings and integrations."
              activePath="/settings"
              onNavigate={handleNavigate}
            />
          );
        }
        return <StudentDashboard onNavigate={handleNavigate} />;

      default:
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