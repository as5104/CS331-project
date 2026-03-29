import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Toast, useToast } from '@/components/ui/Toast';
import type { CourseRow, EnrollmentRow, FacultyOption } from '@/lib/adminCourseTypes';
import { ArrowLeft, Loader2, UserPlus, Users, X } from 'lucide-react';

interface AdminCourseEnrollmentsProps {
    onNavigate: (path: string) => void;
}

export function AdminCourseEnrollments({ onNavigate }: AdminCourseEnrollmentsProps) {
    const { toast, flash, dismiss } = useToast();

    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

    const [loadingBase, setLoadingBase] = useState(true);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);

    async function loadBase() {
        setLoadingBase(true);
        const [coursesRes, facultyRes] = await Promise.all([
            supabase
                .from('courses')
                .select(`
                    id,
                    code,
                    name,
                    credits,
                    semester,
                    department,
                    description,
                    instructor_id,
                    term_id,
                    department_id,
                    created_at,
                    academic_terms(id, name, sequence),
                    departments(id, name, code)
                `)
                .order('code'),
            supabase.from('faculty').select('id, name, department').order('name'),
        ]);

        if (coursesRes.error) flash(coursesRes.error.message, 'error');
        if (facultyRes.error) flash(facultyRes.error.message, 'error');

        const courseRows: CourseRow[] = (coursesRes.data ?? []).map((row: any) => ({
            ...row,
            academic_terms: getRelationOne(row.academic_terms),
            departments: getRelationOne(row.departments),
        }));
        setCourses(courseRows);
        setFacultyList((facultyRes.data ?? []) as FacultyOption[]);

        const remembered = sessionStorage.getItem('adminCourseEnrollmentCourseId');
        const validRemembered = remembered && courseRows.some((course) => course.id === remembered);
        const selected = validRemembered ? remembered : courseRows[0]?.id ?? '';
        setSelectedCourseId(selected);
        setLoadingBase(false);
    }

    async function loadEnrollments(courseId: string) {
        if (!courseId) {
            setEnrollments([]);
            return;
        }
        setLoadingEnrollments(true);
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('id, student_id, course_id, section, section_faculty_id, students(name, roll_number, department)')
            .eq('course_id', courseId);
        if (enrollmentsError) flash(enrollmentsError.message, 'error');
        const normalizedEnrollments: EnrollmentRow[] = (enrollmentsData ?? []).map((row: any) => ({
            ...row,
            students: getRelationOne(row.students),
        }));
        setEnrollments(normalizedEnrollments);
        setLoadingEnrollments(false);
    }

    useEffect(() => {
        loadBase();
    }, []);

    useEffect(() => {
        if (!selectedCourseId) return;
        sessionStorage.setItem('adminCourseEnrollmentCourseId', selectedCourseId);
        loadEnrollments(selectedCourseId);
    }, [selectedCourseId]);

    const groupedEnrollments = useMemo(() => {
        const bySection: Record<string, EnrollmentRow[]> = {};
        enrollments.forEach((row) => {
            const key = row.section || 'Unassigned';
            if (!bySection[key]) bySection[key] = [];
            bySection[key].push(row);
        });
        return bySection;
    }, [enrollments]);

    const sectionNames = useMemo(() => {
        return Object.keys(groupedEnrollments).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return a.localeCompare(b);
        });
    }, [groupedEnrollments]);

    async function removeEnrollment(enrollmentId: string) {
        const { error } = await supabase.from('course_enrollments').delete().eq('id', enrollmentId);
        if (error) flash(error.message, 'error');
        else {
            flash('Enrollment removed');
            if (selectedCourseId) loadEnrollments(selectedCourseId);
        }
    }

    return (
        <DashboardLayout title="Enrollment" activePath="/course-management/enrollments" onNavigate={onNavigate}>
            <Toast toast={toast} onDismiss={dismiss} />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button onClick={() => onNavigate('/course-management/courses')} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Course Enrollment
                </h2>
                <p className="text-muted-foreground mt-1">
                    Keep track of enrolled students per course and open the Enroll Students page when you need to add new students.
                </p>
            </motion.div>

            <div className="bg-card border border-border rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-1 gap-3">
                    <CustomSelect
                        label="Course"
                        value={selectedCourseId}
                        onChange={setSelectedCourseId}
                        options={courses.map((course) => ({
                            value: course.id,
                            label: `${course.code} - ${course.name}`,
                            subtitle: `${course.departments?.name ?? course.department ?? 'No Department'} | ${course.academic_terms?.name ?? 'No Semester'}`,
                        }))}
                        searchable
                        placeholder="Select course"
                    />
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => onNavigate('/course-management/enrollments/students')}
                        disabled={!selectedCourseId}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        <UserPlus className="w-4 h-4" />
                        Enroll Students
                    </button>
                </div>
            </div>

            {loadingBase ? (
                <div className="bg-card border border-border rounded-2xl p-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : !selectedCourseId ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                    <p className="text-muted-foreground">No courses available. Create a course first.</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl p-4">
                    <h3 className="font-semibold text-sm mb-2">Enrolled Students ({enrollments.length})</h3>
                    {loadingEnrollments ? (
                        <div className="py-12 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">No students enrolled for this course.</p>
                    ) : (
                        <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
                            {sectionNames.map((sectionName) => {
                                const rows = groupedEnrollments[sectionName];
                                const sectionFacultyId = rows[0]?.section_faculty_id;
                                const sectionFaculty = sectionFacultyId
                                    ? facultyList.find((faculty) => faculty.id === sectionFacultyId)
                                    : null;
                                return (
                                    <div key={sectionName} className="border border-border rounded-xl overflow-hidden">
                                        <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
                                            <p className="text-xs font-medium">
                                                {sectionName} ({rows.length})
                                            </p>
                                            {sectionFaculty && (
                                                <p className="text-xs text-muted-foreground">
                                                    Faculty: <span className="text-foreground">{sectionFaculty.name}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="divide-y divide-border">
                                            {rows.map((row) => (
                                                <div key={row.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{row.students?.name ?? 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {row.students?.roll_number ?? '-'} | {row.students?.department ?? '-'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeEnrollment(row.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                                        title="Remove"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}

function getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
}
