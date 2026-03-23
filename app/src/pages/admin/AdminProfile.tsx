import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import type { Admin } from '@/types';
import { User, Mail, Building, Hash, Shield } from 'lucide-react';

interface AdminProfileProps {
  onNavigate: (path: string) => void;
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export function AdminProfile({ onNavigate }: AdminProfileProps) {
  const { user } = useAuth();
  const admin = user as Admin;

  return (
    <DashboardLayout title="My Profile" activePath="/profile" onNavigate={onNavigate}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={admin?.avatar || `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(admin?.name ?? 'admin')}`}
            alt={admin?.name}
            className="w-24 h-24 rounded-2xl border-4 border-white/30 shadow-xl object-cover"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{admin?.name}</h2>
            <p className="text-white/80 text-sm mb-3">Administrator</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{admin?.department || 'Administration'}</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{admin?.institution || 'Tech University'}</span>
            </div>
          </div>
          <div className="text-center bg-white/10 rounded-2xl px-5 py-4">
            <p className="text-2xl font-bold">{admin?.permissions?.length || 0}</p>
            <p className="text-white/70 text-xs mt-1">Permissions</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald-600" />
            Admin Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Full Name" value={admin?.name} />
            <InfoRow icon={Mail} label="University Email" value={admin?.email} />
            <InfoRow icon={Hash} label="Employee ID" value={admin?.employeeId} />
            <InfoRow icon={Building} label="Department" value={admin?.department} />
            <InfoRow icon={Building} label="Institution" value={admin?.institution} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            Access Summary
          </h3>
          {admin?.permissions?.length ? (
            <div className="space-y-2">
              {admin.permissions.map((permission) => (
                <div key={permission} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
                  {permission}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No explicit permissions available.</p>
          )}
        </motion.div>
      </div>

    </DashboardLayout>
  );
}
