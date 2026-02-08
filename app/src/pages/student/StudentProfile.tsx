import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { CourseProgress } from "@/components/student/CourseProgress";
export function StudentProfile() {
    const { user } = useAuth();
    const student = user as Student;
    const { name, email, rollNumber, program, semester, cgpa, attendance, courses } = student;
    const completedCredits = useMemo(() => {
        return courses.reduce((total, course) => {
            return total + (course.progress === 100 ? course.credits : 0);
        }, 0);
    }, [courses]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <img src={student.avatar} alt="Profile" className="w-16 h-16 rounded-full" />
                <div>
                    <h2 className="text-xl font-semibold">{name}</h2>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <p className="text-sm text-muted-foreground">Roll Number: {rollNumber}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Program"
                    value={program}
                    color="blue"
                />
                <StatCard

                    title="Semester"
                    value={semester}
                    color="green"
                />
                <StatCard
                    title="CGPA"
                    value={cgpa.toFixed(2)}
                    color="yellow"
                />
                <StatCard

                    title="Attendance"
                    value={`${attendance}%`}
                    color="red"
                />
                <StatCard

                    title="Completed Credits"
                    value={completedCredits}
                    color="purple"
                />
            </div>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Courses</h3>
                <div className="space-y-3">
                    {courses.map(course => (
                        <CourseProgress key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </div>
    );
}