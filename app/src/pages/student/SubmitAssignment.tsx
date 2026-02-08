import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockAssignments } from '@/data/mockData';
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  File,
  FileCode,
  FileImage,
  Loader2,
  User,
} from 'lucide-react';

interface SubmitAssignmentProps {
  onNavigate: (path: string) => void;
}

export function SubmitAssignment({ onNavigate }: SubmitAssignmentProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [comments, setComments] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending');
  const selectedAssignmentData = pendingAssignments.find(a => a.id === selectedAssignment);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    newFiles.forEach(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 10MB limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => setValidationErrors([]), 5000);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return <File className="w-5 h-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <FileImage className="w-5 h-5 text-green-500" />;
    if (['zip', 'rar'].includes(ext || '')) return <FileCode className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || files.length === 0) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  if (submitSuccess) {
    return (
      <DashboardLayout title="Submit Assignment" activePath="/assignments" onNavigate={onNavigate}>
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
          <h2 className="text-2xl font-bold mb-2">Assignment Submitted!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Your assignment has been successfully submitted and is pending review by your supervisor.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setSelectedAssignment('');
                setFiles([]);
                setComments('');
              }}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Submit Another
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
    <DashboardLayout title="Submit Assignment" activePath="/assignments" onNavigate={onNavigate}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">Submit Assignment</h2>
          <p className="text-muted-foreground">Upload your assignment files and submit for review</p>
        </motion.div>

        {/* Validation Errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Validation Errors</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-600">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignment Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Select Assignment
              </h3>
              
              <div className="space-y-2">
                {pendingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending assignments
                  </p>
                ) : (
                  pendingAssignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className={`
                        w-full text-left p-3 rounded-lg border transition-all
                        ${selectedAssignment === assignment.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }
                      `}
                    >
                      <p className="font-medium text-sm">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.courseName}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600">
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Assignment Details */}
            {selectedAssignmentData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-card rounded-xl border border-border p-5"
              >
                <h3 className="font-semibold mb-3">Assignment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Course:</span> {selectedAssignmentData.courseName}</p>
                  <p><span className="text-muted-foreground">Total Marks:</span> {selectedAssignmentData.totalMarks}</p>
                  <p><span className="text-muted-foreground">Deadline:</span> {new Date(selectedAssignmentData.deadline).toLocaleString()}</p>
                </div>
                {selectedAssignmentData.description && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">{selectedAssignmentData.description}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - File Upload */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Files
              </h3>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }
                  ${!selectedAssignment ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={!selectedAssignment}
                />
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium mb-1">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (max 10MB per file)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: PDF, DOC, DOCX, ZIP, Images
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2"
                >
                  <p className="text-sm font-medium mb-2">Uploaded Files ({files.length})</p>
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Comments */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments or notes for your supervisor..."
                  rows={4}
                  disabled={!selectedAssignment}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Supervisor Assignment */}
              {selectedAssignment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supervisor Assigned</p>
                      <p className="text-xs text-muted-foreground">
                        Dr. Debrup Das will review your submission
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!selectedAssignment || files.length === 0 || isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl
                  font-medium transition-all
                  ${!selectedAssignment || files.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Assignment
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

