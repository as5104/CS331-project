import { createClient } from '@supabase/supabase-js';
import {
    handleOptions,
    setCorsHeaders,
    ensureOriginAllowed,
    getAuthUserFromRequest,
    normalizeEmail,
    isValidEmail,
    isStrongPassword,
} from './_security.js';

const ALLOWED_GENDERS = new Set(['Male', 'Female', 'Other']);
const ALLOWED_FACULTY_DESIGNATIONS = new Set(['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor']);

function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value) {
    const normalized = normalizeString(value);
    return normalized || null;
}

function normalizePhone(value) {
    const rawDigits = normalizeString(value).replace(/\D/g, '');
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

function isValidIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime());
}

function validateStudentProfile(profile) {
    const payload = profile && typeof profile === 'object' ? profile : null;
    if (!payload) return { ok: false, error: 'Invalid student profile payload.' };

    const requiredFields = {
        name: normalizeString(payload.name),
        rollNumber: normalizeString(payload.rollNumber),
        program: normalizeString(payload.program),
        department: normalizeString(payload.department),
        batchYear: normalizeString(payload.batchYear),
        dateOfBirth: normalizeString(payload.dateOfBirth),
        gender: normalizeString(payload.gender),
        phone: normalizePhone(payload.phone),
        fatherName: normalizeString(payload.fatherName),
        motherName: normalizeString(payload.motherName),
        guardianContact: normalizePhone(payload.guardianContact),
    };

    const missing = Object.entries(requiredFields)
        .filter(([, value]) => !value)
        .map(([key]) => key);
    if (missing.length > 0) {
        return { ok: false, error: `Missing required student profile fields: ${missing.join(', ')}` };
    }

    if (!ALLOWED_GENDERS.has(requiredFields.gender)) {
        return { ok: false, error: 'Invalid gender value for student profile.' };
    }

    if (!isValidIsoDate(requiredFields.dateOfBirth)) {
        return { ok: false, error: 'Invalid student dateOfBirth. Use YYYY-MM-DD.' };
    }

    const semester = Number(payload.semester ?? 1);
    if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
        return { ok: false, error: 'Student semester must be an integer between 1 and 12.' };
    }

    if (!/^\d{4}$/.test(requiredFields.batchYear)) {
        return { ok: false, error: 'Student batchYear must be a 4-digit year.' };
    }

    if (!isValidPhone(requiredFields.phone)) {
        return { ok: false, error: 'Student phone must be +91 followed by exactly 10 digits.' };
    }

    if (!isValidPhone(requiredFields.guardianContact)) {
        return { ok: false, error: 'Student guardianContact must be +91 followed by exactly 10 digits.' };
    }

    const normalizedProfile = {
        name: requiredFields.name,
        rollNumber: requiredFields.rollNumber,
        program: requiredFields.program,
        department: requiredFields.department,
        batchYear: requiredFields.batchYear,
        semester,
        dateOfBirth: requiredFields.dateOfBirth,
        gender: requiredFields.gender,
        phone: requiredFields.phone,
        fatherName: requiredFields.fatherName,
        motherName: requiredFields.motherName,
        guardianContact: requiredFields.guardianContact,
        bloodGroup: normalizeOptionalString(payload.bloodGroup),
        institution: normalizeOptionalString(payload.institution) || 'Tech University',
    };

    return { ok: true, profile: normalizedProfile };
}

function validateFacultyProfile(profile) {
    const payload = profile && typeof profile === 'object' ? profile : null;
    if (!payload) return { ok: false, error: 'Invalid faculty profile payload.' };

    const requiredFields = {
        name: normalizeString(payload.name),
        employeeId: normalizeString(payload.employeeId),
        department: normalizeString(payload.department),
        designation: normalizeString(payload.designation),
        qualification: normalizeString(payload.qualification),
        dateOfJoining: normalizeString(payload.dateOfJoining),
        dateOfBirth: normalizeString(payload.dateOfBirth),
        gender: normalizeString(payload.gender),
        phone: normalizePhone(payload.phone),
    };

    const missing = Object.entries(requiredFields)
        .filter(([, value]) => !value)
        .map(([key]) => key);
    if (missing.length > 0) {
        return { ok: false, error: `Missing required faculty profile fields: ${missing.join(', ')}` };
    }

    if (!ALLOWED_GENDERS.has(requiredFields.gender)) {
        return { ok: false, error: 'Invalid gender value for faculty profile.' };
    }

    if (!ALLOWED_FACULTY_DESIGNATIONS.has(requiredFields.designation)) {
        return { ok: false, error: 'Invalid faculty designation value.' };
    }

    if (!isValidIsoDate(requiredFields.dateOfBirth) || !isValidIsoDate(requiredFields.dateOfJoining)) {
        return { ok: false, error: 'Faculty dateOfBirth/dateOfJoining must use YYYY-MM-DD format.' };
    }

    if (!isValidPhone(requiredFields.phone)) {
        return { ok: false, error: 'Faculty phone must be +91 followed by exactly 10 digits.' };
    }

    const normalizedProfile = {
        name: requiredFields.name,
        employeeId: requiredFields.employeeId,
        department: requiredFields.department,
        designation: requiredFields.designation,
        qualification: requiredFields.qualification,
        dateOfJoining: requiredFields.dateOfJoining,
        dateOfBirth: requiredFields.dateOfBirth,
        gender: requiredFields.gender,
        phone: requiredFields.phone,
        institution: normalizeOptionalString(payload.institution) || 'Tech University',
    };

    return { ok: true, profile: normalizedProfile };
}

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

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({ error: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters.' });
    }

    if (!['student', 'faculty'].includes(role)) {
        return res.status(400).json({ error: 'Role must be student or faculty' });
    }

    const profileValidation = role === 'student'
        ? validateStudentProfile(profile)
        : validateFacultyProfile(profile);

    if (!profileValidation.ok) {
        return res.status(400).json({ error: profileValidation.error });
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
                    name: profileValidation.profile.name,
                    roll_number: profileValidation.profile.rollNumber,
                    program: profileValidation.profile.program,
                    department: profileValidation.profile.department,
                    batch_year: profileValidation.profile.batchYear,
                    semester: profileValidation.profile.semester,
                    date_of_birth: profileValidation.profile.dateOfBirth,
                    gender: profileValidation.profile.gender,
                    blood_group: profileValidation.profile.bloodGroup,
                    phone: profileValidation.profile.phone,
                    father_name: profileValidation.profile.fatherName,
                    mother_name: profileValidation.profile.motherName,
                    guardian_contact: profileValidation.profile.guardianContact,
                    institution: profileValidation.profile.institution,
                    avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(profileValidation.profile.name)}`,
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
                    name: profileValidation.profile.name,
                    employee_id: profileValidation.profile.employeeId,
                    department: profileValidation.profile.department,
                    designation: profileValidation.profile.designation,
                    qualification: profileValidation.profile.qualification,
                    date_of_joining: profileValidation.profile.dateOfJoining,
                    gender: profileValidation.profile.gender,
                    date_of_birth: profileValidation.profile.dateOfBirth,
                    phone: profileValidation.profile.phone,
                    institution: profileValidation.profile.institution,
                    avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(profileValidation.profile.name + 'faculty')}`,
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
