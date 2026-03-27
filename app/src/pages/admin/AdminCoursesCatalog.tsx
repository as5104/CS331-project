import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Toast, useToast } from '@/components/ui/Toast';
import type { AcademicTermRow, CourseRow, DepartmentRow } from '@/lib/adminCourseTypes';
import { ArrowLeft, BookOpen, Edit3, Plus, Search, Trash2, Users } from 'lucide-react';

interface AdminCoursesCatalogProps {
    onNavigate: (path: string) => void;
}

export function AdminCoursesCatalog({ onNavigate }: AdminCoursesCatalogProps) {
    const { toast, flash, dismiss } = useToast();

    const [loading, setLoading] = useState(true);
    const [terms, setTerms] = useState<AcademicTermRow[]>([]);
    const [departments, setDepartments] = useState<DepartmentRow[]>([]);
    const [courses, setCourses] = useState<CourseRow[]>([]);

    const [search, setSearch] = useState('');
    const [termFilter, setTermFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);

    async function loadMeta() {
        const [termsRes, departmentsRes] = await Promise.all([
            supabase.from('academic_terms').select('*').order('sequence', { ascending: true, nullsFirst: false }).order('name'),
            supabase.from('departments').select('*').order('name'),
        ]);

        if (termsRes.error) flash(termsRes.error.message, 'error');
        if (departmentsRes.error) flash(departmentsRes.error.message, 'error');

        setTerms((termsRes.data ?? []) as AcademicTermRow[]);
        setDepartments((departmentsRes.data ?? []) as DepartmentRow[]);
    }

    async function loadCourses() {
        const { data, error } = await supabase
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
                instructor:faculty!courses_instructor_id_fkey(id, name, department),
                academic_terms(id, name, sequence),
                departments(id, name, code)
            `)
            .order('code', { ascending: true });
        if (error) flash(error.message, 'error');
        const normalizedCourses: CourseRow[] = (data ?? []).map((row: any) => ({
            ...row,
            instructor: getRelationOne(row.instructor),
            academic_terms: getRelationOne(row.academic_terms),
            departments: getRelationOne(row.departments),
        }));
        setCourses(normalizedCourses);
    }

    useEffect(() => {
        let active = true;
        async function init() {
            setLoading(true);
            await Promise.all([loadMeta(), loadCourses()]);
            if (active) setLoading(false);
        }
        init();
        return () => {
            active = false;
        };
    }, []);

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const matchesSearch =
                course.code.toLowerCase().includes(search.toLowerCase()) ||
                course.name.toLowerCase().includes(search.toLowerCase()) ||
                (course.department ?? '').toLowerCase().includes(search.toLowerCase());
            const matchesTerm = !termFilter || course.term_id === termFilter;
            const matchesDepartment = !departmentFilter || course.department_id === departmentFilter;
            return matchesSearch && matchesTerm && matchesDepartment;
        });
    }, [courses, search, termFilter, departmentFilter]);

    function goCreateCourse() {
        sessionStorage.removeItem('adminCourseEditorCourseId');
        onNavigate('/course-management/courses/create');
    }

    function goEditCourse(courseId: string) {
        sessionStorage.setItem('adminCourseEditorCourseId', courseId);
        onNavigate('/course-management/courses/edit');
    }

    async function deleteCourse(courseId: string) {
        if (deleteArmedId !== courseId) {
            setDeleteArmedId(courseId);
            return;
        }
        const { error } = await supabase.from('courses').delete().eq('id', courseId);
        if (error) {
            flash(error.message, 'error');
            return;
        }
        flash('Course deleted.');
        setDeleteArmedId(null);
        await loadCourses();
    }

    return (
        <DashboardLayout title="Courses" activePath="/course-management/courses" onNavigate={onNavigate}>
            <Toast toast={toast} onDismiss={dismiss} />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button onClick={() => onNavigate('/course-management')} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Course Management
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Courses Catalog
                </h2>
                <p className="text-muted-foreground mt-1">
                    Browse and manage courses. Use the dedicated Create Course page to add or edit course details.
                </p>
            </motion.div>

            <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by code/name"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                            />
                        </div>
                        <CustomSelect
                            value={termFilter}
                            onChange={setTermFilter}
                            options={[
                                { value: '', label: 'All Semesters' },
                                ...terms.map((term) => ({
                                    value: term.id,
                                    label: term.name,
                                    subtitle: term.sequence ? `Semester ${term.sequence}` : 'No semester number',
                                })),
                            ]}
                        />
                        <CustomSelect
                            value={departmentFilter}
                            onChange={setDepartmentFilter}
                            options={[
                                { value: '', label: 'All Departments' },
                                ...departments.map((dep) => ({
                                    value: dep.id,
                                    label: dep.name,
                                    subtitle: dep.code ?? 'No code',
                                })),
                            ]}
                        />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold">Courses ({filteredCourses.length})</h3>
                        <button
                            onClick={goCreateCourse}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create Course
                        </button>
                    </div>
                    {loading ? (
                        <p className="p-4 text-sm text-muted-foreground">Loading courses...</p>
                    ) : filteredCourses.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No courses found for this filter.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredCourses.map((course) => (
                                <div key={course.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-xs font-mono text-muted-foreground">{course.code}</p>
                                        <p className="font-medium">{course.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {course.departments?.name ?? course.department ?? 'No Department'} | {course.academic_terms?.name ?? 'No Semester'} | Semester {course.semester ?? '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                sessionStorage.setItem('adminCourseEnrollmentCourseId', course.id);
                                                onNavigate('/course-management/enrollments');
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
                                        >
                                            <Users className="w-3.5 h-3.5" />
                                            Enrollment
                                        </button>
                                        <button
                                            onClick={() => goEditCourse(course.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteCourse(course.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
                                                deleteArmedId === course.id ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                                            }`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {deleteArmedId === course.id ? 'Confirm' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

function getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
}
