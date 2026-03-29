import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { format } from 'date-fns';
import { useFacultyCourses } from '@/hooks/useCourses';
import type { Faculty } from '@/types';
import {
    Calendar, CheckCircle2, Users, Save, RotateCcw,
    UserCheck, UserX, Timer,
} from 'lucide-react';

interface FacultyAttendanceProps {
    onNavigate: (path: string) => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface StudentAttendance {
    id: string;
    name: string;
    rollNumber: string;
    status: AttendanceStatus;
}

function getMockStudents(courseCode: string): StudentAttendance[] {
    const names = [
        'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Singh', 'Karan Mehta',
        'Sneha Reddy', 'Arjun Kumar', 'Kavya Nair', 'Vivek Das', 'Riya Joshi',
        'Aditya Rao', 'Nisha Verma', 'Siddharth Malhotra', 'Meera Iyer', 'Harsh Agarwal',
        'Pooja Bhat', 'Rahul Saxena', 'Divya Pillai', 'Nikhil Thakur', 'Tanya Chauhan',
    ];
    const seed = courseCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = 12 + (seed % 9);
    return names.slice(0, count).map((name, i) => ({
        id: `STU_${courseCode.replace(/[^A-Za-z0-9]/g, '')}_${i}`,
        name,
        rollNumber: `${courseCode.replace(/[^A-Z]/g, '')}${String(2024001 + i)}`,
        status: 'present' as AttendanceStatus,
    }));
}

export function FacultyAttendance({ onNavigate }: FacultyAttendanceProps) {
    const { user } = useAuth();
    const faculty = user as Faculty;
    const { courses } = useFacultyCourses(faculty?.id);

    const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [saved, setSaved] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendance[]>>({});

    const selectedCourse = courses[selectedCourseIdx] ?? null;

    // Build a stable key for the current selection
    const currentKey = selectedCourse ? selectedCourse.code + '_' + selectedDate : '';

    // Get or lazily initialize the student list for the current key
    const getStudents = useCallback((): StudentAttendance[] => {
        if (!selectedCourse) return [];
        if (attendanceMap[currentKey]) return attendanceMap[currentKey];
        // Initialize on first access
        const mocks = getMockStudents(selectedCourse.code);
        // Use functional update to avoid stale closures
        setAttendanceMap(prev => {
            if (prev[currentKey]) return prev; // already set by concurrent call
            return { ...prev, [currentKey]: mocks };
        });
        return mocks;
    }, [selectedCourse, currentKey, attendanceMap]);

    const currentStudents = getStudents();

    const updateStatus = (studentId: string, status: AttendanceStatus) => {
        if (!currentKey) return;
        setAttendanceMap(prev => ({
            ...prev,
            [currentKey]: (prev[currentKey] || currentStudents).map(s =>
                s.id === studentId ? { ...s, status } : s
            ),
        }));
        setSaved(false);
    };

    const markAll = (status: AttendanceStatus) => {
        if (!currentKey) return;
        setAttendanceMap(prev => ({
            ...prev,
            [currentKey]: (prev[currentKey] || currentStudents).map(s => ({ ...s, status })),
        }));
        setSaved(false);
    };

    const counts = {
        present: currentStudents.filter(s => s.status === 'present').length,
        absent: currentStudents.filter(s => s.status === 'absent').length,
        late: currentStudents.filter(s => s.status === 'late').length,
        total: currentStudents.length,
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const statusStyles: Record<AttendanceStatus, { bg: string; color: string }> = {
        present: { bg: 'bg-emerald-100', color: 'text-emerald-700' },
        absent: { bg: 'bg-red-100', color: 'text-red-700' },
        late: { bg: 'bg-amber-100', color: 'text-amber-700' },
    };

    return (
        <DashboardLayout title="Mark Attendance" activePath="/attendance" onNavigate={onNavigate}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h2 className="text-2xl font-bold">Mark Attendance</h2>
                <p className="text-muted-foreground mt-1">Select a course and date to record student attendance.</p>
            </motion.div>

            {courses.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-xl border border-border p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-semibold mb-1">No courses assigned</h3>
                    <p className="text-sm text-muted-foreground">Courses will appear here once admin assigns them.</p>
                </motion.div>
            ) : (
                <>
                    {/* Course + Date Selector */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <CustomSelect
                            label="Select Course"
                            value={String(selectedCourseIdx)}
                            onChange={v => { setSelectedCourseIdx(Number(v)); setSaved(false); }}
                            options={courses.map((c: any, i: number) => ({ value: String(i), label: `${c.code} — ${c.name}` }))}
                        />
                        <CustomDatePicker
                            label="Date"
                            value={selectedDate ? new Date(selectedDate) : undefined}
                            onChange={(d) => {
                                if (d) {
                                    setSelectedDate(format(d, 'yyyy-MM-dd'));
                                    setSaved(false);
                                }
                            }}
                        />
                    </motion.div>

                    {/* Summary Cards */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total', value: counts.total, Icon: Users, cls: 'text-blue-500' },
                            { label: 'Present', value: counts.present, Icon: UserCheck, cls: 'text-emerald-500' },
                            { label: 'Absent', value: counts.absent, Icon: UserX, cls: 'text-red-500' },
                            { label: 'Late', value: counts.late, Icon: Timer, cls: 'text-amber-500' },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.05 }}
                                className="bg-card rounded-xl border border-border p-3 text-center">
                                <stat.Icon className={`w-5 h-5 mx-auto mb-1 ${stat.cls}`} />
                                <p className="text-xl font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-xs text-muted-foreground mr-1">Quick:</span>
                        <button onClick={() => markAll('present')}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                            All Present
                        </button>
                        <button onClick={() => markAll('absent')}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                            All Absent
                        </button>
                        <button onClick={() => markAll('present')}
                            className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                    </motion.div>

                    {/* Student Table */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">#</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Roll Number</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {currentStudents.map((student, i) => (
                                        <motion.tr key={student.id}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.02 }}
                                            className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{i + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{student.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{student.rollNumber}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {(['present', 'absent', 'late'] as AttendanceStatus[]).map(st => {
                                                        const s = statusStyles[st];
                                                        const active = student.status === st;
                                                        return (
                                                            <button key={st} onClick={() => updateStatus(student.id, st)}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${active
                                                                    ? `${s.bg} ${s.color} border-current`
                                                                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}>
                                                                {st.charAt(0).toUpperCase() + st.slice(1)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Save */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="mt-4 flex items-center gap-3">
                        <button onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
                            <Save className="w-4 h-4" /> Save Attendance
                        </button>
                        <AnimatePresence>
                            {saved && (
                                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                    className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Attendance saved successfully!
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </DashboardLayout>
    );
}
