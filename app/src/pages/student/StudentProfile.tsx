import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface StudentProfileProps {
  onNavigate: (path: string) => void;
}

export function StudentProfile({ onNavigate }: StudentProfileProps) {
  const { user } = useAuth();
  const student = user as any;
  const studentCourses = Array.isArray(student?.courses) ? student.courses : [];
  const [activeTab, setActiveTab] = useState<'personal' | 'academic'>('personal');

  const academicHistory = [
    { semester: 'Semester 1', sgpa: 8.2, credits: 20, status: 'completed' },
    { semester: 'Semester 2', sgpa: 8.5, credits: 22, status: 'completed' },
    { semester: 'Semester 3', sgpa: 8.3, credits: 21, status: 'completed' },
    { semester: 'Semester 4', sgpa: 8.7, credits: 23, status: 'completed' },
    { semester: 'Semester 5', sgpa: 8.6, credits: 21, status: 'completed' },
    { semester: 'Semester 6', sgpa: '-', credits: 20, status: 'ongoing' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout title="My Profile" activePath="/profile" onNavigate={onNavigate}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8 text-white mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <img
              src={student?.avatar}
              alt={student?.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white/30 shadow-xl"
            />
          </motion.div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{student?.name}</h2>
            <p className="text-white/80 mb-2">{student?.rollNumber}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{student?.program}</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Semester {student?.semester}</span>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {student?.email}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {student?.department}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-bold">{student?.cgpa}</p>
              <p className="text-white/70 text-sm">Current CGPA</p>
            </div>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'academic', label: 'Academic Details', icon: GraduationCap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Full Name', value: student?.name, icon: User },
                  { label: 'Email', value: student?.email, icon: Mail },
                  { label: 'Phone', value: '+1 (555) 123-4567', icon: Phone },
                  { label: 'Date of Birth', value: '2002-05-15', icon: Calendar },
                  { label: 'Address', value: '123 University Ave, Campus City', icon: MapPin },
                ].map((field) => (
                  <motion.div
                    key={field.label}
                    variants={itemVariants}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <field.icon className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="font-medium text-sm">{field.value}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>

            {/* Emergency Contact */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Emergency Contact
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Name', value: 'John Johnson (Father)' },
                  { label: 'Phone', value: '+1 (555) 987-6543' },
                  { label: 'Email', value: 'john.sr@email.com' },
                  { label: 'Address', value: '456 Home Street, Hometown' },
                ].map((field) => (
                  <motion.div
                    key={field.label}
                    variants={itemVariants}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="font-medium text-sm">{field.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* Current Semester */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Current Semester Courses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {studentCourses.map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-muted/50 rounded-xl"
                  >
                    <p className="text-xs text-muted-foreground">{course.code}</p>
                    <p className="font-medium text-sm mb-2">{course.name}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{course.credits} Credits</span>
                      <span className={course.grade ? 'text-green-600 font-medium' : 'text-amber-600'}>
                        {course.grade || 'In Progress'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Academic History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Academic History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Semester</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Credits</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">SGPA</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {academicHistory.map((sem, index) => (
                      <motion.tr
                        key={sem.semester}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-6 py-3 text-sm font-medium">{sem.semester}</td>
                        <td className="px-6 py-3 text-sm">{sem.credits}</td>
                        <td className="px-6 py-3 text-sm font-semibold">{sem.sgpa}</td>
                        <td className="px-6 py-3">
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                            ${sem.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'}
                          `}>
                            {sem.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {sem.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* CGPA Calculation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                CGPA Calculation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-card rounded-xl">
                  <p className="text-3xl font-bold text-primary">{student?.cgpa}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current CGPA</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl">
                  <p className="text-3xl font-bold text-green-600">127</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Credits</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">5</p>
                  <p className="text-xs text-muted-foreground mt-1">Semesters</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">A</p>
                  <p className="text-xs text-muted-foreground mt-1">Grade</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}