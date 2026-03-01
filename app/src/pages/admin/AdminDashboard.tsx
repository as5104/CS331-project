import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import {
    Users, GraduationCap, Workflow, ClipboardCheck,
    Activity, AlertTriangle, CheckCircle2, Info,
    UserPlus, Megaphone, BarChart3, ChevronRight,
    Clock, TrendingUp, Shield,
} from 'lucide-react';
import {
    mockSystemStats, mockRecentActivities, mockSystemAlerts,
} from '@/data/mockData';
import { supabase } from '@/lib/supabaseClient';

interface AdminDashboardProps {
    onNavigate: (path: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
    const [studentCount, setStudentCount] = useState<number | null>(null);
    const [facultyCount, setFacultyCount] = useState<number | null>(null);

    useEffect(() => {
        // Fetch real counts from Supabase
        supabase.from('students').select('id', { count: 'exact', head: true })
            .then(({ count }) => setStudentCount(count ?? 0));
        supabase.from('faculty').select('id', { count: 'exact', head: true })
            .then(({ count }) => setFacultyCount(count ?? 0));
    }, []);

    const getAlertIcon = (type: string) => {
        if (type === 'error') return <AlertTriangle className="w-4 h-4 text-red-500" />;
        if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        return <Info className="w-4 h-4 text-blue-500" />;
    };

    const getAlertBg = (type: string) => {
        if (type === 'error') return 'bg-red-50 border-red-100';
        if (type === 'warning') return 'bg-amber-50 border-amber-100';
        return 'bg-blue-50 border-blue-100';
    };

    const quickActions = [
        { label: 'Add New User', desc: 'Onboard a student or faculty', icon: UserPlus, color: 'emerald', path: '/users' },
        { label: 'Manage Workflows', desc: 'Configure approval rules', icon: Workflow, color: 'blue', path: '/workflows' },
        { label: 'Announcements', desc: 'Post a new announcement', icon: Megaphone, color: 'purple', path: '/announcements' },
        { label: 'System Monitor', desc: 'View system health', icon: BarChart3, color: 'amber', path: '/monitor' },
    ];

    return (
        <DashboardLayout title="Admin Dashboard" activePath="/dashboard" onNavigate={onNavigate}>
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Admin Control Panel
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1">
                            Manage users, workflows, and monitor the platform.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onNavigate('/users')}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium border border-white/20 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Onboard User
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Students"
                    value={studentCount !== null ? studentCount : mockSystemStats.activeStudents}
                    icon={GraduationCap}
                    trend="up"
                    trendValue={studentCount !== null ? 'From DB' : 'Mock data'}
                    color="blue"
                    delay={0}
                />
                <StatCard
                    title="Total Faculty"
                    value={facultyCount !== null ? facultyCount : mockSystemStats.activeFaculty}
                    icon={Users}
                    trend="up"
                    trendValue={facultyCount !== null ? 'From DB' : 'Mock data'}
                    color="purple"
                    delay={0.1}
                />
                <StatCard
                    title="Active Workflows"
                    value={mockSystemStats.activeWorkflows}
                    icon={Workflow}
                    trend="neutral"
                    trendValue="Running"
                    color="amber"
                    delay={0.2}
                />
                <StatCard
                    title="Pending Approvals"
                    value={mockSystemStats.pendingApprovals}
                    icon={ClipboardCheck}
                    trend="down"
                    trendValue="Need action"
                    color="green"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Actions + Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Quick Actions</h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {quickActions.map((action, i) => (
                                <motion.button
                                    key={action.path}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.05 }}
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    onClick={() => onNavigate(action.path)}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all text-left group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${action.color}-100 flex-shrink-0`}>
                                        <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{action.label}</p>
                                        <p className="text-xs text-muted-foreground">{action.desc}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Recent Activity</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {mockRecentActivities.map((act, i) => (
                                <motion.div
                                    key={act.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.08 }}
                                    className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">
                                            <span className="font-medium">{act.user}</span>
                                            <span className="text-muted-foreground"> {act.action} </span>
                                            <span className="font-medium text-primary truncate">{act.target}</span>
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(act.timestamp).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right: System Health + Alerts */}
                <div className="space-y-6">
                    {/* System Health */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">System Health</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { label: 'CPU Usage', value: mockSystemStats.cpuUsage, color: 'blue' },
                                { label: 'Memory', value: mockSystemStats.memoryUsage, color: 'purple' },
                                { label: 'Disk', value: mockSystemStats.diskUsage, color: 'emerald' },
                                { label: 'System Health', value: mockSystemStats.systemHealth, color: 'amber' },
                            ].map((metric, i) => (
                                <div key={metric.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{metric.label}</span>
                                        <span className="font-medium">{metric.value}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${metric.value}%` }}
                                            transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                                            className={`h-full rounded-full bg-${metric.color}-500`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="mt-2 text-center">
                                <span className="text-xs text-muted-foreground">Uptime: </span>
                                <span className="text-sm font-semibold text-emerald-600">{mockSystemStats.uptime}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold">System Alerts</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            {mockSystemAlerts.map((alert, i) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + i * 0.08 }}
                                    className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${getAlertBg(alert.type)}`}
                                >
                                    {getAlertIcon(alert.type)}
                                    <div className="flex-1">
                                        <p className="text-sm">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(alert.timestamp).toLocaleString('en-IN', {
                                                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
