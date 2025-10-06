/**
 * CardFrequency Component
 * Bar chart showing most drawn cards
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface CardFrequencyProps {
  data: Array<{
    card_id: string;
    count: number;
    percentage: number;
  }>;
  className?: string;
}

export function CardFrequency({ data, className = '' }: CardFrequencyProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    name: item.card_id.split('-').pop() || item.card_id,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Most Drawn Cards</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontFamily: 'var(--numeric), monospace',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value, 'Times Drawn'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            name="Times Drawn"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
