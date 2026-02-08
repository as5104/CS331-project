import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockAssignments, mockNotifications, mockCourses } from '@/data/mockData';
import {
  GraduationCap,
  Calendar,
  ClipboardList,
  Bell,
  Clock,
  ChevronRight,
  BookOpen,
  FileText,
  TrendingUp,
  CheckCircle2,
  User,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user } = useAuth();
  const student = user as any;
  const [activeTab, setActiveTab] = useState('all');

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending');
  const unreadNotifications = mockNotifications.filter(n => !n.read);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'submitted': return 'text-blue-600 bg-blue-50';
      case 'graded': return 'text-green-600 bg-green-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout title="Student Dashboard" activePath="/dashboard" onNavigate={onNavigate}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {student?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              {student?.program} • Semester {student?.semester}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Current CGPA"
          value={student?.cgpa || 0}
          suffix="/10"
          icon={GraduationCap}
          trend="up"
          trendValue="+0.3 this sem"
          color="blue"
          delay={0}
        />
        <StatCard
          title="Attendance"
          value={student?.attendance || 0}
          suffix="%"
          icon={Calendar}
          trend="neutral"
          trendValue="On track"
          color="green"
          delay={0.1}
          isPercentage
        />
        <StatCard
          title="Pending Tasks"
          value={pendingAssignments.length}
          icon={ClipboardList}
          trend="down"
          trendValue="2 due soon"
          color="amber"
          delay={0.2}
        />
        <StatCard
          title="Notifications"
          value={unreadNotifications.length}
          icon={Bell}
          trend="up"
          trendValue="New alerts"
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Current Courses</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockCourses.slice(0, 4).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">{course.code}</span>
                        <h4 className="font-medium text-sm mt-0.5">{course.name}</h4>
                      </div>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${course.grade ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {course.grade || 'In Progress'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Att: {course.attendance}%
                      </span>
                      <span>{course.credits} Credits</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Assignments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Recent Assignments</h3>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-muted/50"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                </select>
                <button 
                  onClick={() => onNavigate('/assignments')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {mockAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${getStatusColor(assignment.status)}
                    `}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {assignment.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {assignment.courseName}
                          </p>
                        </div>
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0
                          ${getStatusColor(assignment.status)}
                        `}>
                          {assignment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                        <span>{assignment.totalMarks} Marks</span>
                        {assignment.marks !== undefined && (
                          <span className="text-green-600 font-medium">
                            Scored: {assignment.marks}/{assignment.totalMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Submit Assignment', icon: FileText, color: 'blue', path: '/assignments' },
                { label: 'Apply for Leave', icon: Calendar, color: 'green', path: '/attendance' },
                { label: 'Exam Re-evaluation', icon: TrendingUp, color: 'purple', path: '/reevaluation' },
                { label: 'View Attendance', icon: CheckCircle2, color: 'amber', path: '/view-attendance' },
                { label: 'Calculate CGPA', icon: GraduationCap, color: 'emerald', path: '/cgpa-calculator' },
                { label: 'My Profile', icon: User, color: 'pink', path: '/profile' },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${action.color}-100`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <span className="font-medium text-sm flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              {unreadNotifications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                  {unreadNotifications.length} new
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {mockNotifications.slice(0, 4).map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`
                    p-4 hover:bg-muted/50 transition-colors cursor-pointer
                    ${!notification.read ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                      ${notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'warning' ? 'bg-amber-500' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
                    `} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''} line-clamp-1`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate('/notifications')}
              className="w-full p-3 text-sm text-primary hover:bg-muted/50 transition-colors border-t border-border"
            >
              View All Notifications
            </button>
          </motion.div>

          {/* Academic Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold">Upcoming Events</h3>
            </div>
            <div className="space-y-3">
              {[
                { date: 'Feb 15', event: 'Assignment Deadline', type: 'deadline' },
                { date: 'Feb 20', event: 'Mid-term Exam', type: 'exam' },
                { date: 'Feb 25', event: 'Project Submission', type: 'submission' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-12 text-center">
                    <span className="font-semibold">{item.date.split(' ')[0]}</span>
                    <span className="text-xs text-white/70 block">{item.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-lg px-3 py-2">
                    <span className="text-xs text-white/70 uppercase">{item.type}</span>
                    <p className="font-medium">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}