/**
 * PatternInsights Component
 * Display discovered patterns and insights
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Brain, TrendingUp, Calendar, Clock } from 'lucide-react';

interface Pattern {
  id: string;
  pattern_type: string;
  pattern_data: Record<string, any>;
  frequency: number;
  confidence_score: number;
}

interface PatternInsightsProps {
  patterns: Pattern[];
  readingPatterns?: {
    most_active_day: string;
    most_active_hour: number;
    average_readings_per_week: number;
    streak_days: number;
  };
  className?: string;
}

export function PatternInsights({
  patterns,
  readingPatterns,
  className = '',
}: PatternInsightsProps) {
  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'question_theme':
        return Brain;
      case 'card_combination':
        return TrendingUp;
      default:
        return Brain;
    }
  };

  const getPatternDescription = (pattern: Pattern) => {
    if (pattern.pattern_type === 'question_theme') {
      const keywords = pattern.pattern_data.keywords;
      const topKeywords = Object.entries(keywords)
        .slice(0, 3)
        .map(([word]) => word)
        .join(', ');
      return `Common themes: ${topKeywords}`;
    }

    if (pattern.pattern_type === 'card_combination') {
      const cards = pattern.pattern_data.cards || [];
      return `Frequently drawn together: ${cards.slice(0, 3).join(', ')}`;
    }

    return 'Pattern detected';
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Pattern Insights</h3>

      {/* Reading Patterns */}
      {readingPatterns && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm font-medium">Most Active Day</p>
              <p className="text-lg font-semibold">{readingPatterns.most_active_day}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm font-medium">Peak Hour</p>
              <p className="text-lg font-semibold">{readingPatterns.most_active_hour}:00</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm font-medium">Weekly Average</p>
              <p className="text-lg font-semibold">
                {readingPatterns.average_readings_per_week.toFixed(1)} readings
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm font-medium">Longest Streak</p>
              <p className="text-lg font-semibold">{readingPatterns.streak_days} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Patterns */}
      {patterns.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mb-3">Discovered Patterns</h4>
          <div className="space-y-3">
            {patterns.map((pattern) => {
              const Icon = getPatternIcon(pattern.pattern_type);
              return (
                <div
                  key={pattern.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {pattern.pattern_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {(pattern.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getPatternDescription(pattern)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Observed {pattern.frequency} times
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {patterns.length === 0 && !readingPatterns && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No patterns discovered yet. Keep reading to unlock insights!
        </p>
      )}
    </Card>
  );
}
