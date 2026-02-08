import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockNotifications, mockAnnouncements } from '@/data/mockData';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Check,
  Megaphone,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface NotificationsProps {
  onNavigate: (path: string) => void;
}

export function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>;
      case 'warning':
        return <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-amber-600" /></div>;
      case 'error':
        return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Info className="w-5 h-5 text-blue-600" /></div>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <DashboardLayout title="Notifications" activePath="/notifications" onNavigate={onNavigate}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold mb-1">Notifications</h2>
            <p className="text-muted-foreground">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'read', label: 'Read', count: notifications.length - unreadCount },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${filter === f.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
                  `}
                >
                  {f.label}
                  <span className="ml-1.5 text-xs opacity-70">({f.count})</span>
                </button>
              ))}
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No notifications</p>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        markAsRead(notification.id);
                        setSelectedNotification(selectedNotification === notification.id ? null : notification.id);
                      }}
                      className={`
                        relative p-4 rounded-xl border cursor-pointer transition-all
                        ${!notification.read 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-card border-border hover:border-primary/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(notification.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {/* Expanded Content */}
                          <AnimatePresence>
                            {selectedNotification === notification.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-border"
                              >
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                                    {notification.type}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sidebar - Announcements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Announcements */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Announcements
                </h3>
                <span className="text-xs text-muted-foreground">
                  {mockAnnouncements.length} new
                </span>
              </div>
              <div className="divide-y divide-border">
                {mockAnnouncements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                        ${announcement.priority === 'high' ? 'bg-red-500' :
                          announcement.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}
                      `} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.publishedAt).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Notification Settings</h3>
              <div className="space-y-3">
                {[
                  { label: 'Assignment Deadlines', checked: true },
                  { label: 'Grade Updates', checked: true },
                  { label: 'Attendance Alerts', checked: true },
                  { label: 'General Announcements', checked: false },
                ].map((setting) => (
                  <label key={setting.label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">{setting.label}</span>
                    <input
                      type="checkbox"
                      defaultChecked={setting.checked}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
