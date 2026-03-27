export interface AcademicTermRow {
    id: string;
    name: string;
    sequence: number | null;
    is_active: boolean;
    created_at: string;
}

export interface DepartmentRow {
    id: string;
    name: string;
    code: string | null;
    created_at: string;
}

export interface FacultyOption {
    id: string;
    name: string;
    department: string | null;
}

export interface StudentOption {
    id: string;
    name: string;
    roll_number: string;
    department: string | null;
    batch_year: string | null;
    semester: number | null;
}

export interface CourseRow {
    id: string;
    code: string;
    name: string;
    credits: number;
    semester: number | null;
    department: string | null;
    description: string | null;
    instructor_id: string | null;
    term_id: string | null;
    department_id: string | null;
    created_at: string;
    instructor?: { id: string; name: string; department: string | null } | null;
    academic_terms?: { id: string; name: string; sequence: number | null } | null;
    departments?: { id: string; name: string; code: string | null } | null;
}

export interface CourseFacultyRow {
    id: string;
    course_id: string;
    faculty_id: string;
}

export interface EnrollmentRow {
    id: string;
    student_id: string;
    course_id: string;
    section: string | null;
    section_faculty_id: string | null;
    students: { name: string; roll_number: string; department: string | null } | null;
}
