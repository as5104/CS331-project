import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Toast, useToast } from '@/components/ui/Toast';
import type { AcademicTermRow, DepartmentRow, FacultyOption } from '@/lib/adminCourseTypes';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';

interface AdminCourseEditorProps {
    onNavigate: (path: string) => void;
    mode: 'create' | 'edit';
}

interface CourseForm {
    code: string;
    name: string;
    credits: number;
    description: string;
    termId: string;
    departmentId: string;
}

const emptyForm: CourseForm = {
    code: '',
    name: '',
    credits: 3,
    description: '',
    termId: '',
    departmentId: '',
};

export function AdminCourseEditor({ onNavigate, mode }: AdminCourseEditorProps) {
    const { toast, flash, dismiss } = useToast();

    const [loadingMeta, setLoadingMeta] = useState(true);
    const [loadingCourse, setLoadingCourse] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);

    const [terms, setTerms] = useState<AcademicTermRow[]>([]);
    const [departments, setDepartments] = useState<DepartmentRow[]>([]);
    const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);

    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [facultyPage, setFacultyPage] = useState(1);

    async function loadMeta() {
        setLoadingMeta(true);
        const [termsRes, departmentsRes, facultyRes] = await Promise.all([
            supabase.from('academic_terms').select('*').order('sequence', { ascending: true, nullsFirst: false }).order('name'),
            supabase.from('departments').select('*').order('name'),
            supabase.from('faculty').select('id, name, department').order('name'),
        ]);

        if (termsRes.error) flash(termsRes.error.message, 'error');
        if (departmentsRes.error) flash(departmentsRes.error.message, 'error');
        if (facultyRes.error) flash(facultyRes.error.message, 'error');

        setTerms((termsRes.data ?? []) as AcademicTermRow[]);
        setDepartments((departmentsRes.data ?? []) as DepartmentRow[]);
        setFacultyList((facultyRes.data ?? []) as FacultyOption[]);
        setLoadingMeta(false);
    }

    async function loadCourseForEdit(targetCourseId: string) {
        setLoadingCourse(true);
        const [{ data: courseRow, error: courseError }, { data: facultyRows, error: facultyError }] = await Promise.all([
            supabase
                .from('courses')
                .select('id, code, name, credits, description, term_id, department_id')
                .eq('id', targetCourseId)
                .maybeSingle(),
            supabase.from('course_faculty').select('faculty_id').eq('course_id', targetCourseId),
        ]);

        if (courseError) {
            flash(courseError.message, 'error');
            setLoadingCourse(false);
            return;
        }
        if (!courseRow) {
            flash('Course not found for editing.', 'error');
            setLoadingCourse(false);
            return;
        }
        if (facultyError) flash(facultyError.message, 'error');

        setCourseId(courseRow.id);
        setForm({
            code: courseRow.code ?? '',
            name: courseRow.name ?? '',
            credits: courseRow.credits ?? 3,
            description: courseRow.description ?? '',
            termId: courseRow.term_id ?? '',
            departmentId: courseRow.department_id ?? '',
        });
        setSelectedFacultyIds((facultyRows ?? []).map((row) => row.faculty_id));
        setFacultySearch('');
        setFacultyPage(1);
        setLoadingCourse(false);
    }

    function clearForm() {
        setForm(emptyForm);
        setSelectedFacultyIds([]);
        setFacultySearch('');
        setFacultyPage(1);
        setCourseId(null);
    }

    function toggleFaculty(id: string) {
        setSelectedFacultyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    async function handleReset() {
        if (mode === 'edit' && courseId) {
            await loadCourseForEdit(courseId);
            return;
        }
        clearForm();
    }

    async function saveCourse() {
        if (!form.code.trim() || !form.name.trim()) {
            flash('Course code and name are required.', 'error');
            return;
        }
        if (!form.termId || !form.departmentId) {
            flash('Select both semester and department.', 'error');
            return;
        }

        const term = terms.find((item) => item.id === form.termId);
        const dep = departments.find((item) => item.id === form.departmentId);
        if (!term || !dep) {
            flash('Invalid semester or department selection.', 'error');
            return;
        }

        const primaryFacultyId = selectedFacultyIds.length > 0 ? selectedFacultyIds[0] : null;
        const payload = {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            credits: form.credits || 3,
            description: form.description.trim() || null,
            term_id: term.id,
            department_id: dep.id,
            semester: term.sequence ?? null,
            department: dep.name,
            instructor_id: primaryFacultyId,
        };

        setSaving(true);
        try {
            let targetCourseId = courseId;
            if (mode === 'edit') {
                if (!targetCourseId) {
                    flash('No course selected for edit.', 'error');
                    setSaving(false);
                    return;
                }
                const { error } = await supabase.from('courses').update(payload).eq('id', targetCourseId);
                if (error) {
                    flash(error.message, 'error');
                    setSaving(false);
                    return;
                }
            } else {
                const { data, error } = await supabase.from('courses').insert([payload]).select('id').single();
                if (error) {
                    flash(error.message, 'error');
                    setSaving(false);
                    return;
                }
                targetCourseId = data.id;
                setCourseId(targetCourseId);
            }

            if (targetCourseId) {
                await supabase.from('course_faculty').delete().eq('course_id', targetCourseId);
                if (selectedFacultyIds.length > 0) {
                    const { error } = await supabase.from('course_faculty').insert(
                        selectedFacultyIds.map((facultyId) => ({ course_id: targetCourseId, faculty_id: facultyId }))
                    );
                    if (error) {
                        flash(error.message, 'error');
                        setSaving(false);
                        return;
                    }
                }
            }

            flash(mode === 'edit' ? 'Course updated successfully.' : 'Course added successfully.');
            if (mode === 'create') {
                clearForm();
            }
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadMeta();
    }, []);

    useEffect(() => {
        if (mode !== 'edit') {
            sessionStorage.removeItem('adminCourseEditorCourseId');
            setLoadingCourse(false);
            return;
        }
        const targetCourseId = sessionStorage.getItem('adminCourseEditorCourseId');
        if (!targetCourseId) {
            flash('Select a course from catalog to edit.', 'error');
            setLoadingCourse(false);
            return;
        }
        loadCourseForEdit(targetCourseId);
    }, [mode]);

    const filteredFacultyList = useMemo(() => {
        const query = facultySearch.trim().toLowerCase();
        if (!query) return facultyList;
        return facultyList.filter((faculty) => {
            const haystack = `${faculty.name} ${faculty.department ?? ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [facultyList, facultySearch]);

    const facultyPageSize = 8;
    const facultyTotalPages = Math.max(1, Math.ceil(filteredFacultyList.length / facultyPageSize));
    const safeFacultyPage = Math.min(facultyPage, facultyTotalPages);
    const pagedFacultyList = useMemo(() => {
        const start = (safeFacultyPage - 1) * facultyPageSize;
        return filteredFacultyList.slice(start, start + facultyPageSize);
    }, [filteredFacultyList, safeFacultyPage]);

    useEffect(() => {
        if (facultyPage > facultyTotalPages) {
            setFacultyPage(facultyTotalPages);
        }
    }, [facultyPage, facultyTotalPages]);

    const blockedEdit = mode === 'edit' && !loadingCourse && !courseId;
    const selectedTerm = useMemo(
        () => terms.find((term) => term.id === form.termId) ?? null,
        [terms, form.termId]
    );
    const selectedDepartment = useMemo(
        () => departments.find((department) => department.id === form.departmentId) ?? null,
        [departments, form.departmentId]
    );
    const selectedFaculty = useMemo(() => {
        return selectedFacultyIds
            .map((id) => facultyList.find((faculty) => faculty.id === id))
            .filter(Boolean) as FacultyOption[];
    }, [selectedFacultyIds, facultyList]);
    const primaryFaculty = selectedFaculty[0] ?? null;

    return (
        <DashboardLayout title={mode === 'edit' ? 'Edit Course' : 'Create Course'} activePath="/course-management/courses" onNavigate={onNavigate}>
            <Toast toast={toast} onDismiss={dismiss} />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button onClick={() => onNavigate('/course-management/courses')} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses Catalog
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    {mode === 'edit' ? 'Edit Course' : 'Create Course'}
                </h2>
                <p className="text-muted-foreground mt-1">
                    Set semester, department and faculty assignments in one place.
                </p>
            </motion.div>

            {loadingMeta || loadingCourse ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                    Loading...
                </div>
            ) : blockedEdit ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <p className="text-muted-foreground mb-4">No course selected for editing.</p>
                    <button
                        onClick={() => onNavigate('/course-management/courses')}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                    >
                        Go to Catalog
                    </button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 xl:grid-cols-12 gap-6"
                >
                    <section className="xl:col-span-7 space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <h3 className="font-semibold mb-4">Course Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Course Code</label>
                                        <input
                                            value={form.code}
                                            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                                            placeholder="CS101"
                                            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm font-mono uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Credits</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={form.credits}
                                            onChange={(event) => setForm((prev) => ({ ...prev, credits: Number(event.target.value) || 1 }))}
                                            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Course Name</label>
                                    <input
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        placeholder="Introduction to C"
                                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        label="Semester"
                                        value={form.termId}
                                        onChange={(value) => setForm((prev) => ({ ...prev, termId: value }))}
                                        options={terms.map((term) => ({
                                            value: term.id,
                                            label: term.name,
                                            subtitle: term.sequence ? `Semester ${term.sequence}` : 'No semester number',
                                        }))}
                                        placeholder="Select semester"
                                    />

                                    <CustomSelect
                                        label="Department"
                                        value={form.departmentId}
                                        onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
                                        options={departments.map((dep) => ({
                                            value: dep.id,
                                            label: dep.name,
                                            subtitle: dep.code ?? 'No code',
                                        }))}
                                        placeholder="Select department"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-5">
                            <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                rows={6}
                                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm resize-none"
                                placeholder="Add context, outcomes, grading notes, or course highlights..."
                            />
                        </div>
                    </section>

                    <aside className="xl:col-span-5">
                        <div className="xl:sticky xl:top-24 space-y-4">
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <h3 className="font-semibold mb-3">Course Preview</h3>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="text-muted-foreground">Code:</span>{' '}
                                        <span className="font-medium">{form.code.trim() || '-'}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Name:</span>{' '}
                                        <span className="font-medium">{form.name.trim() || '-'}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Semester:</span>{' '}
                                        <span className="font-medium">
                                            {selectedTerm ? `${selectedTerm.name}${selectedTerm.sequence ? ` (Sem ${selectedTerm.sequence})` : ''}` : '-'}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Department:</span>{' '}
                                        <span className="font-medium">{selectedDepartment?.name ?? '-'}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Primary Faculty:</span>{' '}
                                        <span className="font-medium">{primaryFaculty?.name ?? '-'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold">Assigned Faculty</label>
                                    <span className="text-[11px] text-muted-foreground">
                                        Selected {selectedFacultyIds.length}
                                    </span>
                                </div>

                                <input
                                    value={facultySearch}
                                    onChange={(event) => {
                                        setFacultySearch(event.target.value);
                                        setFacultyPage(1);
                                    }}
                                    placeholder="Search faculty by name or department"
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs mb-2"
                                />

                                {selectedFaculty.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-1.5">
                                        {selectedFaculty.map((faculty, index) => (
                                            <button
                                                key={faculty.id}
                                                onClick={() => toggleFaculty(faculty.id)}
                                                className={`px-2 py-1 rounded-md text-[11px] font-medium border ${
                                                    index === 0
                                                        ? 'border-primary/50 bg-primary/10 text-primary'
                                                        : 'border-border bg-muted/30 text-foreground'
                                                }`}
                                                title={index === 0 ? 'Primary instructor (click to remove)' : 'Click to remove'}
                                            >
                                                {faculty.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {facultyList.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-1">No faculty available.</p>
                                ) : filteredFacultyList.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-1">No faculty match your search.</p>
                                ) : (
                                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                        {pagedFacultyList.map((faculty) => {
                                            const active = selectedFacultyIds.includes(faculty.id);
                                            return (
                                                <button
                                                    key={faculty.id}
                                                    onClick={() => toggleFaculty(faculty.id)}
                                                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left ${
                                                        active
                                                            ? 'border-primary/40 bg-primary/10'
                                                            : 'border-transparent hover:border-border hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{faculty.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{faculty.department ?? 'No Department'}</p>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                                            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {active ? 'Selected' : 'Select'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {filteredFacultyList.length > facultyPageSize && (
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-[11px] text-muted-foreground">
                                            Page {safeFacultyPage} of {facultyTotalPages}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setFacultyPage((prev) => Math.max(1, prev - 1))}
                                                disabled={safeFacultyPage === 1}
                                                className="px-2.5 py-1 rounded-lg border border-border text-xs disabled:opacity-50"
                                            >
                                                Prev
                                            </button>
                                            <button
                                                onClick={() => setFacultyPage((prev) => Math.min(facultyTotalPages, prev + 1))}
                                                disabled={safeFacultyPage === facultyTotalPages}
                                                className="px-2.5 py-1 rounded-lg border border-border text-xs disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    First selected faculty is set as primary instructor.
                                </p>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/50"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={saveCourse}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                                    >
                                        <Save className="w-4 h-4" />
                                        {mode === 'edit' ? 'Update Course' : 'Save Course'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </motion.div>
            )}
        </DashboardLayout>
    );
}
