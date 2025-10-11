/**
 * StatisticsCard Component Tests
 * Tests for Doto font integration
 * Requirements: 3.3, 3.4
 *
 * Note: 使用 PixelIcon 名稱字串代替 lucide-react 元件
 */

import { render, screen } from '@testing-library/react';
import { StatisticsCard } from '../StatisticsCard';

describe('StatisticsCard with Doto Font', () => {
  it('should apply numeric class to numeric value by default', () => {
    render(
      <StatisticsCard
        title="Total Users"
        value={1234}
        icon="activity"
      />
    );

    const valueElement = screen.getByText('1234');
    expect(valueElement).toHaveClass('numeric');
  });

  it('should apply numeric class to trend percentage', () => {
    render(
      <StatisticsCard
        title="Total Users"
        value={1234}
        icon="activity"
        trend={{
          value: 12.5,
          label: 'from last month',
          isPositive: true,
        }}
      />
    );

    // 趨勢百分比應該也使用 Doto 字體
    const trendElement = screen.getByText(/12.5%/);
    expect(trendElement).toHaveClass('numeric');
  });

  it('should not apply numeric when useNumericFont is false', () => {
    render(
      <StatisticsCard
        title="Total Users"
        value={1234}
        icon="activity"
        useNumericFont={false}
      />
    );

    const valueElement = screen.getByText('1234');
    expect(valueElement).not.toHaveClass('numeric');
  });

  it('should handle string values with numeric', () => {
    render(
      <StatisticsCard
        title="Status"
        value="42 active"
        icon="activity"
      />
    );

    const valueElement = screen.getByText('42 active');
    expect(valueElement).toHaveClass('numeric');
  });
});
