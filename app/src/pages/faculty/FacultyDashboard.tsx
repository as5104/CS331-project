import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useFacultyCourses } from '@/hooks/useCourses';
import {
    ClipboardCheck, BookOpen, Calendar, Bell,
    Users, ChevronRight, FileText, CheckCircle2,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { mockPendingReviews, mockFacultyTasks } from '@/data/mockData';

interface FacultyDashboardProps {
    onNavigate: (path: string) => void;
}

export function FacultyDashboard({ onNavigate }: FacultyDashboardProps) {
    const { user } = useAuth();
    const { courses } = useFacultyCourses(user?.id);


    const quickActions = [
        { label: 'Review Assignments', icon: ClipboardCheck, color: 'purple', path: '/review' },
        { label: 'My Courses', icon: BookOpen, color: 'blue', path: '/courses' },
        { label: 'Mark Attendance', icon: Calendar, color: 'emerald', path: '/attendance' },
        { label: 'Notifications', icon: Bell, color: 'amber', path: '/notifications' },
    ];

    return (
        <DashboardLayout title="Faculty Dashboard" activePath="/dashboard" onNavigate={onNavigate}>
            {/* Welcome */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h2 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 👋</h2>
                <p className="text-muted-foreground mt-1">{(user as any)?.designation} • {user?.department}</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Pending Reviews" value={mockPendingReviews.length} icon={ClipboardCheck} trend="down" trendValue="Need attention" color="amber" delay={0} />
                <StatCard title="My Courses" value={courses.length} icon={BookOpen} trend="neutral" trendValue="This semester" color="blue" delay={0.1} />
                <StatCard title="Students" value={85} icon={Users} trend="neutral" trendValue="Total enrolled" color="purple" delay={0.2} />
                <StatCard title="Tasks Due" value={mockFacultyTasks.filter(t => !t.completed).length} icon={CheckCircle2} trend="down" trendValue="Pending" color="green" delay={0.3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Reviews */}
                <div className="lg:col-span-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold">Pending Assignment Reviews</h3>
                            </div>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{mockPendingReviews.length} pending</span>
                        </div>
                        <div className="divide-y divide-border">
                            {mockPendingReviews.map((review, i) => (
                                <motion.div key={review.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.08 }}
                                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-medium text-sm">{review.studentName}</p>
                                        <p className="text-xs text-muted-foreground">{review.assignmentTitle} • {review.courseName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Submitted: {new Date(review.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={() => onNavigate('/review')}
                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        Review <ChevronRight className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-5 border-b border-border">
                            <h3 className="font-semibold">Quick Actions</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {quickActions.map((a, i) => (
                                <motion.button key={a.path} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.07 }} whileHover={{ x: 3 }}
                                    onClick={() => onNavigate(a.path)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-left">
                                    <div className={`w-9 h-9 rounded-lg bg-${a.color}-100 flex items-center justify-center`}>
                                        <a.icon className={`w-4 h-4 text-${a.color}-600`} />
                                    </div>
                                    <span className="font-medium text-sm flex-1">{a.label}</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
