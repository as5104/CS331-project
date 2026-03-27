import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useFacultyCourses } from '@/hooks/useCourses';
import type { Faculty } from '@/types';
import {
    User, Mail, Phone, Calendar, BookOpen,
    GraduationCap, Building, Hash, Award,
    Briefcase, Layers,
} from 'lucide-react';

interface FacultyProfileProps {
    onNavigate: (path: string) => void;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
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
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm truncate">{value || '-'}</p>
            </div>
        </div>
    );
}

export function FacultyProfile({ onNavigate }: FacultyProfileProps) {
    const { user } = useAuth();
    const faculty = user as Faculty;
    const { courses } = useFacultyCourses(faculty?.id);

    return (
        <DashboardLayout title="My Profile" activePath="/profile" onNavigate={onNavigate}>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-6 sm:p-8 text-white mb-6"
            >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <img
                            src={faculty?.avatar || `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(faculty?.name ?? 'faculty')}`}
                            alt={faculty?.name}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white/30 shadow-xl object-cover"
                        />
                    </motion.div>

                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-1">{faculty?.name}</h2>
                        <p className="text-white/80 mb-3 text-sm">{faculty?.designation}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{faculty?.department}</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-mono">{faculty?.employeeId}</span>
                            {faculty?.qualification && (
                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{faculty.qualification}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-white/80">
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {faculty?.email}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="text-center bg-white/10 rounded-2xl px-6 py-4">
                            <p className="text-4xl font-bold">{courses.length}</p>
                            <p className="text-white/70 text-sm mt-1">Courses</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-purple-600" /> Personal Information
                    </h3>
                    <div className="space-y-3">
                        <InfoRow icon={User} label="Full Name" value={faculty?.name} />
                        <InfoRow icon={Mail} label="University Email" value={faculty?.email} />
                        <InfoRow icon={Hash} label="Employee ID" value={faculty?.employeeId} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(faculty?.dateOfBirth)} />
                        <InfoRow icon={User} label="Gender" value={faculty?.gender} />
                        <InfoRow icon={Phone} label="Phone" value={faculty?.phone} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-purple-600" /> Professional Details
                    </h3>
                    <div className="space-y-3">
                        <InfoRow icon={Award} label="Designation" value={faculty?.designation} />
                        <InfoRow icon={Building} label="Department" value={faculty?.department} />
                        <InfoRow icon={GraduationCap} label="Qualification" value={faculty?.qualification} />
                        <InfoRow icon={Calendar} label="Date of Joining" value={formatDate(faculty?.dateOfJoining)} />
                        <InfoRow icon={Building} label="Institution" value={faculty?.institution} />
                        <InfoRow icon={Layers} label="Courses Assigned" value={courses.length} />
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-6 bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Assigned Courses
                    <span className="text-xs font-normal text-muted-foreground ml-1">({courses.length})</span>
                </h3>
                {courses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No courses assigned yet. Admin will assign courses.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {courses.map((course, i) => (
                            <motion.div key={course.id || course.code}
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.35 + i * 0.06 }}
                                className="p-4 bg-muted/50 rounded-xl border border-border hover:border-purple-200 transition-colors">
                                <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                                <p className="font-medium text-sm mt-0.5 mb-2">{course.name}</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{course.credits} Credits</span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                        Sem {course.semester || '-'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
