'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReadingQuickActionsProps {
  readingId: string;
  voiceSettings?: Record<string, unknown>;
  categorySettings?: Record<string, unknown>;
  onShare?: (readingId: string) => void;
  layout?: 'horizontal' | 'vertical';
}

export function ReadingQuickActions({
  readingId,
  voiceSettings = {},
  categorySettings = {},
  onShare,
  layout = 'horizontal',
}: ReadingQuickActionsProps) {
  const router = useRouter();

  const handleDrawAgain = () => {
    // Preserve voice and category settings in sessionStorage
    const preservedSettings = {
      ...voiceSettings,
      ...categorySettings,
    };

    sessionStorage.setItem('preserved-reading-settings', JSON.stringify(preservedSettings));

    // Navigate to new reading
    router.push('/readings/new');
  };

  const handleViewHistory = () => {
    // Store scroll target for latest reading
    sessionStorage.setItem('scroll-to-reading', readingId);

    // Navigate to history
    router.push('/readings/history');
  };

  const handleShare = () => {
    onShare?.(readingId);
  };

  return (
    <div
      role="group"
      aria-label="快速操作"
      className={cn(
        'flex gap-3 p-4 bg-pip-boy-dark/50 border border-pip-boy-green/20 rounded-lg',
        layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
      )}
    >
      <Button
        onClick={handleDrawAgain}
        className="flex-1 bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/30 font-cubic"
      >
        <span className="mr-2">↻</span>
        再抽一次
      </Button>

      <Button
        onClick={handleViewHistory}
        variant="outline"
        className="flex-1 border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10 font-cubic"
      >
        <span className="mr-2">📁</span>
        查看歷史
      </Button>

      <Button
        onClick={handleShare}
        variant="outline"
        className="flex-1 border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10 font-cubic"
      >
        <span className="mr-2">↗</span>
        分享此解讀
      </Button>
    </div>
  );
}
