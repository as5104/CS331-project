import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockSystemStats, mockSystemAlerts } from '@/data/mockData';
import {
    Server, Cpu, HardDrive, MemoryStick, AlertTriangle,
    Info, CheckCircle2, TrendingUp, Activity, Clock,
} from 'lucide-react';

interface AdminMonitorProps {
    onNavigate: (path: string) => void;
}

export function AdminMonitor({ onNavigate }: AdminMonitorProps) {
    const metrics = [
        { label: 'CPU Usage', value: mockSystemStats.cpuUsage, icon: Cpu, color: 'blue', threshold: 80 },
        { label: 'Memory Usage', value: mockSystemStats.memoryUsage, icon: MemoryStick, color: 'purple', threshold: 85 },
        { label: 'Disk Usage', value: mockSystemStats.diskUsage, icon: HardDrive, color: 'amber', threshold: 90 },
        { label: 'System Health', value: mockSystemStats.systemHealth, icon: Activity, color: 'emerald', threshold: 90 },
    ];

    const getHealth = (value: number, threshold: number) => {
        if (value >= threshold) return { label: 'Critical', color: 'text-red-600 bg-red-50' };
        if (value >= threshold - 15) return { label: 'Warning', color: 'text-amber-600 bg-amber-50' };
        return { label: 'Healthy', color: 'text-emerald-600 bg-emerald-50' };
    };

    const getAlertIcon = (type: string) => {
        if (type === 'error') return <AlertTriangle className="w-4 h-4 text-red-500" />;
        if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        return <Info className="w-4 h-4 text-blue-500" />;
    };

    return (
        <DashboardLayout title="System Monitor" activePath="/monitor" onNavigate={onNavigate}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">System Monitor</h2>
                        <p className="text-muted-foreground mt-1">Real-time platform performance and health metrics.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-emerald-600 font-medium">All Systems Operational</span>
                    </div>
                </div>
            </motion.div>

            {/* Platform Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            >
                {[
                    { label: 'Total Users', value: mockSystemStats.totalUsers.toLocaleString(), icon: TrendingUp, color: 'blue' },
                    { label: 'Active Students', value: mockSystemStats.activeStudents.toLocaleString(), icon: CheckCircle2, color: 'emerald' },
                    { label: 'Active Faculty', value: mockSystemStats.activeFaculty.toLocaleString(), icon: CheckCircle2, color: 'purple' },
                    { label: 'Uptime', value: mockSystemStats.uptime, icon: Server, color: 'amber' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="bg-card rounded-xl border border-border p-4 text-center"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center mx-auto mb-2`}>
                            <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resource Usage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                >
                    <div className="p-5 border-b border-border flex items-center gap-2">
                        <Server className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Resource Usage</h3>
                    </div>
                    <div className="p-5 space-y-5">
                        {metrics.map((m, i) => {
                            const health = getHealth(m.value, m.threshold);
                            return (
                                <div key={m.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <m.icon className={`w-4 h-4 text-${m.color}-500`} />
                                            <span className="text-sm font-medium">{m.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${health.color}`}>
                                                {health.label}
                                            </span>
                                            <span className="text-sm font-bold">{m.value}%</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${m.value}%` }}
                                            transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                                            className={`h-full rounded-full ${m.value >= m.threshold ? 'bg-red-500' :
                                                    m.value >= m.threshold - 15 ? 'bg-amber-500' :
                                                        `bg-${m.color}-500`
                                                }`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Alerts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                >
                    <div className="p-5 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold">System Alerts</h3>
                        </div>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            {mockSystemAlerts.filter(a => a.type === 'error').length} Critical
                        </span>
                    </div>
                    <div className="p-4 space-y-3">
                        {mockSystemAlerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.08 }}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-sm
                  ${alert.type === 'error' ? 'bg-red-50 border-red-100' :
                                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                                            'bg-blue-50 border-blue-100'}`}
                            >
                                {getAlertIcon(alert.type)}
                                <div className="flex-1">
                                    <p className="text-sm">{alert.message}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {new Date(alert.timestamp).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
