import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockPendingReviews } from '@/data/mockData';
import {
    ClipboardCheck, Search, ChevronDown, Check, RotateCcw,
    Star, MessageSquare, CheckCircle2, Clock,
    User as UserIcon,
} from 'lucide-react';

interface FacultyReviewAssignmentsProps {
    onNavigate: (path: string) => void;
}

type ReviewStatus = 'pending' | 'approved' | 'revision' | 'graded';

interface ReviewItem {
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseName: string;
    submittedAt: string;
    status: ReviewStatus;
    marks?: number;
    feedback?: string;
}

export function FacultyReviewAssignments({ onNavigate }: FacultyReviewAssignmentsProps) {
    const [reviews, setReviews] = useState<ReviewItem[]>(
        mockPendingReviews.map(r => ({ ...r, status: 'pending' as ReviewStatus }))
    );
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | ReviewStatus>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [gradeInput, setGradeInput] = useState<Record<string, string>>({});
    const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
    const [actionResult, setActionResult] = useState<{ id: string; message: string; success: boolean } | null>(null);

    const filtered = reviews.filter(r => {
        const matchesSearch =
            r.studentName.toLowerCase().includes(search.toLowerCase()) ||
            r.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
            r.courseName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const counts = {
        all: reviews.length,
        pending: reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        revision: reviews.filter(r => r.status === 'revision').length,
        graded: reviews.filter(r => r.status === 'graded').length,
    };

    const handleAction = (id: string, action: 'approve' | 'revision' | 'grade') => {
        setReviews(prev => prev.map(r => {
            if (r.id !== id) return r;
            if (action === 'approve') return { ...r, status: 'approved' as ReviewStatus };
            if (action === 'revision') return { ...r, status: 'revision' as ReviewStatus, feedback: feedbackInput[id] || 'Please revise and resubmit.' };
            if (action === 'grade') return { ...r, status: 'graded' as ReviewStatus, marks: Number(gradeInput[id]) || 0, feedback: feedbackInput[id] || '' };
            return r;
        }));
        const msg = action === 'approve' ? 'Assignment approved' : action === 'revision' ? 'Revision requested' : 'Marks assigned';
        setActionResult({ id, message: msg, success: true });
        setTimeout(() => setActionResult(null), 3000);
    };

    const statusBadge = (status: ReviewStatus) => {
        const map = {
            pending: { bg: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
            approved: { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Approved' },
            revision: { bg: 'bg-red-100 text-red-700', icon: RotateCcw, label: 'Revision' },
            graded: { bg: 'bg-blue-100 text-blue-700', icon: Star, label: 'Graded' },
        };
        const s = map[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg}`}>
                <s.icon className="w-3 h-3" /> {s.label}
            </span>
        );
    };

    return (
        <DashboardLayout title="Review Assignments" activePath="/review" onNavigate={onNavigate}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h2 className="text-2xl font-bold">Review Assignments</h2>
                <p className="text-muted-foreground mt-1">Evaluate and provide feedback on student submissions.</p>
            </motion.div>

            {/* Filter Tabs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2 mb-4">
                {(['all', 'pending', 'approved', 'revision', 'graded'] as const).map(tab => (
                    <button key={tab} onClick={() => setFilterStatus(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === tab
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'}`}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="ml-1 opacity-70">({counts[tab]})</span>
                    </button>
                ))}
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by student, assignment, or course..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {actionResult && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> {actionResult.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-xl border border-border p-12 text-center">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <h3 className="font-semibold mb-1">No submissions found</h3>
                    <p className="text-sm text-muted-foreground">
                        {reviews.length === 0 ? 'Assignments will appear here when students submit.' : 'Try a different filter or search.'}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((review, i) => {
                        const isExpanded = expandedId === review.id;
                        return (
                            <motion.div key={review.id}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.04 }}
                                className="bg-card rounded-xl border border-border overflow-hidden hover:border-purple-200 transition-all">

                                <button onClick={() => setExpandedId(isExpanded ? null : review.id)}
                                    className="w-full p-4 flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-sm truncate">{review.studentName}</p>
                                            {statusBadge(review.status)}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {review.assignmentTitle} &bull; {review.courseName}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                        <p className="text-xs text-muted-foreground">{new Date(review.submittedAt).toLocaleDateString()}</p>
                                        {review.marks != null && (
                                            <p className="text-sm font-semibold text-blue-600 mt-0.5">{review.marks}/100</p>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                            className="overflow-hidden">
                                            <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="p-2 bg-muted/50 rounded-lg">
                                                        <span className="text-muted-foreground">Assignment</span>
                                                        <p className="font-medium mt-0.5">{review.assignmentTitle}</p>
                                                    </div>
                                                    <div className="p-2 bg-muted/50 rounded-lg">
                                                        <span className="text-muted-foreground">Course</span>
                                                        <p className="font-medium mt-0.5">{review.courseName}</p>
                                                    </div>
                                                    <div className="p-2 bg-muted/50 rounded-lg">
                                                        <span className="text-muted-foreground">Submitted</span>
                                                        <p className="font-medium mt-0.5">{new Date(review.submittedAt).toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-2 bg-muted/50 rounded-lg">
                                                        <span className="text-muted-foreground">Status</span>
                                                        <div className="mt-0.5">{statusBadge(review.status)}</div>
                                                    </div>
                                                </div>

                                                {review.status === 'pending' && (
                                                    <div className="space-y-3 pt-2">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Marks (out of 100)</label>
                                                                <input type="number" min={0} max={100}
                                                                    value={gradeInput[review.id] || ''}
                                                                    onChange={e => setGradeInput({ ...gradeInput, [review.id]: e.target.value })}
                                                                    placeholder="e.g. 85"
                                                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium mb-1">Feedback</label>
                                                                <input type="text"
                                                                    value={feedbackInput[review.id] || ''}
                                                                    onChange={e => setFeedbackInput({ ...feedbackInput, [review.id]: e.target.value })}
                                                                    placeholder="Optional feedback"
                                                                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleAction(review.id, 'approve')}
                                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                                                                <Check className="w-3.5 h-3.5" /> Approve
                                                            </button>
                                                            <button onClick={() => handleAction(review.id, 'grade')}
                                                                disabled={!gradeInput[review.id]}
                                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                                <Star className="w-3.5 h-3.5" /> Grade
                                                            </button>
                                                            <button onClick={() => handleAction(review.id, 'revision')}
                                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                                                <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {review.status !== 'pending' && review.feedback && (
                                                    <div className="p-3 bg-muted/50 rounded-lg text-xs">
                                                        <span className="flex items-center gap-1 text-muted-foreground mb-1">
                                                            <MessageSquare className="w-3 h-3" /> Feedback
                                                        </span>
                                                        <p className="font-medium">{review.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
