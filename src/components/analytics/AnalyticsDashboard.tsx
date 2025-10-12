/**
 * AnalyticsDashboard Component
 * Main analytics dashboard displaying user statistics and insights
 */

'use client';

import React, { useEffect, useState } from 'react';
import { StatisticsCard } from './StatisticsCard';
import { ReadingTrends } from './ReadingTrends';
import { CardFrequency } from './CardFrequency';
import { SpreadUsage } from './SpreadUsage';
import { PatternInsights } from './PatternInsights';
import { RecommendationCard } from './RecommendationCard';
import { PixelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface AnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsData {
  user_analytics: {
    session_count: number;
    readings_count: number;
    avg_session_duration: number;
    favorite_spread_type: string;
    favorite_character_voice: string;
    shares_count: number;
    notes_count: number;
  };
  recent_events: any[];
  patterns: any[];
  recommendations: any[];
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reading frequency data
  const [frequencyData, setFrequencyData] = useState<any[]>([]);
  const fetchFrequency = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/readings/analytics/frequency?period=30d`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFrequencyData(data.data_points || []);
      }
    } catch (err) {
      console.error('Failed to fetch frequency data:', err);
    }
  };

  // Fetch card frequency data
  const [cardFrequencyData, setCardFrequencyData] = useState<any[]>([]);
  const fetchCardFrequency = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/readings/analytics/cards?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCardFrequencyData(data.most_drawn_cards || []);
      }
    } catch (err) {
      console.error('Failed to fetch card frequency:', err);
    }
  };

  // Fetch spread usage data
  const [spreadUsageData, setSpreadUsageData] = useState<Record<string, number>>({});
  const fetchSpreadUsage = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/readings/analytics/spreads`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSpreadUsageData(data.spread_usage || {});
      }
    } catch (err) {
      console.error('Failed to fetch spread usage:', err);
    }
  };

  // Fetch reading patterns
  const [readingPatterns, setReadingPatterns] = useState<any>(null);
  const fetchReadingPatterns = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/readings/analytics/patterns`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReadingPatterns(data);
      }
    } catch (err) {
      console.error('Failed to fetch reading patterns:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchFrequency();
    fetchCardFrequency();
    fetchSpreadUsage();
    fetchReadingPatterns();
  }, []);

  // Handle recommendation actions
  const handleAcceptRecommendation = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/recommendations/${id}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  const handleRejectRecommendation = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/recommendations/${id}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to reject recommendation:', err);
    }
  };

  // Generate new recommendations
  const handleGenerateRecommendations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/recommendations/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <PixelIcon name="reload" size={32} className="animate-spin mx-auto mb-2" decorative />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Failed to load analytics'}
          </p>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <PixelIcon name="reload" size={16} className="mr-2" decorative />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { user_analytics, patterns, recommendations } = data;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <PixelIcon name="reload" size={16} className="mr-2" decorative />
          Refresh
        </Button>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsCard
          title="Total Readings"
          value={user_analytics.readings_count}
          iconName="book-open"
          description="All time"
        />
        <StatisticsCard
          title="Sessions"
          value={user_analytics.session_count}
          iconName="trending-up"
          description="Total sessions"
        />
        <StatisticsCard
          title="Avg. Session"
          value={`${Math.round(user_analytics.avg_session_duration / 60)}m`}
          iconName="clock"
          description="Duration"
          useNumericFont={true}
        />
        <StatisticsCard
          title="Engagement"
          value={user_analytics.shares_count + user_analytics.notes_count}
          iconName="sparkles"
          description="Shares & notes"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadingTrends data={frequencyData} />
        <SpreadUsage data={spreadUsageData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardFrequency data={cardFrequencyData} />
        <PatternInsights patterns={patterns} readingPatterns={readingPatterns} />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <Button
              onClick={handleGenerateRecommendations}
              variant="outline"
              size="sm"
            >
              <PixelIcon name="sparkles" size={16} className="mr-2" decorative />
              Generate New
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={handleAcceptRecommendation}
                onReject={handleRejectRecommendation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
