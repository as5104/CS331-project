import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockWorkflows } from '@/data/mockData';
import {
    Workflow, CheckCircle2, Bell, ClipboardList,
    Clock, Users, Zap, ChevronRight,
} from 'lucide-react';

interface AdminWorkflowsProps {
    onNavigate: (path: string) => void;
}

const stepTypeConfig = {
    task: { icon: ClipboardList, color: 'bg-blue-100 text-blue-600' },
    approval: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
    notification: { icon: Bell, color: 'bg-purple-100 text-purple-600' },
};

export function AdminWorkflows({ onNavigate }: AdminWorkflowsProps) {
    return (
        <DashboardLayout title="Workflow Configuration" activePath="/workflows" onNavigate={onNavigate}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Workflows</h2>
                        <p className="text-muted-foreground mt-1">Configure and manage administrative approval workflows.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border border-border">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {mockWorkflows.filter(w => w.status === 'active').length} Active Workflows
                    </div>
                </div>
            </motion.div>

            <div className="space-y-6">
                {mockWorkflows.map((workflow, wi) => (
                    <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: wi * 0.1 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Workflow className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{workflow.name}</h3>
                                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium
                ${workflow.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                                {workflow.status}
                            </span>
                        </div>

                        {/* Steps */}
                        <div className="p-5">
                            <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">Workflow Steps</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {workflow.steps.map((step, si) => {
                                    const cfg = stepTypeConfig[step.type] || stepTypeConfig.task;
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={step.id} className="flex items-center gap-2">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: wi * 0.1 + si * 0.05 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-border ${cfg.color} bg-opacity-10`}>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${cfg.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{step.name}</p>
                                                        {step.assignee && (
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                <Users className="w-2.5 h-2.5" />
                                                                {step.assignee}
                                                            </p>
                                                        )}
                                                        {step.sla && (
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                SLA: {step.sla}h
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                            {si < workflow.steps.length - 1 && (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </DashboardLayout>
    );
}
