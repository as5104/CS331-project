import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ForgotPasswordModal } from '@/components/security/ForgotPasswordModal';
import {
  GraduationCap,
  Mail,
  Lock,
  UserCircle,
  ArrowRight,
  Building2,
  BookOpen,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
  Menu,
  X,
  FileCheck,
  Calculator,
  Bell,
  BarChart3
} from 'lucide-react';
import type { UserRole } from '@/types';

interface LoginProps {
  onLogin: () => void;
}

const roleConfig = {
  student: {
    icon: BookOpen,
    label: 'Student',
    description: 'Access courses & grades',
    color: 'from-blue-400 to-blue-600',
    glowColor: 'shadow-blue-500/30',
  },
  faculty: {
    icon: UserCircle,
    label: 'Faculty',
    description: 'Manage classes & curriculum',
    color: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-purple-500/30',
  },
  admin: {
    icon: Shield,
    label: 'Administrator',
    description: 'System controls & reports',
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

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

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-blue-500/30">
      {/* Fixed Background Base */}
      <div className="fixed inset-0 bg-gradient-to-br from-stone-300 via-gray-200 to-stone-300 -z-20" />

      {/* Blurry Colored Orbs Background (Fixed) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Blue orb */}
        <motion.div
          animate={{
            x: [0, 120, 60, -40, 0],
            y: [0, -60, 30, -80, 0],
            scale: [1, 1.15, 1.05, 1.2, 1],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] rounded-full bg-blue-400/30 blur-[120px]"
        />
        {/* Violet orb */}
        <motion.div
          animate={{
            x: [0, -100, -30, 70, 0],
            y: [0, 80, -20, 50, 0],
            scale: [1, 1.2, 1.1, 1.25, 1],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] rounded-full bg-violet-400/25 blur-[100px]"
        />
        {/* Emerald orb */}
        <motion.div
          animate={{
            x: [0, -70, 40, -20, 0],
            y: [0, 50, -60, 20, 0],
            scale: [1, 1.1, 1.18, 1.05, 1],
          }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-[350px] h-[350px] lg:w-[500px] lg:h-[500px] rounded-full bg-emerald-400/20 blur-[110px]"
        />
        {/* Light blue orb */}
        <motion.div
          animate={{
            x: [0, 60, -30, 80, 0],
            y: [0, -50, 40, -20, 0],
            scale: [1, 1.12, 1.05, 1.15, 1],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-blue-300/20 blur-[90px]"
        />
        {/* Subtle noise / grain overlay */}
        <div className="absolute inset-0 bg-gray-400/15 backdrop-blur-[2px]" />
      </div>

      {/* Navbar */}
      <nav className="absolute inset-x-0 top-0 z-50">
        <div className="w-full px-6 sm:px-10 lg:px-16 pt-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold font-heading text-gray-900">UniAdmin</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</button>
              <button onClick={() => scrollToSection('solutions')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Solutions</button>
              <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</button>
              <button
                onClick={() => scrollToSection('login-section')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 p-2 focus:outline-none">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[72px] right-6 sm:right-10 w-56 bg-white/40 backdrop-blur-2xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 overflow-hidden md:hidden z-50 flex flex-col"
            >
              <div className="flex flex-col py-1.5">
                <button onClick={() => { scrollToSection('features'); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 flex items-center gap-3 transition-colors">
                  <FileCheck className="w-[18px] h-[18px] text-gray-500" />
                  Features
                </button>
                <div className="h-[1px] bg-gray-100 mx-3 my-0.5" />
                <button onClick={() => { scrollToSection('solutions'); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 flex items-center gap-3 transition-colors">
                  <Building2 className="w-[18px] h-[18px] text-gray-500" />
                  Solutions
                </button>
                <div className="h-[1px] bg-gray-100 mx-3 my-0.5" />
                <button onClick={() => { scrollToSection('contact'); setIsMenuOpen(false); }} className="text-left px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 flex items-center gap-3 transition-colors">
                  <Mail className="w-[18px] h-[18px] text-gray-500" />
                  Contact
                </button>
                <div className="h-[1px] bg-gray-100 mx-3 my-0.5" />
                <button
                  onClick={() => { scrollToSection('login-section'); setIsMenuOpen(false); }}
                  className="text-left px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-black/5 flex items-center gap-3 transition-colors"
                >
                  <Lock className="w-[18px] h-[18px] text-gray-500" />
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10 flex flex-col">
        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 lg:pt-40 lg:pb-24 flex flex-col lg:flex-row items-center gap-16 min-h-screen">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-1/2 xl:w-7/12 flex flex-col items-center text-center lg:items-start lg:text-left pt-8 lg:pt-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-block py-1.5 px-3 rounded-md bg-blue-100/80 border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6">
                Administrative Automation Platform
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 text-gray-900 font-heading">
                Streamline Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                  Academic Journey
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed mx-auto lg:mx-0">
                UniAdmin empowers modern institutions with seamless management, automated course administration, and military-grade access control. Experience the future of campus operations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10"
            >
              {[
                { icon: Building2, label: 'Institution Management' },
                { icon: BookOpen, label: 'Course Administration' },
                { icon: Shield, label: 'Secure Access Control' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-black/10 text-sm font-medium text-gray-700 shadow-sm"
                >
                  <feature.icon className="w-4 h-4 text-blue-600" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => scrollToSection('login-section')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full text-base font-medium transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
              >
                Get Started Today
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="w-full sm:w-auto bg-white/80 hover:bg-white text-gray-900 border border-black/10 px-8 py-3.5 rounded-full text-base font-medium transition-all shadow-sm hover:shadow-md"
              >
                View Features
              </button>
            </motion.div>
          </motion.div>

          {/* Right Login Card */}
          <div id="login-section" className="w-full lg:w-1/2 xl:w-5/12 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-md scroll-mt-24"
            >
              {/* Glassmorphism Card */}
              <div className="backdrop-blur-2xl bg-white/70 rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl shadow-black/5">
                {step === 'role' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Welcome Back!</h2>
                      <p className="text-gray-500 text-sm">Select your role to continue to your dashboard</p>
                    </div>

                    <div className="space-y-3">
                      {(Object.keys(roleConfig) as UserRole[]).map((role, index) => {
                        const config = roleConfig[role];
                        const Icon = config.icon;

                        return (
                          <motion.button
                            key={role}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRoleSelect(role)}
                            className={`
                              w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                              ${selectedRole === role
                                ? 'bg-white shadow-md border-transparent ring-2 ring-blue-500/20'
                                : 'bg-white/50 border-black/5 hover:bg-white hover:shadow-sm'
                              }
                            `}
                          >
                            <div className={`
                              w-12 h-12 rounded-xl bg-gradient-to-br ${config.color}
                              flex items-center justify-center shadow-lg flex-shrink-0
                            `}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h3 className="font-semibold capitalize text-gray-900 text-base">{config.label}</h3>
                              <p className="text-xs text-gray-500 truncate">{config.description}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-xs text-gray-500">
                        Trouble signing in? <a href="#contact" className="text-blue-600 font-medium hover:underline" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact IT Support</a>
                      </p>
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
                      className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1.5 transition-colors font-medium"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back
                    </button>

                    <div className="text-center mb-6">
                      <div className={`
                        inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3
                        bg-gradient-to-br ${roleConfig[selectedRole].color} shadow-lg
                      `}>
                        {(() => {
                          const Icon = roleConfig[selectedRole].icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1 font-heading">
                        Sign in as {roleConfig[selectedRole].label}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Enter your institution credentials
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="break-words font-medium">{error}</span>
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={`${selectedRole}@university.edu`}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 bg-white/60 text-gray-900 text-sm font-medium
                              placeholder:text-gray-400 placeholder:font-normal
                              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 focus:bg-white
                              transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full pl-12 pr-12 py-3 rounded-xl border border-black/10 bg-white/60 text-gray-900 text-sm font-medium
                              placeholder:text-gray-400 placeholder:font-normal
                              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 focus:bg-white
                              transition-all duration-200"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm mt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded cursor-pointer checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-all"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full flex items-center justify-center gap-2 py-3.5 rounded-xl mt-6
                          bg-gradient-to-r ${roleConfig[selectedRole].color}
                          text-white font-semibold text-base shadow-lg ${roleConfig[selectedRole].glowColor}
                          hover:shadow-xl
                          disabled:opacity-70 disabled:cursor-not-allowed
                          transition-all duration-200
                        `}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">Powerful Features for Modern Universities</h2>
            <p className="text-lg text-gray-600">Our platform automates daily tasks, tracks performance, and ensures secure operations across your entire campus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileCheck,
                title: "Assignment Workflows",
                desc: "End-to-end automation for assignment submissions, faculty reviews, and grading with automated supervisor assignment."
              },
              {
                icon: BarChart3,
                title: "Attendance Tracking",
                desc: "Integrated attendance management with automated exception requests, leave approvals, and threshold alerts."
              },
              {
                icon: Calculator,
                title: "CGPA Calculator",
                desc: "Built-in tools for students to calculate and project their SGPA and CGPA based on official university grading rules."
              },
              {
                icon: BookOpen,
                title: "Exam Re-evaluation",
                desc: "Streamlined process for students to request exam re-evaluations, routed automatically to reviewers for grading updates."
              },
              {
                icon: Bell,
                title: "Real-time Notifications",
                desc: "Instant alerts for assignment deadlines, grade updates, and campus announcements using live WebSocket connections."
              },
              {
                icon: Shield,
                title: "Role-Based Security",
                desc: "Military-grade access control ensuring students, faculty, and administrators only see data they are authorized to access."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/60 backdrop-blur-md border border-black/5 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SOLUTIONS SECTION */}
        <section id="solutions" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 scroll-mt-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading">Solutions for Every Role</h2>
            <p className="text-lg text-gray-600">Tailored dashboards and tools designed specifically for the needs of students, faculty, and administrative staff.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-1 shadow-xl shadow-blue-500/20"
            >
              <div className="bg-white rounded-[22px] p-8 h-full flex flex-col">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading">For Students</h3>
                <ul className="space-y-4 mb-8 flex-1">
                  {['View live attendance & grades', 'Submit assignments digitally', 'Apply for leave & re-evaluations', 'Calculate target CGPA'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-gray-600 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setSelectedRole('student'); scrollToSection('login-section'); }} className="w-full py-3.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors">
                  Student Login
                </button>
              </div>
            </motion.div>

            {/* Faculty */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-1 shadow-xl shadow-purple-500/20"
            >
              <div className="bg-white rounded-[22px] p-8 h-full flex flex-col">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                  <UserCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading">For Faculty</h3>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Manage assigned courses', 'Review & grade submissions', 'Approve student leave requests', 'Mark digital attendance'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-gray-600 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setSelectedRole('faculty'); scrollToSection('login-section'); }} className="w-full py-3.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition-colors">
                  Faculty Login
                </button>
              </div>
            </motion.div>

            {/* Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-1 shadow-xl shadow-emerald-500/20"
            >
              <div className="bg-white rounded-[22px] p-8 h-full flex flex-col">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-heading">For Administrators</h3>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Onboard students & faculty', 'Configure system workflows', 'Monitor platform analytics', 'Publish global announcements'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-gray-600 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setSelectedRole('admin'); scrollToSection('login-section'); }} className="w-full py-3.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors">
                  Admin Login
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mb-12 scroll-mt-16">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-10 md:p-16 rounded-[40px] shadow-2xl shadow-black/5 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-heading">Get in Touch</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Interested in onboarding your institution? Our IT support team is ready to help you streamline your campus operations.
            </p>
            <a
              href="mailto:support@uniadmin.edu"
              className="inline-flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-full text-lg font-medium transition-all shadow-lg hover:-translate-y-1"
            >
              <Mail className="w-5 h-5" />
              Contact IT Support
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-black/5 bg-white/40 backdrop-blur-xl mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-medium text-gray-500 text-center md:text-left">
            © 2026 UniAdmin Platform. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
