import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Check,
  Clock,
  AlertCircle,
  User,
  Settings,
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import type { Notification } from '@/types';

interface HeaderProps {
  title: string;
  onNavigate: (path: string) => void;
  onMenuClick: () => void;
}

const navItemsByRole = {
  student: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Profile', path: '/profile' },
    { label: 'Assignments', path: '/assignments' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'CGPA Calculator', path: '/cgpa-calculator' },
    { label: 'Re-evaluation', path: '/reevaluation' },
    { label: 'Notifications', path: '/notifications' },
  ],
  faculty: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Profile', path: '/profile' },
    { label: 'My Courses', path: '/courses' },
    { label: 'Review Assignments', path: '/review' },
    { label: 'Mark Attendance', path: '/attendance' },
    { label: 'Notifications', path: '/notifications' },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'User Management', path: '/users' },
    { label: 'Workflows', path: '/workflows' },
    { label: 'System Monitor', path: '/monitor' },
    { label: 'Announcements', path: '/announcements' },
    { label: 'Settings', path: '/settings' },
  ],
} as const;

export function Header({ title, onNavigate, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div>;
      case 'warning':
        return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>;
      case 'error':
        return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-600" /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Bell className="w-4 h-4 text-blue-600" /></div>;
    }
  };

  const searchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !user) return [];
    const items = navItemsByRole[user.role] ?? [];
    return items.filter(item => item.label.toLowerCase().includes(query));
  }, [searchQuery, user]);

  const handleSearchSelect = (path: string) => {
    onNavigate(path);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
          
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-foreground"
          >
            {title}
          </motion.h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 100)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchItems.length > 0) {
                  handleSearchSelect(searchItems[0].path);
                }
              }}
              className="pl-10 pr-4 py-2 w-64 rounded-xl border border-border bg-muted/50 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                transition-all duration-200"
            />
            <AnimatePresence>
              {showSearch && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-full bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
                >
                  {searchItems.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground">No results</div>
                  ) : (
                    <div className="py-1">
                      {searchItems.map((item) => (
                        <button
                          key={item.path}
                          onMouseDown={() => handleSearchSelect(item.path)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold 
                    rounded-full flex items-center justify-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => markAsRead(notification.id)}
                            className={`
                              flex items-start gap-3 p-4 border-b border-border last:border-0
                              hover:bg-muted/50 transition-colors cursor-pointer
                              ${!notification.read ? 'bg-primary/5' : ''}
                            `}
                          >
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-muted transition-colors"
            >
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full border border-border"
              />
              <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowProfile(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <span className={`
                        inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium
                        ${user?.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 
                          user?.role === 'faculty' ? 'bg-purple-100 text-purple-700' : 
                          'bg-blue-100 text-blue-700'}
                      `}>
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                      </span>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                        <Settings className="w-4 h-4" />
                        Preferences
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
