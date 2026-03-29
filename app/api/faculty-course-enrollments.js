import {
    createSupabaseAdmin,
    ensureOriginAllowed,
    getAuthUserFromRequest,
    handleOptions,
    normalizeEmail,
    setCorsHeaders,
} from './_security.js';

function getUniqueCourseIds(primaryCourses, junctionRows) {
    const ids = new Set((primaryCourses || []).map((course) => course.id));
    (junctionRows || []).forEach((row) => ids.add(row.course_id));
    return Array.from(ids);
}

function isEnrollmentVisible(enrollment, facultyRowId, assignedCourseIds, primaryCourseIds, sectionAssignedCourseIds) {
    if (enrollment.section_faculty_id === facultyRowId) return true;
    if (enrollment.section_faculty_id) return false;
    if (primaryCourseIds.has(enrollment.course_id)) return true;
    return assignedCourseIds.has(enrollment.course_id) && !sectionAssignedCourseIds.has(enrollment.course_id);
}

async function resolveFacultyRow(supabaseAdmin, authUser) {
    const authUserId = authUser?.id;
    const normalizedEmail = normalizeEmail(authUser?.email || '');

    if (!authUserId) return null;

    const { data: direct } = await supabaseAdmin
        .from('faculty')
        .select('id, email, auth_user_id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

    if (direct) return direct;
    if (!normalizedEmail) return null;

    const { data: emailMatch } = await supabaseAdmin
        .from('faculty')
        .select('id, email, auth_user_id')
        .ilike('email', normalizedEmail)
        .maybeSingle();

    if (!emailMatch) return null;

    if (!emailMatch.auth_user_id) {
        await supabaseAdmin
            .from('faculty')
            .update({ auth_user_id: authUserId })
            .eq('id', emailMatch.id);
        return { ...emailMatch, auth_user_id: authUserId };
    }

    return emailMatch;
}

export default async function handler(req, res) {
    if (handleOptions(req, res)) return;
    setCorsHeaders(req, res);
    if (!ensureOriginAllowed(req, res)) return;

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authUser = await getAuthUserFromRequest(req);
        if (!authUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabaseAdmin = createSupabaseAdmin();
        const facultyRow = await resolveFacultyRow(supabaseAdmin, authUser);
        if (!facultyRow) {
            return res.status(403).json({ error: 'Faculty profile not found for this account.' });
        }

        const facultyRowId = facultyRow.id;
        const requestedCourseId = typeof req.query?.courseId === 'string' ? req.query.courseId : null;

        const [primaryRes, junctionRes] = await Promise.all([
            supabaseAdmin
                .from('courses')
                .select('id, code, name, credits, semester, department, description, instructor_id')
                .eq('instructor_id', facultyRowId)
                .order('code'),
            supabaseAdmin
                .from('course_faculty')
                .select('course_id')
                .eq('faculty_id', facultyRowId),
        ]);

        const primaryCourses = primaryRes.data || [];
        const junctionRows = junctionRes.data || [];
        const courseIds = getUniqueCourseIds(primaryCourses, junctionRows);

        if (courseIds.length === 0) {
            return res.status(200).json({
                courses: [],
                students: [],
            });
        }

        const primaryIds = new Set(primaryCourses.map((course) => course.id));
        const extraCourseIds = courseIds.filter((id) => !primaryIds.has(id));

        let allCourses = [...primaryCourses];
        if (extraCourseIds.length > 0) {
            const { data: extraCourses } = await supabaseAdmin
                .from('courses')
                .select('id, code, name, credits, semester, department, description, instructor_id')
                .in('id', extraCourseIds);
            allCourses = [...allCourses, ...(extraCourses || [])];
        }

        allCourses.sort((a, b) => a.code.localeCompare(b.code));

        const assignedCourseIds = new Set(allCourses.map((course) => course.id));
        if (requestedCourseId && !assignedCourseIds.has(requestedCourseId)) {
            return res.status(403).json({ error: 'You are not assigned to this course.' });
        }

        const { data: allEnrollments } = await supabaseAdmin
            .from('course_enrollments')
            .select('id, student_id, course_id, section, section_faculty_id')
            .in('course_id', Array.from(assignedCourseIds));

        const enrollments = allEnrollments || [];
        const primaryCourseIds = new Set(
            allCourses.filter((course) => course.instructor_id === facultyRowId).map((course) => course.id)
        );
        const sectionAssignedCourseIds = new Set(
            enrollments.filter((row) => Boolean(row.section_faculty_id)).map((row) => row.course_id)
        );

        const visibleEnrollments = enrollments.filter((row) =>
            isEnrollmentVisible(row, facultyRowId, assignedCourseIds, primaryCourseIds, sectionAssignedCourseIds)
        );

        const countMap = {};
        allCourses.forEach((course) => { countMap[course.id] = 0; });
        visibleEnrollments.forEach((row) => {
            countMap[row.course_id] = (countMap[row.course_id] || 0) + 1;
        });

        const courses = allCourses.map((course) => ({
            ...course,
            enrolled_count: countMap[course.id] || 0,
        }));

        if (!requestedCourseId) {
            return res.status(200).json({
                courses,
                students: [],
            });
        }

        const courseVisibleEnrollments = visibleEnrollments.filter((row) => row.course_id === requestedCourseId);
        const studentIds = Array.from(new Set(courseVisibleEnrollments.map((row) => row.student_id)));

        let studentRows = [];
        if (studentIds.length > 0) {
            const { data } = await supabaseAdmin
                .from('students')
                .select('id, name, email, roll_number, department')
                .in('id', studentIds);
            studentRows = data || [];
        }

        const studentMap = {};
        studentRows.forEach((student) => { studentMap[student.id] = student; });

        const students = courseVisibleEnrollments.map((row) => {
            const student = studentMap[row.student_id];
            return {
                id: row.id,
                section: row.section,
                studentId: student?.id || row.student_id,
                rollNo: student?.roll_number || '-',
                department: student?.department || '-',
                name: student?.name || 'Unknown',
                email: student?.email || 'No email',
            };
        });

        return res.status(200).json({
            courses,
            students,
        });
    } catch (err) {
        console.error('faculty-course-enrollments handler error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
