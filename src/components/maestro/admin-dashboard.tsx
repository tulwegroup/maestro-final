'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Eye,
  Send,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  tasks: any[];
  user?: {
    name?: string;
    email: string;
    profile?: {
      fullNameEnglish?: string;
    };
  };
}

export function AdminDashboard() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const res = await fetch('/api/journeys?status=all');
        const data = await res.json();
        if (data.success) {
          setJourneys(data.journeys);
        }
      } catch (error) {
        console.error('Error fetching journeys:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJourneys();
  }, []);

  // Stats
  const pendingJourneys = journeys.filter(j => j.status === 'PENDING' || j.status === 'PAYMENT_PENDING');
  const processingJourneys = journeys.filter(j => j.status === 'PROCESSING');
  const completedJourneys = journeys.filter(j => j.status === 'COMPLETED');
  const totalRevenue = completedJourneys.reduce((sum, j) => sum + j.totalAmount, 0);

  const handleStartJourney = async (journeyId: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/journeys/${journeyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROCESSING' })
      });
      setJourneys(prev => prev.map(j => 
        j.id === journeyId ? { ...j, status: 'PROCESSING' } : j
      ));
    } catch (error) {
      console.error('Error starting journey:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteJourney = async (journeyId: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/journeys/${journeyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      setJourneys(prev => prev.map(j => 
        j.id === journeyId ? { ...j, status: 'COMPLETED' } : j
      ));
    } catch (error) {
      console.error('Error completing journey:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700">{status.replace('_', ' ')}</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
        <Badge className="bg-teal-100 text-teal-700">
          <Activity className="w-3 h-3 mr-1" />
          Operator View
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{pendingJourneys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Processing</p>
                <p className="text-2xl font-bold text-slate-900">{processingJourneys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedJourneys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="text-2xl font-bold text-slate-900">AED {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="pending" className="data-[state=active]:bg-teal-50">
            Pending ({pendingJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="data-[state=active]:bg-teal-50">
            Processing ({processingJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-teal-50">
            Completed ({completedJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-teal-50">
            All ({journeys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <JourneyTable 
            journeys={pendingJourneys} 
            onStart={handleStartJourney}
            onView={setSelectedJourney}
            setShowModal={setShowDetailModal}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="processing" className="mt-4">
          <JourneyTable 
            journeys={processingJourneys} 
            onComplete={handleCompleteJourney}
            onView={setSelectedJourney}
            setShowModal={setShowDetailModal}
            getStatusBadge={getStatusBadge}
            isUpdating={isUpdating}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <JourneyTable 
            journeys={completedJourneys} 
            onView={setSelectedJourney}
            setShowModal={setShowDetailModal}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          <JourneyTable 
            journeys={journeys} 
            onStart={handleStartJourney}
            onComplete={handleCompleteJourney}
            onView={setSelectedJourney}
            setShowModal={setShowDetailModal}
            getStatusBadge={getStatusBadge}
            isUpdating={isUpdating}
          />
        </TabsContent>
      </Tabs>

      {/* Journey Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Journey Details</DialogTitle>
          </DialogHeader>
          
          {selectedJourney && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedJourney.title}</h3>
                {getStatusBadge(selectedJourney.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Created</p>
                  <p className="font-medium">{new Date(selectedJourney.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Amount</p>
                  <p className="font-medium">AED {selectedJourney.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment Status</p>
                  <p className="font-medium">{selectedJourney.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tasks</p>
                  <p className="font-medium">{selectedJourney.tasks?.length || 0}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Tasks</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedJourney.tasks?.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">{task.title}</span>
                      <span className="text-sm font-medium">AED {task.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Journey Table Component
function JourneyTable({ 
  journeys, 
  onStart, 
  onComplete,
  onView,
  setShowModal,
  getStatusBadge,
  isUpdating
}: { 
  journeys: Journey[];
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onView: (j: Journey) => void;
  setShowModal: (v: boolean) => void;
  getStatusBadge: (s: string) => JSX.Element;
  isUpdating?: boolean;
}) {
  if (journeys.length === 0) {
    return (
      <div className="text-center py-8 bg-white/50 rounded-xl border border-slate-200">
        <p className="text-slate-500">No journeys in this category</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-slate-500">Journey</th>
              <th className="text-left p-3 text-sm font-medium text-slate-500">Status</th>
              <th className="text-left p-3 text-sm font-medium text-slate-500">Amount</th>
              <th className="text-left p-3 text-sm font-medium text-slate-500">Created</th>
              <th className="text-right p-3 text-sm font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {journeys.map((journey) => (
              <tr key={journey.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3">
                  <div>
                    <p className="font-medium text-slate-900">{journey.title}</p>
                    <p className="text-xs text-slate-500">{journey.tasks?.length || 0} tasks</p>
                  </div>
                </td>
                <td className="p-3">{getStatusBadge(journey.status)}</td>
                <td className="p-3 font-medium">AED {journey.totalAmount.toLocaleString()}</td>
                <td className="p-3 text-sm text-slate-500">
                  {new Date(journey.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        onView(journey);
                        setShowModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {journey.status === 'PENDING' && onStart && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onStart(journey.id)}
                        disabled={isUpdating}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {journey.status === 'PROCESSING' && onComplete && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onComplete(journey.id)}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
