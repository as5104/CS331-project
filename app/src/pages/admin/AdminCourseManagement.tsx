import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { BookOpen, Building2, CalendarRange, ChevronRight, GraduationCap, Layers3, Users } from 'lucide-react';

interface AdminCourseManagementProps {
    onNavigate: (path: string) => void;
}

interface Snapshot {
    courses: number;
    departments: number;
    terms: number;
    enrollments: number;
}

interface RecentCourse {
    id: string;
    code: string;
    name: string;
    department: string | null;
    semester: number | null;
}

export function AdminCourseManagement({ onNavigate }: AdminCourseManagementProps) {
    const [snapshot, setSnapshot] = useState<Snapshot>({
        courses: 0,
        departments: 0,
        terms: 0,
        enrollments: 0,
    });
    const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function load() {
            setLoading(true);
            const [coursesRes, departmentsRes, termsRes, enrollmentsRes, recentRes] = await Promise.all([
                supabase.from('courses').select('id', { count: 'exact', head: true }),
                supabase.from('departments').select('id', { count: 'exact', head: true }),
                supabase.from('academic_terms').select('id', { count: 'exact', head: true }),
                supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
                supabase
                    .from('courses')
                    .select('id, code, name, department, semester')
                    .order('created_at', { ascending: false })
                    .limit(6),
            ]);

            if (!active) return;
            setSnapshot({
                courses: coursesRes.count ?? 0,
                departments: departmentsRes.count ?? 0,
                terms: termsRes.count ?? 0,
                enrollments: enrollmentsRes.count ?? 0,
            });
            setRecentCourses((recentRes.data ?? []) as RecentCourse[]);
            setLoading(false);
        }
        load();
        return () => {
            active = false;
        };
    }, []);

    const cards = [
        {
            label: 'Semesters',
            description: 'Define academic term names such as Winter or Monsoon.',
            icon: CalendarRange,
            path: '/course-management/terms',
            accent: 'from-indigo-500 to-blue-500',
        },
        {
            label: 'Departments',
            description: 'Maintain official departments available for course planning.',
            icon: Building2,
            path: '/course-management/departments',
            accent: 'from-emerald-500 to-teal-500',
        },
        {
            label: 'Courses',
            description: 'Create courses under a department + semester and assign faculty.',
            icon: BookOpen,
            path: '/course-management/courses',
            accent: 'from-fuchsia-500 to-violet-500',
        },
        {
            label: 'Enrollment',
            description: 'Manage student enrollment and section mapping per selected course.',
            icon: Users,
            path: '/course-management/enrollments',
            accent: 'from-amber-500 to-orange-500',
        },
    ];

    return (
        <DashboardLayout title="Course Management" activePath="/course-management" onNavigate={onNavigate}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
                <h2 className="text-3xl font-bold tracking-tight">Course & Enrollment System</h2>
                <p className="mt-2 text-muted-foreground">
                    Configure semesters and departments first, then add courses and complete enrollment.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7"
            >
                {[
                    { label: 'Courses', value: snapshot.courses, icon: GraduationCap, tone: 'text-indigo-600 bg-indigo-100' },
                    { label: 'Departments', value: snapshot.departments, icon: Building2, tone: 'text-emerald-600 bg-emerald-100' },
                    { label: 'Semesters', value: snapshot.terms, icon: Layers3, tone: 'text-violet-600 bg-violet-100' },
                    { label: 'Enrollments', value: snapshot.enrollments, icon: Users, tone: 'text-amber-600 bg-amber-100' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                        <div className={`w-10 h-10 rounded-xl ${stat.tone} flex items-center justify-center mb-2`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-semibold">{loading ? '--' : stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {cards.map((card, idx) => (
                        <button
                            key={card.label}
                            onClick={() => onNavigate(card.path)}
                            className="text-left group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
                        >
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.accent} text-white flex items-center justify-center mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-lg">{card.label}</h3>
                            <p className="mt-1.5 text-sm text-muted-foreground min-h-[40px]">{card.description}</p>
                            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                                Open section
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </div>
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.14 + idx * 0.04, duration: 0.4 }}
                                className="origin-left h-1 mt-4 rounded-full bg-gradient-to-r from-primary/40 to-primary/0"
                            />
                        </button>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="xl:col-span-4 bg-card border border-border rounded-2xl p-5"
                >
                    <h3 className="font-semibold mb-3">Recently Added Courses</h3>
                    {recentCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No courses yet. Start with Departments and Semesters, then add courses.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {recentCourses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() => {
                                        sessionStorage.setItem('adminCourseEnrollmentCourseId', course.id);
                                        onNavigate('/course-management/enrollments');
                                    }}
                                    className="w-full text-left px-3.5 py-3 rounded-xl border border-border hover:bg-muted/40 transition-colors"
                                >
                                    <p className="text-xs font-mono text-muted-foreground">{course.code}</p>
                                    <p className="text-sm font-medium mt-0.5">{course.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {course.department ?? 'No Department'} | Semester {course.semester ?? '-'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
