import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

type RecoveryTone = 'student' | 'faculty' | 'admin';
type ChangeStep = 'request' | 'otp' | 'reset' | 'done';

interface ChangePasswordPanelProps {
  tone: RecoveryTone;
  recoveryEmailVerified: boolean;
  recoveryEmailMasked: string | null;
}

const toneStyles: Record<RecoveryTone, { button: string; ring: string; iconBg: string; iconText: string }> = {
  student: {
    button: 'bg-blue-600 hover:bg-blue-700',
    ring: 'focus:ring-blue-500/20',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  faculty: {
    button: 'bg-purple-600 hover:bg-purple-700',
    ring: 'focus:ring-purple-500/20',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
  },
  admin: {
    button: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'focus:ring-emerald-500/20',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
};

function getPasswordChecks(password: string) {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_[\]\\/~`+=;']/.test(password),
    hasMinLength: password.length >= 8,
  };
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error('Session expired. Please sign in again.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export function ChangePasswordPanel({
  tone,
  recoveryEmailVerified,
  recoveryEmailMasked,
}: ChangePasswordPanelProps) {
  const { logout } = useAuth();
  const styles = toneStyles[tone];
  const logoutTimerRef = useRef<number | null>(null);
  const [step, setStep] = useState<ChangeStep>('request');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current !== null) {
        window.clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const passwordChecks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const isPasswordStrong = useMemo(() => Object.values(passwordChecks).every(Boolean), [passwordChecks]);
  const isConfirmMatch = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === newPassword,
    [confirmPassword, newPassword],
  );

  const conditionItems = [
    { label: 'Uppercase letter', ok: passwordChecks.hasUppercase },
    { label: 'Lowercase letter', ok: passwordChecks.hasLowercase },
    { label: 'Number', ok: passwordChecks.hasNumber },
    { label: 'Special character (e.g. !?<>@#$%)', ok: passwordChecks.hasSpecial },
    { label: '8 characters or more', ok: passwordChecks.hasMinLength },
  ];

  const requestOtp = async () => {
    setError(null);
    setMessage(null);
    setSendingOtp(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/password-change-request-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
      setStep('otp');
      setMessage(data.message || 'OTP sent to your recovery email.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setMessage(null);
    setVerifyingOtp(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/password-change-verify-otp', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({ otpCode: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP.');
      setStep('reset');
      setMessage('OTP verified. You can now set a new password.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP.';
      setError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const completePasswordChange = async () => {
    setError(null);
    setMessage(null);
    setUpdatingPassword(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/password-change-complete', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setStep('done');
      setMessage('Password changed successfully. For security, signing you out now...');
      setCurrentPassword('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      logoutTimerRef.current = window.setTimeout(() => {
        logout();
      }, 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      setError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const resetFlow = () => {
    if (logoutTimerRef.current !== null) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setStep('request');
    setCurrentPassword('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
          <Shield className={`w-5 h-5 ${styles.iconText}`} />
        </div>
        <div>
          <h3 className="font-semibold">Change Password</h3>
          <p className="text-xs text-muted-foreground">
            We verify your current password and recovery email OTP before allowing password change.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
        <p className="text-xs text-muted-foreground">Recovery Email Status</p>
        <p className="font-medium mt-1">
          {recoveryEmailVerified
            ? `Verified (${recoveryEmailMasked || 'configured'})`
            : 'Not verified yet'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          {message}
        </div>
      )}

      {!recoveryEmailVerified && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          Verify your recovery email first to enable secure password change.
        </div>
      )}

      {recoveryEmailVerified && step === 'request' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={requestOtp}
            disabled={sendingOtp || !currentPassword}
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
          >
            {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
          </button>
        </div>
      )}

      {recoveryEmailVerified && step === 'otp' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Enter 6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className={`w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm tracking-[0.35em] font-mono focus:outline-none focus:ring-2 ${styles.ring}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestOtp}
              disabled={sendingOtp}
              className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-60"
              title="Resend OTP"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${sendingOtp ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyingOtp || otpCode.length !== 6}
              className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
            >
              {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
            </button>
          </div>
        </div>
      )}

      {recoveryEmailVerified && step === 'reset' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                className={`w-full pl-9 pr-10 py-3 rounded-xl border-2 border-cyan-200 bg-white text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {newPassword.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <ul className="space-y-1.5">
                    {conditionItems.map((item) => (
                      <li
                        key={item.label}
                        className={`flex items-center gap-2.5 text-sm ${item.ok ? 'text-emerald-700' : 'text-muted-foreground'}`}
                      >
                        {item.ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                className={`w-full pl-9 pr-10 py-3 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !isConfirmMatch && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
            )}
          </div>

          <button
            type="button"
            onClick={completePasswordChange}
            disabled={updatingPassword || !isPasswordStrong || !isConfirmMatch}
            className={`w-full py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
          >
            {updatingPassword ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Set New Password'}
          </button>
        </div>
      )}

      {recoveryEmailVerified && step === 'done' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Password changed successfully.
          </div>
          <button
            type="button"
            onClick={resetFlow}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Change Again
          </button>
        </div>
      )}

      {step !== 'done' && step !== 'request' && (
        <button
          type="button"
          onClick={resetFlow}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Restart password change flow
        </button>
      )}
    </div>
  );
}
