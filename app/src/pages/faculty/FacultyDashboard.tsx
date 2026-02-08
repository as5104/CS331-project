import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockPendingReviews, mockFacultyTasks, mockCourses } from '@/data/mockData';
import {
  ClipboardCheck,
  Users,
  BookOpen,
  CheckSquare,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  MoreHorizontal,
  User,
  Check,
} from 'lucide-react';

interface FacultyDashboardProps {
  onNavigate: (path: string) => void;
}

export function FacultyDashboard({ onNavigate }: FacultyDashboardProps) {
  const { user } = useAuth();
  const faculty = user as any;
  const [tasks, setTasks] = useState(mockFacultyTasks);

  const toggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  };

  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const totalStudents = mockCourses.reduce((acc) => acc + 45, 0); // Mock student count

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout title="Faculty Dashboard" activePath="/dashboard" onNavigate={onNavigate}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {faculty?.name?.split(' ')[0]}! 🎓
            </h2>
            <p className="text-muted-foreground mt-1">
              {faculty?.designation} • {faculty?.department}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
              <Clock className="w-4 h-4" />
              <span>{pendingTasksCount} tasks pending</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Reviews"
          value={mockPendingReviews.length}
          icon={ClipboardCheck}
          trend="up"
          trendValue="3 new today"
          color="amber"
          delay={0}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          trend="neutral"
          trendValue="4 courses"
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="My Courses"
          value={faculty?.courses?.length || 2}
          icon={BookOpen}
          trend="neutral"
          trendValue="This semester"
          color="purple"
          delay={0.2}
        />
        <StatCard
          title="Tasks Due"
          value={pendingTasksCount}
          icon={CheckSquare}
          trend="down"
          trendValue="2 due today"
          color="green"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Pending Assignment Reviews</h3>
              </div>
              <button 
                onClick={() => onNavigate('/review')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Review All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {mockPendingReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                            {review.assignmentTitle}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            by {review.studentName} • {review.courseName}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex-shrink-0">
                          Pending
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Submitted: {new Date(review.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          Due: {new Date(review.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Review
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* My Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">My Courses</h3>
              </div>
              <button 
                onClick={() => onNavigate('/courses')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Manage Courses
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(faculty?.courses || mockCourses.slice(0, 2)).map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">{course.code}</span>
                        <h4 className="font-medium mt-0.5">{course.name}</h4>
                      </div>
                      <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        45 Students
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        4 Assignments
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => onNavigate('/attendance')}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Mark Attendance
                      </button>
                      <button className="flex-1 px-3 py-2 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">
                        Upload Material
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Today's Schedule</h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {[
                { time: '09:00 AM', course: 'Data Structures', room: 'Lab 301', status: 'completed' },
                { time: '11:00 AM', course: 'Algorithms', room: 'Room 205', status: 'ongoing' },
                { time: '02:00 PM', course: 'Database Systems', room: 'Lab 302', status: 'upcoming' },
              ].map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border
                    ${slot.status === 'ongoing' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'}
                    transition-all
                  `}
                >
                  <div className={`
                    w-14 text-center text-sm
                    ${slot.status === 'ongoing' ? 'text-primary font-medium' : 'text-muted-foreground'}
                  `}>
                    {slot.time}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${slot.status === 'ongoing' ? 'text-primary' : ''}`}>
                      {slot.course}
                    </p>
                    <p className="text-xs text-muted-foreground">{slot.room}</p>
                  </div>
                  {slot.status === 'completed' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {slot.status === 'ongoing' && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">My Tasks</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {tasks.filter(t => t.completed).length}/{tasks.length} done
              </span>
            </div>
            <div className="divide-y divide-border">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-muted-foreground hover:border-primary'}
                        transition-colors
                      `}
                    >
                      {task.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${getPriorityColor(task.priority)}
                        `}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">This Week's Activity</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-white/70">Assignments Graded</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">18</p>
                <p className="text-xs text-white/70">Hours Taught</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-white/70">Avg Attendance</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-xs text-white/70">Student Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
