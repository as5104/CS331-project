import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Toast, useToast } from '@/components/ui/Toast';
import type { CourseFacultyRow, CourseRow, EnrollmentRow, FacultyOption, StudentOption } from '@/lib/adminCourseTypes';
import { ArrowLeft, CheckSquare, Layers, Loader2, Search, Square, UserPlus } from 'lucide-react';

interface AdminCourseEnrollStudentsProps {
    onNavigate: (path: string) => void;
}

export function AdminCourseEnrollStudents({ onNavigate }: AdminCourseEnrollStudentsProps) {
    const { toast, flash, dismiss } = useToast();

    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
    const [courseFaculty, setCourseFaculty] = useState<CourseFacultyRow[]>([]);

    const [loadingBase, setLoadingBase] = useState(true);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterRollFrom, setFilterRollFrom] = useState('');
    const [filterRollTo, setFilterRollTo] = useState('');
    const [availablePage, setAvailablePage] = useState(1);
    const [availablePageSize, setAvailablePageSize] = useState(25);

    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [batchSection, setBatchSection] = useState('');
    const [batchFacultyId, setBatchFacultyId] = useState('');

    const selectedCourse = useMemo(
        () => courses.find((course) => course.id === selectedCourseId) ?? null,
        [courses, selectedCourseId]
    );
    const selectedCourseDepartment = selectedCourse?.departments?.name ?? selectedCourse?.department ?? null;

    function normalizeText(value: string | null | undefined): string {
        return (value ?? '').trim().toLowerCase();
    }

    async function loadBase() {
        setLoadingBase(true);
        const [coursesRes, studentsRes, facultyRes] = await Promise.all([
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
            supabase.from('students').select('id, name, roll_number, department, batch_year, semester').order('roll_number'),
            supabase.from('faculty').select('id, name, department').order('name'),
        ]);

        if (coursesRes.error) flash(coursesRes.error.message, 'error');
        if (studentsRes.error) flash(studentsRes.error.message, 'error');
        if (facultyRes.error) flash(facultyRes.error.message, 'error');

        const courseRows: CourseRow[] = (coursesRes.data ?? []).map((row: any) => ({
            ...row,
            academic_terms: getRelationOne(row.academic_terms),
            departments: getRelationOne(row.departments),
        }));
        setCourses(courseRows);
        setStudentsList((studentsRes.data ?? []) as StudentOption[]);
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
            setCourseFaculty([]);
            return;
        }
        setLoadingEnrollments(true);
        const [enrollmentsRes, facultyRes] = await Promise.all([
            supabase
                .from('course_enrollments')
                .select('id, student_id, course_id, section, section_faculty_id, students(name, roll_number, department)')
                .eq('course_id', courseId),
            supabase.from('course_faculty').select('id, course_id, faculty_id').eq('course_id', courseId),
        ]);
        if (enrollmentsRes.error) flash(enrollmentsRes.error.message, 'error');
        if (facultyRes.error) flash(facultyRes.error.message, 'error');
        const normalizedEnrollments: EnrollmentRow[] = (enrollmentsRes.data ?? []).map((row: any) => ({
            ...row,
            students: getRelationOne(row.students),
        }));
        setEnrollments(normalizedEnrollments);
        setCourseFaculty((facultyRes.data ?? []) as CourseFacultyRow[]);
        setLoadingEnrollments(false);
    }

    useEffect(() => {
        loadBase();
    }, []);

    useEffect(() => {
        if (!selectedCourseId) return;
        sessionStorage.setItem('adminCourseEnrollmentCourseId', selectedCourseId);
        setSelectedStudents(new Set());
        setBatchSection('');
        setBatchFacultyId('');
        setAvailablePage(1);
        loadEnrollments(selectedCourseId);
    }, [selectedCourseId]);

    const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.student_id)), [enrollments]);

    const availableStudents = useMemo(() => {
        return studentsList.filter((student) => {
            if (enrolledIds.has(student.id)) return false;
            if (selectedCourse?.semester !== null && selectedCourse?.semester !== undefined) {
                if (student.semester !== selectedCourse.semester) return false;
            }
            if (selectedCourseDepartment) {
                if (normalizeText(student.department) !== normalizeText(selectedCourseDepartment)) return false;
            }
            if (search.trim()) {
                const query = search.toLowerCase();
                const hit =
                    student.name.toLowerCase().includes(query) ||
                    student.roll_number.toLowerCase().includes(query) ||
                    (student.department ?? '').toLowerCase().includes(query);
                if (!hit) return false;
            }
            if (filterDept && student.department !== filterDept) return false;
            if (filterYear && student.batch_year !== filterYear) return false;
            if (filterRollFrom && student.roll_number.localeCompare(filterRollFrom, undefined, { numeric: true }) < 0) return false;
            if (filterRollTo && student.roll_number.localeCompare(filterRollTo, undefined, { numeric: true }) > 0) return false;
            return true;
        });
    }, [studentsList, enrolledIds, selectedCourse?.semester, selectedCourseDepartment, search, filterDept, filterYear, filterRollFrom, filterRollTo]);

    const allSelected = availableStudents.length > 0 && availableStudents.every((student) => selectedStudents.has(student.id));
    const hasFilters = Boolean(search || filterDept || filterYear || filterRollFrom || filterRollTo);
    const availableTotalPages = Math.max(1, Math.ceil(availableStudents.length / availablePageSize));
    const safeAvailablePage = Math.min(availablePage, availableTotalPages);
    const pagedAvailableStudents = useMemo(() => {
        const start = (safeAvailablePage - 1) * availablePageSize;
        return availableStudents.slice(start, start + availablePageSize);
    }, [availableStudents, safeAvailablePage, availablePageSize]);
    const pageStart = availableStudents.length === 0 ? 0 : (safeAvailablePage - 1) * availablePageSize + 1;
    const pageEnd = Math.min(safeAvailablePage * availablePageSize, availableStudents.length);

    useEffect(() => {
        if (availablePage > availableTotalPages) {
            setAvailablePage(availableTotalPages);
        }
    }, [availablePage, availableTotalPages]);

    const uniqueDepartments = [...new Set(studentsList.map((student) => student.department).filter(Boolean))] as string[];
    const uniqueBatchYears = [...new Set(studentsList.map((student) => student.batch_year).filter(Boolean))] as string[];

    function toggleSelect(studentId: string) {
        setSelectedStudents((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) next.delete(studentId);
            else next.add(studentId);
            return next;
        });
    }

    function toggleSelectAll() {
        if (allSelected) {
            setSelectedStudents(new Set());
            return;
        }
        setSelectedStudents(new Set(availableStudents.map((student) => student.id)));
    }

    async function enrollSingle(studentId: string) {
        if (!selectedCourseId) return;
        const student = studentsList.find((row) => row.id === studentId);
        if (selectedCourse?.semester !== null && selectedCourse?.semester !== undefined) {
            if (!student || student.semester !== selectedCourse.semester) {
                flash('Only students from the matching semester can be enrolled in this course.', 'error');
                return;
            }
        }
        if (selectedCourseDepartment) {
            if (!student || normalizeText(student.department) !== normalizeText(selectedCourseDepartment)) {
                flash('Only students from the matching department can be enrolled in this course.', 'error');
                return;
            }
        }
        setEnrolling(true);
        const { error } = await supabase.from('course_enrollments').insert([
            {
                student_id: studentId,
                course_id: selectedCourseId,
            },
        ]);
        if (error) flash(error.message, 'error');
        else {
            flash('Student enrolled');
            await loadEnrollments(selectedCourseId);
        }
        setEnrolling(false);
    }

    async function enrollBatch() {
        if (!selectedCourseId || selectedStudents.size === 0) return;
        if (selectedCourse?.semester !== null && selectedCourse?.semester !== undefined) {
            const invalidSemester = Array.from(selectedStudents).some((id) => {
                const student = studentsList.find((row) => row.id === id);
                return !student || student.semester !== selectedCourse.semester;
            });
            if (invalidSemester) {
                flash('Batch enrollment contains students from a different semester.', 'error');
                return;
            }
        }
        if (selectedCourseDepartment) {
            const invalidDepartment = Array.from(selectedStudents).some((id) => {
                const student = studentsList.find((row) => row.id === id);
                return !student || normalizeText(student.department) !== normalizeText(selectedCourseDepartment);
            });
            if (invalidDepartment) {
                flash('Batch enrollment contains students from a different department.', 'error');
                return;
            }
        }
        setEnrolling(true);
        const rows = Array.from(selectedStudents).map((studentId) => ({
            student_id: studentId,
            course_id: selectedCourseId,
            section: batchSection.trim() || null,
            section_faculty_id: batchFacultyId || null,
        }));
        const { error } = await supabase.from('course_enrollments').insert(rows);
        if (error) flash(error.message, 'error');
        else {
            flash(`${rows.length} students enrolled.`);
            setSelectedStudents(new Set());
            await loadEnrollments(selectedCourseId);
        }
        setEnrolling(false);
    }

    return (
        <DashboardLayout title="Enroll Students" activePath="/course-management/enrollments" onNavigate={onNavigate}>
            <Toast toast={toast} onDismiss={dismiss} />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button onClick={() => onNavigate('/course-management/enrollments')} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Enrollment
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-primary" />
                    Enroll Students
                </h2>
                <p className="text-muted-foreground mt-1">
                    Filter available students and enroll individually or in batch for the selected course.
                </p>
            </motion.div>

            <div className="bg-card border border-border rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <CustomSelect
                        label="Course"
                        value={selectedCourseId}
                        onChange={setSelectedCourseId}
                        className="self-start"
                        options={courses.map((course) => ({
                            value: course.id,
                            label: `${course.code} - ${course.name}`,
                            subtitle: `${course.departments?.name ?? course.department ?? 'No Department'} | ${course.academic_terms?.name ?? 'No Semester'}`,
                        }))}
                        searchable
                        placeholder="Select course"
                    />
                    <div className="border border-border rounded-xl px-4 py-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">Course Scope</p>
                        {selectedCourse ? (
                            <div className="mt-1">
                                <p className="font-medium">{selectedCourse.code} - {selectedCourse.name}</p>
                                <p className="text-xs text-primary mt-1">
                                    Semester {selectedCourse.semester ?? '-'} | Dept: {selectedCourseDepartment ?? '-'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Existing enrollments: {enrollments.length}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1">No course selected</p>
                        )}
                    </div>
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
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 space-y-4">
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="relative md:col-span-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setSelectedStudents(new Set());
                                            setAvailablePage(1);
                                        }}
                                        placeholder="Search student by name, roll, department"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                                    />
                                </div>
                                <CustomSelect
                                    value={filterDept}
                                    onChange={(value) => {
                                        setFilterDept(value);
                                        setSelectedStudents(new Set());
                                        setAvailablePage(1);
                                    }}
                                    options={[
                                        { value: '', label: 'All Departments' },
                                        ...uniqueDepartments.map((value) => ({ value, label: value })),
                                    ]}
                                />
                                <CustomSelect
                                    value={filterYear}
                                    onChange={(value) => {
                                        setFilterYear(value);
                                        setSelectedStudents(new Set());
                                        setAvailablePage(1);
                                    }}
                                    options={[
                                        { value: '', label: 'All Batch Years' },
                                        ...uniqueBatchYears.map((value) => ({ value, label: value })),
                                    ]}
                                />
                                <input
                                    value={filterRollFrom}
                                    onChange={(e) => {
                                        setFilterRollFrom(e.target.value);
                                        setSelectedStudents(new Set());
                                        setAvailablePage(1);
                                    }}
                                    placeholder="Roll from"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                                />
                                <input
                                    value={filterRollTo}
                                    onChange={(e) => {
                                        setFilterRollTo(e.target.value);
                                        setSelectedStudents(new Set());
                                        setAvailablePage(1);
                                    }}
                                    placeholder="Roll to"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-semibold text-sm">
                                    Available Students ({availableStudents.length})
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    {selectedCourse?.semester !== null && selectedCourse?.semester !== undefined && (
                                        <span className="text-xs text-primary font-medium">
                                            Semester {selectedCourse.semester} only
                                        </span>
                                    )}
                                    {selectedCourseDepartment && (
                                        <span className="text-xs text-primary font-medium">
                                            Dept: {selectedCourseDepartment}
                                        </span>
                                    )}
                                    {availableStudents.length > 0 && (
                                        <button
                                            onClick={toggleSelectAll}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                                        >
                                            {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {availableStudents.length > 0 && (
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {pageStart}-{pageEnd} of {availableStudents.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Rows</span>
                                        <select
                                            value={String(availablePageSize)}
                                            onChange={(event) => {
                                                const parsed = Number(event.target.value) || 25;
                                                setAvailablePageSize(parsed);
                                                setAvailablePage(1);
                                            }}
                                            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs"
                                        >
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {availableStudents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    {hasFilters ? 'No students match your filters.' : 'All eligible students are already enrolled.'}
                                </p>
                            ) : (
                                <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                                    {pagedAvailableStudents.map((student) => {
                                        const checked = selectedStudents.has(student.id);
                                        return (
                                            <button
                                                key={student.id}
                                                onClick={() => toggleSelect(student.id)}
                                                className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                                                    checked ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-muted/40'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{student.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {student.roll_number} | Sem {student.semester ?? '-'} | {student.department ?? '-'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!checked && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    enrollSingle(student.id);
                                                                }}
                                                                disabled={enrolling}
                                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium"
                                                            >
                                                                Enroll
                                                            </button>
                                                        )}
                                                        {checked ? (
                                                            <CheckSquare className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {availableStudents.length > availablePageSize && (
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setAvailablePage((prev) => Math.max(1, prev - 1))}
                                        disabled={safeAvailablePage === 1}
                                        className="px-2.5 py-1 rounded-lg border border-border text-xs disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        Page {safeAvailablePage} of {availableTotalPages}
                                    </p>
                                    <button
                                        onClick={() => setAvailablePage((prev) => Math.min(availableTotalPages, prev + 1))}
                                        disabled={safeAvailablePage === availableTotalPages}
                                        className="px-2.5 py-1 rounded-lg border border-border text-xs disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium">Batch enroll {selectedStudents.size} students</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    value={batchSection}
                                    onChange={(e) => setBatchSection(e.target.value)}
                                    placeholder="Section name (e.g. A)"
                                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm"
                                />
                                <CustomSelect
                                    value={batchFacultyId}
                                    onChange={setBatchFacultyId}
                                    options={[
                                        { value: '', label: 'No Section Faculty' },
                                        ...courseFaculty.map((row) => {
                                            const faculty = facultyList.find((f) => f.id === row.faculty_id);
                                            return {
                                                value: row.faculty_id,
                                                label: faculty?.name ?? 'Unknown Faculty',
                                                subtitle: faculty?.department ?? 'No Department',
                                            };
                                        }),
                                    ]}
                                />
                            </div>
                            <button
                                onClick={enrollBatch}
                                disabled={enrolling || selectedStudents.size === 0}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                            >
                                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                Enroll Selected Students
                            </button>
                            <p className="text-xs text-muted-foreground">
                                Students are automatically restricted to the selected course's semester and department.
                            </p>
                        </div>
                        {loadingEnrollments && (
                            <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Syncing enrollment data...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function getRelationOne<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
}
