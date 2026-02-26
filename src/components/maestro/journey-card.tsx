'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  Loader2,
  CreditCard
} from 'lucide-react';
import { Entity, JourneyStatus } from '@prisma/client';

interface Task {
  id: string;
  entity: Entity;
  title: string;
  amount: number;
  status: string;
  blockingTask: boolean;
}

interface Journey {
  id: string;
  title: string;
  status: JourneyStatus;
  totalAmount: number;
  tasks: Task[];
  createdAt: Date;
}

interface JourneyCardProps {
  journey: Journey;
  onClick?: () => void;
}

const ENTITY_ICONS: Record<Entity, string> = {
  RTA: '🚗',
  DUBAI_POLICE: '👮',
  ICP: '🏛️',
  AADC: '💡',
  SHARJAH_POLICE: '👮',
  DEWA: '⚡',
  EJARI: '🏠',
  EMIRATES_ID: '🪪',
  SALIK: '🛣️',
  DU: '📱',
  ETISALAT: '📞',
  TASJEEL: '🔧',
  DUBAI_COURTS: '⚖️',
  ABU_DHABI_COURTS: '⚖️',
  FEDERAL_COURTS: '⚖️',
  CUSTOM: '📋'
};

const STATUS_COLORS: Record<JourneyStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700'
};

export function JourneyCard({ journey, onClick }: JourneyCardProps) {
  const tasks = journey.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const blockingTasks = tasks.filter(t => t.blockingTask);

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{journey.title}</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {tasks.length} tasks • AED {journey.totalAmount.toLocaleString()}
            </p>
          </div>
          <Badge className={STATUS_COLORS[journey.status]}>
            {journey.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{completedTasks}/{tasks.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Task entities */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tasks.slice(0, 5).map((task) => (
            <Badge 
              key={task.id} 
              variant="outline" 
              className={`text-xs ${task.blockingTask ? 'border-red-300 text-red-600' : ''}`}
            >
              {ENTITY_ICONS[task.entity]} {task.title.substring(0, 15)}...
            </Badge>
          ))}
          {tasks.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{tasks.length - 5} more
            </Badge>
          )}
        </div>

        {/* Blocking alerts */}
        {blockingTasks.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-700">
              {blockingTasks.length} blocking item{blockingTasks.length > 1 ? 's' : ''} requiring attention
            </span>
          </div>
        )}

        {/* Action */}
        {journey.status === 'PENDING' && (
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={onClick}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Review & Pay
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        {journey.status === 'PROCESSING' && (
          <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing your tasks...
          </div>
        )}
        {journey.status === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            All tasks completed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
