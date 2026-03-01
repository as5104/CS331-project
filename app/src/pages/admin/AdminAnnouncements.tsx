import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockAnnouncements } from '@/data/mockData';
import type { Announcement } from '@/types';
import {
    Megaphone, Plus, X, Send, Users, GraduationCap,
    UserCircle, Globe, AlertCircle, ChevronDown,
} from 'lucide-react';

interface AdminAnnouncementsProps {
    onNavigate: (path: string) => void;
}

const priorityConfig = {
    high: { label: 'High', color: 'bg-red-100 text-red-700' },
    medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
    low: { label: 'Low', color: 'bg-green-100 text-green-700' },
};
const targetConfig = {
    all: { label: 'All Users', icon: Globe },
    students: { label: 'Students', icon: GraduationCap },
    faculty: { label: 'Faculty', icon: UserCircle },
    department: { label: 'Department', icon: Users },
};

const emptyForm = {
    title: '', content: '',
    target: 'all' as Announcement['target'],
    priority: 'medium' as Announcement['priority'],
};

export function AdminAnnouncements({ onNavigate }: AdminAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        const newAnn: Announcement = {
            id: `ANN${String(announcements.length + 1).padStart(3, '0')}`,
            title: form.title,
            content: form.content,
            target: form.target,
            priority: form.priority,
            publishedAt: new Date().toISOString(),
            author: 'Arijit Sen',
        };
        setAnnouncements(prev => [newAnn, ...prev]);
        setIsSubmitting(false);
        setIsCreating(false);
        setForm(emptyForm);
    };

    return (
        <DashboardLayout title="Announcements" activePath="/announcements" onNavigate={onNavigate}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Announcements</h2>
                        <p className="text-muted-foreground mt-1">Create and manage platform announcements.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </motion.button>
                </div>
            </motion.div>

            {/* Announcements list */}
            <div className="space-y-4">
                {announcements.map((ann, i) => {
                    const TargetIcon = targetConfig[ann.target]?.icon || Globe;
                    return (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-card rounded-xl border border-border p-5"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Megaphone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{ann.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ann.priority].color}`}>
                                                {priorityConfig[ann.priority].label} Priority
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                <TargetIcon className="w-3 h-3" />
                                                {targetConfig[ann.target]?.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                By {ann.author} • {new Date(ann.publishedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreating && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCreating(false)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
                                <div className="flex items-center justify-between p-5 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">Create Announcement</h3>
                                    </div>
                                    <button onClick={() => setIsCreating(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Title *</label>
                                        <input
                                            value={form.title}
                                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                            placeholder="Announcement title..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">Content *</label>
                                        <textarea
                                            value={form.content}
                                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                            placeholder="Announcement details..."
                                            rows={4}
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Target Audience</label>
                                            <div className="relative">
                                                <select
                                                    value={form.target}
                                                    onChange={e => setForm(f => ({ ...f, target: e.target.value as Announcement['target'] }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="all">All Users</option>
                                                    <option value="students">Students</option>
                                                    <option value="faculty">Faculty</option>
                                                    <option value="department">Department</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">Priority</label>
                                            <div className="relative">
                                                <select
                                                    value={form.priority}
                                                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Announcement['priority'] }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-5 border-t border-border">
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={handleCreate}
                                        disabled={isSubmitting || !form.title.trim() || !form.content.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                        ) : (
                                            <><Send className="w-4 h-4" /> Publish</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
