import { createClient } from '@supabase/supabase-js';
import {
    handleOptions,
    setCorsHeaders,
    ensureOriginAllowed,
    getAuthUserFromRequest,
    normalizeEmail,
} from './_security.js';

export default async function handler(req, res) {
    if (handleOptions(req, res)) return;
    setCorsHeaders(req, res);
    if (!ensureOriginAllowed(req, res)) return;

    // Create client
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: adminRow } = await supabaseAdmin
        .from('admins')
        .select('auth_user_id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

    if (!adminRow) {
        return res.status(403).json({ error: 'Only admins can create users.' });
    }

    const { email, password, role, profile } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !role || !profile) {
        return res.status(400).json({ error: 'Missing required fields: email, password, role, profile' });
    }

    if (!['student', 'faculty'].includes(role)) {
        return res.status(400).json({ error: 'Role must be student or faculty' });
    }

    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,
            user_metadata: { role, name: profile.name },
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        const authUserId = authData.user.id;

        // 2. Insert profile row into the appropriate table
        let insertError = null;

        if (role === 'student') {
            const { error } = await supabaseAdmin.from('students').insert([
                {
                    auth_user_id: authUserId,
                    email: normalizedEmail,
                    name: profile.name,
                    roll_number: profile.rollNumber,
                    program: profile.program,
                    department: profile.department,
                    batch_year: profile.batchYear,
                    semester: profile.semester ?? 1,
                    date_of_birth: profile.dateOfBirth,
                    gender: profile.gender,
                    blood_group: profile.bloodGroup,
                    phone: profile.phone,
                    father_name: profile.fatherName,
                    mother_name: profile.motherName,
                    guardian_contact: profile.guardianContact,
                    institution: profile.institution ?? 'Tech University',
                    avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(profile.name)}`,
                    cgpa: 0,
                    attendance: 0,
                    courses: [],
                },
            ]);
            insertError = error;
        } else if (role === 'faculty') {
            const { error } = await supabaseAdmin.from('faculty').insert([
                {
                    auth_user_id: authUserId,
                    email: normalizedEmail,
                    name: profile.name,
                    employee_id: profile.employeeId,
                    department: profile.department,
                    designation: profile.designation,
                    qualification: profile.qualification,
                    date_of_joining: profile.dateOfJoining,
                    gender: profile.gender,
                    date_of_birth: profile.dateOfBirth,
                    phone: profile.phone,
                    institution: profile.institution ?? 'Tech University',
                    avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(profile.name + 'faculty')}`,
                    courses: [],
                },
            ]);
            insertError = error;
        }

        if (insertError) {
            // Rollback: delete the auth user if profile insert fails
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            console.error('Profile insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create profile: ' + insertError.message });
        }

        return res.status(200).json({ success: true, userId: authUserId, email: normalizedEmail, role });
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
