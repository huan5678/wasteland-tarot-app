/**
 * @jest-environment jsdom
 *
 * TestimonialCard Component Tests
 *
 * Tests for the testimonial card component with:
 * - Rating star rendering (0-5 stars)
 * - Filled and empty star variants (primary vs muted)
 * - Avatar PixelIcon integration
 * - Username and review text display
 * - PipBoyCard base container integration
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TestimonialCard, type TestimonialCardProps } from '../TestimonialCard';

// Mock PixelIcon component
vi.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, variant, sizePreset, decorative, ...props }: any) => (
    <i
      data-testid={`pixel-icon-${name}`}
      data-variant={variant}
      data-size-preset={sizePreset}
      data-decorative={decorative}
      {...props}
    />
  ),
}));

// Mock PipBoyCard component
vi.mock('@/components/ui/pipboy/PipBoyCard', () => ({
  PipBoyCard: ({ children, className, ...props }: any) => (
    <div
      data-testid="pipboy-card"
      data-classname={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock useAudioEffect hook (used by PipBoyCard)
vi.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: vi.fn(),
  }),
}));

describe('TestimonialCard', () => {
  const defaultProps: TestimonialCardProps = {
    avatar: 'user-3',
    username: '避難所111號倖存者',
    rating: 5,
    review: '這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！',
  };

  describe('Rating Stars - Filled vs Empty', () => {
    it('renders 5 filled stars when rating is 5', () => {
      render(<TestimonialCard {...defaultProps} rating={5} />);

      // Should have 5 filled stars
      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(5);

      // Filled stars should have primary variant
      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });

      // Should have 0 empty stars
      const emptyStars = screen.queryAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(0);
    });

    it('renders 4 filled stars and 1 empty star when rating is 4', () => {
      render(<TestimonialCard {...defaultProps} rating={4} />);

      // Should have 4 filled stars with primary variant
      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(4);
      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });

      // Should have 1 empty star with muted variant
      const emptyStars = screen.getAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(1);
      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('renders 3 filled stars and 2 empty stars when rating is 3', () => {
      render(<TestimonialCard {...defaultProps} rating={3} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(3);
      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });

      const emptyStars = screen.getAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(2);
      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('renders 2 filled stars and 3 empty stars when rating is 2', () => {
      render(<TestimonialCard {...defaultProps} rating={2} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(2);
      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });

      const emptyStars = screen.getAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(3);
      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('renders 1 filled star and 4 empty stars when rating is 1', () => {
      render(<TestimonialCard {...defaultProps} rating={1} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(1);
      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });

      const emptyStars = screen.getAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(4);
      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('renders 0 filled stars and 5 empty stars when rating is 0', () => {
      render(<TestimonialCard {...defaultProps} rating={0} />);

      // Should have 0 filled stars
      const filledStars = screen.queryAllByTestId('pixel-icon-star-fill');
      expect(filledStars).toHaveLength(0);

      // Should have 5 empty stars with muted variant
      const emptyStars = screen.getAllByTestId('pixel-icon-star');
      expect(emptyStars).toHaveLength(5);
      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('uses correct PixelIcon variant for filled stars (primary)', () => {
      render(<TestimonialCard {...defaultProps} rating={5} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');

      filledStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'primary');
      });
    });

    it('uses correct PixelIcon variant for empty stars (muted)', () => {
      render(<TestimonialCard {...defaultProps} rating={0} />);

      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      emptyStars.forEach((star) => {
        expect(star).toHaveAttribute('data-variant', 'muted');
      });
    });

    it('uses correct size preset for stars (xs)', () => {
      render(<TestimonialCard {...defaultProps} rating={3} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      [...filledStars, ...emptyStars].forEach((star) => {
        expect(star).toHaveAttribute('data-size-preset', 'xs');
      });
    });

    it('marks star icons as decorative', () => {
      render(<TestimonialCard {...defaultProps} rating={3} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      [...filledStars, ...emptyStars].forEach((star) => {
        expect(star).toHaveAttribute('data-decorative', 'true');
      });
    });
  });

  describe('Avatar PixelIcon Integration', () => {
    it('renders avatar PixelIcon with correct name', () => {
      render(<TestimonialCard {...defaultProps} avatar="user-3" />);

      const avatar = screen.getByTestId('pixel-icon-user-3');
      expect(avatar).toBeInTheDocument();
    });

    it('renders avatar with different icon names', () => {
      const avatars = ['user-3', 'shield', 'skull', 'briefcase', 'test-tube'];

      avatars.forEach((avatarName) => {
        const { unmount } = render(
          <TestimonialCard {...defaultProps} avatar={avatarName} />
        );

        const avatar = screen.getByTestId(`pixel-icon-${avatarName}`);
        expect(avatar).toBeInTheDocument();

        unmount();
      });
    });

    it('marks avatar icon as decorative', () => {
      render(<TestimonialCard {...defaultProps} avatar="user-3" />);

      const avatar = screen.getByTestId('pixel-icon-user-3');
      expect(avatar).toHaveAttribute('data-decorative', 'true');
    });

    it('uses correct size preset for avatar (md)', () => {
      render(<TestimonialCard {...defaultProps} avatar="user-3" />);

      const avatar = screen.getByTestId('pixel-icon-user-3');
      expect(avatar).toHaveAttribute('data-size-preset', 'md');
    });
  });

  describe('Username Display', () => {
    it('displays username text correctly', () => {
      render(<TestimonialCard {...defaultProps} username="避難所111號倖存者" />);

      expect(screen.getByText('避難所111號倖存者')).toBeInTheDocument();
    });

    it('displays different usernames correctly', () => {
      const usernames = [
        '避難所111號倖存者',
        '鋼鐵兄弟會書記員',
        'NCR 偵察兵',
        '廢土商隊領袖',
        '獨行旅者',
        'Vault-Tec 工程師',
      ];

      usernames.forEach((username) => {
        const { unmount } = render(
          <TestimonialCard {...defaultProps} username={username} />
        );

        expect(screen.getByText(username)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Review Text Display', () => {
    it('displays review text correctly', () => {
      const review = '這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！';
      render(<TestimonialCard {...defaultProps} review={review} />);

      expect(screen.getByText(review)).toBeInTheDocument();
    });

    it('displays different review texts correctly', () => {
      const reviews = [
        '這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！',
        '量子占卜系統整合了戰前科技與神秘學，非常符合我們的理念。',
        '介面設計很有 Pip-Boy 的感覺，占卜結果也很有參考價值。',
        '每次做重大決策前都會來占卜，業力系統幫助我維持正面形象。',
        '快速占卜功能很實用，不需註冊就能體驗，推薦給新手。',
        '技術實現很扎實，多 AI 供應商支援確保服務穩定性。',
      ];

      reviews.forEach((review) => {
        const { unmount } = render(
          <TestimonialCard {...defaultProps} review={review} />
        );

        expect(screen.getByText(review)).toBeInTheDocument();

        unmount();
      });
    });

    it('handles long review text gracefully', () => {
      const longReview =
        '這是一段非常長的評價文字內容。' +
        '這個平台的 AI 占卜準到可怕，幫我在廢土中找到正確的生存方向！' +
        '量子占卜系統整合了戰前科技與神秘學，非常符合我們的理念。' +
        '介面設計很有 Pip-Boy 的感覺，占卜結果也很有參考價值。';

      render(<TestimonialCard {...defaultProps} review={longReview} />);

      expect(screen.getByText(longReview)).toBeInTheDocument();
    });
  });

  describe('PipBoyCard Base Container Integration', () => {
    it('renders PipBoyCard as base container', () => {
      render(<TestimonialCard {...defaultProps} />);

      const card = screen.getByTestId('pipboy-card');
      expect(card).toBeInTheDocument();
    });

    it('applies correct Pip-Boy themed styles to PipBoyCard', () => {
      render(<TestimonialCard {...defaultProps} />);

      const card = screen.getByTestId('pipboy-card');
      const className = card.getAttribute('data-classname');

      // Verify Pip-Boy themed classes are applied
      expect(className).toContain('border-2');
      expect(className).toContain('border-pip-boy-green');
    });

    it('applies correct background color to PipBoyCard', () => {
      render(<TestimonialCard {...defaultProps} />);

      const card = screen.getByTestId('pipboy-card');
      const className = card.getAttribute('data-classname');

      // Verify background color
      expect(className).toMatch(/bg-\[var\(--color-pip-boy-green-10\)\]/);
    });

    it('contains all child elements within PipBoyCard', () => {
      render(<TestimonialCard {...defaultProps} />);

      const card = screen.getByTestId('pipboy-card');

      // Verify all children are within the card
      expect(card).toContainElement(screen.getByTestId('pixel-icon-user-3'));
      expect(card).toContainElement(screen.getByText(defaultProps.username));
      expect(card).toContainElement(screen.getByText(defaultProps.review));
    });
  });

  describe('Edge Cases', () => {
    it('handles rating above 5 by capping at 5 filled stars', () => {
      render(<TestimonialCard {...defaultProps} rating={10} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.queryAllByTestId('pixel-icon-star');

      // Should cap at 5 filled stars
      expect(filledStars).toHaveLength(5);
      expect(emptyStars).toHaveLength(0);
    });

    it('handles negative rating by showing 0 filled stars', () => {
      render(<TestimonialCard {...defaultProps} rating={-1} />);

      const filledStars = screen.queryAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      // Should show 0 filled stars and 5 empty stars
      expect(filledStars).toHaveLength(0);
      expect(emptyStars).toHaveLength(5);
    });

    it('handles decimal rating by rounding down', () => {
      render(<TestimonialCard {...defaultProps} rating={3.7} />);

      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      // Should round down to 3 filled stars
      expect(filledStars).toHaveLength(3);
      expect(emptyStars).toHaveLength(2);
    });

    it('handles empty username string', () => {
      render(<TestimonialCard {...defaultProps} username="" />);

      // Component should still render without crashing
      expect(screen.getByTestId('pipboy-card')).toBeInTheDocument();
    });

    it('handles empty review string', () => {
      render(<TestimonialCard {...defaultProps} review="" />);

      // Component should still render without crashing
      expect(screen.getByTestId('pipboy-card')).toBeInTheDocument();
    });

    it('handles special characters in username', () => {
      const specialUsername = '鋼鐵兄弟會 <書記員> & "監察者" ☢️';
      render(<TestimonialCard {...defaultProps} username={specialUsername} />);

      expect(screen.getByText(specialUsername)).toBeInTheDocument();
    });

    it('handles special characters in review', () => {
      const specialReview = 'AI 占卜 > 傳統占卜 & "準確度" 達到 99% ☢️';
      render(<TestimonialCard {...defaultProps} review={specialReview} />);

      expect(screen.getByText(specialReview)).toBeInTheDocument();
    });
  });

  describe('Component Structure and Layout', () => {
    it('renders all required elements', () => {
      render(<TestimonialCard {...defaultProps} />);

      // Should have PipBoyCard container
      expect(screen.getByTestId('pipboy-card')).toBeInTheDocument();

      // Should have avatar icon
      expect(screen.getByTestId('pixel-icon-user-3')).toBeInTheDocument();

      // Should have username
      expect(screen.getByText(defaultProps.username)).toBeInTheDocument();

      // Should have rating stars (5 total)
      const stars = [
        ...screen.getAllByTestId('pixel-icon-star-fill'),
        ...screen.queryAllByTestId('pixel-icon-star'),
      ];
      expect(stars).toHaveLength(5);

      // Should have review text
      expect(screen.getByText(defaultProps.review)).toBeInTheDocument();
    });

    it('maintains consistent structure across different props', () => {
      const testProps: TestimonialCardProps[] = [
        {
          avatar: 'user-3',
          username: '避難所111號倖存者',
          rating: 5,
          review: '這個平台的 AI 占卜準到可怕！',
        },
        {
          avatar: 'shield',
          username: '鋼鐵兄弟會書記員',
          rating: 4,
          review: '量子占卜系統整合了戰前科技。',
        },
        {
          avatar: 'skull',
          username: '獨行旅者',
          rating: 3,
          review: '快速占卜功能很實用。',
        },
      ];

      testProps.forEach((props) => {
        const { unmount } = render(<TestimonialCard {...props} />);

        // All should have PipBoyCard
        expect(screen.getByTestId('pipboy-card')).toBeInTheDocument();

        // All should have avatar
        expect(screen.getByTestId(`pixel-icon-${props.avatar}`)).toBeInTheDocument();

        // All should have username
        expect(screen.getByText(props.username)).toBeInTheDocument();

        // All should have review
        expect(screen.getByText(props.review)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('marks all decorative icons with decorative attribute', () => {
      render(<TestimonialCard {...defaultProps} rating={3} />);

      // Avatar should be decorative
      const avatar = screen.getByTestId('pixel-icon-user-3');
      expect(avatar).toHaveAttribute('data-decorative', 'true');

      // All star icons should be decorative
      const filledStars = screen.getAllByTestId('pixel-icon-star-fill');
      const emptyStars = screen.getAllByTestId('pixel-icon-star');

      [...filledStars, ...emptyStars].forEach((star) => {
        expect(star).toHaveAttribute('data-decorative', 'true');
      });
    });
  });
});
