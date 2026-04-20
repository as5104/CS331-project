import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { format } from 'date-fns';
import type { StudentAdmissionForm, FacultyAdmissionForm, StudentRow, FacultyRow } from '@/types';
import {
    Users, GraduationCap, UserPlus, Search, X,
    Copy, Check, Eye, EyeOff, Loader2, CheckCircle2,
    AlertCircle, User, Phone, BookOpen,
    UserCircle, RefreshCw, RotateCcw, Pencil, Trash2,
} from 'lucide-react';

interface UserManagementProps {
    onNavigate: (path: string) => void;
}

type UserTab = 'students' | 'faculty';
type ModalType = 'add-student' | 'add-faculty' | null;
type FormSection = 'personal' | 'academic' | 'guardian' | 'credentials';

interface StudentEditForm {
    id: string;
    name: string;
    roll_number: string;
    program: string;
    department: string;
    semester: number;
    batch_year: string;
    phone: string;
}

interface FacultyEditForm {
    id: string;
    name: string;
    employee_id: string;
    department: string;
    designation: string;
    qualification: string;
    phone: string;
}

// Utilities

function generatePassword(length = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '@#$%!';
    const all = upper + lower + digits + special;
    let password =
        upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

function generateStudentEmail(rollNumber: string, domain = 'university.edu'): string {
    return `${rollNumber.toLowerCase().replace(/\s+/g, '')}@${domain}`;
}

function generateFacultyEmail(employeeId: string, domain = 'university.edu'): string {
    return `${employeeId.toLowerCase().replace(/\s+/g, '')}@${domain}`;
}

function extractIndianPhoneDigits(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('91')) {
        return digits.slice(2, 12);
    }
    return digits.slice(0, 10);
}

function toCanonicalIndianPhone(value: string): string {
    const digits = extractIndianPhoneDigits(value);
    return digits.length === 10 ? `+91${digits}` : '';
}

function toIndianPhoneState(value: string): string {
    const digits = extractIndianPhoneDigits(value);
    return digits ? `+91${digits}` : '';
}

function isValidIndianPhone(value: string): boolean {
    return toCanonicalIndianPhone(value) !== '';
}

// Empty Forms

const emptyStudentForm: StudentAdmissionForm = {
    name: '', dateOfBirth: '', gender: 'Male', bloodGroup: '', phone: '',
    rollNumber: '', program: '', department: '', batchYear: new Date().getFullYear().toString(),
    semester: 1, institution: 'Tech University',
    fatherName: '', motherName: '', guardianContact: '',
};

const emptyFacultyForm: FacultyAdmissionForm = {
    name: '', dateOfBirth: '', gender: 'Male', phone: '',
    employeeId: '', department: '', designation: 'Assistant Professor',
    qualification: '', dateOfJoining: '', institution: 'Tech University',
};

// CopyButton Helper

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Copy"
        >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
        </button>
    );
}

// Section Stepper

const studentSections: { id: FormSection; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'academic', label: 'Academic' },
    { id: 'guardian', label: 'Guardian' },
    { id: 'credentials', label: 'Credentials' },
];

const facultySections: { id: FormSection; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'academic', label: 'Professional' },
    { id: 'credentials', label: 'Credentials' },
];

// Main Component

export function UserManagement({ onNavigate }: UserManagementProps) {
    const [activeTab, setActiveTab] = useState<UserTab>('students');
    const [modal, setModal] = useState<ModalType>(null);
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [faculty, setFaculty] = useState<FacultyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

    // Form state
    const [studentForm, setStudentForm] = useState<StudentAdmissionForm>(emptyStudentForm);
    const [facultyForm, setFacultyForm] = useState<FacultyAdmissionForm>(emptyFacultyForm);
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [currentSection, setCurrentSection] = useState<FormSection>('personal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
    const [studentEditForm, setStudentEditForm] = useState<StudentEditForm | null>(null);
    const [facultyEditForm, setFacultyEditForm] = useState<FacultyEditForm | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; role: 'student' | 'faculty'; name: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const studentEditPhoneInvalid = !!studentEditForm?.phone?.trim() && !isValidIndianPhone(studentEditForm.phone);
    const facultyEditPhoneInvalid = !!facultyEditForm?.phone?.trim() && !isValidIndianPhone(facultyEditForm.phone);

    const parseApiPayload = useCallback(async (res: Response): Promise<any> => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return res.json();
        }

        const text = await res.text();
        if (text.trim().startsWith('<!DOCTYPE')) {
            return {
                error: 'API route is not available (HTML returned). Restart API server (npm run dev:api) and try again.',
            };
        }

        return { error: text || `Request failed with status ${res.status}` };
    }, []);

    // Fetch users from Supabase
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        const [{ data: s, error: studentsError }, { data: f, error: facultyError }, { data: d, error: departmentsError }] = await Promise.all([
            supabase.from('students').select('*').order('name'),
            supabase.from('faculty').select('*').order('name'),
            supabase.from('departments').select('name').order('name'),
        ]);

        if (studentsError || facultyError) {
            const parts = [
                studentsError ? `Students: ${studentsError.message}` : null,
                facultyError ? `Faculty: ${facultyError.message}` : null,
            ].filter(Boolean);
            setLoadError(parts.join(' | ') || 'Failed to fetch users.');
            console.error('UserManagement fetchUsers error', { studentsError, facultyError });
        }

        setStudents((s as StudentRow[]) || []);
        setFaculty((f as FacultyRow[]) || []);
        if (!departmentsError && Array.isArray(d)) {
            const names = Array.from(
                new Set(
                    d.map((row: { name: string | null }) => (row.name ?? '').trim()).filter(Boolean)
                )
            );
            setDepartmentOptions(names);
        } else {
            setDepartmentOptions([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Auto-generate credentials when IDs change
    useEffect(() => {
        if (modal === 'add-student' && studentForm.rollNumber) {
            setGeneratedEmail(generateStudentEmail(studentForm.rollNumber));
        }
    }, [studentForm.rollNumber, modal]);

    useEffect(() => {
        if (modal === 'add-faculty' && facultyForm.employeeId) {
            setGeneratedEmail(generateFacultyEmail(facultyForm.employeeId));
        }
    }, [facultyForm.employeeId, modal]);

    const openModal = (type: ModalType) => {
        setModal(type);
        setStudentForm(emptyStudentForm);
        setFacultyForm(emptyFacultyForm);
        setGeneratedEmail('');
        setGeneratedPassword(generatePassword());
        setCurrentSection('personal');
        setSubmitResult(null);
        setCreatedCredentials(null);
        setShowPassword(false);
    };

    const closeModal = () => {
        setModal(null);
        setSubmitResult(null);
        setCreatedCredentials(null);
    };

    const getAccessToken = useCallback(async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
            throw new Error('Session expired. Please sign in again.');
        }
        return accessToken;
    }, []);

    const saveStudentEdit = useCallback(async () => {
        if (!studentEditForm) return;
        const phone = toCanonicalIndianPhone(studentEditForm.phone);
        if (studentEditForm.phone.trim() && !phone) {
            setLoadError('Phone number must be +91 followed by exactly 10 digits.');
            return;
        }
        setLoadError(null);
        setActionLoading(true);
        try {
            const accessToken = await getAccessToken();
            const res = await fetch('/api/manage-user', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    role: 'student',
                    id: studentEditForm.id,
                    updates: {
                        name: studentEditForm.name.trim(),
                        roll_number: studentEditForm.roll_number.trim(),
                        program: studentEditForm.program.trim(),
                        department: studentEditForm.department.trim(),
                        semester: Number(studentEditForm.semester),
                        batch_year: studentEditForm.batch_year.trim(),
                        phone,
                    },
                }),
            });
            const data = await parseApiPayload(res);
            if (!res.ok) throw new Error(data.error || 'Failed to update student.');
            setStudentEditForm(null);
            await fetchUsers();
        } catch (err: any) {
            setLoadError(err.message || 'Failed to update student.');
        } finally {
            setActionLoading(false);
        }
    }, [studentEditForm, fetchUsers, getAccessToken, parseApiPayload]);

    const saveFacultyEdit = useCallback(async () => {
        if (!facultyEditForm) return;
        const phone = toCanonicalIndianPhone(facultyEditForm.phone);
        if (facultyEditForm.phone.trim() && !phone) {
            setLoadError('Phone number must be +91 followed by exactly 10 digits.');
            return;
        }
        setLoadError(null);
        setActionLoading(true);
        try {
            const accessToken = await getAccessToken();
            const res = await fetch('/api/manage-user', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    role: 'faculty',
                    id: facultyEditForm.id,
                    updates: {
                        name: facultyEditForm.name.trim(),
                        employee_id: facultyEditForm.employee_id.trim(),
                        department: facultyEditForm.department.trim(),
                        designation: facultyEditForm.designation.trim(),
                        qualification: facultyEditForm.qualification.trim(),
                        phone,
                    },
                }),
            });
            const data = await parseApiPayload(res);
            if (!res.ok) throw new Error(data.error || 'Failed to update faculty.');
            setFacultyEditForm(null);
            await fetchUsers();
        } catch (err: any) {
            setLoadError(err.message || 'Failed to update faculty.');
        } finally {
            setActionLoading(false);
        }
    }, [facultyEditForm, fetchUsers, getAccessToken, parseApiPayload]);

    const deleteUser = useCallback(async () => {
        if (!deleteTarget) return;
        setLoadError(null);
        setActionLoading(true);
        try {
            const accessToken = await getAccessToken();
            const res = await fetch('/api/manage-user', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    role: deleteTarget.role,
                    id: deleteTarget.id,
                }),
            });
            const data = await parseApiPayload(res);
            if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
            setDeleteTarget(null);
            setStudentEditForm(null);
            setFacultyEditForm(null);
            await fetchUsers();
        } catch (err: any) {
            setLoadError(err.message || 'Failed to delete user.');
        } finally {
            setActionLoading(false);
        }
    }, [deleteTarget, fetchUsers, getAccessToken, parseApiPayload]);

    // Submit
    const handleSubmit = async () => {
        if (!generatedEmail || !generatedPassword) return;
        setIsSubmitting(true);
        setSubmitResult(null);

        const isStudent = modal === 'add-student';
        if (isStudent) {
            const phone = toCanonicalIndianPhone(studentForm.phone);
            const guardianContact = toCanonicalIndianPhone(studentForm.guardianContact);
            if (!phone) {
                setSubmitResult({ success: false, message: 'Student phone must be +91 followed by exactly 10 digits.' });
                setIsSubmitting(false);
                return;
            }
            if (!guardianContact) {
                setSubmitResult({ success: false, message: 'Guardian contact must be +91 followed by exactly 10 digits.' });
                setIsSubmitting(false);
                return;
            }
        } else {
            const phone = toCanonicalIndianPhone(facultyForm.phone);
            if (!phone) {
                setSubmitResult({ success: false, message: 'Faculty phone must be +91 followed by exactly 10 digits.' });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) throw new Error('Session expired. Please sign in again.');

            const studentProfilePayload = {
                ...studentForm,
                phone: toCanonicalIndianPhone(studentForm.phone),
                guardianContact: toCanonicalIndianPhone(studentForm.guardianContact),
            };

            const facultyProfilePayload = {
                ...facultyForm,
                phone: toCanonicalIndianPhone(facultyForm.phone),
            };

            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    email: generatedEmail,
                    password: generatedPassword,
                    role: isStudent ? 'student' : 'faculty',
                    profile: isStudent ? studentProfilePayload : facultyProfilePayload,
                }),
            });
            const data = await parseApiPayload(res);
            if (!res.ok) throw new Error(data.error || 'Failed to create user');
            setCreatedCredentials({ email: generatedEmail, password: generatedPassword });
            setSubmitResult({ success: true, message: `${isStudent ? 'Student' : 'Faculty'} account created successfully!` });
            fetchUsers(); // refresh list
        } catch (err: any) {
            setSubmitResult({ success: false, message: err.message || 'Something went wrong.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helpers
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
    const filteredFaculty = faculty.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase())
    );

    const sections = modal === 'add-student' ? studentSections : facultySections;
    const sectionIndex = sections.findIndex(s => s.id === currentSection);
    const isLastSection = sectionIndex === sections.length - 1;
    const isFirstSection = sectionIndex === 0;

    const canProceedFromSection = (): boolean => {
        if (modal === 'add-student') {
            if (currentSection === 'personal') return !!(studentForm.name && studentForm.dateOfBirth && studentForm.phone && studentForm.gender) && isValidIndianPhone(studentForm.phone);
            if (currentSection === 'academic') return !!(studentForm.rollNumber && studentForm.program && studentForm.department && studentForm.batchYear);
            if (currentSection === 'guardian') return !!(studentForm.fatherName && studentForm.motherName && studentForm.guardianContact) && isValidIndianPhone(studentForm.guardianContact);
            if (currentSection === 'credentials') return !!(generatedEmail && generatedPassword);
        } else {
            if (currentSection === 'personal') return !!(facultyForm.name && facultyForm.dateOfBirth && facultyForm.phone) && isValidIndianPhone(facultyForm.phone);
            if (currentSection === 'academic') return !!(facultyForm.employeeId && facultyForm.department && facultyForm.designation && facultyForm.qualification && facultyForm.dateOfJoining);
            if (currentSection === 'credentials') return !!(generatedEmail && generatedPassword);
        }
        return true;
    };

    const goNext = () => {
        const next = sections[sectionIndex + 1];
        if (next) { setCurrentSection(next.id); }
    };
    const goPrev = () => {
        const prev = sections[sectionIndex - 1];
        if (prev) setCurrentSection(prev.id);
    };

    // Render
    return (
        <DashboardLayout title="User Management" activePath="/users" onNavigate={onNavigate}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">User Management</h2>
                        <p className="text-muted-foreground mt-1">Onboard and manage students and faculty.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={fetchUsers}
                            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
                            title="Refresh">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('add-student')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
                            <UserPlus className="w-4 h-4" />Add Student
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => openModal('add-faculty')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors">
                            <UserPlus className="w-4 h-4" />Add Faculty
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Tabs + Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex bg-muted rounded-xl p-1 gap-1">
                    {(['students', 'faculty'] as UserTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                            {tab === 'students' ? <GraduationCap className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                {tab === 'students' ? students.length : faculty.length}
                            </span>
                        </button>
                    ))}
                </div>
                {departmentOptions.length === 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        No departments configured yet. Add departments in Courses / Departments before onboarding users.
                    </div>
                )}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
            </motion.div>

            {loadError && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {loadError}
                </motion.div>
            )}

            {/* User Table */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl border border-border overflow-hidden">
                    {activeTab === 'students' ? (
                        filteredStudents.length === 0 ? (
                            <EmptyState type="students" onAdd={() => openModal('add-student')} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-border bg-muted/30">
                                        {['Student', 'Roll No.', 'Program', 'Department', 'Sem', 'Email', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStudents.map((s, i) => (
                                            <motion.tr key={s.id || s.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={s.avatar || `https://api.dicebear.com/9.x/dylan/svg?seed=${s.name}`}
                                                            alt={s.name} className="w-9 h-9 rounded-full border border-border flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-sm">{s.name}</p>
                                                            <p className="text-xs text-muted-foreground">{s.batch_year ? `Batch ${s.batch_year}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{s.roll_number}</td>
                                                <td className="px-4 py-3 text-sm">{s.program}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{s.department}</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{s.semester}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[160px]">{s.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setStudentEditForm({
                                                                id: s.id,
                                                                name: s.name ?? '',
                                                                roll_number: s.roll_number ?? '',
                                                                program: s.program ?? '',
                                                                department: s.department ?? '',
                                                                semester: Number(s.semester) || 1,
                                                                batch_year: s.batch_year ?? '',
                                                                phone: toIndianPhoneState(s.phone ?? ''),
                                                            })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: s.id, role: 'student', name: s.name })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        filteredFaculty.length === 0 ? (
                            <EmptyState type="faculty" onAdd={() => openModal('add-faculty')} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-border bg-muted/30">
                                        {['Faculty', 'Emp. ID', 'Department', 'Designation', 'Qualification', 'Email', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredFaculty.map((f, i) => (
                                            <motion.tr key={f.id || f.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04 }} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={f.avatar || `https://api.dicebear.com/9.x/dylan/svg?seed=${f.name}faculty`}
                                                            alt={f.name} className="w-9 h-9 rounded-full border border-border" />
                                                        <p className="font-medium text-sm">{f.name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{f.employee_id}</td>
                                                <td className="px-4 py-3 text-sm">{f.department}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{f.designation}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{f.qualification}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[160px]">{f.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setFacultyEditForm({
                                                                id: f.id,
                                                                name: f.name ?? '',
                                                                employee_id: f.employee_id ?? '',
                                                                department: f.department ?? '',
                                                                designation: f.designation ?? '',
                                                                qualification: f.qualification ?? '',
                                                                phone: toIndianPhoneState(f.phone ?? ''),
                                                            })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget({ id: f.id, role: 'faculty', name: f.name })}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </motion.div>
            )}

            {/* Edit Student Modal */}
            <AnimatePresence>
                {studentEditForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setStudentEditForm(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-5 border-b border-border flex items-center justify-between">
                                    <h3 className="font-semibold">Edit Student</h3>
                                    <button onClick={() => setStudentEditForm(null)} className="p-2 rounded-xl hover:bg-muted">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-3">
                                    <Field label="Name *" value={studentEditForm.name} onChange={v => setStudentEditForm({ ...studentEditForm, name: v })} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Roll Number *" value={studentEditForm.roll_number} onChange={v => setStudentEditForm({ ...studentEditForm, roll_number: v })} />
                                        <Field label="Program *" value={studentEditForm.program} onChange={v => setStudentEditForm({ ...studentEditForm, program: v })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <SelectField
                                            label="Department *"
                                            value={studentEditForm.department}
                                            onChange={v => setStudentEditForm({ ...studentEditForm, department: v })}
                                            options={['', ...departmentOptions]}
                                        />
                                        <SelectField
                                            label="Semester *"
                                            value={String(studentEditForm.semester)}
                                            onChange={v => setStudentEditForm({ ...studentEditForm, semester: Number(v) })}
                                            options={['1', '2', '3', '4', '5', '6', '7', '8']}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Batch Year *" value={studentEditForm.batch_year} onChange={v => setStudentEditForm({ ...studentEditForm, batch_year: v })} />
                                        <div>
                                            <PhoneInputField label="Phone" value={studentEditForm.phone} onChange={v => setStudentEditForm({ ...studentEditForm, phone: v })} />
                                            {studentEditPhoneInvalid && (
                                                <p className="text-xs text-red-600 mt-1">Phone must be +91 followed by exactly 10 digits.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 border-t border-border flex gap-3">
                                    <button
                                        onClick={() => setStudentEditForm(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveStudentEdit}
                                        disabled={actionLoading || studentEditPhoneInvalid}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                                    >
                                        {actionLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Faculty Modal */}
            <AnimatePresence>
                {facultyEditForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFacultyEditForm(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-5 border-b border-border flex items-center justify-between">
                                    <h3 className="font-semibold">Edit Faculty</h3>
                                    <button onClick={() => setFacultyEditForm(null)} className="p-2 rounded-xl hover:bg-muted">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-3">
                                    <Field label="Name *" value={facultyEditForm.name} onChange={v => setFacultyEditForm({ ...facultyEditForm, name: v })} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Employee ID *" value={facultyEditForm.employee_id} onChange={v => setFacultyEditForm({ ...facultyEditForm, employee_id: v })} />
                                        <div>
                                            <PhoneInputField label="Phone" value={facultyEditForm.phone} onChange={v => setFacultyEditForm({ ...facultyEditForm, phone: v })} />
                                            {facultyEditPhoneInvalid && (
                                                <p className="text-xs text-red-600 mt-1">Phone must be +91 followed by exactly 10 digits.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <SelectField
                                            label="Department *"
                                            value={facultyEditForm.department}
                                            onChange={v => setFacultyEditForm({ ...facultyEditForm, department: v })}
                                            options={['', ...departmentOptions]}
                                        />
                                        <SelectField
                                            label="Designation *"
                                            value={facultyEditForm.designation}
                                            onChange={v => setFacultyEditForm({ ...facultyEditForm, designation: v })}
                                            options={['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor']}
                                        />
                                    </div>
                                    <Field label="Qualification" value={facultyEditForm.qualification} onChange={v => setFacultyEditForm({ ...facultyEditForm, qualification: v })} />
                                </div>
                                <div className="p-5 border-t border-border flex gap-3">
                                    <button
                                        onClick={() => setFacultyEditForm(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveFacultyEdit}
                                        disabled={actionLoading || facultyEditPhoneInvalid}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                                    >
                                        {actionLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
                            >
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="font-semibold text-lg">Delete {deleteTarget.role === 'student' ? 'Student' : 'Faculty'}?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This will permanently remove <span className="font-medium text-foreground">{deleteTarget.name}</span> and all related data.
                                </p>
                                <div className="mt-5 flex gap-3">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={deleteUser}
                                        disabled={actionLoading}
                                        className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                                    >
                                        {actionLoading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Add User Modal */}
            <AnimatePresence>
                {modal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />

                        {/* Centered popup */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                className="relative w-full max-w-xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">

                                {/* Modal Header */}
                                <div className={`p-5 border-b border-border flex items-center justify-between flex-shrink-0
                ${modal === 'add-student' ? 'bg-blue-50/50' : 'bg-purple-50/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${modal === 'add-student' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                            <UserPlus className={`w-5 h-5 ${modal === 'add-student' ? 'text-blue-600' : 'text-purple-600'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{modal === 'add-student' ? 'Admit New Student' : 'Onboard Faculty Member'}</h3>
                                            <p className="text-xs text-muted-foreground">Fill all required fields (*)</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Progress Stepper */}
                                <div className="px-5 py-4 border-b border-border flex-shrink-0">
                                    <div className="flex items-center gap-1">
                                        {sections.map((sec, idx) => {
                                            const isActive = sec.id === currentSection;
                                            const isDone = idx < sectionIndex;
                                            return (
                                                <div key={sec.id} className="flex items-center flex-1">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                            {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                                        </div>
                                                        <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{sec.label}</span>
                                                    </div>
                                                    {idx < sections.length - 1 && (
                                                        <div className={`flex-1 h-0.5 mx-1 mb-3 rounded-full transition-colors ${isDone ? 'bg-emerald-400' : 'bg-muted'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Form Body */}
                                <div className="flex-1 overflow-y-auto p-5">
                                    <AnimatePresence mode="wait">
                                        {modal === 'add-student' ? (
                                            <StudentFormSections
                                                key={`student-${currentSection}`}
                                                section={currentSection}
                                                departments={departmentOptions}
                                                form={studentForm}
                                                onChange={setStudentForm}
                                                generatedEmail={generatedEmail}
                                                setGeneratedEmail={setGeneratedEmail}
                                                generatedPassword={generatedPassword}
                                                setGeneratedPassword={setGeneratedPassword}
                                                showPassword={showPassword}
                                                setShowPassword={setShowPassword}
                                            />
                                        ) : (
                                            <FacultyFormSections
                                                key={`faculty-${currentSection}`}
                                                section={currentSection}
                                                departments={departmentOptions}
                                                form={facultyForm}
                                                onChange={setFacultyForm}
                                                generatedEmail={generatedEmail}
                                                setGeneratedEmail={setGeneratedEmail}
                                                generatedPassword={generatedPassword}
                                                setGeneratedPassword={setGeneratedPassword}
                                                showPassword={showPassword}
                                                setShowPassword={setShowPassword}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Result Banner */}
                                    {submitResult && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className={`mt-4 p-4 rounded-xl border flex items-start gap-3
                      ${submitResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                            {submitResult.success
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                            <p className={`text-sm ${submitResult.success ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {submitResult.message}
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Credential Card (shown after success) */}
                                    {createdCredentials && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                                            <p className="text-sm font-semibold text-emerald-800 mb-3">⚠️ Save these credentials now — they won't be shown again!</p>
                                            {[
                                                { label: 'University Email', value: createdCredentials.email },
                                                { label: 'Password', value: createdCredentials.password },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center justify-between bg-white rounded-lg border border-emerald-200 px-3 py-2 mb-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                                        <p className="text-sm font-mono font-medium">{item.value}</p>
                                                    </div>
                                                    <CopyButton value={item.value} />
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-5 border-t border-border flex-shrink-0 flex justify-between gap-3">
                                    {!createdCredentials ? (
                                        <>
                                            <button onClick={isFirstSection ? closeModal : goPrev}
                                                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                                                {isFirstSection ? 'Cancel' : '← Back'}
                                            </button>
                                            {isLastSection ? (
                                                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting || !canProceedFromSection()}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium transition-colors
                          ${modal === 'add-student' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
                          disabled:opacity-60 disabled:cursor-not-allowed`}>
                                                    {isSubmitting
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                                                        : <><CheckCircle2 className="w-4 h-4" /> Create Account</>}
                                                </motion.button>
                                            ) : (
                                                <button onClick={goNext} disabled={!canProceedFromSection()}
                                                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${modal === 'add-student' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                                    Next →
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                                                Close
                                            </button>
                                            <button onClick={() => {
                                                setCreatedCredentials(null); setSubmitResult(null); setCurrentSection('personal');
                                                setStudentForm(emptyStudentForm); setFacultyForm(emptyFacultyForm);
                                                setGeneratedPassword(generatePassword()); setGeneratedEmail('');
                                            }}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                                                <RotateCcw className="w-4 h-4" />Add Another
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

// EmptyState

function EmptyState({ type, onAdd }: { type: string; onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                {type === 'students' ? <GraduationCap className="w-8 h-8 text-muted-foreground" /> : <Users className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h3 className="font-semibold mb-1">No {type} yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start by onboarding your first {type === 'students' ? 'student' : 'faculty member'}.</p>
            <button onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                <UserPlus className="w-4 h-4" />Add {type === 'students' ? 'Student' : 'Faculty'}
            </button>
        </div>
    );
}

// Student Form Sections

function StudentFormSections({
    section, departments, form, onChange, generatedEmail, setGeneratedEmail,
    generatedPassword, setGeneratedPassword, showPassword, setShowPassword,
}: {
    section: FormSection;
    departments: string[];
    form: StudentAdmissionForm;
    onChange: (f: StudentAdmissionForm) => void;
    generatedEmail: string; setGeneratedEmail: (v: string) => void;
    generatedPassword: string; setGeneratedPassword: (v: string) => void;
    showPassword: boolean; setShowPassword: (v: boolean) => void;
}) {
    const set = (key: keyof StudentAdmissionForm, value: any) => onChange({ ...form, [key]: value });

    return (
        <motion.div key={section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            {section === 'personal' && (
                <>
                    <SectionHeader icon={User} title="Personal Information" />
                    <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Ananya Sharma" />
                    <div className="grid grid-cols-2 gap-3">
                        <DateField label="Date of Birth *" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
                        <SelectField label="Gender *" value={form.gender} onChange={v => set('gender', v as any)}
                            options={['Male', 'Female', 'Other']} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <PhoneInputField label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} />
                        <SelectField label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)}
                            options={['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
                    </div>
                    {form.phone && !isValidIndianPhone(form.phone) && (
                        <p className="text-xs text-red-600">Phone must be +91 followed by exactly 10 digits.</p>
                    )}
                </>
            )}
            {section === 'academic' && (
                <>
                    <SectionHeader icon={BookOpen} title="Academic Information" />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Roll Number *" value={form.rollNumber} onChange={v => set('rollNumber', v)} placeholder="e.g. CS2024001" />
                        <SelectField label="Starting Semester *" value={String(form.semester)} onChange={v => set('semester', Number(v))}
                            options={['1', '2', '3', '4', '5', '6', '7', '8']} />
                    </div>
                    <SelectField label="Program *" value={form.program} onChange={v => set('program', v)}
                        options={['', 'B.Tech', 'M.Tech', 'MBA', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'Ph.D']} />
                    <SelectField label="Department / Branch *" value={form.department} onChange={v => set('department', v)}
                        options={['', ...departments]} />
                    {departments.length === 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Departments are empty. Add departments first from Courses / Departments.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Batch Year *" value={form.batchYear} onChange={v => set('batchYear', v)} placeholder="e.g. 2024" type="number" />
                        <Field label="Institution" value={form.institution} onChange={v => set('institution', v)} placeholder="University name" />
                    </div>
                </>
            )}
            {section === 'guardian' && (
                <>
                    <SectionHeader icon={Users} title="Guardian Information" />
                    <Field label="Father's Name *" value={form.fatherName} onChange={v => set('fatherName', v)} placeholder="Father's full name" />
                    <Field label="Mother's Name *" value={form.motherName} onChange={v => set('motherName', v)} placeholder="Mother's full name" />
                    <PhoneInputField label="Guardian Contact *" value={form.guardianContact} onChange={v => set('guardianContact', v)} />
                    {form.guardianContact && !isValidIndianPhone(form.guardianContact) && (
                        <p className="text-xs text-red-600">Guardian contact must be +91 followed by exactly 10 digits.</p>
                    )}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <strong>Note:</strong> CGPA and attendance will start at 0. Courses will be assigned by faculty after enrollment.
                    </div>
                </>
            )}
            {section === 'credentials' && (
                <CredentialsSection
                    email={generatedEmail} setEmail={setGeneratedEmail}
                    password={generatedPassword} setPassword={setGeneratedPassword}
                    showPassword={showPassword} setShowPassword={setShowPassword}
                    hint={`Generated from roll number. Format: rollno@university.edu`}
                />
            )}
        </motion.div>
    );
}

// Faculty Form Sections

function FacultyFormSections({
    section, departments, form, onChange, generatedEmail, setGeneratedEmail,
    generatedPassword, setGeneratedPassword, showPassword, setShowPassword,
}: {
    section: FormSection;
    departments: string[];
    form: FacultyAdmissionForm;
    onChange: (f: FacultyAdmissionForm) => void;
    generatedEmail: string; setGeneratedEmail: (v: string) => void;
    generatedPassword: string; setGeneratedPassword: (v: string) => void;
    showPassword: boolean; setShowPassword: (v: boolean) => void;
}) {
    const set = (key: keyof FacultyAdmissionForm, value: any) => onChange({ ...form, [key]: value });

    return (
        <motion.div key={section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            {section === 'personal' && (
                <>
                    <SectionHeader icon={User} title="Personal Information" />
                    <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Dr. Rajesh Kumar" />
                    <div className="grid grid-cols-2 gap-3">
                        <DateField label="Date of Birth *" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} />
                        <SelectField label="Gender *" value={form.gender} onChange={v => set('gender', v as any)} options={['Male', 'Female', 'Other']} />
                    </div>
                    <PhoneInputField label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} />
                    {form.phone && !isValidIndianPhone(form.phone) && (
                        <p className="text-xs text-red-600">Phone must be +91 followed by exactly 10 digits.</p>
                    )}
                </>
            )}
            {section === 'academic' && (
                <>
                    <SectionHeader icon={BookOpen} title="Professional Details" />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Employee ID *" value={form.employeeId} onChange={v => set('employeeId', v)} placeholder="e.g. FAC2024001" />
                        <SelectField label="Designation *" value={form.designation} onChange={v => set('designation', v as any)}
                            options={['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor']} />
                    </div>
                    <SelectField label="Department *" value={form.department} onChange={v => set('department', v)}
                        options={['', ...departments]} />
                    {departments.length === 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Departments are empty. Add departments first from Courses / Departments.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Qualification *" value={form.qualification} onChange={v => set('qualification', v)} placeholder="e.g. Ph.D, M.Tech" />
                        <DateField label="Date of Joining *" value={form.dateOfJoining} onChange={v => set('dateOfJoining', v)} />
                    </div>
                    <Field label="Institution" value={form.institution} onChange={v => set('institution', v)} placeholder="University name" />
                </>
            )}
            {section === 'credentials' && (
                <CredentialsSection
                    email={generatedEmail} setEmail={setGeneratedEmail}
                    password={generatedPassword} setPassword={setGeneratedPassword}
                    showPassword={showPassword} setShowPassword={setShowPassword}
                    hint="Generated from Employee ID. Format: employeeid@university.edu"
                />
            )}
        </motion.div>
    );
}

// CredentialsSection

function CredentialsSection({ email, setEmail, password, setPassword, showPassword, setShowPassword, hint }: {
    email: string; setEmail: (v: string) => void;
    password: string; setPassword: (v: string) => void;
    showPassword: boolean; setShowPassword: (v: boolean) => void;
    hint: string;
}) {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <SectionHeader icon={Phone} title="Login Credentials" />
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ <strong>Important:</strong> These credentials will only be shown once. Please note them down before submitting.
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5">University Email *</label>
                <div className="flex items-center gap-2">
                    <input value={email} onChange={e => setEmail(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="auto-generated from roll/employee ID" />
                    <CopyButton value={email} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5">Password *</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            type={showPassword ? 'text' : 'password'}
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-muted/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <CopyButton value={password} />
                    <button type="button" onClick={() => setPassword(generatePassword())}
                        className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors" title="Regenerate">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Auto-generated strong password. You can edit or regenerate it.</p>
            </div>
        </motion.div>
    );
}

// Reusable Fields

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
            <Icon className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">{title}</h4>
        </div>
    );
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
    );
}

function PhoneInputField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    const digits = extractIndianPhoneDigits(value);

    return (
        <div>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <div className="flex items-center rounded-xl border border-border bg-muted/50 overflow-hidden transition-all">
                <span className="px-3 py-2.5 text-sm font-medium text-muted-foreground border-r border-border select-none">+91</span>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={digits}
                    onChange={(e) => {
                        const nextDigits = extractIndianPhoneDigits(e.target.value);
                        onChange(nextDigits ? `+91${nextDigits}` : '');
                    }}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2.5 bg-transparent text-sm border-0 shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0"
                />
            </div>
        </div>
    );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const dateValue = value ? new Date(value) : undefined;
    const handleChange = (d: Date | undefined) => {
        onChange(d ? format(d, 'yyyy-MM-dd') : '');
    };
    return (
        <CustomDatePicker
            label={label}
            value={dateValue}
            onChange={handleChange}
        />
    );
}

function SelectField({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
    return (
        <CustomSelect
            label={label}
            value={value}
            onChange={onChange}
            options={options.map(opt => ({ value: opt, label: opt || '— Select —' }))}
        />
    );
}
