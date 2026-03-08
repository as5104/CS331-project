import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Mail,
  Lock,
  UserCircle,
  ArrowRight,
  Building2,
  BookOpen,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface LoginProps {
  onLogin: () => void;
}

const roleConfig = {
  student: {
    icon: BookOpen,
    label: 'Student',
    description: 'Access courses, assignments, and grades',
    color: 'from-blue-400 to-blue-600',
    glowColor: 'shadow-blue-500/30',
  },
  faculty: {
    icon: UserCircle,
    label: 'Faculty',
    description: 'Manage courses and review assignments',
    color: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-purple-500/30',
  },
  admin: {
    icon: Shield,
    label: 'Administrator',
    description: 'Manage users and monitor system',
    color: 'from-emerald-400 to-emerald-600',
    glowColor: 'shadow-emerald-500/30',
  },
};

export function Login({ onLogin }: LoginProps) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'role' | 'credentials'>('role');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password, selectedRole);
      onLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleBack = () => {
    setStep('role');
    setError('');
  };

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Light Background Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-300 via-gray-200 to-stone-300" />

      {/* Blurry Colored Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 🔵 Blue orb — top-left, slow wide drift */}
        <motion.div
          animate={{
            x: [0, 120, 60, -40, 0],
            y: [0, -60, 30, -80, 0],
            scale: [1, 1.15, 1.05, 1.2, 1],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full bg-blue-400/30 blur-[120px]"
        />
        {/* 🟣 Violet orb — bottom-right, slow counter-drift */}
        <motion.div
          animate={{
            x: [0, -100, -30, 70, 0],
            y: [0, 80, -20, 50, 0],
            scale: [1, 1.2, 1.1, 1.25, 1],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-violet-400/25 blur-[100px]"
        />
        {/* 🟢 Emerald orb — center-right, gentle wandering */}
        <motion.div
          animate={{
            x: [0, -70, 40, -20, 0],
            y: [0, 50, -60, 20, 0],
            scale: [1, 1.1, 1.18, 1.05, 1],
          }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-[350px] h-[350px] lg:w-[500px] lg:h-[500px] rounded-full bg-emerald-400/20 blur-[110px]"
        />
        {/* 🔵 Light blue orb — bottom-left, subtle float */}
        <motion.div
          animate={{
            x: [0, 60, -30, 80, 0],
            y: [0, -50, 40, -20, 0],
            scale: [1, 1.12, 1.05, 1.15, 1],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-blue-300/20 blur-[90px]"
        />
        {/* Subtle noise / grain overlay for that slight darkish vibe */}
        <div className="absolute inset-0 bg-gray-400/15 backdrop-blur-[2px]" />
      </div>

      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative z-10 p-8 xl:p-12 text-gray-900"
      >
        <div className="flex flex-col justify-between h-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 xl:w-14 xl:h-14 bg-black/5 backdrop-blur-xl rounded-xl xl:rounded-2xl flex items-center justify-center border border-black/10">
              <GraduationCap className="w-6 h-6 xl:w-8 xl:h-8 text-gray-800" />
            </div>
            <div>
              <h1 className="text-xl xl:text-2xl font-bold text-gray-900">UniAdmin</h1>
              <p className="text-gray-500 text-xs xl:text-sm">Administrative Automation Platform</p>
            </div>
          </motion.div>

          <div className="space-y-6 xl:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl xl:text-4xl xl:text-5xl font-bold leading-tight mb-3 xl:mb-4 text-gray-900">
                Streamline Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                  Academic Journey
                </span>
              </h2>
              <p className="text-base xl:text-lg text-gray-600 max-w-md">
                A comprehensive platform for students, faculty, and administrators to manage all academic processes efficiently.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-2 xl:gap-4"
            >
              {[
                { icon: Building2, label: 'Institution Management' },
                { icon: BookOpen, label: 'Course Administration' },
                { icon: Shield, label: 'Secure Access Control' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 xl:px-4 xl:py-2 rounded-full border border-black/10 text-xs xl:text-sm text-gray-700"
                >
                  <feature.icon className="w-3 h-3 xl:w-4 xl:h-4 text-gray-600" />
                  <span>{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs xl:text-sm text-gray-400"
          >
            © 2026 UniAdmin Platform. All rights reserved.
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4 sm:mb-6 justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/5 backdrop-blur-xl rounded-xl flex items-center justify-center border border-black/10">
              <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-gray-800" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">UniAdmin</h1>
              <p className="text-gray-500 text-xs">Administrative Automation</p>
            </div>
          </div>

          {/* Glassmorphism Card */}
          <div className="backdrop-blur-2xl bg-white/60 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-white/40 shadow-2xl shadow-black/5">
            {step === 'role' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 border border-black/10 mb-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Welcome Back!</h2>
                  <p className="text-gray-500 text-sm">Select your role to continue</p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {(Object.keys(roleConfig) as UserRole[]).map((role, index) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;

                    return (
                      <motion.button
                        key={role}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelect(role)}
                        className={`
                          w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-300
                          backdrop-blur-xl
                          ${selectedRole === role
                            ? 'bg-white/70 border-black/15 shadow-lg ' + config.glowColor
                            : 'bg-white/40 border-black/10 hover:bg-white/60 hover:border-black/15'
                          }
                        `}
                      >
                        <div className={`
                          w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${config.color}
                          flex items-center justify-center shadow-lg flex-shrink-0
                        `}>
                          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" /> {/* Keep white — sits on colored gradient bg */}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="font-semibold capitalize text-gray-900 text-sm sm:text-base">{config.label}</h3>
                          <p className="text-xs text-gray-500 truncate">{config.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={handleBack}
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-900 mb-4 sm:mb-6 flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                  Back to roles
                </button>

                <div className="text-center mb-4 sm:mb-6">
                  <div className={`
                    inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3
                    bg-gradient-to-br ${roleConfig[selectedRole].color} shadow-lg
                  `}>
                    {(() => {
                      const Icon = roleConfig[selectedRole].icon;
                      return <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />; {/* Keep white since icon sits on colored gradient bg */ }
                    })()}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                    Login as {roleConfig[selectedRole].label}
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Enter your credentials
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs sm:text-sm flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="break-words">{error}</span>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={`${selectedRole}@university.edu`}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-black/10 bg-white/50 text-gray-900 text-sm
                          placeholder:text-gray-400
                          focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20
                          transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-black/10 bg-white/50 text-gray-900 text-sm
                          placeholder:text-gray-400
                          focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20
                          transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {showPassword ? (
                            <motion.span key="off" initial={{ opacity: 0, scale: 0.7, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.7, rotate: 10 }} transition={{ duration: 0.18 }}>
                              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.span>
                          ) : (
                            <motion.span key="on" initial={{ opacity: 0, scale: 0.7, rotate: 10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.7, rotate: -10 }} transition={{ duration: 0.18 }}>
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-black/20 bg-white/50 text-primary focus:ring-black/10 w-3.5 h-3.5 sm:w-4 sm:h-4"
                      />
                      <span className="text-gray-500">Remember me</span>
                    </label>
                    <button type="button" className="text-gray-500 hover:text-gray-900 transition-colors">
                      Forgot password?
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl
                      bg-gradient-to-r ${roleConfig[selectedRole].color}
                      text-white font-medium text-sm shadow-lg ${roleConfig[selectedRole].glowColor}
                      hover:shadow-xl
                      disabled:opacity-70 disabled:cursor-not-allowed
                      transition-all duration-200
                    `}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </motion.button>


                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}