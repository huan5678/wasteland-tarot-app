'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function HistoryToNewReadingFlow() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterCount, setFilterCount] = useState(0);

  // Restore filters from sessionStorage on mount
  useEffect(() => {
    const storedFilters = sessionStorage.getItem('reading-history-filters');
    if (storedFilters) {
      try {
        const filters = JSON.parse(storedFilters);
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.set(key, String(value));
          }
        });

        if (params.toString()) {
          router.replace(`${pathname}?${params.toString()}`);
        }

        // Clear storage after restoration
        sessionStorage.removeItem('reading-history-filters');
      } catch (error) {
        console.error('Failed to restore filters:', error);
      }
    }
  }, [pathname, router]);

  // Count active filters
  useEffect(() => {
    const count = Array.from(searchParams.keys()).filter((key) => {
      const value = searchParams.get(key);
      return value && value !== '';
    }).length;

    setFilterCount(count);
  }, [searchParams]);

  const handleNewReading = () => {
    // Preserve filters in sessionStorage
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });

    if (Object.keys(filters).length > 0) {
      sessionStorage.setItem('reading-history-filters', JSON.stringify(filters));

      // Update URL to preserve filters
      const params = new URLSearchParams(filters);
      router.replace(`${pathname}?${params.toString()}`);
    }

    // Navigate to new reading
    router.push('/readings/new');
  };

  const handleClearFilters = () => {
    router.replace(pathname);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-pip-boy-dark/50 border border-pip-boy-green/20 rounded-lg">
      <Button
        onClick={handleNewReading}
        className="bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/30 font-cubic"
      >
        <span className="mr-2">+</span>
        開始新解讀
      </Button>

      {filterCount > 0 && (
        <>
          <span className="text-pip-boy-green/70 text-sm font-cubic">
            {filterCount} 個篩選器已啟用
          </span>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            size="sm"
            className="border-pip-boy-green/40 text-pip-boy-green/70 hover:bg-pip-boy-green/10 font-cubic"
          >
            清除篩選器
          </Button>
        </>
      )}
    </div>
  );
}
