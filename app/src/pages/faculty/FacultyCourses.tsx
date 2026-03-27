import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
    BookOpen, Users, FileText, Upload, Search,
    ChevronRight, GraduationCap, Clock, X,
    File, CheckCircle2, Loader2,
} from 'lucide-react';

interface FacultyCoursesProps {
    onNavigate: (path: string) => void;
}

interface CourseWithEnrollment {
    id: string;
    code: string;
    name: string;
    credits: number;
    instructor_id: string | null;
    semester: number | null;
    department: string | null;
    description: string | null;
    enrolled_count: number;
}

interface FacultyCourseEnrollmentsApiResponse {
    courses: CourseWithEnrollment[];
    students: any[];
}

export function FacultyCourses({ onNavigate }: FacultyCoursesProps) {
    const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollment | null>(null);

    // Upload Modal
    const [uploadModal, setUploadModal] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Students Modal
    const [studentListModal, setStudentListModal] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const fetchFromFacultyEnrollmentsApi = useCallback(async (courseId?: string): Promise<FacultyCourseEnrollmentsApiResponse | null> => {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return null;

        const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
        const res = await fetch(`/api/faculty-course-enrollments${query}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) return null;
        return await res.json();
    }, []);

    /* Fetch courses assigned to this faculty */
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const apiData = await fetchFromFacultyEnrollmentsApi();
            if (apiData) {
                setCourses(apiData.courses ?? []);
                return;
            }
            setCourses([]);
            setLoadError('Could not load faculty enrollment data. Start the API server and refresh.');
        } finally {
            setLoading(false);
        }
    }, [fetchFromFacultyEnrollmentsApi]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    /* derived */
    const filtered = courses.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const totalStudents = courses.reduce((sum, c) => sum + c.enrolled_count, 0);

    /* View Enrolled Students Handler */
    const handleViewStudents = useCallback(async (course: CourseWithEnrollment) => {
        setSelectedCourse(course);
        setStudentListModal(true);
        setLoadingStudents(true);
        setEnrolledStudents([]);
        setLoadError(null);

        try {
            const apiData = await fetchFromFacultyEnrollmentsApi(course.id);
            if (apiData) {
                if (Array.isArray(apiData.courses) && apiData.courses.length > 0) {
                    setCourses(apiData.courses);
                }
                setEnrolledStudents(Array.isArray(apiData.students) ? apiData.students : []);
                return;
            }
            setEnrolledStudents([]);
            setLoadError('Could not load enrolled students. Start the API server and refresh.');
        } catch (err) {
            console.error('Unhandled JS error in handleViewStudents:', err);
            setLoadError('Failed to load enrollment data. Please retry.');
        } finally {
            setLoadingStudents(false);
        }
    }, [fetchFromFacultyEnrollmentsApi]);

    /* upload handler */
    const handleUpload = () => {
        setUploadSuccess(true);
        setTimeout(() => { setUploadSuccess(false); setUploadModal(false); }, 2000);
    };

    return (
        <DashboardLayout title="My Courses" activePath="/courses" onNavigate={onNavigate}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h2 className="text-2xl font-bold">My Courses</h2>
                <p className="text-muted-foreground mt-1">Manage your assigned courses and upload materials.</p>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Courses', value: courses.length, icon: BookOpen, iconBg: 'bg-purple-100 dark:bg-purple-500/20', iconText: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Total Students', value: totalStudents, icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-500/20', iconText: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Materials', value: '—', icon: FileText, iconBg: 'bg-emerald-100 dark:bg-emerald-500/20', iconText: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'This Semester', value: courses.filter(c => c.semester).length || courses.length, icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-500/20', iconText: 'text-amber-600 dark:text-amber-400' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className="bg-card rounded-xl border border-border p-4">
                        <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-2`}>
                            <stat.icon className={`w-4 h-4 ${stat.iconText}`} />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
            </motion.div>

            {loadError && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </div>
            )}

            {/* Course Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-xl border border-border p-12 text-center">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-semibold mb-1">No courses found</h3>
                    <p className="text-sm text-muted-foreground">
                        {courses.length === 0
                            ? 'Courses will appear here once admin assigns them.'
                            : 'Try a different search term.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((course, i) => (
                        <motion.div key={course.id}
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.06 }}
                            whileHover={{ y: -2 }}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:border-purple-200 dark:hover:border-purple-700 transition-all cursor-pointer group"
                            onClick={() => handleViewStudents(course)}
                        >
                            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-600" />

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                                        <h4 className="font-semibold text-sm mt-0.5">{course.name}</h4>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="w-3.5 h-3.5" /> {course.credits} Credits
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" /> {course.enrolled_count} Students
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); setUploadModal(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
                                        <Upload className="w-3 h-3" /> Upload Material
                                    </button>
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-lg">
                                        Sem {course.semester || '—'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Upload Material Modal */}
            <AnimatePresence>
                {uploadModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setUploadModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden">

                                <div className="p-5 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">Upload Material</h3>
                                            <p className="text-xs text-muted-foreground">{selectedCourse?.code} — {selectedCourse?.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setUploadModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-5 space-y-4">
                                    <CustomSelect
                                        label="Material Type"
                                        value="Lecture Notes"
                                        onChange={() => { }}
                                        options={[
                                            { value: 'Lecture Notes', label: 'Lecture Notes' },
                                            { value: 'Assignment', label: 'Assignment' },
                                            { value: 'Lab Manual', label: 'Lab Manual' },
                                            { value: 'Reference Material', label: 'Reference Material' },
                                            { value: 'Previous Year Paper', label: 'Previous Year Paper' },
                                        ]}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Title</label>
                                        <input type="text" placeholder="e.g. Week 5 — Trees & Graphs"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer">
                                        <File className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                                        <p className="text-sm font-medium text-muted-foreground">Click or drag file to upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX up to 25 MB</p>
                                    </div>
                                    {uploadSuccess ? (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
                                            <CheckCircle2 className="w-4 h-4" /> Material uploaded successfully!
                                        </motion.div>
                                    ) : (
                                        <button onClick={handleUpload}
                                            className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                            <Upload className="w-4 h-4" /> Upload Material
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* View Students Modal */}
                {studentListModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setStudentListModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

                                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base">Enrolled Students</h3>
                                            <p className="text-xs text-muted-foreground">{selectedCourse?.code} — {selectedCourse?.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setStudentListModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        Total Students: <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{enrolledStudents.length}</span>
                                    </h4>

                                    {loadingStudents ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    ) : enrolledStudents.length === 0 ? (
                                        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                                            <p className="text-sm font-medium">No students enrolled</p>
                                            <p className="text-xs text-muted-foreground mt-1">There are no students assigned to you for this course yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {enrolledStudents.map(student => (
                                                <div key={student.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50 hover:bg-muted/70 transition-colors gap-3">

                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{student.name}</p>
                                                            <p className="text-xs text-muted-foreground">{student.rollNo} • {student.department}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:items-end text-sm">
                                                        {student.section && (
                                                            <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-700/10 dark:ring-purple-400/20 w-max mb-1">
                                                                {student.section.toLowerCase().includes('section') ? student.section : `Section ${student.section}`}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{student.email}</span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                                    <button onClick={() => setStudentListModal(false)}
                                        className="px-4 py-2 font-medium bg-card border border-border hover:bg-muted rounded-lg transition-colors text-sm">
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
