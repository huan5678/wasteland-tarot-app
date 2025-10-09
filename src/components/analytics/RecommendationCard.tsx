/**
 * RecommendationCard Component
 * Display personalized recommendation with action buttons
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ThumbsUp, X } from 'lucide-react';

interface Recommendation {
  id: string;
  recommendation_type: string;
  recommendation_data: Record<string, any>;
  confidence_score: number;
  priority: number;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  className = '',
}: RecommendationCardProps) {
  const getRecommendationTitle = () => {
    switch (recommendation.recommendation_type) {
      case 'spread':
        return 'Recommended Spread';
      case 'voice':
        return 'Suggested Character Voice';
      case 'card':
        return 'Cards for You';
      case 'timing':
        return 'Optimal Reading Time';
      default:
        return 'Recommendation';
    }
  };

  const getRecommendationContent = () => {
    const { recommendation_data } = recommendation;

    if (recommendation.recommendation_type === 'spread') {
      return (
        <>
          <p className="font-semibold">{recommendation_data.spread_type}</p>
          <p className="text-sm text-muted-foreground">{recommendation_data.reason}</p>
        </>
      );
    }

    if (recommendation.recommendation_type === 'voice') {
      return (
        <>
          <p className="font-semibold">{recommendation_data.character_voice}</p>
          <p className="text-sm text-muted-foreground">{recommendation_data.reason}</p>
        </>
      );
    }

    if (recommendation.recommendation_type === 'card') {
      return (
        <>
          <p className="font-semibold">
            {recommendation_data.cards?.slice(0, 3).join(', ')}
          </p>
          <p className="text-sm text-muted-foreground">{recommendation_data.reason}</p>
        </>
      );
    }

    if (recommendation.recommendation_type === 'timing') {
      return (
        <>
          <p className="font-semibold">
            {recommendation_data.optimal_hour}:00
          </p>
          <p className="text-sm text-muted-foreground">{recommendation_data.reason}</p>
        </>
      );
    }

    return <p className="text-sm text-muted-foreground">New recommendation</p>;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{getRecommendationTitle()}</h4>
          {getRecommendationContent()}

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onAccept(recommendation.id)}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="w-3 h-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(recommendation.id)}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Dismiss
            </Button>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence</span>
              <span>{(recommendation.confidence_score * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full mt-1">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${recommendation.confidence_score * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
