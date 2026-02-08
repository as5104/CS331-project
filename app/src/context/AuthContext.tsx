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

// Mock user data (faculty/admin remain local only)
const mockUsers: Record<string, User> = {
  'faculty@university.edu': {
    id: 'FAC001',
    email: 'faculty@university.edu',
    name: 'Dr. Debrup Das',
    role: 'faculty',
    avatar: 'https://api.dicebear.com/9.x/dylan/svg?seed=Sarah',
    department: 'Computer Science',
    institution: 'Tech University',
    employeeId: 'EMP2015001',
    designation: 'Associate Professor',
    courses: [
      { id: 'CSE301', code: 'CSE301', name: 'Data Structures', credits: 4 },
      { id: 'CSE304', code: 'CSE304', name: 'Algorithms', credits: 4 },
    ],
  } as Faculty,
  'admin@university.edu': {
    id: 'ADM001',
    email: 'admin@university.edu',
    name: 'Arijit Sen',
    role: 'admin',
    avatar: 'https://api.dicebear.com/9.x/dylan/svg?seed=Michael',
    department: 'Administration',
    institution: 'Tech University',
    employeeId: 'EMP2010001',
    permissions: ['users.manage', 'workflows.configure', 'system.monitor', 'announcements.publish'],
  } as Admin,
};

const studentEmails = new Set([
  'ananya.student@university.edu',
  'rohan.student@university.edu',
]);

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
    semester: Number(row.semester) || 0,
    cgpa: Number(row.cgpa) || 0,
    attendance: Number(row.attendance) || 0,
    courses: Array.isArray(row.courses) ? row.courses : [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      if (role === 'student') {
        if (email in mockUsers) {
          throw new Error('This email is not allowed for student login.');
        }
        // Supabase auth for students
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !authData.session) {
          // Surface auth reason during dev (e.g., email not confirmed)
          throw new Error(authError?.message || 'Student does not exist or password is incorrect.');
        }

        const { data: profile, error: profileError } = await supabase
          .from('students')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error('Student profile not found. Please contact admin.');
        }

        setUser(mapStudentRow(profile));
      } else {
        if (studentEmails.has(email)) {
          const roleName = role === 'faculty' ? 'faculty' : 'admin';
          throw new Error(`This email is not allowed for ${roleName} login.`);
        }
        // Keep faculty/admin on local mock data
        const mockUser = mockUsers[email];
        if (mockUser && mockUser.role === role) {
          setUser(mockUser);
        } else {
          const roleName = role === 'faculty' ? 'Faculty' : 'Admin';
          throw new Error(`${roleName} account not found.`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Best-effort sign out from Supabase; safe for non-students
    supabase.auth.signOut().catch(() => {});
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // Restore student session if present
  useEffect(() => {
    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      if (email) {
        const { data: profile } = await supabase
          .from('students')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (profile) {
          setUser(mapStudentRow(profile));
        }
      }
    };
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      updateUser,
      isLoading 
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