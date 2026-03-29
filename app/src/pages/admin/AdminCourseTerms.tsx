import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { Toast, useToast } from '@/components/ui/Toast';
import type { AcademicTermRow } from '@/lib/adminCourseTypes';
import { ArrowLeft, CalendarRange, Plus, Save, Trash2 } from 'lucide-react';

interface AdminCourseTermsProps {
    onNavigate: (path: string) => void;
}

export function AdminCourseTerms({ onNavigate }: AdminCourseTermsProps) {
    const { toast, flash, dismiss } = useToast();
    const [terms, setTerms] = useState<AcademicTermRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newSequence, setNewSequence] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editSequence, setEditSequence] = useState('');

    async function loadTerms() {
        setLoading(true);
        const { data, error } = await supabase
            .from('academic_terms')
            .select('*')
            .order('name', { ascending: true })
            .order('sequence', { ascending: true, nullsFirst: false });
        if (error) flash(error.message, 'error');
        setTerms((data ?? []) as AcademicTermRow[]);
        setLoading(false);
    }

    useEffect(() => {
        loadTerms();
    }, []);

    async function handleCreate() {
        if (!newName.trim()) return;
        if (!newSequence.trim()) {
            flash('Actual semester number is required.', 'error');
            return;
        }
        setSaving(true);
        const payload = {
            name: newName.trim(),
            sequence: Number(newSequence),
            is_active: true,
        };
        const { error } = await supabase.from('academic_terms').insert([payload]);
        if (error) flash(error.message, 'error');
        else {
            flash('Semester added');
            setNewName('');
            setNewSequence('');
            loadTerms();
        }
        setSaving(false);
    }

    function startEdit(term: AcademicTermRow) {
        setEditingId(term.id);
        setEditName(term.name);
        setEditSequence(term.sequence?.toString() ?? '');
    }

    async function saveEdit(id: string) {
        if (!editName.trim()) return;
        if (!editSequence.trim()) {
            flash('Actual semester number is required.', 'error');
            return;
        }
        const payload = {
            name: editName.trim(),
            sequence: Number(editSequence),
        };
        const { error } = await supabase.from('academic_terms').update(payload).eq('id', id);
        if (error) flash(error.message, 'error');
        else {
            flash('Semester updated');
            setEditingId(null);
            loadTerms();
        }
    }

    async function toggleActive(term: AcademicTermRow) {
        const { error } = await supabase
            .from('academic_terms')
            .update({ is_active: !term.is_active })
            .eq('id', term.id);
        if (error) flash(error.message, 'error');
        else loadTerms();
    }

    async function remove(id: string) {
        const { error } = await supabase.from('academic_terms').delete().eq('id', id);
        if (error) flash(error.message, 'error');
        else {
            flash('Semester removed');
            loadTerms();
        }
    }

    return (
        <DashboardLayout title="Semesters" activePath="/course-management/terms" onNavigate={onNavigate}>
            <Toast toast={toast} onDismiss={dismiss} />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button
                    onClick={() => onNavigate('/course-management')}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Course Management
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarRange className="w-6 h-6 text-primary" />
                    Semester Setup
                </h2>
                <p className="text-muted-foreground mt-1">
                    Create term records as: term name (Winter/Monsoon) + semester number (1-8).
                </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="xl:col-span-4 bg-card border border-border rounded-2xl p-5"
                >
                    <h3 className="font-semibold mb-3">Add Semester</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Term Name</label>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Winter Semester"
                                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Semester Number *</label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={newSequence}
                                onChange={(e) => setNewSequence(e.target.value)}
                                placeholder="e.g. 1"
                                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                        >
                            <Plus className="w-4 h-4" />
                            Add Semester
                        </button>
                        <p className="text-[11px] text-muted-foreground">
                            You can reuse the same term name with different semester numbers (for example Winter + 1, Winter + 3).
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-8 bg-card border border-border rounded-2xl p-5"
                >
                    <h3 className="font-semibold mb-3">Configured Semesters</h3>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : terms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No semesters configured yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {terms.map((term) => (
                                <div key={term.id} className="border border-border rounded-xl p-3">
                                    {editingId === term.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm"
                                            />
                                            <input
                                                type="number"
                                                min={1}
                                                value={editSequence}
                                                onChange={(e) => setEditSequence(e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => saveEdit(term.id)}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{term.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Semester Number: {term.sequence ?? '-'} | Status: {term.is_active ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleActive(term)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                                                        term.is_active
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {term.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                                <button
                                                    onClick={() => startEdit(term)}
                                                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => remove(term.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                                    title="Delete semester"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
