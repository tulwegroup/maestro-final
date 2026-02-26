'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

interface UpcomingItem {
  id: string;
  type: string;
  title: string;
  date: Date;
  status: 'urgent' | 'upcoming' | 'normal';
  daysUntil: number;
}

interface UpcomingRenewalsProps {
  items: UpcomingItem[];
}

const TYPE_ICONS: Record<string, string> = {
  visa: '🛂',
  license: '🪪',
  vehicle: '🚗',
  emirates_id: '📋',
  passport: '📕',
  insurance: '🛡️'
};

export function UpcomingRenewals({ items }: UpcomingRenewalsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'upcoming': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AE', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Upcoming Renewals
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-teal-600">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-4 text-slate-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">No upcoming renewals</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.status === 'urgent' ? 'bg-red-50 border-red-100' :
                  item.status === 'upcoming' ? 'bg-yellow-50 border-yellow-100' :
                  'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{TYPE_ICONS[item.type] || '📋'}</span>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(item.status)}>
                    {item.daysUntil} days
                  </Badge>
                  {item.status === 'urgent' && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Action needed
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
