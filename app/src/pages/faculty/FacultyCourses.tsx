import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import type { Faculty, Course } from '@/types';
import {
    BookOpen, Users, FileText, Upload, Search,
    ChevronRight, GraduationCap, Clock, Plus, X,
    File, CheckCircle2,
} from 'lucide-react';

interface FacultyCoursesProps {
    onNavigate: (path: string) => void;
}

export function FacultyCourses({ onNavigate }: FacultyCoursesProps) {
    const { user } = useAuth();
    const faculty = user as Faculty;
    const courses: Course[] = Array.isArray(faculty?.courses) ? faculty.courses : [];
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [uploadModal, setUploadModal] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const filtered = courses.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    // Mock students enrolled per course
    const enrolledCounts: Record<string, number> = {};
    courses.forEach(c => {
        enrolledCounts[c.id || c.code] = 15 + Math.floor(Math.random() * 40);
    });

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
                    { label: 'Total Courses', value: courses.length, icon: BookOpen, iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
                    { label: 'Total Students', value: Object.values(enrolledCounts).reduce((a, b) => a + b, 0), icon: Users, iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
                    { label: 'Materials Uploaded', value: courses.length * 3, icon: FileText, iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
                    { label: 'This Semester', value: courses.filter(c => c.semester).length || courses.length, icon: Clock, iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
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

            {/* Course Grid */}
            {filtered.length === 0 ? (
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
                        <motion.div key={course.id || course.code}
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.06 }}
                            whileHover={{ y: -2 }}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:border-purple-200 transition-all cursor-pointer group"
                            onClick={() => setSelectedCourse(course)}
                        >
                            {/* Course accent */}
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
                                        <Users className="w-3.5 h-3.5" /> {enrolledCounts[course.id || course.code] || 0} Students
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); setUploadModal(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
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

            {/* ── Upload Material Modal ─────────────────────────────────────── */}
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

                                <div className="p-5 border-b border-border flex items-center justify-between bg-purple-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-purple-600" />
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
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Material Type</label>
                                        <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                                            <option>Lecture Notes</option>
                                            <option>Assignment</option>
                                            <option>Lab Manual</option>
                                            <option>Reference Material</option>
                                            <option>Previous Year Paper</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Title</label>
                                        <input type="text" placeholder="e.g. Week 5 — Trees & Graphs"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                    </div>

                                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-purple-300 transition-colors cursor-pointer">
                                        <File className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                                        <p className="text-sm font-medium text-muted-foreground">Click or drag file to upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX up to 25 MB</p>
                                    </div>

                                    {uploadSuccess ? (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4" /> Material uploaded successfully!
                                        </motion.div>
                                    ) : (
                                        <button onClick={handleUpload}
                                            className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> Upload Material
                                        </button>
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
