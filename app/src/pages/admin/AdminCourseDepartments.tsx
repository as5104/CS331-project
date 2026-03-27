import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { Toast, useToast } from '@/components/ui/Toast';
import type { DepartmentRow } from '@/lib/adminCourseTypes';
import { ArrowLeft, Building2, Plus, Save, Trash2 } from 'lucide-react';

interface AdminCourseDepartmentsProps {
    onNavigate: (path: string) => void;
}

export function AdminCourseDepartments({ onNavigate }: AdminCourseDepartmentsProps) {
    const { toast, flash, dismiss } = useToast();
    const [departments, setDepartments] = useState<DepartmentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCode, setEditCode] = useState('');
    const [saving, setSaving] = useState(false);

    async function loadDepartments() {
        setLoading(true);
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name', { ascending: true });
        if (error) flash(error.message, 'error');
        setDepartments((data ?? []) as DepartmentRow[]);
        setLoading(false);
    }

    useEffect(() => {
        loadDepartments();
    }, []);

    async function createDepartment() {
        if (!newName.trim()) return;
        setSaving(true);
        const { error } = await supabase.from('departments').insert([
            {
                name: newName.trim(),
                code: newCode.trim() || null,
            },
        ]);
        if (error) flash(error.message, 'error');
        else {
            flash('Department added');
            setNewName('');
            setNewCode('');
            loadDepartments();
        }
        setSaving(false);
    }

    function startEdit(dep: DepartmentRow) {
        setEditingId(dep.id);
        setEditName(dep.name);
        setEditCode(dep.code ?? '');
    }

    async function saveEdit(id: string) {
        if (!editName.trim()) return;
        const { error } = await supabase
            .from('departments')
            .update({ name: editName.trim(), code: editCode.trim() || null })
            .eq('id', id);
        if (error) flash(error.message, 'error');
        else {
            flash('Department updated');
            setEditingId(null);
            loadDepartments();
        }
    }

    async function remove(id: string) {
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) flash(error.message, 'error');
        else {
            flash('Department removed');
            loadDepartments();
        }
    }

    return (
        <DashboardLayout title="Departments" activePath="/course-management/departments" onNavigate={onNavigate}>
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
                    <Building2 className="w-6 h-6 text-primary" />
                    Department Setup
                </h2>
                <p className="text-muted-foreground mt-1">
                    Maintain official departments, then map courses and enrollment under each one.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="xl:col-span-4 bg-card border border-border rounded-2xl p-5"
                >
                    <h3 className="font-semibold mb-3">Add Department</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Department Name</label>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Computer Science & Engineering"
                                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Department Code (Optional)</label>
                            <input
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                placeholder="e.g. CSE"
                                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm uppercase"
                            />
                        </div>
                        <button
                            onClick={createDepartment}
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                        >
                            <Plus className="w-4 h-4" />
                            Add Department
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-8 bg-card border border-border rounded-2xl p-5"
                >
                    <h3 className="font-semibold mb-3">Configured Departments</h3>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : departments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No departments configured yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {departments.map((dep) => (
                                <div key={dep.id} className="border border-border rounded-xl p-3">
                                    {editingId === dep.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="md:col-span-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm"
                                            />
                                            <input
                                                value={editCode}
                                                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                                className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm uppercase"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => saveEdit(dep.id)}
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
                                                <p className="font-medium">{dep.name}</p>
                                                <p className="text-xs text-muted-foreground">Code: {dep.code ?? '-'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => startEdit(dep)}
                                                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => remove(dep.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                                                    title="Delete department"
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
