import { supabase } from '@/lib/supabaseClient';

export interface FacultyCourse {
    id: string;
    code: string;
    name: string;
    credits: number;
    semester: number | null;
    department: string | null;
    description: string | null;
    instructor_id: string | null;
}

export interface FacultyEnrollmentRow {
    course_id: string;
    section_faculty_id: string | null;
}

export interface FacultyEnrollmentVisibilityContext {
    facultyRowId: string;
    assignedCourseIds: Set<string>;
    primaryCourseIds: Set<string>;
    sectionAssignedCourseIds: Set<string>;
}

export async function resolveFacultyRowId(authOrProfileId?: string): Promise<string | null> {
    if (!authOrProfileId) return null;

    const [authMatch, idMatch] = await Promise.all([
        supabase
            .from('faculty')
            .select('id')
            .eq('auth_user_id', authOrProfileId)
            .maybeSingle(),
        supabase
            .from('faculty')
            .select('id')
            .eq('id', authOrProfileId)
            .maybeSingle(),
    ]);

    return authMatch.data?.id ?? idMatch.data?.id ?? null;
}

export async function fetchAssignedFacultyCourses(facultyRowId: string): Promise<FacultyCourse[]> {
    const [primaryRes, junctionRes] = await Promise.all([
        supabase.from('courses').select('*').eq('instructor_id', facultyRowId).order('code'),
        supabase.from('course_faculty').select('course_id').eq('faculty_id', facultyRowId),
    ]);

    const primaryCourses = (primaryRes.data ?? []) as FacultyCourse[];
    const primaryIds = new Set(primaryCourses.map(course => course.id));
    const junctionCourseIds = (junctionRes.data ?? [])
        .map(row => row.course_id)
        .filter(courseId => !primaryIds.has(courseId));

    if (junctionCourseIds.length === 0) {
        return primaryCourses;
    }

    const { data: extraCourses } = await supabase
        .from('courses')
        .select('*')
        .in('id', junctionCourseIds)
        .order('code');

    return [...primaryCourses, ...((extraCourses ?? []) as FacultyCourse[])].sort((a, b) =>
        a.code.localeCompare(b.code)
    );
}

export function buildFacultyEnrollmentVisibilityContext(
    facultyRowId: string,
    courses: Pick<FacultyCourse, 'id' | 'instructor_id'>[],
    enrollments: FacultyEnrollmentRow[]
): FacultyEnrollmentVisibilityContext {
    const assignedCourseIds = new Set(courses.map(course => course.id));
    const primaryCourseIds = new Set(
        courses
            .filter(course => course.instructor_id === facultyRowId)
            .map(course => course.id)
    );
    const sectionAssignedCourseIds = new Set(
        enrollments
            .filter(enrollment => Boolean(enrollment.section_faculty_id))
            .map(enrollment => enrollment.course_id)
    );

    return {
        facultyRowId,
        assignedCourseIds,
        primaryCourseIds,
        sectionAssignedCourseIds,
    };
}

export function isEnrollmentVisibleToFaculty(
    enrollment: FacultyEnrollmentRow,
    context: FacultyEnrollmentVisibilityContext
): boolean {
    if (enrollment.section_faculty_id === context.facultyRowId) {
        return true;
    }

    if (enrollment.section_faculty_id) {
        return false;
    }

    if (context.primaryCourseIds.has(enrollment.course_id)) {
        return true;
    }

    return (
        context.assignedCourseIds.has(enrollment.course_id) &&
        !context.sectionAssignedCourseIds.has(enrollment.course_id)
    );
}
