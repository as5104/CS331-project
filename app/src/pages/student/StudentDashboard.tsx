import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/shared/StatCard';
import { Calendar, Users, BookOpen, BarChart2 } from "lucide-react";

export default function StudentDashboard() {
    const { user } = useAuth();
    const stats = { 
        timeSubmissions: 85,
        lateSubmissions: 10,
        pendingAssignments: 5,
        attendance: 92,
        cgpa: 8.2,
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="On-Time Submissions"
                    value={stats.timeSubmissions}
                    suffix="%"
                    isNumeric
                    delay={0.1}
                />
                <StatCard
                    title="Late Submissions"
                    value={stats.lateSubmissions}
                    suffix="%"
                    isNumeric
                    delay={0.2}
                />
                <StatCard
                    title="Pending Assignments"
                    value={stats.pendingAssignments}
                    isNumeric
                    delay={0.3}
                />
                <StatCard

                    title="Attendance"
                    value={stats.attendance}
                    suffix="%"
                    isNumeric
                    delay={0.4}
                />
                <StatCard


                    title="Current CGPA"
                    value={stats.cgpa}
                    isNumeric
                    delay={0.5}
                />
            </div>
        </div>
    );
}

