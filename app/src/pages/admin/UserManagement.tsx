import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import type { StudentAdmissionForm, FacultyAdmissionForm, StudentRow, FacultyRow } from '@/types';
import {
    Users, GraduationCap, UserPlus, Search, X,
    Copy, Check, Eye, EyeOff, Loader2, CheckCircle2,
    AlertCircle, ChevronDown, User, Phone, BookOpen,
    UserCircle, RefreshCw, RotateCcw,
} from 'lucide-react';

interface UserManagementProps {
    onNavigate: (path: string) => void;
}

type UserTab = 'students' | 'faculty';
type ModalType = 'add-student' | 'add-faculty' | null;
type FormSection = 'personal' | 'academic' | 'guardian' | 'credentials';

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

    // Fetch users from Supabase
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const [{ data: s }, { data: f }] = await Promise.all([
            supabase.from('students').select('*').order('name'),
            supabase.from('faculty').select('*').order('name'),
        ]);
        setStudents((s as StudentRow[]) || []);
        setFaculty((f as FacultyRow[]) || []);
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

    // Submit
    const handleSubmit = async () => {
        if (!generatedEmail || !generatedPassword) return;
        setIsSubmitting(true);
        setSubmitResult(null);

        const isStudent = modal === 'add-student';
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (!accessToken) throw new Error('Session expired. Please sign in again.');

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
                    profile: isStudent ? studentForm : facultyForm,
                }),
            });
            const data = await res.json();
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
            if (currentSection === 'personal') return !!(studentForm.name && studentForm.dateOfBirth && studentForm.phone && studentForm.gender);
            if (currentSection === 'academic') return !!(studentForm.rollNumber && studentForm.program && studentForm.department && studentForm.batchYear);
            if (currentSection === 'guardian') return !!(studentForm.fatherName && studentForm.motherName && studentForm.guardianContact);
            if (currentSection === 'credentials') return !!(generatedEmail && generatedPassword);
        } else {
            if (currentSection === 'personal') return !!(facultyForm.name && facultyForm.dateOfBirth && facultyForm.phone);
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
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
            </motion.div>

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
                                        {['Student', 'Roll No.', 'Program', 'Department', 'Sem', 'Email'].map(h => (
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
                                        {['Faculty', 'Emp. ID', 'Department', 'Designation', 'Qualification', 'Email'].map(h => (
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
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </motion.div>
            )}

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
    section, form, onChange, generatedEmail, setGeneratedEmail,
    generatedPassword, setGeneratedPassword, showPassword, setShowPassword,
}: {
    section: FormSection;
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
                        <Field label="Date of Birth *" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
                        <SelectField label="Gender *" value={form.gender} onChange={v => set('gender', v as any)}
                            options={['Male', 'Female', 'Other']} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9XXXXXXXXX" type="tel" />
                        <SelectField label="Blood Group" value={form.bloodGroup} onChange={v => set('bloodGroup', v)}
                            options={['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
                    </div>
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
                        options={['', 'Computer Science & Engineering', 'Electronics & Communication', 'Electrical Engineering',
                            'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Data Science', 'Artificial Intelligence']} />
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
                    <Field label="Guardian Contact *" value={form.guardianContact} onChange={v => set('guardianContact', v)} placeholder="+91 9XXXXXXXXX" type="tel" />
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
    section, form, onChange, generatedEmail, setGeneratedEmail,
    generatedPassword, setGeneratedPassword, showPassword, setShowPassword,
}: {
    section: FormSection;
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
                        <Field label="Date of Birth *" value={form.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
                        <SelectField label="Gender *" value={form.gender} onChange={v => set('gender', v as any)} options={['Male', 'Female', 'Other']} />
                    </div>
                    <Field label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9XXXXXXXXX" type="tel" />
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
                        options={['', 'Computer Science & Engineering', 'Electronics & Communication', 'Electrical Engineering',
                            'Mechanical Engineering', 'Civil Engineering', 'Information Technology', 'Data Science', 'Artificial Intelligence']} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Qualification *" value={form.qualification} onChange={v => set('qualification', v)} placeholder="e.g. Ph.D, M.Tech" />
                        <Field label="Date of Joining *" value={form.dateOfJoining} onChange={v => set('dateOfJoining', v)} type="date" />
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

function SelectField({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <div className="relative">
                <select value={value} onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {options.map(opt => <option key={opt} value={opt}>{opt || '— Select —'}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
        </div>
    );
}
