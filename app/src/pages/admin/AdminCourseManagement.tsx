import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Toast, useToast } from '@/components/ui/Toast';
import {
    BookOpen, Plus, X, Search, Edit3, Trash2, Users,
    GraduationCap, Loader2, UserPlus, Save, Hash, Clock,
    CheckSquare, Square, Filter, Layers,
} from 'lucide-react';

interface AdminCourseManagementProps {
    onNavigate: (path: string) => void;
}

/* types */

interface CourseRow {
    id: string;
    code: string;
    name: string;
    credits: number;
    semester: number | null;
    department: string | null;
    description: string | null;
    instructor_id: string | null;
    created_at: string;
    instructor?: { id: string; name: string; department: string } | null;
}

interface FacultyOption { id: string; name: string; department: string; }
interface StudentOption { id: string; name: string; roll_number: string; department: string; batch_year?: string; }
interface EnrollmentRow {
    id: string; student_id: string; course_id: string;
    section: string | null; section_faculty_id: string | null;
    students: { name: string; roll_number: string; department: string };
}
interface CourseFacultyRow { id: string; course_id: string; faculty_id: string; }

const DEPARTMENTS = [
    '', 'Computer Science & Engineering', 'Electronics & Communication', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Data Science', 'Artificial Intelligence',
];

const emptyCourse = {
    code: '', name: '', credits: 3, semester: 1,
    department: '', description: '', instructor_id: '',
};

/* component */

export function AdminCourseManagement({ onNavigate }: AdminCourseManagementProps) {
    /* state */
    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);
    const [studentsList, setStudentsList] = useState<StudentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { toast, flash, dismiss } = useToast();

    // course modal
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
    const [form, setForm] = useState(emptyCourse);
    const [saving, setSaving] = useState(false);
    const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);

    // enrollment modal
    const [enrollModal, setEnrollModal] = useState<CourseRow | null>(null);
    const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [courseFaculty, setCourseFaculty] = useState<CourseFacultyRow[]>([]);

    // batch filters
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterRollFrom, setFilterRollFrom] = useState('');
    const [filterRollTo, setFilterRollTo] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [batchSection, setBatchSection] = useState('');
    const [batchFacultyId, setBatchFacultyId] = useState('');

    // delete confirm
    const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    /* data fetching */

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('courses')
            .select('*, instructor:faculty!courses_instructor_id_fkey(id, name, department)')
            .order('code');
        if (error) flash(error.message, 'error');
        else setCourses(data ?? []);
        setLoading(false);
    }, [flash]);

    const fetchFaculty = useCallback(async () => {
        const { data } = await supabase.from('faculty').select('id, name, department').order('name');
        setFacultyList(data ?? []);
    }, []);

    const fetchStudents = useCallback(async () => {
        const { data } = await supabase.from('students').select('id, name, roll_number, department, batch_year').order('roll_number');
        setStudentsList(data ?? []);
    }, []);

    useEffect(() => { fetchCourses(); fetchFaculty(); fetchStudents(); }, [fetchCourses, fetchFaculty, fetchStudents]);

    /* course CRUD */

    const openCreate = () => {
        setEditingCourse(null); setForm(emptyCourse); setSelectedFacultyIds([]);
        setShowCourseModal(true);
    };
    const openEdit = async (c: CourseRow) => {
        setEditingCourse(c);
        setForm({
            code: c.code, name: c.name, credits: c.credits,
            semester: c.semester ?? 1, department: c.department ?? '',
            description: c.description ?? '', instructor_id: c.instructor_id ?? '',
        });
        // load assigned faculty
        const { data } = await supabase.from('course_faculty').select('faculty_id').eq('course_id', c.id);
        setSelectedFacultyIds((data ?? []).map(d => d.faculty_id));
        setShowCourseModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) return;
        setSaving(true);
        const primaryFacultyId = selectedFacultyIds.length > 0 ? selectedFacultyIds[0] : null;
        const payload = {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            credits: form.credits,
            semester: form.semester || null,
            department: form.department.trim() || null,
            description: form.description.trim() || null,
            instructor_id: primaryFacultyId,
        };

        let courseId: string | null = null;
        if (editingCourse) {
            courseId = editingCourse.id;
            const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id);
            if (error) { flash(error.message, 'error'); setSaving(false); return; }
        } else {
            const { data, error } = await supabase.from('courses').insert([payload]).select('id').single();
            if (error) { flash(error.message, 'error'); setSaving(false); return; }
            courseId = data.id;
        }

        // sync course_faculty junction
        if (courseId) {
            await supabase.from('course_faculty').delete().eq('course_id', courseId);
            if (selectedFacultyIds.length > 0) {
                await supabase.from('course_faculty').insert(
                    selectedFacultyIds.map(fid => ({ course_id: courseId!, faculty_id: fid }))
                );
            }
        }

        flash(editingCourse ? 'Course updated successfully' : 'Course created successfully');
        setShowCourseModal(false);
        fetchCourses();
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await supabase.from('courses').delete().eq('id', deleteTarget.id);
        if (error) flash(error.message, 'error');
        else { flash('Course deleted'); fetchCourses(); }
        setDeleting(false);
        setDeleteTarget(null);
    };

    const toggleFaculty = (fid: string) => {
        setSelectedFacultyIds(prev =>
            prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]
        );
    };

    /* enrollment */

    const openEnroll = async (c: CourseRow) => {
        setEnrollModal(c);
        setEnrollLoading(true);
        setSelectedStudents(new Set());
        setBatchSection(''); setBatchFacultyId('');
        setFilterDept(''); setFilterYear(''); setFilterRollFrom(''); setFilterRollTo('');

        const [enrollRes, cfRes] = await Promise.all([
            supabase.from('course_enrollments')
                .select('id, student_id, course_id, section, section_faculty_id, students(name, roll_number, department)')
                .eq('course_id', c.id),
            supabase.from('course_faculty').select('id, course_id, faculty_id').eq('course_id', c.id),
        ]);
        setEnrollments((enrollRes.data as any) ?? []);
        setCourseFaculty(cfRes.data ?? []);
        setEnrollLoading(false);
    };

    const addEnrollment = async (studentId: string) => {
        if (!enrollModal) return;
        setEnrolling(true);
        const { error } = await supabase
            .from('course_enrollments')
            .insert([{ student_id: studentId, course_id: enrollModal.id }]);
        if (error) flash(error.message, 'error');
        else { flash('Student enrolled'); openEnroll(enrollModal); }
        setEnrolling(false);
    };

    const batchEnroll = async () => {
        if (!enrollModal || selectedStudents.size === 0) return;
        setEnrolling(true);
        const rows = Array.from(selectedStudents).map(sid => ({
            student_id: sid,
            course_id: enrollModal.id,
            section: batchSection.trim() || null,
            section_faculty_id: batchFacultyId || null,
        }));
        const { error } = await supabase.from('course_enrollments').insert(rows);
        if (error) flash(error.message, 'error');
        else { flash(`${rows.length} students enrolled${batchSection ? ` in ${batchSection}` : ''}`); openEnroll(enrollModal); }
        setEnrolling(false);
    };

    const removeEnrollment = async (enrollmentId: string) => {
        if (!enrollModal) return;
        const { error } = await supabase.from('course_enrollments').delete().eq('id', enrollmentId);
        if (error) flash(error.message, 'error');
        else { flash('Student removed'); openEnroll(enrollModal); }
    };

    /* derived */

    const filtered = courses.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.department ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const enrolledIds = new Set(enrollments.map(e => e.student_id));

    // batch-filtered + not-enrolled students
    const availableStudents = studentsList.filter(s => {
        if (enrolledIds.has(s.id)) return false;
        if (filterDept && s.department !== filterDept) return false;
        if (filterYear && s.batch_year !== filterYear) return false;
        if (filterRollFrom && s.roll_number.localeCompare(filterRollFrom, undefined, { numeric: true }) < 0) return false;
        if (filterRollTo && s.roll_number.localeCompare(filterRollTo, undefined, { numeric: true }) > 0) return false;
        return true;
    });

    const batchYears = [...new Set(studentsList.map(s => s.batch_year).filter(Boolean))].sort();
    const uniqueDepts = [...new Set(studentsList.map(s => s.department).filter(Boolean))].sort();

    const allSelected = availableStudents.length > 0 && availableStudents.every(s => selectedStudents.has(s.id));
    const toggleSelectAll = () => {
        if (allSelected) { setSelectedStudents(new Set()); }
        else { setSelectedStudents(new Set(availableStudents.map(s => s.id))); }
    };
    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // group enrollments by section
    const enrollmentsBySection: Record<string, EnrollmentRow[]> = {};
    enrollments.forEach(e => {
        const key = e.section || 'Unassigned';
        if (!enrollmentsBySection[key]) enrollmentsBySection[key] = [];
        enrollmentsBySection[key].push(e);
    });
    const sectionKeys = Object.keys(enrollmentsBySection).sort((a, b) => a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b));

    const courseFacultyNames = courseFaculty.map(cf => {
        const f = facultyList.find(fl => fl.id === cf.faculty_id);
        return f ? f.name : 'Unknown';
    });

    // check if any filter is active
    const hasFilters = filterDept || filterYear || filterRollFrom || filterRollTo;

    /* render */

    return (
        <DashboardLayout title="Course Management" activePath="/course-management" onNavigate={onNavigate}>

            <Toast toast={toast} onDismiss={dismiss} />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Course Management</h2>
                        <p className="text-muted-foreground mt-1">Create courses, assign faculty, and manage enrollments.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Course
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Courses', value: courses.length, icon: BookOpen, iconBg: 'bg-purple-100 dark:bg-purple-500/20', iconText: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Departments', value: [...new Set(courses.map(c => c.department).filter(Boolean))].length, icon: Hash, iconBg: 'bg-blue-100 dark:bg-blue-500/20', iconText: 'text-blue-600 dark:text-blue-400' },
                    { label: 'With Faculty', value: courses.filter(c => c.instructor_id).length, icon: Users, iconBg: 'bg-emerald-100 dark:bg-emerald-500/20', iconText: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Semesters', value: [...new Set(courses.map(c => c.semester).filter(Boolean))].length, icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-500/20', iconText: 'text-amber-600 dark:text-amber-400' },
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
                        placeholder="Search by code, name, department..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
            </motion.div>

            {/* Course Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-xl border border-border p-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-semibold mb-1">
                        {courses.length === 0 ? 'No courses yet' : 'No matching courses'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {courses.length === 0
                            ? 'Click "New Course" to create your first course.'
                            : 'Try a different search term.'}
                    </p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((course, i) => (
                        <motion.div key={course.id}
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.04 }}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                        >
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                                        <h4 className="font-semibold text-sm mt-0.5 truncate">{course.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        <button onClick={() => openEdit(course)}
                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                                            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                        <button onClick={() => setDeleteTarget(course)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {course.instructor && (
                                    <p className="text-xs text-muted-foreground mb-2 truncate">
                                        <span className="text-foreground font-medium">{course.instructor.name}</span> · {course.instructor.department}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="w-3.5 h-3.5" /> {course.credits} Credits
                                    </span>
                                    {course.semester && (
                                        <span className="px-2 py-0.5 bg-muted rounded-full">Sem {course.semester}</span>
                                    )}
                                    {course.department && (
                                        <span className="truncate">{course.department}</span>
                                    )}
                                </div>

                                <button onClick={() => openEnroll(course)}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                                    <UserPlus className="w-3.5 h-3.5" /> Manage Enrollments
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create / Edit Course Modal */}
            <AnimatePresence>
                {showCourseModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowCourseModal(false)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
                                    </div>
                                    <button onClick={() => setShowCourseModal(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Course Code *</label>
                                            <input value={form.code}
                                                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                                                placeholder="e.g. CS331"
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Credits *</label>
                                            <input type="number" min={1} max={12} value={form.credits}
                                                onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 3 }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Course Name *</label>
                                        <input value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. Software Engineering"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomSelect
                                            label="Department"
                                            value={form.department}
                                            onChange={v => setForm(f => ({ ...f, department: v }))}
                                            searchable
                                            placeholder="— Select Department —"
                                            options={DEPARTMENTS.map(d => ({ value: d, label: d || '— Select Department —' }))}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Semester</label>
                                            <input type="number" min={1} max={8} value={form.semester}
                                                onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) || 1 }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        </div>
                                    </div>

                                    {/* Multi-Faculty Selector */}
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            Assign Faculty
                                            {selectedFacultyIds.length > 0 && (
                                                <span className="ml-1.5 text-xs text-muted-foreground font-normal">({selectedFacultyIds.length} selected)</span>
                                            )}
                                        </label>
                                        {/* selected tags */}
                                        {selectedFacultyIds.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {selectedFacultyIds.map((fid, idx) => {
                                                    const f = facultyList.find(fl => fl.id === fid);
                                                    return (
                                                        <span key={fid} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                            idx === 0
                                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                                : 'bg-muted text-muted-foreground border border-border'
                                                        }`}>
                                                            {f?.name ?? 'Unknown'}
                                                            {idx === 0 && <span className="text-[10px] opacity-60">(Primary)</span>}
                                                            <button onClick={() => toggleFaculty(fid)} className="ml-0.5 hover:text-red-500 transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* faculty list to pick from */}
                                        <div className="border border-border rounded-xl max-h-36 overflow-y-auto p-1">
                                            {facultyList.map(f => {
                                                const picked = selectedFacultyIds.includes(f.id);
                                                return (
                                                    <button type="button" key={f.id} onClick={() => toggleFaculty(f.id)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                            picked ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                                                        }`}>
                                                        {picked
                                                            ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                                                            : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                                        <div className="text-left min-w-0">
                                                            <p className="truncate">{f.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{f.department}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Description</label>
                                        <textarea value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="Optional course description..."
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                </div>

                                <div className="flex gap-3 p-5 border-t border-border">
                                    <button onClick={() => setShowCourseModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                                        Cancel
                                    </button>
                                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        onClick={handleSave}
                                        disabled={saving || !form.code.trim() || !form.name.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <><Save className="w-4 h-4" /> {editingCourse ? 'Update' : 'Create'}</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Enrollment Modal */}
            <AnimatePresence>
                {enrollModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEnrollModal(null)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                                {/* header */}
                                <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-primary" />
                                            <h3 className="font-semibold">Manage Enrollments</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {enrollModal.code} — {enrollModal.name}
                                            {courseFacultyNames.length > 0 && (
                                                <span className="ml-2">· Faculty: {courseFacultyNames.join(', ')}</span>
                                            )}
                                        </p>
                                    </div>
                                    <button onClick={() => setEnrollModal(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                                    {/* Batch Filters */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Filter className="w-4 h-4 text-primary" />
                                            <h4 className="text-sm font-medium">Batch Filters</h4>
                                            {hasFilters && (
                                                <button onClick={() => { setFilterDept(''); setFilterYear(''); setFilterRollFrom(''); setFilterRollTo(''); setSelectedStudents(new Set()); }}
                                                    className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <CustomSelect
                                                label="Department"
                                                value={filterDept}
                                                onChange={v => { setFilterDept(v); setSelectedStudents(new Set()); }}
                                                placeholder="All Departments"
                                                searchable
                                                options={[
                                                    { value: '', label: 'All Departments' },
                                                    ...uniqueDepts.map(d => ({ value: d, label: d })),
                                                ]}
                                            />
                                            <CustomSelect
                                                label="Batch Year"
                                                value={filterYear}
                                                onChange={v => { setFilterYear(v); setSelectedStudents(new Set()); }}
                                                placeholder="All Years"
                                                options={[
                                                    { value: '', label: 'All Years' },
                                                    ...batchYears.map(y => ({ value: y!, label: `Batch ${y}` })),
                                                ]}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium mb-1 text-muted-foreground">From Roll No</label>
                                                <input value={filterRollFrom}
                                                    onChange={e => { setFilterRollFrom(e.target.value); setSelectedStudents(new Set()); }}
                                                    placeholder="e.g. CS2024001"
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1 text-muted-foreground">To Roll No</label>
                                                <input value={filterRollTo}
                                                    onChange={e => { setFilterRollTo(e.target.value); setSelectedStudents(new Set()); }}
                                                    placeholder="e.g. CS2024030"
                                                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Students */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-medium">
                                                Available Students
                                                <span className="ml-1.5 text-xs text-muted-foreground font-normal">({availableStudents.length})</span>
                                            </h4>
                                            {availableStudents.length > 0 && (
                                                <button onClick={toggleSelectAll}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                                    {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                                    {allSelected ? 'Deselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>

                                        {availableStudents.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
                                                {hasFilters ? 'No students match the filters.' : 'All students are enrolled.'}
                                            </p>
                                        ) : (
                                            <div className="space-y-1.5 max-h-44 overflow-y-auto border border-border rounded-xl p-1.5">
                                                {availableStudents.slice(0, 50).map(s => {
                                                    const checked = selectedStudents.has(s.id);
                                                    return (
                                                        <button key={s.id} onClick={() => toggleStudent(s.id)}
                                                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${
                                                                checked ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
                                                            }`}>
                                                            {checked
                                                                ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                                                                : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                                                            <div className="text-left min-w-0 flex-1">
                                                                <p className="font-medium truncate">{s.name}</p>
                                                                <p className="text-xs text-muted-foreground">{s.roll_number} · {s.department}</p>
                                                            </div>
                                                            {!checked && (
                                                                <motion.button whileTap={{ scale: 0.95 }}
                                                                    onClick={e => { e.stopPropagation(); addEnrollment(s.id); }}
                                                                    disabled={enrolling}
                                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-60">
                                                                    <Plus className="w-3 h-3" /> Enroll
                                                                </motion.button>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                                {availableStudents.length > 50 && (
                                                    <p className="text-xs text-center text-muted-foreground py-2">
                                                        Showing 50 of {availableStudents.length} — use filters to narrow down.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Batch Enroll Bar */}
                                    {selectedStudents.size > 0 && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-primary" />
                                                <p className="text-sm font-medium">
                                                    Batch Enroll <span className="text-primary">{selectedStudents.size}</span> students
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Section / Group</label>
                                                    <input value={batchSection} onChange={e => setBatchSection(e.target.value)}
                                                        placeholder="e.g. Section A"
                                                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                                </div>
                                                {courseFaculty.length > 0 && (
                                                    <CustomSelect
                                                        label="Section Faculty"
                                                        value={batchFacultyId}
                                                        onChange={setBatchFacultyId}
                                                        placeholder="— Select —"
                                                        options={[
                                                            { value: '', label: '— No faculty —' },
                                                            ...courseFaculty.map(cf => {
                                                                const f = facultyList.find(fl => fl.id === cf.faculty_id);
                                                                return { value: cf.faculty_id, label: f?.name ?? 'Unknown', subtitle: f?.department };
                                                            }),
                                                        ]}
                                                    />
                                                )}
                                            </div>
                                            <motion.button whileTap={{ scale: 0.98 }}
                                                onClick={batchEnroll} disabled={enrolling}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
                                                {enrolling
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <><UserPlus className="w-4 h-4" /> Enroll {selectedStudents.size} Students</>}
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {/* Enrolled Students (grouped by section) */}
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">
                                            Enrolled Students
                                            <span className="ml-1.5 text-xs text-muted-foreground font-normal">({enrollments.length})</span>
                                        </h4>
                                        {enrollLoading ? (
                                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                                        ) : enrollments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground py-3 text-center bg-muted/50 rounded-xl">No students enrolled yet.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-52 overflow-y-auto">
                                                {sectionKeys.map(sectionName => {
                                                    const rows = enrollmentsBySection[sectionName];
                                                    const secFaculty = rows[0]?.section_faculty_id
                                                        ? facultyList.find(f => f.id === rows[0].section_faculty_id)
                                                        : null;
                                                    return (
                                                        <div key={sectionName} className="border border-border rounded-xl overflow-hidden">
                                                            <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                                                                <p className="text-xs font-medium">
                                                                    {sectionName}
                                                                    <span className="ml-1.5 text-muted-foreground font-normal">({rows.length})</span>
                                                                </p>
                                                                {secFaculty && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Faculty: <span className="text-foreground font-medium">{secFaculty.name}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="divide-y divide-border">
                                                                {rows.map(e => (
                                                                    <div key={e.id} className="flex items-center justify-between px-3 py-2">
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-medium truncate">{e.students?.name}</p>
                                                                            <p className="text-xs text-muted-foreground">{e.students?.roll_number} · {e.students?.department}</p>
                                                                        </div>
                                                                        <button onClick={() => removeEnrollment(e.id)}
                                                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0" title="Remove">
                                                                            <X className="w-3.5 h-3.5 text-red-400" />
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
                                </div>

                                <div className="p-4 border-t border-border flex-shrink-0">
                                    <button onClick={() => setEnrollModal(null)}
                                        className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="font-semibold text-lg mb-1">Delete Course?</h3>
                                <p className="text-sm text-muted-foreground mb-5">
                                    <span className="font-mono text-foreground">{deleteTarget.code}</span> — {deleteTarget.name} will be permanently removed along with all enrollments.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                                        Cancel
                                    </button>
                                    <motion.button whileTap={{ scale: 0.98 }}
                                        onClick={handleDelete} disabled={deleting}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
