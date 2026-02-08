import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  Info,
} from 'lucide-react';

interface CGPACalculatorProps {
  onNavigate: (path: string) => void;
}

const gradePoints: Record<string, number> = {
  'A+': 10,
  'A': 9,
  'A-': 8,
  'B+': 7,
  'B': 6,
  'B-': 5,
  'C': 4,
  'P': 3,
  'F': 0,
};

const semesterData = [
  {
    semester: 1,
    courses: [
      { code: 'CSE101', name: 'Introduction to Programming', credits: 4, grade: 'A' },
      { code: 'MAT101', name: 'Engineering Mathematics I', credits: 4, grade: 'A-' },
      { code: 'PHY101', name: 'Engineering Physics', credits: 3, grade: 'B+' },
      { code: 'ENG101', name: 'Communication Skills', credits: 2, grade: 'A' },
      { code: 'CSE102', name: 'Digital Logic', credits: 3, grade: 'B' },
    ],
  },
  {
    semester: 2,
    courses: [
      { code: 'CSE201', name: 'Data Structures', credits: 4, grade: 'A' },
      { code: 'MAT201', name: 'Engineering Mathematics II', credits: 4, grade: 'B+' },
      { code: 'CSE202', name: 'Object Oriented Programming', credits: 3, grade: 'A-' },
      { code: 'ECE201', name: 'Basic Electronics', credits: 3, grade: 'B' },
      { code: 'CSE203', name: 'Computer Organization', credits: 3, grade: 'B+' },
    ],
  },
  {
    semester: 3,
    courses: [
      { code: 'CSE301', name: 'Algorithms', credits: 4, grade: 'A-' },
      { code: 'CSE302', name: 'Database Systems', credits: 3, grade: 'B+' },
      { code: 'CSE303', name: 'Operating Systems', credits: 4, grade: 'B' },
      { code: 'MAT301', name: 'Discrete Mathematics', credits: 3, grade: 'A' },
      { code: 'CSE304', name: 'Web Technologies', credits: 3, grade: 'A-' },
    ],
  },
  {
    semester: 4,
    courses: [
      { code: 'CSE401', name: 'Computer Networks', credits: 4, grade: 'A' },
      { code: 'CSE402', name: 'Software Engineering', credits: 3, grade: 'A-' },
      { code: 'CSE403', name: 'Theory of Computation', credits: 3, grade: 'B+' },
      { code: 'CSE404', name: 'Machine Learning', credits: 3, grade: 'A' },
      { code: 'CSE405', name: 'Cloud Computing', credits: 3, grade: 'B+' },
    ],
  },
  {
    semester: 5,
    courses: [
      { code: 'CSE501', name: 'Artificial Intelligence', credits: 4, grade: 'A-' },
      { code: 'CSE502', name: 'Cyber Security', credits: 3, grade: 'B+' },
      { code: 'CSE503', name: 'Data Mining', credits: 3, grade: 'A' },
      { code: 'CSE504', name: 'Mobile App Development', credits: 3, grade: 'A-' },
      { code: 'CSE505', name: 'Project Management', credits: 2, grade: 'A' },
    ],
  },
  {
    semester: 6,
    courses: [
      { code: 'CSE601', name: 'Big Data Analytics', credits: 4, grade: 'IP' },
      { code: 'CSE602', name: 'Blockchain Technology', credits: 3, grade: 'IP' },
      { code: 'CSE603', name: 'IoT Systems', credits: 3, grade: 'IP' },
      { code: 'CSE604', name: 'Capstone Project', credits: 4, grade: 'IP' },
      { code: 'CSE605', name: 'Technical Elective', credits: 3, grade: 'IP' },
    ],
  },
];

export function CGPACalculator({ onNavigate }: CGPACalculatorProps) {
  const { user } = useAuth();
  const student = user as any;
  const [activeSemester, setActiveSemester] = useState<number | 'all'>('all');

  // Calculate SGPA for a semester
  const calculateSGPA = (courses: typeof semesterData[0]['courses']) => {
    let totalCredits = 0;
    let totalPoints = 0;
    
    courses.forEach(course => {
      if (course.grade !== 'IP' && gradePoints[course.grade] !== undefined) {
        totalCredits += course.credits;
        totalPoints += course.credits * gradePoints[course.grade];
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  // Calculate CGPA
  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    
    semesterData.forEach(sem => {
      sem.courses.forEach(course => {
        if (course.grade !== 'IP' && gradePoints[course.grade] !== undefined) {
          totalCredits += course.credits;
          totalPoints += course.credits * gradePoints[course.grade];
        }
      });
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const currentCGPA = calculateCGPA();

  // Calculate projected CGPA
  const projectedCGPA = (parseFloat(currentCGPA) + 0.2).toFixed(2);

  return (
    <DashboardLayout title="CGPA Calculator" activePath="/cgpa-calculator" onNavigate={onNavigate}>
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-white/70">Current CGPA</span>
          </div>
          <p className="text-4xl font-bold">{currentCGPA}</p>
          <p className="text-sm text-white/60 mt-1">out of 10.0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-muted-foreground">Projected CGPA</span>
          </div>
          <p className="text-4xl font-bold text-green-600">{projectedCGPA}</p>
          <p className="text-sm text-muted-foreground mt-1">after current semester</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-muted-foreground">Grade</span>
          </div>
          <p className="text-4xl font-bold text-amber-600">
            {parseFloat(currentCGPA) >= 9 ? 'A+' : 
             parseFloat(currentCGPA) >= 8 ? 'A' :
             parseFloat(currentCGPA) >= 7 ? 'B+' :
             parseFloat(currentCGPA) >= 6 ? 'B' : 'C'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">current standing</p>
        </motion.div>
      </motion.div>

      {/* Semester Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSemester('all')}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${activeSemester === 'all'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }
            `}
          >
            All Semesters
          </button>
          {semesterData.map(sem => (
            <button
              key={sem.semester}
              onClick={() => setActiveSemester(sem.semester)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeSemester === sem.semester
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              Sem {sem.semester}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Grades */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-4"
        >
          {(activeSemester === 'all' ? semesterData : semesterData.filter(s => s.semester === activeSemester)).map((sem, semIndex) => (
            <motion.div
              key={sem.semester}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + semIndex * 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Semester {sem.semester}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    SGPA: <span className="font-bold text-foreground">{calculateSGPA(sem.courses)}</span>
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {sem.courses.map((course, index) => (
                  <motion.div
                    key={course.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="p-4 flex items-center justify-between hover:bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.code} • {course.credits} Credits</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-bold
                        ${course.grade === 'IP' ? 'bg-amber-100 text-amber-700' :
                          gradePoints[course.grade] >= 9 ? 'bg-green-100 text-green-700' :
                          gradePoints[course.grade] >= 7 ? 'bg-blue-100 text-blue-700' :
                          gradePoints[course.grade] >= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'}
                      `}>
                        {course.grade}
                      </span>
                      {course.grade !== 'IP' && (
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {gradePoints[course.grade]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Grade Scale */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Grade Scale
            </h3>
            <div className="space-y-2">
              {Object.entries(gradePoints).map(([grade, points]) => (
                <div key={grade} className="flex items-center justify-between py-1">
                  <span className={`
                    px-2 py-0.5 rounded text-sm font-bold
                    ${points >= 9 ? 'bg-green-100 text-green-700' :
                      points >= 7 ? 'bg-blue-100 text-blue-700' :
                      points >= 5 ? 'bg-amber-100 text-amber-700' :
                      points > 0 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'}
                  `}>
                    {grade}
                  </span>
                  <span className="text-sm text-muted-foreground">{points} points</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Academic Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Credits</span>
                <span className="font-medium">
                  {semesterData.reduce((acc, sem) => 
                    acc + sem.courses.filter(c => c.grade !== 'IP').reduce((sum, c) => sum + c.credits, 0), 0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Courses Completed</span>
                <span className="font-medium">
                  {semesterData.reduce((acc, sem) => 
                    acc + sem.courses.filter(c => c.grade !== 'IP').length, 0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Semester</span>
                <span className="font-medium">{student?.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Standing</span>
                <span className={`
                  font-medium
                  ${parseFloat(currentCGPA) >= 8 ? 'text-green-600' :
                    parseFloat(currentCGPA) >= 6 ? 'text-amber-600' : 'text-red-600'}
                `}>
                  {parseFloat(currentCGPA) >= 8 ? 'First Class' :
                   parseFloat(currentCGPA) >= 6 ? 'Second Class' : 'Pass Class'}
                </span>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </DashboardLayout>
  );
}
