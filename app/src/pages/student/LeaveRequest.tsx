import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockLeaveRequests } from '@/data/mockData';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  X,
  User,
  ChevronRight,
  Upload,
  Info,
} from 'lucide-react';

interface LeaveRequestProps {
  onNavigate: (path: string) => void;
}

const leaveTypes = [
  { id: 'medical', label: 'Medical Leave', color: 'bg-red-100 text-red-700' },
  { id: 'personal', label: 'Personal Leave', color: 'bg-blue-100 text-blue-700' },
  { id: 'academic', label: 'Academic Leave', color: 'bg-purple-100 text-purple-700' },
  { id: 'family', label: 'Family Emergency', color: 'bg-amber-100 text-amber-700' },
];

export function LeaveRequest({ onNavigate }: LeaveRequestProps) {
  const [leaveType, setLeaveType] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [previousRequests, setPreviousRequests] = useState(mockLeaveRequests);

  // Calculate duration
  const calculateDuration = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const duration = calculateDuration();

  // Validate dates
  const validateDates = () => {
    if (!fromDate || !toDate) return true;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) return false;
    if (end < start) return false;
    return true;
  };

  const isValid = () => {
    return leaveType && fromDate && toDate && reason.length >= 10 && validateDates();
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRequest = {
      id: `LEV${String(previousRequests.length + 1).padStart(3, '0')}`,
      type: leaveType as any,
      fromDate,
      toDate,
      reason,
      status: 'pending' as const,
      documents: documents.map(d => d.name),
    };
    
    setPreviousRequests(prev => [newRequest, ...prev]);
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypes.find(l => l.id === type)?.label || type;
  };

  if (submitSuccess) {
    return (
      <DashboardLayout title="Leave Request" activePath="/leave-request" onNavigate={onNavigate}>
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
            Your leave request has been submitted for approval.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You will be notified once it's approved.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setLeaveType('');
                setFromDate('');
                setToDate('');
                setReason('');
                setDocuments([]);
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
    <DashboardLayout title="Leave / Attendance Request" activePath="/leave-request" onNavigate={onNavigate}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">Submit Leave Request</h2>
          <p className="text-muted-foreground">Apply for leave or attendance exemption</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Leave Type */}
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="block text-sm font-medium mb-3">Leave Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setLeaveType(type.id)}
                    className={`
                      p-3 rounded-xl border text-left transition-all
                      ${leaveType === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }
                    `}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${type.color}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="block text-sm font-medium mb-3">Select Dates *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Duration & Validation */}
              {fromDate && toDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  {!validateDates() ? (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Invalid date range. Please check your dates.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Duration: {duration} day{duration !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Date & Rule Validation Passed
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Reason */}
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="block text-sm font-medium mb-2">
                Reason for Leave *
                <span className="text-muted-foreground font-normal"> (minimum 10 characters)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for your leave request..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Documents */}
            <div className="bg-card rounded-xl border border-border p-5">
              <label className="block text-sm font-medium mb-3">Supporting Documents</label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="leave-docs"
                />
                <label htmlFor="leave-docs" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload documents</p>
                  <p className="text-xs text-muted-foreground">Medical certificates, etc.</p>
                </label>
              </div>

              {documents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 space-y-2"
                >
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
                      </div>
                      <button
                        onClick={() => removeDocument(index)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Approval Workflow */}
            {isValid() && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 rounded-xl border border-blue-100"
              >
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">Approval Workflow</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Faculty</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Admin</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Approved</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!isValid() || isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all
                ${!isValid()
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
                  Submit Request
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Guidelines */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Apply at least 2 days in advance
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Medical leave requires certificate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Maximum 5 days per request
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Approval may take 24-48 hours
                </li>
              </ul>
            </div>

            {/* Previous Requests */}
            {previousRequests.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{getLeaveTypeLabel(req.type)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.fromDate} to {req.toDate}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
