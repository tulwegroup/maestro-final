'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Route, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Journey {
  id: string;
  title: string;
  user: string;
  status: string;
  amount: number;
  tasks: number;
  createdAt: string;
}

export default function AdminJourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch journeys from API
    fetch('/api/journeys')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJourneys(data.journeys.map((j: any) => ({
            id: j.id,
            title: j.title,
            user: 'Demo User',
            status: j.status,
            amount: j.totalAmount,
            tasks: j.tasks?.length || 0,
            createdAt: j.createdAt
          })));
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/20 text-blue-400">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Journey Management</h1>
          <p className="text-slate-400 text-sm">Monitor and manage all user journeys</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{journeys.length}</p>
                <p className="text-xs text-slate-400">Total Journeys</p>
              </div>
              <Route className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{journeys.filter(j => j.status === 'PENDING').length}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{journeys.filter(j => j.status === 'COMPLETED').length}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-400">{journeys.filter(j => j.status === 'FAILED').length}</p>
                <p className="text-xs text-slate-400">Failed</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journeys List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Journey</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">User</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Tasks</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Created</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map((journey) => (
                  <tr key={journey.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white font-medium">{journey.title}</td>
                    <td className="px-4 py-3 text-slate-300">{journey.user}</td>
                    <td className="px-4 py-3">{getStatusBadge(journey.status)}</td>
                    <td className="px-4 py-3 text-white">AED {journey.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{journey.tasks}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(journey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-teal-400 hover:text-teal-300">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {journeys.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No journeys found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
