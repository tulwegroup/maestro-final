'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Bell, 
  Send, 
  Users, 
  Mail, 
  Smartphone, 
  Globe,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  Loader2,
  Filter,
  MessageSquare,
  AlertTriangle,
  Info,
  Megaphone
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'SYSTEM_ALERT' | 'JOURNEY_UPDATE' | 'PAYMENT' | 'MARKETING' | 'SECURITY';
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  status: 'sent' | 'pending' | 'delivered' | 'failed';
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
  createdBy: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Compose form
  const [composeForm, setComposeForm] = useState({
    title: '',
    message: '',
    channel: 'in_app',
    targetType: 'all',
    scheduledFor: '',
  });

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setNotifications([
        { id: '1', type: 'SYSTEM_ALERT', title: 'Scheduled Maintenance', message: 'System will be under maintenance on Sunday 2-4 AM UAE time.', channel: 'in_app', status: 'delivered', recipientCount: 12847, deliveredCount: 12654, readCount: 8932, createdAt: new Date(Date.now() - 3600000).toISOString(), sentAt: new Date(Date.now() - 3000000).toISOString(), createdBy: 'Admin' },
        { id: '2', type: 'MARKETING', title: 'New Feature: AANI Payments', message: 'We are excited to announce AANI payment integration! Now you can make instant payments directly from your MAESTRO wallet.', channel: 'email', status: 'delivered', recipientCount: 8500, deliveredCount: 8342, readCount: 2341, createdAt: new Date(Date.now() - 86400000).toISOString(), sentAt: new Date(Date.now() - 86000000).toISOString(), createdBy: 'Marketing' },
        { id: '3', type: 'SECURITY', title: 'Security Update Required', message: 'Please update your password to meet our new security requirements.', channel: 'email', status: 'delivered', recipientCount: 234, deliveredCount: 230, readCount: 189, createdAt: new Date(Date.now() - 172800000).toISOString(), sentAt: new Date(Date.now() - 172000000).toISOString(), createdBy: 'Security' },
        { id: '4', type: 'JOURNEY_UPDATE', title: 'Visa Renewal Reminder', message: 'Your visa renewal is due in 30 days. Start your renewal journey now!', channel: 'sms', status: 'sent', recipientCount: 156, deliveredCount: 152, readCount: 98, createdAt: new Date(Date.now() - 259200000).toISOString(), sentAt: new Date(Date.now() - 258000000).toISOString(), createdBy: 'System' },
        { id: '5', type: 'PAYMENT', title: 'Payment Successful', message: 'Your payment of AED 2,500 for Journey #4521 has been processed.', channel: 'in_app', status: 'delivered', recipientCount: 1, deliveredCount: 1, readCount: 1, createdAt: new Date(Date.now() - 300000).toISOString(), sentAt: new Date(Date.now() - 280000).toISOString(), createdBy: 'System' },
        { id: '6', type: 'MARKETING', title: 'Weekend Special Offer', message: 'Get 20% off on all RTA services this weekend!', channel: 'push', status: 'pending', recipientCount: 5000, deliveredCount: 0, readCount: 0, createdAt: new Date().toISOString(), scheduledFor: new Date(Date.now() + 86400000).toISOString(), createdBy: 'Marketing' },
      ]);

      setTemplates([
        { id: 't1', name: 'Welcome Email', subject: 'Welcome to MAESTRO!', body: 'Dear {name},\n\nWelcome to MAESTRO - your UAE life automation platform...', type: 'email' },
        { id: 't2', name: 'Payment Receipt', subject: 'Payment Confirmation - MAESTRO', body: 'Your payment of {amount} AED has been received...', type: 'email' },
        { id: 't3', name: 'Journey Complete', subject: 'Journey Completed Successfully', body: 'Your {journey_type} journey has been completed!', type: 'in_app' },
        { id: 't4', name: 'Document Expiry', subject: 'Document Expiring Soon', body: 'Your {document_type} will expire in {days} days...', type: 'sms' },
      ]);

      setIsLoading(false);
    }, 500);
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SYSTEM_ALERT':
        return <Badge className="bg-red-500/20 text-red-400">System Alert</Badge>;
      case 'JOURNEY_UPDATE':
        return <Badge className="bg-blue-500/20 text-blue-400">Journey</Badge>;
      case 'PAYMENT':
        return <Badge className="bg-green-500/20 text-green-400">Payment</Badge>;
      case 'MARKETING':
        return <Badge className="bg-purple-500/20 text-purple-400">Marketing</Badge>;
      case 'SECURITY':
        return <Badge className="bg-orange-500/20 text-orange-400">Security</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{type}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'sms':
        return <Smartphone className="w-4 h-4 text-green-400" />;
      case 'push':
        return <Bell className="w-4 h-4 text-purple-400" />;
      case 'in_app':
        return <MessageSquare className="w-4 h-4 text-teal-400" />;
      default:
        return <Globe className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500/20 text-green-400">Delivered</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500/20 text-blue-400">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (typeFilter !== 'all' && n.type !== typeFilter) {
      return false;
    }
    return true;
  });

  // Stats
  const totalSent = notifications.reduce((sum, n) => sum + n.deliveredCount, 0);
  const totalRead = notifications.reduce((sum, n) => sum + n.readCount, 0);
  const avgReadRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">Manage and send platform notifications</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowComposeModal(true)}>
          <Send className="w-4 h-4 mr-2" />
          Compose Notification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalRead.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{avgReadRate}%</p>
                <p className="text-xs text-slate-400">Read Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{notifications.filter(n => n.status === 'pending').length}</p>
                <p className="text-xs text-slate-400">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="SYSTEM_ALERT">System Alert</option>
                  <option value="JOURNEY_UPDATE">Journey Update</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className="bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                onClick={() => { setSelectedNotification(notification); setShowDetailModal(true); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getChannelIcon(notification.channel)}
                        {getTypeBadge(notification.type)}
                        {getStatusBadge(notification.status)}
                      </div>
                      <h3 className="text-white font-medium mb-1">{notification.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {notification.recipientCount.toLocaleString()} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {notification.readCount.toLocaleString()} read
                        </span>
                        <span>
                          {notification.scheduledFor 
                            ? `Scheduled: ${new Date(notification.scheduledFor).toLocaleString()}`
                            : `Sent: ${new Date(notification.sentAt || notification.createdAt).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template) => (
                <Button 
                  key={template.id} 
                  variant="ghost" 
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={() => {
                    setComposeForm(prev => ({ ...prev, title: template.subject, message: template.body }));
                    setShowComposeModal(true);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {template.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Channel Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span className="text-slate-300">In-App: Instant delivery, high engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Email: Best for detailed content</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">SMS: Urgent notifications only</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">Push: Mobile engagement</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Compose Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Title</label>
              <Input 
                value={composeForm.title}
                onChange={(e) => setComposeForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Message</label>
              <Textarea 
                value={composeForm.message}
                onChange={(e) => setComposeForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Notification message..."
                className="bg-slate-700 border-slate-600 text-white min-h-32"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Channel</label>
                <select 
                  value={composeForm.channel}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="in_app">In-App</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Target</label>
                <select 
                  value={composeForm.targetType}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, targetType: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="premium">Premium Users</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Schedule (Optional)</label>
              <Input 
                type="datetime-local"
                value={composeForm.scheduledFor}
                onChange={(e) => setComposeForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => setShowComposeModal(false)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-slate-600 text-slate-300"
                onClick={() => setShowComposeModal(false)}
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getChannelIcon(selectedNotification.channel)}
                {getTypeBadge(selectedNotification.type)}
                {getStatusBadge(selectedNotification.status)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedNotification.title}</h3>
                <p className="text-slate-300 mt-2">{selectedNotification.message}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{selectedNotification.recipientCount.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Recipients</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">{selectedNotification.deliveredCount.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-400">{selectedNotification.readCount.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Read</p>
                </div>
              </div>
              <div className="text-sm text-slate-400">
                <p>Created by: {selectedNotification.createdBy}</p>
                <p>Created at: {new Date(selectedNotification.createdAt).toLocaleString()}</p>
                {selectedNotification.sentAt && (
                  <p>Sent at: {new Date(selectedNotification.sentAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
