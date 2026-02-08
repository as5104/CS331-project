import React, { createContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    user:
    | {


        id: string;
        name: string;
        email: string;
        role: 'student' | 'faculty' | 'admin';
        avatar?: string;
    }
    | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    login: async () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthContextType['user']>(null);
    
    useEffect(() => {
        // Check localStorage for existing auth state
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);
 