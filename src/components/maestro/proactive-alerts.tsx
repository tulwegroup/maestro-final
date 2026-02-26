'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Entity } from '@prisma/client';

interface Task {
  id: string;
  entity: Entity;
  title: string;
  description?: string | null;
  amount: number;
  status: string;
  blockingTask: boolean;
  priority: number;
}

interface ProactiveAlertsProps {
  tasks: Task[];
}

const ENTITY_COLORS: Record<Entity, string> = {
  RTA: 'bg-purple-100 text-purple-700',
  DUBAI_POLICE: 'bg-red-100 text-red-700',
  ICP: 'bg-blue-100 text-blue-700',
  AADC: 'bg-yellow-100 text-yellow-700',
  SHARJAH_POLICE: 'bg-red-100 text-red-700',
  DEWA: 'bg-green-100 text-green-700',
  EJARI: 'bg-orange-100 text-orange-700',
  EMIRATES_ID: 'bg-teal-100 text-teal-700',
  SALIK: 'bg-cyan-100 text-cyan-700',
  DU: 'bg-pink-100 text-pink-700',
  ETISALAT: 'bg-indigo-100 text-indigo-700',
  TASJEEL: 'bg-amber-100 text-amber-700',
  DUBAI_COURTS: 'bg-slate-100 text-slate-700',
  ABU_DHABI_COURTS: 'bg-slate-100 text-slate-700',
  FEDERAL_COURTS: 'bg-slate-100 text-slate-700',
  CUSTOM: 'bg-gray-100 text-gray-700'
};

export function ProactiveAlerts({ tasks }: ProactiveAlertsProps) {
  const blockingTasks = tasks.filter(t => t.blockingTask);
  const urgentTasks = tasks.filter(t => !t.blockingTask && t.priority >= 3);

  if (blockingTasks.length === 0 && urgentTasks.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <CardTitle className="text-lg text-amber-800">Proactive Alerts</CardTitle>
          <Badge className="bg-amber-200 text-amber-800">
            {blockingTasks.length + urgentTasks.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {blockingTasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={ENTITY_COLORS[task.entity]}>
                  {task.entity.replace('_', ' ')}
                </Badge>
                <span className="font-semibold text-red-600">
                  AED {task.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          
          {urgentTasks.slice(0, 3).map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={ENTITY_COLORS[task.entity]}>
                  {task.entity.replace('_', ' ')}
                </Badge>
                <span className="font-semibold text-amber-600">
                  AED {task.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
