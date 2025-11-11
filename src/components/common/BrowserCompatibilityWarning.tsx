/**
 * Browser Compatibility Warning Component
 * Shows warning when browser doesn't support required features
 *
 * Features:
 * - Checks for specific browser API support
 * - Dismissible warning
 * - Recommended browsers list
 * - Fallout-themed styling
 */

'use client';

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';

export interface BrowserCompatibilityWarningProps {
  /** Feature name that's unsupported */
  feature: string;
  /** Whether the feature is supported */
  isSupported: boolean;
  /** Recommended browsers */
  recommendedBrowsers: string[];
  /** Current browser name */
  currentBrowser?: string;
  /** Warning message */
  message?: string;
}

/**
 * Component that displays browser compatibility warnings
 */
export const BrowserCompatibilityWarning: React.FC<BrowserCompatibilityWarningProps> = ({
  feature,
  isSupported,
  recommendedBrowsers,
  currentBrowser,
  message
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if supported or dismissed
  if (isSupported || dismissed) {
    return null;
  }

  const defaultMessage = `您的瀏覽器不支援${feature}功能。建議使用 ${recommendedBrowsers.join(' 或 ')} 瀏覽器`;

  return (
    <div className="bg-radiation-orange/20 border-2 border-radiation-orange p-4 mb-4">
      <div className="flex items-start gap-3">
        <PixelIcon
          name="alert-triangle"
          sizePreset="sm"
          variant="warning"
          decorative
        />
        <div className="flex-1">
          <p className="text-radiation-orange font-bold text-sm mb-1">
            瀏覽器相容性警告
          </p>
          <p className="text-radiation-orange/90 text-xs mb-2">
            {message || defaultMessage}
          </p>
          {currentBrowser && (
            <p className="text-radiation-orange/70 text-xs">
              目前使用：{currentBrowser}
            </p>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="關閉警告"
          className="text-radiation-orange/70 hover:text-radiation-orange transition-colors"
        >
          <PixelIcon name="close" sizePreset="sm" decorative />
        </button>
      </div>
    </div>
  );
};

BrowserCompatibilityWarning.displayName = 'BrowserCompatibilityWarning';
