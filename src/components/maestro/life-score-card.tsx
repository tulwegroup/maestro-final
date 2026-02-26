'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface LifeScoreCardProps {
  score: number;
  factors?: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    detail?: string;
  }[];
}

export function LifeScoreCard({ score, factors = [] }: LifeScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const, className: 'bg-green-100 text-green-700' };
    if (score >= 60) return { label: 'Good', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Needs Attention', variant: 'destructive' as const, className: '' };
  };

  const status = getStatusBadge(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Life Score
          </CardTitle>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="#e2e8f0"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 1s ease-out'
                }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
              <span className="text-xs text-slate-500">out of 100</span>
            </div>
          </div>

          {/* Factors */}
          <div className="flex-1 space-y-2">
            {factors.length > 0 ? (
              factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {factor.impact === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : factor.impact === 'negative' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-slate-700">{factor.name}</span>
                  {factor.detail && (
                    <span className="text-slate-400 text-xs">({factor.detail})</span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  All documents valid
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No pending fines
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  License expires in 40 days
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
