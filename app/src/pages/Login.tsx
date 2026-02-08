import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/shared/StatCard';
import { Calendar, Users, BookOpen, BarChart2 } from "lucide-react";
export default function Login() {
    const { login, isLoading } = useAuth();
    useEffect(() => {
        if (!isLoading) {
            const email = `user${Math.floor(Math.random() * 1000)}@example.com`;
            const roles = ['student', 'faculty', 'admin'];
            const role = roles[Math.floor(Math.random() * roles.length)] as 'student' | 'faculty' | 'admin';
            const newUser = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                name: `User ${Math.floor(Math.random() * 1000)}`,
                email,
                role,
                avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${email}`,
            };
            login(email, role);
        }
    }, [login, isLoading]);
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Logging in...</h1>
                <p className="text-lg text-muted-foreground">Please wait while we set up your account.</p>
            </div>
        </div>
    );
}

