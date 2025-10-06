/**
 * Analytics Page
 * Display user analytics dashboard
 */

import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <AnalyticsDashboard />
    </div>
  );
}
