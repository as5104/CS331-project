import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    buildFacultyEnrollmentVisibilityContext,
    fetchAssignedFacultyCourses,
    isEnrollmentVisibleToFaculty,
    resolveFacultyRowId,
} from '@/lib/facultyCourseAccess';

export function useFacultyCourses(authUserProfileId?: string) {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = useCallback(async () => {
        if (!authUserProfileId) {
            setCourses([]);
            setLoading(false);
            return;
        }
        setLoading(true);

        const facultyRowId = await resolveFacultyRowId(authUserProfileId);
        if (!facultyRowId) {
            setCourses([]);
            setLoading(false);
            return;
        }

        const allCourses = await fetchAssignedFacultyCourses(facultyRowId);
        if (allCourses.length === 0) {
            setCourses([]);
            setLoading(false);
            return;
        }

        const courseIds = allCourses.map(c => c.id);
        const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('course_id, section_faculty_id')
            .in('course_id', courseIds);

        const visibilityContext = buildFacultyEnrollmentVisibilityContext(
            facultyRowId,
            allCourses,
            (enrollments ?? []) as any[]
        );

        const countMap: Record<string, number> = {};
        allCourses.forEach(c => countMap[c.id] = 0);

        (enrollments ?? []).forEach((rawEnrollment: any) => {
            if (isEnrollmentVisibleToFaculty(rawEnrollment, visibilityContext)) {
                const e = rawEnrollment as { course_id: string };
                countMap[e.course_id]++;
            }
        });

        const enrichedCourses = allCourses.map(c => ({
            ...c,
            enrolled_count: countMap[c.id] || 0
        }));

        setCourses(enrichedCourses);
        setLoading(false);
    }, [authUserProfileId]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    return { courses, loading, fetchCourses };
}

export function useStudentCourses(authUserProfileId?: string) {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = useCallback(async () => {
        if (!authUserProfileId) return;
        setLoading(true);

        const { data: studentRow } = await supabase
            .from('students')
            .select('id')
            .eq('auth_user_id', authUserProfileId)
            .maybeSingle();

        if (!studentRow) { setLoading(false); return; }

        const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select(`
                grade, attendance_pct,
                courses (id, code, name, credits, semester, department)
            `)
            .eq('student_id', studentRow.id);

        if (enrollments) {
            setCourses(enrollments.map((e: any) => ({
                id: e.courses.id,
                code: e.courses.code,
                name: e.courses.name,
                credits: e.courses.credits,
                semester: e.courses.semester,
                department: e.courses.department,
                grade: e.grade,
                attendance: e.attendance_pct || 0,
            })));
        }
        setLoading(false);
    }, [authUserProfileId]);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    return { courses, loading, fetchCourses };
}
