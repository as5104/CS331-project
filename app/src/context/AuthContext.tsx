import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, UserRole, Student, Faculty, Admin } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAuthErrorMessage(error: { message?: string } | null): string {
  const raw = (error?.message ?? '').toLowerCase();

  if (raw.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (raw.includes('too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  return 'Unable to sign in right now. Please try again.';
}

// Row mappers

function mapStudentRow(row: any): Student {
  return {
    id: row.auth_user_id ?? row.id,
    email: row.email,
    name: row.name,
    role: 'student',
    avatar: row.avatar ?? undefined,
    department: row.department ?? undefined,
    institution: row.institution ?? undefined,
    rollNumber: row.roll_number,
    program: row.program ?? '',
    semester: Number(row.semester) || 1,
    cgpa: Number(row.cgpa) || 0,
    attendance: Number(row.attendance) || 0,
    courses: Array.isArray(row.courses) ? row.courses : [],
    // New admission fields
    dateOfBirth: row.date_of_birth ?? undefined,
    gender: row.gender ?? undefined,
    bloodGroup: row.blood_group ?? undefined,
    phone: row.phone ?? undefined,
    batchYear: row.batch_year ?? undefined,
    fatherName: row.father_name ?? undefined,
    motherName: row.mother_name ?? undefined,
    guardianContact: row.guardian_contact ?? undefined,
  };
}

function mapFacultyRow(row: any): Faculty {
  return {
    id: row.auth_user_id ?? row.id,
    email: row.email,
    name: row.name,
    role: 'faculty',
    avatar: row.avatar ?? undefined,
    department: row.department ?? undefined,
    institution: row.institution ?? undefined,
    employeeId: row.employee_id,
    designation: row.designation ?? '',
    qualification: row.qualification ?? undefined,
    dateOfJoining: row.date_of_joining ?? undefined,
    courses: Array.isArray(row.courses) ? row.courses : [],
    // Admission fields
    dateOfBirth: row.date_of_birth ?? undefined,
    gender: row.gender ?? undefined,
    phone: row.phone ?? undefined,
  };
}

function mapAdminRow(row: any): Admin {
  return {
    id: row.auth_user_id ?? row.id,
    email: row.email,
    name: row.name,
    role: 'admin',
    avatar: row.avatar ?? `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(row.name ?? 'admin')}`,
    department: row.department ?? 'Administration',
    institution: row.institution ?? 'Tech University',
    employeeId: row.employee_id ?? '',
    permissions: row.permissions ?? [
      'users.manage',
      'workflows.configure',
      'system.monitor',
      'announcements.publish',
    ],
  };
}

// Auth Provider

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve a Supabase auth session to a full user object by querying role tables
  const resolveAuthUser = useCallback(async (authEmail: string): Promise<User | null> => {
    // Try students table
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('email', authEmail)
      .maybeSingle();
    if (student) {
      return mapStudentRow(student);
    }

    // Try faculty table
    const { data: faculty } = await supabase
      .from('faculty')
      .select('*')
      .eq('email', authEmail)
      .maybeSingle();
    if (faculty) {
      return mapFacultyRow(faculty);
    }

    // Try admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', authEmail)
      .maybeSingle();
    if (admin) {
      return mapAdminRow(admin);
    }

    return null;
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    const normalizedEmail = email.trim();

    try {
      // 1. Authenticate with Supabase (all roles now use real Supabase auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError || !authData.session) {
        throw new Error(normalizeAuthErrorMessage(authError));
      }

      const authEmail = authData.user?.email?.trim() ?? normalizedEmail;

      // 2. Resolve the authenticated account to an app profile
      const profile = await resolveAuthUser(authEmail);
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Your account is authenticated but not linked to a portal profile. Contact your administrator.');
      }

      // 3. Verify the profile role matches what the user selected on the login screen
      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Role mismatch. Please select the correct role and try again.');
      }

      setUser(profile);
    } catch (error) {
      await supabase.auth.signOut().catch(() => { });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }, [resolveAuthUser]);

  const logout = useCallback(() => {
    supabase.auth.signOut().catch(() => { });
    setUser(null);
    sessionStorage.removeItem('currentPage');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // Restore session on page refresh
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authEmail = data.session?.user?.email;
        if (!authEmail) return;

        const resolved = await resolveAuthUser(authEmail);
        if (resolved) setUser(resolved);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [resolveAuthUser]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      updateUser,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
