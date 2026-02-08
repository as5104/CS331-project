import { useState } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  mockSystemStats, 
  mockRecentActivities, 
  mockSystemAlerts,
  mockWorkflows,
} from '@/data/mockData';
import {
  Users,
  Activity,
  CheckCircle,
  Heart,
  AlertTriangle,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Zap,
  Bell,
  FileText,
  Workflow,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const chartData = [
  { time: '00:00', users: 120, cpu: 35 },
  { time: '04:00', users: 80, cpu: 25 },
  { time: '08:00', users: 450, cpu: 55 },
  { time: '12:00', users: 680, cpu: 72 },
  { time: '16:00', users: 590, cpu: 65 },
  { time: '20:00', users: 320, cpu: 45 },
  { time: '23:59', users: 150, cpu: 30 },
];

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Bell;
      default: return Bell;
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" activePath="/dashboard" onNavigate={onNavigate}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Admin Control Center
            </h2>
            <p className="text-muted-foreground mt-1">
              System overview and management dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-card"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>System Operational</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={mockSystemStats.totalUsers}
          icon={Users}
          trend="up"
          trendValue="+124 this month"
          color="blue"
          delay={0}
        />
        <StatCard
          title="Active Workflows"
          value={mockSystemStats.activeWorkflows}
          icon={Activity}
          trend="up"
          trendValue="+12 today"
          color="purple"
          delay={0.1}
        />
        <StatCard
          title="Pending Approvals"
          value={mockSystemStats.pendingApprovals}
          icon={CheckCircle}
          trend="down"
          trendValue="-8 resolved"
          color="amber"
          delay={0.2}
        />
        <StatCard
          title="System Health"
          value={mockSystemStats.systemHealth}
          suffix="%"
          icon={Heart}
          trend="up"
          trendValue="Excellent"
          color="green"
          delay={0.3}
          isPercentage
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">System Performance</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  Active Users
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  CPU Usage
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorCpu)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Resource Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Resource Usage</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { 
                    label: 'CPU Usage', 
                    value: mockSystemStats.cpuUsage, 
                    icon: Cpu,
                    color: 'from-blue-500 to-blue-600'
                  },
                  { 
                    label: 'Memory Usage', 
                    value: mockSystemStats.memoryUsage, 
                    icon: MemoryStick,
                    color: 'from-purple-500 to-purple-600'
                  },
                  { 
                    label: 'Disk Usage', 
                    value: mockSystemStats.diskUsage, 
                    icon: HardDrive,
                    color: 'from-amber-500 to-amber-600'
                  },
                ].map((resource, index) => (
                  <motion.div
                    key={resource.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 251' }}
                          animate={{ strokeDasharray: `${resource.value * 2.51} 251` }}
                          transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <resource.icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{resource.value}%</p>
                    <p className="text-sm text-muted-foreground">{resource.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Active Workflows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Active Workflows</h3>
              </div>
              <button 
                onClick={() => onNavigate('/workflows')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Manage Workflows
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {mockWorkflows.map((workflow, index) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{workflow.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {workflow.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.steps.length} steps
                        </span>
                      </div>
                    </div>
                    <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">System Alerts</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                {mockSystemAlerts.length} active
              </span>
            </div>
            <div className="divide-y divide-border">
              {mockSystemAlerts.map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className={`p-4 border-l-4 ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Recent Activities</h3>
              </div>
            </div>
            <div className="divide-y divide-border">
              {mockRecentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Onboard New User', icon: Users, path: '/users' },
                { label: 'Publish Announcement', icon: Bell, path: '/announcements' },
                { label: 'Configure Workflow', icon: Workflow, path: '/workflows' },
                { label: 'View System Logs', icon: FileText, path: '/monitor' },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Platform Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Platform Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Students</span>
                <span className="font-medium">{mockSystemStats.activeStudents.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Faculty</span>
                <span className="font-medium">{mockSystemStats.activeFaculty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Staff</span>
                <span className="font-medium">{mockSystemStats.adminStaff}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-medium text-green-600">{mockSystemStats.uptime}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
