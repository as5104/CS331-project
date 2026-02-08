import { useState

 } from "react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { Calendar, Users, BookOpen, BarChart2 } from "lucide-react";

export default function FacultyDashboard() {
    const { user } = useAuth();
    const stats = {
    activeWorkflows: 156,
    pendingApprovals: 43,
    systemHealth: 98.5,
    uptime: '99.9%',
    cpuUsage: 42,
    memoryUsage: 68,
        
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard

                    title="Active Workflows"
                    value={stats.activeWorkflows}
                    isNumeric
                    delay={0.1}
                />
                <StatCard

                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    isNumeric
                    delay={0.2}
                />
                <StatCard

                    title="System Health"
                    value={stats.systemHealth}
                    suffix="%"
                    isNumeric
                    delay={0.3}
                />
                <StatCard


                    title="Uptime"
                    value={stats.uptime}
                    delay={0.4}
                />
                <StatCard

                    title="CPU Usage"
                    value={stats.cpuUsage}
                    suffix="%"
                    isNumeric
                    delay={0.5}
                />
                <StatCard
                    title="Memory Usage"
                    value={stats.memoryUsage}
                    suffix="%"
                    isNumeric
                    delay={0.6}
                />
            </div>
        </div>
    );
}