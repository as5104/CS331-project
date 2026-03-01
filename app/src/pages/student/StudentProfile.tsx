import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Student } from '@/types';
import {
  User, Mail, Phone, Calendar, BookOpen,
  GraduationCap, Award, Users,
  Hash, Building, Layers, Clock, CheckCircle2,
  Droplets,
} from 'lucide-react';

interface StudentProfileProps {
  onNavigate: (path: string) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return dateStr; }
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value?: string | number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export function StudentProfile({ onNavigate }: StudentProfileProps) {
  const { user } = useAuth();
  const student = user as Student;
  const studentCourses = Array.isArray(student?.courses) ? student.courses : [];
  const [activeTab, setActiveTab] = useState<'personal' | 'academic'>('personal');

  // Build semester history based on actual current semester
  const currentSem = student?.semester ?? 1;
  const semesterHistory = Array.from({ length: currentSem }, (_, i) => ({
    semester: `Semester ${i + 1}`,
    status: i + 1 < currentSem ? 'completed' : 'ongoing',
    sgpa: i + 1 < currentSem ? '—' : 'In Progress',
    credits: '—',
  }));

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic Details', icon: GraduationCap },
  ];

  return (
    <DashboardLayout title="My Profile" activePath="/profile" onNavigate={onNavigate}>

      {/* ── Profile Hero ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 sm:p-8 text-white mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            <img
              src={student?.avatar || `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(student?.name ?? 'student')}`}
              alt={student?.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white/30 shadow-xl object-cover"
            />
          </motion.div>

          {/* Key Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{student?.name}</h2>
            <p className="text-white/80 mb-3 font-mono text-sm">{student?.rollNumber || '—'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              {student?.program && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{student.program}</span>
              )}
              {student?.department && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{student.department}</span>
              )}
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Semester {student?.semester ?? 1}
              </span>
              {student?.batchYear && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Batch {student.batchYear}</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {student?.email}
              </span>
              {student?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {student.phone}
                </span>
              )}
            </div>
          </div>

          {/* CGPA */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-center bg-white/10 rounded-2xl px-6 py-4">
              <p className="text-4xl sm:text-5xl font-bold">
                {student?.cgpa > 0 ? student.cgpa.toFixed(2) : '—'}
              </p>
              <p className="text-white/70 text-sm mt-1">Current CGPA</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <p className="text-xl font-bold">
                {student?.attendance > 0 ? `${student.attendance}%` : '—'}
              </p>
              <p className="text-white/70 text-xs mt-0.5">Attendance</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Personal Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <InfoRow icon={User} label="Full Name" value={student?.name} />
                <InfoRow icon={Mail} label="University Email" value={student?.email} />
                <InfoRow icon={Phone} label="Phone Number" value={student?.phone} />
                <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(student?.dateOfBirth)} />
                <InfoRow icon={User} label="Gender" value={student?.gender} />
                <InfoRow icon={Droplets} label="Blood Group" value={student?.bloodGroup} />
              </div>
            </motion.div>

            {/* Guardian Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                Guardian Information
              </h3>
              <div className="space-y-3">
                <InfoRow icon={User} label="Father's Name" value={student?.fatherName} />
                <InfoRow icon={User} label="Mother's Name" value={student?.motherName} />
                <InfoRow icon={Phone} label="Guardian Contact" value={student?.guardianContact} />
              </div>

              {/* Institution */}
              <h3 className="font-semibold flex items-center gap-2 mb-4 mt-6">
                <Building className="w-5 h-5 text-primary" />
                Institution
              </h3>
              <div className="space-y-3">
                <InfoRow icon={Building} label="Institution" value={student?.institution} />
                <InfoRow icon={Hash} label="Roll Number" value={student?.rollNumber} />
              </div>
            </motion.div>

          </div>
        )}

        {/* Academic Tab */}
        {activeTab === 'academic' && (
          <div className="space-y-6">

            {/* Academic Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Program', value: student?.program || '—', icon: GraduationCap, color: 'blue' },
                { label: 'Batch Year', value: student?.batchYear || '—', icon: Calendar, color: 'purple' },
                { label: 'Semester', value: `${student?.semester ?? 1}`, icon: Layers, color: 'amber' },
                { label: 'Department', value: student?.department || '—', icon: BookOpen, color: 'emerald' },
              ].map((item, i) => (
                <motion.div key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-xl border border-border p-4">
                  <div className={`w-9 h-9 rounded-xl bg-${item.color}-100 flex items-center justify-center mb-3`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-sm mt-0.5 truncate">{item.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Current Courses */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Enrolled Courses
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({studentCourses.length} course{studentCourses.length !== 1 ? 's' : ''})
                </span>
              </h3>
              {studentCourses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No courses assigned yet. Faculty will assign courses after enrollment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentCourses.map((course: any, index: number) => (
                    <motion.div key={course.id || course.code}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                      <p className="font-medium text-sm mt-0.5 mb-2">{course.name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{course.credits} Credits</span>
                        <span className={course.grade ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                          {course.grade || 'In Progress'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Semester Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Semester Progress
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {['Semester', 'Status', 'SGPA', 'Credits'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {semesterHistory.map((sem, i) => (
                      <motion.tr key={sem.semester}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                        className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium">{sem.semester}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                            ${sem.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sem.status === 'completed'
                              ? <><CheckCircle2 className="w-3 h-3" /> Completed</>
                              : <><Clock className="w-3 h-3" /> Ongoing</>}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm font-semibold">{sem.sgpa}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{sem.credits}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Academic Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Academic Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'CGPA', value: student?.cgpa > 0 ? student.cgpa.toFixed(2) : '—', color: 'text-primary' },
                  { label: 'Attendance', value: student?.attendance > 0 ? `${student.attendance}%` : '—', color: 'text-emerald-600' },
                  { label: 'Semester', value: String(student?.semester ?? 1), color: 'text-blue-600' },
                  { label: 'Courses', value: String(studentCourses.length), color: 'text-purple-600' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-4 bg-card rounded-xl border border-border/50">
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}