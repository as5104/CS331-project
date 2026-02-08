import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Percent,
} from 'lucide-react';

interface ViewAttendanceProps {
  onNavigate: (path: string) => void;
}

// Generate mock attendance data
const generateAttendanceData = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: Record<number, string> = {};
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data[day] = 'weekend';
    } else {
      // Random attendance (80% present)
      const rand = Math.random();
      if (rand < 0.75) data[day] = 'present';
      else if (rand < 0.85) data[day] = 'absent';
      else if (rand < 0.95) data[day] = 'late';
      else data[day] = 'holiday';
    }
  }
  
  return data;
};

export function ViewAttendance({ onNavigate }: ViewAttendanceProps) {
  const { user } = useAuth();
  const student = user as any;
  const studentCourses = Array.isArray(student?.courses) ? student.courses : [];
  const courseAttendance = studentCourses.map((course: any) => ({
    ...course,
    present: Math.floor(Math.random() * 10) + 35,
    absent: Math.floor(Math.random() * 5),
    late: Math.floor(Math.random() * 3),
  }));
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const attendanceData = generateAttendanceData(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-amber-500';
      case 'holiday': return 'bg-blue-400';
      default: return 'bg-transparent';
    }
  };

  // Calculate overall stats
  const totalDays = Object.values(attendanceData).filter(s => s !== 'weekend' && s !== 'holiday').length;
  const presentDays = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentDays = Object.values(attendanceData).filter(s => s === 'absent').length;
  const lateDays = Object.values(attendanceData).filter(s => s === 'late').length;
  const monthlyPercentage = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 0;

  return (
    <DashboardLayout title="View Attendance" activePath="/view-attendance" onNavigate={onNavigate}>
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Overall Attendance', value: `${student?.attendance}%`, icon: Percent, color: 'text-blue-600', bgColor: 'bg-blue-50' },
          { label: 'Present Days', value: presentDays, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
          { label: 'Absent Days', value: absentDays, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
          { label: 'Late Entries', value: lateDays, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Attendance Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium min-w-[120px] text-center">
                {monthName} {year}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = attendanceData[day];
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    ${status === 'weekend' ? 'bg-muted/30 text-muted-foreground' : 'bg-muted/50'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  <span className="font-medium">{day}</span>
                  {status !== 'weekend' && status !== 'holiday' && (
                    <div className={`w-2 h-2 rounded-full mt-1 ${getStatusColor(status)}`} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
            {[
              { label: 'Present', color: 'bg-green-500' },
              { label: 'Absent', color: 'bg-red-500' },
              { label: 'Late', color: 'bg-amber-500' },
              { label: 'Holiday', color: 'bg-blue-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Course-wise Attendance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Course-wise Attendance
            </h3>
            
            <div className="space-y-4">
              {courseAttendance.map((course: any, index: number) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{course.attendance}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.attendance || 0}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                      className={`h-full rounded-full ${
                        (course.attendance || 0) >= 75 ? 'bg-green-500' :
                        (course.attendance || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {course.present}
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      {course.absent}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {course.late}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Attendance Alert */}
          {student?.attendance < 75 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 rounded-xl border border-red-100"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 text-sm">Low Attendance Alert</p>
                  <p className="text-xs text-red-600 mt-1">
                    Your attendance is below 75%. Please improve your attendance to avoid academic penalties.
                  </p>
                  <button
                    onClick={() => onNavigate('/attendance')}
                    className="mt-3 text-xs text-red-700 font-medium hover:underline"
                  >
                    Apply for Leave →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Monthly Summary */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Working Days</span>
                <span className="font-medium">{totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Present</span>
                <span className="font-medium">{presentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Absent</span>
                <span className="font-medium">{absentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Late</span>
                <span className="font-medium">{lateDays}</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Monthly %</span>
                  <span className="text-2xl font-bold">{monthlyPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
