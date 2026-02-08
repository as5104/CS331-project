import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockReevaluationRequests } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import type { Student } from '@/types';
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  User,
} from 'lucide-react';

interface ExamReevaluationProps {
  onNavigate: (path: string) => void;
}

const steps = ['Select Course', 'Enter Details', 'Review & Submit'];

export function ExamReevaluation({ onNavigate }: ExamReevaluationProps) {
  const { user } = useAuth();
  const studentCourses = Array.isArray((user as Student | null)?.courses)
    ? (user as Student).courses
    : [];
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [examType, setExamType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [previousRequests, setPreviousRequests] = useState(mockReevaluationRequests);

  const selectedCourseData = studentCourses.find((c: any) => c.id === selectedCourse);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add new request
    const newRequest = {
      id: `REV${String(previousRequests.length + 1).padStart(3, '0')}`,
      courseId: selectedCourse,
      courseName: selectedCourseData?.name || '',
      examType,
      reason,
      status: 'pending' as const,
    };
    
    setPreviousRequests(prev => [newRequest, ...prev]);
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (submitSuccess) {
    return (
      <DashboardLayout title="Exam Re-evaluation" activePath="/reevaluation" onNavigate={onNavigate}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-2 max-w-md">
            Your re-evaluation request has been submitted successfully.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            A reviewer will be assigned shortly.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setCurrentStep(0);
                setSelectedCourse('');
                setExamType('');
                setReason('');
              }}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              New Request
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Exam Re-evaluation" activePath="/reevaluation" onNavigate={onNavigate}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">Apply for Exam Re-evaluation</h2>
          <p className="text-muted-foreground">Request a re-evaluation of your exam answer scripts</p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300
                      ${index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={`
                    text-xs mt-2 font-medium
                    ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded-full transition-all duration-300
                    ${index < currentStep ? 'bg-green-500' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold mb-4">Select Course & Exam</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentCourses.map((course: any) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course.id)}
                        className={`
                          p-4 rounded-xl border text-left transition-all
                          ${selectedCourse === course.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }
                        `}
                      >
                        <p className="font-medium text-sm">{course.name}</p>
                        <p className="text-xs text-muted-foreground">{course.code}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                            Grade: {course.grade}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Exam Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mid Semester', 'End Semester', 'Quiz 1', 'Quiz 2', 'Lab Exam'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setExamType(type)}
                        className={`
                          px-4 py-2 rounded-lg border text-sm transition-all
                          ${examType === type
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Eligibility Check */}
              {selectedCourse && examType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100"
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Eligibility Check Passed</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    You are eligible to apply for re-evaluation for this exam.
                  </p>
                </motion.div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!selectedCourse || !examType}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                    ${!selectedCourse || !examType
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                    }
                  `}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold mb-4">Enter Reason for Re-evaluation</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm font-medium">Selected Course</p>
                  <p className="text-sm text-muted-foreground">{selectedCourseData?.name} ({selectedCourseData?.code})</p>
                  <p className="text-sm text-muted-foreground">{examType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason for Re-evaluation *
                    <span className="text-muted-foreground font-normal"> (minimum 20 characters)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you believe your answer script should be re-evaluated. Be specific about the questions/sections you want reviewed..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {reason.length}/500 characters
                  </p>
                </div>

                {/* Reviewer Assignment Preview */}
                {reason.length >= 20 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 rounded-xl border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Reviewer will be assigned</p>
                        <p className="text-xs text-muted-foreground">
                          A faculty member will be assigned to review your request
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={reason.length < 20}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                    ${reason.length < 20
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                    }
                  `}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="font-semibold mb-4">Review & Confirm</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Course</span>
                    <span className="text-sm font-medium">{selectedCourseData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Exam Type</span>
                    <span className="text-sm font-medium">{examType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Grade</span>
                    <span className="text-sm font-medium">{selectedCourseData?.grade}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm">{reason}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous Requests */}
        {previousRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Previous Requests
              </h3>
            </div>
            <div className="divide-y divide-border">
              {previousRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 flex items-center justify-between hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{req.courseName}</p>
                    <p className="text-xs text-muted-foreground">{req.examType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                    {req.newGrade && (
                      <span className="text-sm font-medium text-green-600">
                        {req.originalGrade} → {req.newGrade}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
