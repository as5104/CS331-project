import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    Bell, Shield, Globe, Database,
    Save, Check,
} from 'lucide-react';

interface AdminSettingsProps {
    onNavigate: (path: string) => void;
}

export function AdminSettings({ onNavigate }: AdminSettingsProps) {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        institutionName: 'Tech University',
        domain: 'university.edu',
        emailNotifications: true,
        smsNotifications: false,
        autoAssignReviewer: true,
        maintenanceMode: false,
        maxUploadSize: '10',
        sessionTimeout: '60',
        requireEmailVerification: false,
        twoFactorAuth: false,
    });

    const handleSave = async () => {
        await new Promise(r => setTimeout(r, 600));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const toggle = (key: keyof typeof settings) =>
        setSettings(s => ({ ...s, [key]: !s[key] }));

    const Toggle = ({ field }: { field: keyof typeof settings }) => (
        <button
            onClick={() => toggle(field)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none
        ${settings[field] ? 'bg-primary' : 'bg-muted border border-border'}`}
        >
            <motion.div
                animate={{ x: settings[field] ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
            />
        </button>
    );

    const sections = [
        {
            title: 'Institution', icon: Globe, color: 'blue',
            fields: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Institution Name</label>
                        <input
                            value={settings.institutionName}
                            onChange={e => setSettings(s => ({ ...s, institutionName: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Email Domain</label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">@</span>
                            <input
                                value={settings.domain}
                                onChange={e => setSettings(s => ({ ...s, domain: e.target.value }))}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">User emails will be generated as rollno@{settings.domain}</p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Notifications', icon: Bell, color: 'purple',
            fields: (
                <div className="space-y-4">
                    {[
                        { label: 'Email Notifications', desc: 'Send notifications via email', field: 'emailNotifications' as const },
                        { label: 'SMS Notifications', desc: 'Send notifications via SMS', field: 'smsNotifications' as const },
                    ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Toggle field={item.field} />
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: 'Security', icon: Shield, color: 'emerald',
            fields: (
                <div className="space-y-4">
                    {[
                        { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts', field: 'twoFactorAuth' as const },
                        { label: 'Maintenance Mode', desc: 'Restrict platform access to admins only', field: 'maintenanceMode' as const },
                    ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Toggle field={item.field} />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Session Timeout (minutes)</label>
                        <input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={e => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))}
                            className="w-32 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'System', icon: Database, color: 'amber',
            fields: (
                <div className="space-y-4">
                    {[
                        { label: 'Auto-Assign Reviewer', desc: 'Auto-assign faculty for re-evaluation requests', field: 'autoAssignReviewer' as const },
                    ].map(item => (
                        <div key={item.field} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <Toggle field={item.field} />
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Max Upload Size (MB)</label>
                        <input
                            type="number"
                            value={settings.maxUploadSize}
                            onChange={e => setSettings(s => ({ ...s, maxUploadSize: e.target.value }))}
                            className="w-32 px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout title="Settings" activePath="/settings" onNavigate={onNavigate}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Platform Settings</h2>
                        <p className="text-muted-foreground mt-1">Configure institution-wide settings and policies.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
              ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                    >
                        {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </motion.button>
                </div>
            </motion.div>

            <div className="space-y-6">
                {sections.map((section, i) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        <div className="p-5 border-b border-border flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-${section.color}-100 flex items-center justify-center`}>
                                <section.icon className={`w-5 h-5 text-${section.color}-600`} />
                            </div>
                            <h3 className="font-semibold">{section.title}</h3>
                        </div>
                        <div className="p-5">{section.fields}</div>
                    </motion.div>
                ))}
            </div>
        </DashboardLayout>
    );
}
