import type { User } from '../types';

export const mockUser: User = {
    id: '1',
    email: '
    title': 'John Doe',
    role: 'student',
    avatar: 'https://i.pravatar.cc/150?img=3',
    department: 'Computer Science',
    institution: 'ABC University',
    rollNumber: 'CS2021001',
    program: 'B.Tech Computer Science',
    semester: 4,
    cgpa: 8.5,
    attendance: 92,
    courses: [
        {
            id: 'c1',
            code: 'CS101',
            name: 'Introduction to Computer Science',
            credits: 3,
            semester: 1,
            instructor: 'Dr. Smith',
            progress: 100,
            grade: 'A',
            attendance: 95,
        },
        {
            id: 'c2',
            code: 'CS201',
            name: 'Data Structures and Algorithms',
            credits: 4,
            semester: 3,
            instructor: 'Dr. Johnson',
            progress: 75,
            grade: 'A-',
            attendance: 90,
        },
        {
            id: 'c3',
            code: 'CS301',
            name: 'Operating Systems',
            credits: 4,
            semester: 5,
            instructor: 'Dr. Lee',
            progress: 50,
            grade: 'B+',

            attendance: 88,
        },
    ],
};

