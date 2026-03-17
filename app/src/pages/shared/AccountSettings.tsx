import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChangePasswordPanel } from '@/components/security/ChangePasswordPanel';
import { RecoveryEmailPanel, type RecoveryStatus } from '@/components/security/RecoveryEmailPanel';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface AccountSettingsProps {
  onNavigate: (path: string) => void;
}

type PanelTone = 'student' | 'faculty' | 'admin';

const roleLabel: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin: 'Admin',
};

function maskEmail(email: string | null) {
  if (!email) return null;
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || '*'}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.max(2, name.length - 2))}${name[name.length - 1]}@${domain}`;
}

export function AccountSettings({ onNavigate }: AccountSettingsProps) {
  const { user } = useAuth();
  const tone = (user?.role || 'student') as PanelTone;
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>({
    recoveryEmail: null,
    recoveryEmailVerified: false,
    recoveryEmailVerifiedAt: null,
  });

  const maskedRecoveryEmail = useMemo(
    () => maskEmail(recoveryStatus.recoveryEmail),
    [recoveryStatus.recoveryEmail],
  );

  return (
    <DashboardLayout title="Settings" activePath="/settings" onNavigate={onNavigate}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground mt-1">
          Secure your {roleLabel[user?.role || 'student'].toLowerCase()} account with recovery email verification and OTP-based password change.
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <RecoveryEmailPanel tone={tone} onStatusChange={setRecoveryStatus} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ChangePasswordPanel
            tone={tone}
            recoveryEmailVerified={recoveryStatus.recoveryEmailVerified}
            recoveryEmailMasked={maskedRecoveryEmail}
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
