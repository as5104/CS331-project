import React, { createContext, useContext, useState, useCallback } from 'react';
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

// Mock user data
const mockUsers: Record<string, User> = {
  'student@university.edu': {
    id: 'STU001',
    email: 'student@university.edu',
    name: 'Ankit Sarkar',
    role: 'student',
    avatar: 'https://api.dicebear.com/9.x/dylan/svg?seed=Alex',
    department: 'Computer Science',
    institution: 'Tech University',
    rollNumber: 'CS2021001',
    program: 'B.Tech Computer Science',
    semester: 6,
    cgpa: 8.5,
    attendance: 87,
    courses: [
      { id: 'CSE301', code: 'CSE301', name: 'Data Structures', credits: 4, progress: 75, grade: 'A', attendance: 90 },
      { id: 'CSE302', code: 'CSE302', name: 'Database Systems', credits: 3, progress: 60, grade: 'B+', attendance: 85 },
      { id: 'CSE303', code: 'CSE303', name: 'Computer Networks', credits: 4, progress: 80, grade: 'A-', attendance: 88 },
    ],
  } as Student,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = mockUsers[email];
    if (mockUser && mockUser.role === role) {
      setUser(mockUser);
    } else {
      // Create a new mock user if not found
      const newUser: User = {
        id: 'USR' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role,
        avatar: `https://api.dicebear.com/9.x/dylan/svg?seed=${email}`,
        department: 'Computer Science',
        institution: 'Tech University',
      };
      
      if (role === 'student') {
        (newUser as Student).rollNumber = 'CS2021' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        (newUser as Student).program = 'B.Tech Computer Science';
        (newUser as Student).semester = 6;
        (newUser as Student).cgpa = 8.2;
        (newUser as Student).attendance = 85;
        (newUser as Student).courses = [
          { id: 'CSE301', code: 'CSE301', name: 'Data Structures', credits: 4, progress: 75 },
          { id: 'CSE302', code: 'CSE302', name: 'Database Systems', credits: 3, progress: 60 },
        ];
      } else if (role === 'faculty') {
        (newUser as Faculty).employeeId = 'EMP2015' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        (newUser as Faculty).designation = 'Assistant Professor';
        (newUser as Faculty).courses = [
          { id: 'CSE301', code: 'CSE301', name: 'Data Structures', credits: 4 },
        ];
      } else {
        (newUser as Admin).employeeId = 'EMP2010' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        (newUser as Admin).permissions = ['users.manage', 'workflows.configure', 'system.monitor'];
      }
      
      setUser(newUser);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
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

