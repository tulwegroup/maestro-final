'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Ticket, 
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2,
  Send,
  Paperclip,
  MoreVertical
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  user: {
    name: string;
    email: string;
  };
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'user' | 'support';
    message: string;
    timestamp: string;
  }[];
}

// Mock tickets
function generateMockTickets(): SupportTicket[] {
  const tickets = [
    {
      id: '1',
      ticketNumber: 'TKT-001234',
      subject: 'Unable to complete payment for visa renewal',
      user: { name: 'Ahmed Al Mansoori', email: 'ahmed@example.com' },
      status: 'open' as const,
      priority: 'high' as const,
      category: 'Payment',
      assignedTo: 'Support Agent 1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      messages: [
        { id: 'm1', sender: 'user' as const, message: 'I tried to pay for my visa renewal but the payment keeps failing. I have sufficient balance in my wallet.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 'm2', sender: 'support' as const, message: 'Thank you for reaching out. We are looking into this issue. Can you confirm which payment method you are trying to use?', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
      ]
    },
    {
      id: '2',
      ticketNumber: 'TKT-001235',
      subject: 'Wrong amount deducted from wallet',
      user: { name: 'Fatima Hassan', email: 'fatima@example.com' },
      status: 'in_progress' as const,
      priority: 'urgent' as const,
      category: 'Billing',
      assignedTo: 'Support Agent 2',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      messages: [
        { id: 'm1', sender: 'user' as const, message: 'I was charged AED 500 instead of AED 350 for my RTA fine payment. Please refund the difference.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      ]
    },
    {
      id: '3',
      ticketNumber: 'TKT-001236',
      subject: 'UAE Pass connection issue',
      user: { name: 'Mohammed Al Maktoum', email: 'mohammed@example.com' },
      status: 'waiting' as const,
      priority: 'medium' as const,
      category: 'Technical',
      assignedTo: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      messages: []
    },
    {
      id: '4',
      ticketNumber: 'TKT-001237',
      subject: 'Feature request: Add more banks',
      user: { name: 'Aisha Al Nahyan', email: 'aisha@example.com' },
      status: 'resolved' as const,
      priority: 'low' as const,
      category: 'Feature Request',
      assignedTo: 'Support Agent 1',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      messages: []
    },
  ];
  
  return tickets;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    setTimeout(() => {
      const mockTickets = generateMockTickets();
      setTickets(mockTickets);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    return filtered;
  }, [searchQuery, statusFilter, priorityFilter, tickets]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500/20 text-blue-400">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500/20 text-yellow-400">In Progress</Badge>;
      case 'waiting':
        return <Badge className="bg-orange-500/20 text-orange-400">Waiting</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-slate-500/20 text-slate-400">Closed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500/20 text-red-400">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500/20 text-green-400">Low</Badge>;
      default:
        return null;
    }
  };

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
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400 text-sm">Manage customer support requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{tickets.length}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <Ticket className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{tickets.filter(t => t.status === 'open').length}</p>
                <p className="text-xs text-slate-400">Open</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{tickets.filter(t => t.status === 'in_progress').length}</p>
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-400">{tickets.filter(t => t.status === 'waiting').length}</p>
                <p className="text-xs text-slate-400">Waiting</p>
              </div>
              <User className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{tickets.filter(t => t.status === 'resolved').length}</p>
                <p className="text-xs text-slate-400">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <Card 
            key={ticket.id} 
            className="bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
            onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-400 text-sm font-mono">{ticket.ticketNumber}</span>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <h3 className="text-white font-medium mb-1">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ticket.user.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {ticket.messages.length} messages
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {ticket.assignedTo ? (
                    <span className="text-sm text-slate-400">Assigned: {ticket.assignedTo}</span>
                  ) : (
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400">Unassigned</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedTicket?.ticketNumber}
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>From: {selectedTicket.user.name} ({selectedTicket.user.email})</span>
                  <span>Category: {selectedTicket.category}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedTicket.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-slate-700 ml-8' : 'bg-teal-900/30 mr-8'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${msg.sender === 'user' ? 'text-slate-400' : 'text-teal-400'}`}>
                        {msg.sender === 'user' ? selectedTicket.user.name : 'Support'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    <Paperclip className="w-4 h-4 mr-1" />
                    Attach File
                  </Button>
                  <Button variant="outline" size="sm" className="border-green-500/30 text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Resolved
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    Escalate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
