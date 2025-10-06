/**
 * ReadingTrends Component
 * Line chart showing reading frequency over time
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ReadingTrendsProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  className?: string;
}

export function ReadingTrends({ data, className = '' }: ReadingTrendsProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Reading Frequency</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            labelFormatter={(value) => {
              const date = new Date(value as string);
              return date.toLocaleDateString();
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Readings"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
