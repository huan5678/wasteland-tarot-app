/**
 * Social Media Sharing Utilities
 *
 * Task 16.7: Social media sharing functionality
 * Requirement: 10.9
 *
 * Features:
 * - Facebook sharing
 * - Twitter/X sharing
 * - Customizable share text
 */

interface ShareOptions {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Share to Facebook
 */
export function shareToFacebook(options: ShareOptions): void {
  const { url, title = '我在廢土塔羅抽到了這些牌！', description } = options;

  const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  facebookUrl.searchParams.set('u', url);

  if (description) {
    facebookUrl.searchParams.set('quote', description);
  }

  // Open in new window
  window.open(
    facebookUrl.toString(),
    'facebook-share-dialog',
    'width=626,height=436'
  );
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(options: ShareOptions): void {
  const { url, title = '我在廢土塔羅抽到了這些牌！', description } = options;

  const twitterUrl = new URL('https://twitter.com/intent/tweet');

  // Combine title and description for tweet text
  let text = title;
  if (description) {
    text += `\n\n${description}`;
  }

  twitterUrl.searchParams.set('text', text);
  twitterUrl.searchParams.set('url', url);

  // Open in new window
  window.open(
    twitterUrl.toString(),
    'twitter-share-dialog',
    'width=626,height=436'
  );
}

/**
 * Generate default share text for a reading
 */
export function generateShareText(reading: {
  question?: string;
  cards_drawn?: Array<{ name: string }>;
}): string {
  let text = '我在廢土塔羅抽到了這些牌！';

  if (reading.question) {
    text += `\n問題：${reading.question}`;
  }

  if (reading.cards_drawn && reading.cards_drawn.length > 0) {
    const cardNames = reading.cards_drawn
      .map(card => card.name)
      .join('、');
    text += `\n抽到的牌：${cardNames}`;
  }

  return text;
}
