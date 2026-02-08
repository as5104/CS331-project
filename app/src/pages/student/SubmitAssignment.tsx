import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/shared/StatCard';
export function SubmitAssignment() {
    const { user } = useAuth();
    const student = user as Student;
    useEffect(() => {
        // Simulate assignment submission and review process
        const timer = setTimeout(() => {
            alert('Assignment submitted successfully! It is now under review.');
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (

        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Submit Assignment</h2>
            <p className="text-muted-foreground">You are submitting an assignment for the course: <strong>Data Structures</strong>.</p>
            <StatCard

                title="Assignment Status"
                value="Under Review"
                color="blue"
            />
            <p className="text-muted-foreground">Once the review is complete, you will receive a notification with your grade.</p>
        </div>
    );
}

