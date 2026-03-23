import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, KeyRound, CheckCircle2, Circle, Loader2, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ForgotStep = 'email' | 'otp' | 'reset' | 'done';

function getPasswordChecks(password: string) {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_[\]\\/~`+=;']/.test(password),
    hasMinLength: password.length >= 8,
  };
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('email');
      setEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSubmitting(false);
      setError(null);
      setMessage(null);
    }
  }, [isOpen]);

  const passwordChecks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const isPasswordStrong = useMemo(() => Object.values(passwordChecks).every(Boolean), [passwordChecks]);
  const isConfirmMatch = useMemo(
    () => confirmPassword.length > 0 && newPassword === confirmPassword,
    [confirmPassword, newPassword],
  );

  const requestResetOtp = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/password-reset-request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send OTP.');
      setMessage(data.message || 'If eligible, an OTP has been sent.');
      setStep('otp');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send OTP.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyResetOtp = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/password-reset-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: email.trim(),
          otpCode: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP.');
      setStep('reset');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const completePasswordReset = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/password-reset-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      setMessage(data.message || 'Password reset successfully.');
      setStep('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const conditionItems = [
    { label: 'Uppercase letter', ok: passwordChecks.hasUppercase },
    { label: 'Lowercase letter', ok: passwordChecks.hasLowercase },
    { label: 'Number', ok: passwordChecks.hasNumber },
    { label: 'Special character (e.g. !?<>@#$%)', ok: passwordChecks.hasSpecial },
    { label: '8 characters or more', ok: passwordChecks.hasMinLength },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          className="w-full max-w-lg bg-white rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-lg font-semibold">Forgot Password</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            {message && (
              <div className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">{message}</div>
            )}

            {step === 'email' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your generated university email. If recovery is enabled, we will send an OTP to your verified personal email.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">University Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rollno@university.edu"
                      className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestResetOtp}
                  disabled={submitting || !email.trim()}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Send OTP'}
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit OTP sent to your verified recovery email.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1.5">OTP Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-3 py-3 rounded-xl border border-border bg-muted/40 text-sm tracking-[0.35em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestResetOtp}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={verifyResetOtp}
                    disabled={submitting || otpCode.length !== 6}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set a new strong password for your account.
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-9 pr-10 py-3 rounded-xl border-2 border-cyan-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                            <li key={item.label} className={`flex items-center gap-2.5 text-sm ${item.ok ? 'text-emerald-700' : 'text-muted-foreground'}`}>
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-9 pr-10 py-3 rounded-xl border border-border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
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
                  onClick={completePasswordReset}
                  disabled={submitting || !isPasswordStrong || !isConfirmMatch}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Set New Password'}
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="text-lg font-semibold mb-1">Password Updated</h4>
                <p className="text-sm text-muted-foreground mb-4">You can now sign in with your new password.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
