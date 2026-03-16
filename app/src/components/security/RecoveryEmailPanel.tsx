import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Loader2, CheckCircle2, AlertCircle, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type RecoveryTone = 'student' | 'faculty' | 'admin';

interface RecoveryEmailPanelProps {
  tone: RecoveryTone;
}

const toneStyles: Record<RecoveryTone, { badge: string; button: string; buttonGhost: string; ring: string; iconBg: string; iconText: string }> = {
  student: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonGhost: 'border-blue-200 text-blue-700 hover:bg-blue-50',
    ring: 'focus:ring-blue-500/20',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  faculty: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    button: 'bg-purple-600 hover:bg-purple-700',
    buttonGhost: 'border-purple-200 text-purple-700 hover:bg-purple-50',
    ring: 'focus:ring-purple-500/20',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
  },
  admin: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    buttonGhost: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    ring: 'focus:ring-emerald-500/20',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
};

interface RecoveryStatus {
  recoveryEmail: string | null;
  recoveryEmailVerified: boolean;
  recoveryEmailVerifiedAt: string | null;
}

function maskEmail(email: string | null) {
  if (!email) return '—';
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || '*'}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.max(2, name.length - 2))}${name[name.length - 1]}@${domain}`;
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

export function RecoveryEmailPanel({ tone }: RecoveryEmailPanelProps) {
  const styles = toneStyles[tone];
  const [status, setStatus] = useState<RecoveryStatus>({
    recoveryEmail: null,
    recoveryEmailVerified: false,
    recoveryEmailVerifiedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasVerifiedRecovery = useMemo(
    () => !!status.recoveryEmail && !!status.recoveryEmailVerified,
    [status.recoveryEmail, status.recoveryEmailVerified],
  );

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/recovery-email-status', { method: 'GET', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load recovery email status.');
      setStatus({
        recoveryEmail: data.recoveryEmail ?? null,
        recoveryEmailVerified: !!data.recoveryEmailVerified,
        recoveryEmailVerifiedAt: data.recoveryEmailVerifiedAt ?? null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load recovery email status.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRequestOtp = async () => {
    setError(null);
    setMessage(null);
    setSendingOtp(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/recovery-email-request-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recoveryEmail: recoveryEmailInput.trim(),
          currentPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification OTP.');
      setOtpSent(true);
      setMessage(data.message || 'OTP sent. Check your personal email.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification OTP.';
      setError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setMessage(null);
    setVerifyingOtp(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/recovery-email-verify-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ otpCode: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP.');
      setMessage('Recovery email verified successfully.');
      setOtpCode('');
      setOtpSent(false);
      setIsEditing(false);
      setRecoveryEmailInput('');
      setCurrentPassword('');
      await loadStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify OTP.';
      setError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading recovery settings...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
            <ShieldCheck className={`w-5 h-5 ${styles.iconText}`} />
          </div>
          <div>
            <h3 className="font-semibold">Recovery Email Security</h3>
            <p className="text-xs text-muted-foreground">Use a personal email for OTP-based password recovery.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles.badge}`}>
          {hasVerifiedRecovery ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {hasVerifiedRecovery ? 'Verified' : 'Not Verified'}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
        <p className="text-xs text-muted-foreground">Current Recovery Email</p>
        <p className="font-medium mt-1">{hasVerifiedRecovery ? maskEmail(status.recoveryEmail) : 'Not added yet'}</p>
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

      {!isEditing && hasVerifiedRecovery && (
        <button
          type="button"
          onClick={() => {
            setIsEditing(true);
            setMessage(null);
            setError(null);
            setOtpSent(false);
            setOtpCode('');
            setCurrentPassword('');
          }}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${styles.buttonGhost}`}
        >
          Change Recovery Email
        </button>
      )}

      {(isEditing || !hasVerifiedRecovery) && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Personal Recovery Email</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={recoveryEmailInput}
                  onChange={(e) => setRecoveryEmailInput(e.target.value)}
                  placeholder="your.personal@email.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
                />
              </div>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp || !recoveryEmailInput.trim() || !currentPassword}
                className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
              >
                {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current account password"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Required to securely add or change recovery email.</p>
          </div>

          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border p-3 bg-card">
                  <label className="block text-sm font-medium mb-1.5">Enter 6-digit OTP</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className={`flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm tracking-[0.35em] font-mono focus:outline-none focus:ring-2 ${styles.ring}`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
                    >
                      {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={sendingOtp}
                      className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                      title="Resend OTP"
                    >
                      <RefreshCw className={`w-4 h-4 text-muted-foreground ${sendingOtp ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
