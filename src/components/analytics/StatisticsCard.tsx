/**
 * StatisticsCard Component
 * Display individual statistic with icon and trend
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  useNumericFont?: boolean;
}

export function StatisticsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className = '',
  useNumericFont = true,
}: StatisticsCardProps) {
  const numericClass = useNumericFont ? 'numeric' : '';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${numericClass} tabular-nums`}>{value}</p>

          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${numericClass} tabular-nums ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
