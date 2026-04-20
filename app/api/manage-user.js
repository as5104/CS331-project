import {
    createSupabaseAdmin,
    ensureOriginAllowed,
    getAuthUserFromRequest,
    handleOptions,
    setCorsHeaders,
} from './_security.js';

const STUDENT_EDITABLE_FIELDS = new Set([
    'name',
    'roll_number',
    'program',
    'department',
    'semester',
    'batch_year',
    'phone',
]);

const FACULTY_EDITABLE_FIELDS = new Set([
    'name',
    'employee_id',
    'department',
    'designation',
    'qualification',
    'phone',
]);

function normalizePhone(value) {
    if (typeof value !== 'string') return '';
    const rawDigits = value.trim().replace(/\D/g, '');
    let localDigits = '';
    if (rawDigits.length === 10) {
        localDigits = rawDigits;
    } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
        localDigits = rawDigits.slice(2);
    }
    return localDigits ? `+91${localDigits}` : '';
}

function isValidPhone(value) {
    return /^\+91\d{10}$/.test(normalizePhone(value));
}

function normalizeRole(role) {
    if (role === 'student' || role === 'faculty') return role;
    return null;
}

function pickEditableFields(role, updates) {
    const source = updates && typeof updates === 'object' ? updates : {};
    const allowed = role === 'student' ? STUDENT_EDITABLE_FIELDS : FACULTY_EDITABLE_FIELDS;
    const payload = {};
    for (const [key, value] of Object.entries(source)) {
        if (!allowed.has(key)) continue;
        payload[key] = value;
    }
    return payload;
}

async function requireAdmin(supabaseAdmin, authUserId) {
    const { data: adminRow } = await supabaseAdmin
        .from('admins')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
    return Boolean(adminRow);
}

async function deleteAuthLinkedRows(supabaseAdmin, authUserId) {
    const { error: announcementsError } = await supabaseAdmin
        .from('announcements')
        .update({ author_id: null })
        .eq('author_id', authUserId);
    if (announcementsError) throw new Error(`Failed cleanup on announcements: ${announcementsError.message}`);

    const targets = [
        ['notifications', 'user_id'],
        ['event_logs', 'actor_id'],
        ['security_audit_log', 'auth_user_id'],
        ['security_otp_challenges', 'auth_user_id'],
        ['security_password_reset_sessions', 'auth_user_id'],
        ['account_security', 'auth_user_id'],
    ];

    for (const [table, column] of targets) {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, authUserId);
        if (error) throw new Error(`Failed cleanup on ${table}: ${error.message}`);
    }
}

async function deleteStudentFully(supabaseAdmin, studentRow) {
    const studentId = studentRow.id;
    const authUserId = studentRow.auth_user_id;

    const cleanupTargets = [
        ['assignment_submissions', 'student_id', studentId],
        ['attendance_records', 'student_id', studentId],
        ['leave_requests', 'student_id', studentId],
        ['re_evaluations', 'student_id', studentId],
        ['course_enrollments', 'student_id', studentId],
    ];

    for (const [table, column, value] of cleanupTargets) {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, value);
        if (error) throw new Error(`Failed cleanup on ${table}: ${error.message}`);
    }

    const { error: studentDeleteError } = await supabaseAdmin.from('students').delete().eq('id', studentId);
    if (studentDeleteError) throw new Error(`Failed to delete student: ${studentDeleteError.message}`);

    if (authUserId) {
        await deleteAuthLinkedRows(supabaseAdmin, authUserId);
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (authDeleteError) throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }
}

async function deleteFacultyFully(supabaseAdmin, facultyRow) {
    const facultyId = facultyRow.id;
    const authUserId = facultyRow.auth_user_id;

    const { data: assignmentRows, error: assignmentSelectError } = await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('created_by', facultyId);
    if (assignmentSelectError) throw new Error(`Failed to list assignments: ${assignmentSelectError.message}`);

    const assignmentIds = (assignmentRows ?? []).map((row) => row.id);
    if (assignmentIds.length > 0) {
        const { error: submissionsDeleteError } = await supabaseAdmin
            .from('assignment_submissions')
            .delete()
            .in('assignment_id', assignmentIds);
        if (submissionsDeleteError) throw new Error(`Failed to delete assignment submissions: ${submissionsDeleteError.message}`);
    }

    if (assignmentIds.length > 0) {
        const { error: assignmentsDeleteError } = await supabaseAdmin
            .from('assignments')
            .delete()
            .eq('created_by', facultyId);
        if (assignmentsDeleteError) throw new Error(`Failed to delete assignments: ${assignmentsDeleteError.message}`);
    }

    const nullableUpdates = [
        ['course_enrollments', 'section_faculty_id'],
        ['courses', 'instructor_id'],
        ['assignment_submissions', 'reviewed_by'],
        ['attendance_records', 'marked_by'],
        ['re_evaluations', 'reviewer_id'],
    ];
    for (const [table, column] of nullableUpdates) {
        const { error } = await supabaseAdmin.from(table).update({ [column]: null }).eq(column, facultyId);
        if (error) throw new Error(`Failed to detach ${table}.${column}: ${error.message}`);
    }

    const { error: courseFacultyDeleteError } = await supabaseAdmin.from('course_faculty').delete().eq('faculty_id', facultyId);
    if (courseFacultyDeleteError) throw new Error(`Failed to delete course_faculty rows: ${courseFacultyDeleteError.message}`);

    const { error: facultyDeleteError } = await supabaseAdmin.from('faculty').delete().eq('id', facultyId);
    if (facultyDeleteError) throw new Error(`Failed to delete faculty: ${facultyDeleteError.message}`);

    if (authUserId) {
        await deleteAuthLinkedRows(supabaseAdmin, authUserId);
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
        if (authDeleteError) throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }
}

export default async function handler(req, res) {
    if (handleOptions(req, res)) return;
    setCorsHeaders(req, res);
    if (!ensureOriginAllowed(req, res)) return;

    if (!['PATCH', 'DELETE'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body ?? {};
        if (typeof req.body === 'string') {
            try {
                body = JSON.parse(req.body);
            } catch {
                return res.status(400).json({ error: 'Invalid JSON body.' });
            }
        }

        const authUser = await getAuthUserFromRequest(req);
        if (!authUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabaseAdmin = createSupabaseAdmin();
        const isAdmin = await requireAdmin(supabaseAdmin, authUser.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can manage users.' });
        }

        const role = normalizeRole(body.role);
        const id = body.id;
        if (!role || !id) {
            return res.status(400).json({ error: 'Missing required fields: role, id' });
        }

        const table = role === 'student' ? 'students' : 'faculty';
        const { data: targetRow, error: rowError } = await supabaseAdmin
            .from(table)
            .select('id, auth_user_id, name')
            .eq('id', id)
            .maybeSingle();
        if (rowError) return res.status(400).json({ error: rowError.message });
        if (!targetRow) return res.status(404).json({ error: `${role} not found.` });

        if (req.method === 'PATCH') {
            const updates = pickEditableFields(role, body.updates);
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No valid editable fields provided.' });
            }

            if (updates.semester !== undefined) {
                const value = Number(updates.semester);
                if (!Number.isInteger(value) || value < 1 || value > 12) {
                    return res.status(400).json({ error: 'Semester must be an integer between 1 and 12.' });
                }
                updates.semester = value;
            }

            if (updates.phone !== undefined) {
                const phone = normalizePhone(updates.phone);
                if (String(updates.phone).trim() && !phone) {
                    return res.status(400).json({ error: 'Phone must be +91 followed by exactly 10 digits.' });
                }
                updates.phone = phone;
            }

            const { error: updateError } = await supabaseAdmin.from(table).update(updates).eq('id', id);
            if (updateError) return res.status(400).json({ error: updateError.message });
            return res.status(200).json({ success: true });
        }

        if (role === 'student') {
            await deleteStudentFully(supabaseAdmin, targetRow);
        } else {
            await deleteFacultyFully(supabaseAdmin, targetRow);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('manage-user handler error:', err);
        return res.status(500).json({ error: err?.message || 'Internal server error' });
    }
}
