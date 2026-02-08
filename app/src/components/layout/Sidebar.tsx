import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  User,
  BookOpen,
  FileText,
  Calendar,
  Bell,
  GraduationCap,
  ClipboardCheck,
  Users,
  Settings,
  BarChart3,
  Megaphone,
  Workflow,
  X,
  LogOut,
  ChevronRight,
  Calculator,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: NavItem[];
}

const navItems: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'Assignments', icon: FileText, path: '/assignments' },
    { 
      label: 'Attendance', 
      icon: Calendar, 
      path: '/view-attendance',
      children: [
        { label: 'Leave Request', icon: Calendar, path: '/leave-request' },
      ],
    },
    { label: 'CGPA Calculator', icon: Calculator, path: '/cgpa-calculator' },
    { label: 'Re-evaluation', icon: TrendingUp, path: '/reevaluation' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'My Courses', icon: BookOpen, path: '/courses' },
    { label: 'Review Assignments', icon: ClipboardCheck, path: '/review' },
    { label: 'Mark Attendance', icon: Calendar, path: '/attendance' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'User Management', icon: Users, path: '/users' },
    { label: 'Workflows', icon: Workflow, path: '/workflows' },
    { label: 'System Monitor', icon: BarChart3, path: '/monitor' },
    { label: 'Announcements', icon: Megaphone, path: '/announcements' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
};

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ activePath, onNavigate, isMobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const items = navItems[user.role];
  const roleColor = {
    student: 'from-blue-500 to-blue-600',
    faculty: 'from-purple-500 to-purple-600',
    admin: 'from-emerald-500 to-emerald-600',
  }[user.role];

  const roleLabel = {
    student: 'Student Portal',
    faculty: 'Faculty Portal',
    admin: 'Admin Portal',
  }[user.role];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center shadow-lg`}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-tight">UniAdmin</span>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item, index) => {
          const isActive = activePath === item.path || item.children?.some(child => child.path === activePath);
          const Icon = item.icon;
          
          return (
            <div key={item.path}>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onNavigate(item.path);
                  onMobileClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative overflow-hidden
                  ${isActive 
                    ? 'sidebar-item-active' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && isActive && (
                  <ChevronRight className="w-4 h-4 text-primary" />
                )}
              </motion.button>

              {!isCollapsed && item.children && item.children.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const childActive = activePath === child.path;
                    return (
                      <button
                        key={child.path}
                        onClick={() => {
                          onNavigate(child.path);
                          onMobileClose();
                        }}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                          transition-all duration-200
                          ${childActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${childActive ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <span className="text-left">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={`
          flex items-center gap-3 p-3 rounded-xl bg-muted/50
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className={`
            w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl
            text-sm font-medium text-red-600 hover:bg-red-50
            transition-colors duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="hidden lg:flex flex-col h-screen bg-card border-r border-border sticky top-0 z-30"
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-72 bg-card border-r border-border z-50 lg:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
